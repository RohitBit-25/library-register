import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import dbConnect from '@/lib/mongodb';
import AdminCredential from '@/models/AdminCredential';

// ─── Admin PIN storage ───────────────────────────────────────────
// Hashed with scrypt (Node stdlib — no extra dependency), stored in MongoDB.
// Previously: plaintext in `.admin-pin.json` on the local filesystem, which is
// read-only on Vercel and wiped on every deploy.

const KEYLEN = 64;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export const PIN_PATTERN = /^\d{4,8}$/;

function hashPin(pin: string, salt?: string): string {
  const s = salt ?? randomBytes(16).toString('hex');
  const derived = scryptSync(pin, s, KEYLEN).toString('hex');
  return `scrypt$${s}$${derived}`;
}

function verifyPin(pin: string, stored: string): boolean {
  const [scheme, salt, expected] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !expected) return false;
  const actual = scryptSync(pin, salt, KEYLEN).toString('hex');
  // Constant-time: a plain === leaks the matching prefix length via timing.
  const a = Buffer.from(actual, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Load the credential doc, seeding it from ADMIN_PIN on very first run. */
async function loadCredential() {
  await dbConnect();
  const existing = await AdminCredential.findOne({ key: 'admin' });
  if (existing) return existing;

  const seed = process.env.ADMIN_PIN;
  if (!seed || !PIN_PATTERN.test(seed)) {
    throw new Error(
      'No admin PIN is set. Provide ADMIN_PIN (4-8 digits) in .env for the initial seed.'
    );
  }
  return await AdminCredential.create({
    key: 'admin',
    pinHash: hashPin(seed),
    failedAttempts: 0,
    lockedUntil: null,
  });
}

export type PinCheck =
  | { ok: true }
  | { ok: false; reason: 'invalid'; attemptsLeft: number }
  | { ok: false; reason: 'locked'; retryAfterSeconds: number };

/**
 * Check a PIN and record the outcome.
 *
 * The lockout is what actually stops brute force. The previous 2-second
 * `setTimeout` on failure delayed each response but did nothing against
 * concurrency — 10,000 parallel requests still cracked a 4-digit PIN in
 * seconds, because they all ran at once.
 */
export async function checkAdminPin(pin: string): Promise<PinCheck> {
  const cred = await loadCredential();

  if (cred.lockedUntil && cred.lockedUntil.getTime() > Date.now()) {
    return {
      ok: false,
      reason: 'locked',
      retryAfterSeconds: Math.ceil((cred.lockedUntil.getTime() - Date.now()) / 1000),
    };
  }

  if (verifyPin(pin, cred.pinHash)) {
    if (cred.failedAttempts !== 0 || cred.lockedUntil) {
      await AdminCredential.updateOne(
        { key: 'admin' },
        { $set: { failedAttempts: 0, lockedUntil: null } }
      );
    }
    return { ok: true };
  }

  const attempts = cred.failedAttempts + 1;
  const shouldLock = attempts >= MAX_ATTEMPTS;
  await AdminCredential.updateOne(
    { key: 'admin' },
    {
      $set: {
        failedAttempts: shouldLock ? 0 : attempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MS) : null,
      },
    }
  );

  if (shouldLock) {
    return { ok: false, reason: 'locked', retryAfterSeconds: LOCKOUT_MS / 1000 };
  }
  return { ok: false, reason: 'invalid', attemptsLeft: MAX_ATTEMPTS - attempts };
}

/** Replace the admin PIN. Caller must already have verified the current one. */
export async function setAdminPin(newPin: string): Promise<void> {
  if (!PIN_PATTERN.test(newPin)) {
    throw new Error('PIN must be 4-8 digits');
  }
  await dbConnect();
  await AdminCredential.updateOne(
    { key: 'admin' },
    { $set: { pinHash: hashPin(newPin), failedAttempts: 0, lockedUntil: null } },
    { upsert: true }
  );
}
