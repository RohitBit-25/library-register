import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import dbConnect from '@/lib/mongodb';
import Staff, { type StaffRole } from '@/models/Staff';

// ─── Staff PINs ─────────────────────────────────────────────────
// Hashed with scrypt (Node stdlib — no extra dependency), stored in MongoDB.
// Previously: one shared plaintext PIN in `.admin-pin.json`, on a filesystem
// that is read-only on Vercel and wiped on every deploy.

const KEYLEN = 64;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

/** Guard on the login fan-out below — see checkStaffPin. */
const MAX_ACTIVE_STAFF = 25;

export const PIN_PATTERN = /^\d{4,8}$/;

function hashPin(pin: string, salt?: string): string {
  const s = salt ?? randomBytes(16).toString('hex');
  return `scrypt$${s}$${scryptSync(pin, s, KEYLEN).toString('hex')}`;
}

function verifyPin(pin: string, stored: string): boolean {
  const [scheme, salt, expected] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !expected) return false;
  const a = Buffer.from(scryptSync(pin, salt, KEYLEN).toString('hex'), 'hex');
  const b = Buffer.from(expected, 'hex');
  // Constant-time: a plain === leaks the matching prefix length via timing.
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface StaffIdentity {
  id: string;
  name: string;
  role: StaffRole;
}

/**
 * Ensure at least one owner exists.
 *
 * Migrates the old single AdminCredential document into a staff member named
 * "Admin" so an existing deployment keeps working with the PIN already in use.
 * Falls back to seeding from ADMIN_PIN on a fresh install.
 */
async function ensureSeeded(): Promise<void> {
  await dbConnect();
  if (await Staff.countDocuments({ active: true }) > 0) return;

  // Migrate the previous single-admin credential, PIN hash intact.
  const legacy = await Staff.db
    .collection('admincredentials')
    .findOne({ key: 'admin' });

  if (legacy?.pinHash) {
    await Staff.create({
      name: 'Admin',
      pinHash: legacy.pinHash,
      role: 'owner',
      active: true,
    });
    return;
  }

  const seed = process.env.ADMIN_PIN;
  if (!seed || !PIN_PATTERN.test(seed)) {
    throw new Error(
      'No staff exist and ADMIN_PIN is unset. Set ADMIN_PIN (4-8 digits) to create the first owner.'
    );
  }
  await Staff.create({ name: 'Admin', pinHash: hashPin(seed), role: 'owner', active: true });
}

export type PinCheck =
  | { ok: true; staff: StaffIdentity }
  | { ok: false; reason: 'invalid'; attemptsLeft: number }
  | { ok: false; reason: 'locked'; retryAfterSeconds: number };

/**
 * Identify a staff member from a PIN alone.
 *
 * Because each PIN is salted separately, there is no way to look one up — the
 * candidate is tested against each active staff hash in turn. scrypt is
 * deliberately slow, so this is capped: past MAX_ACTIVE_STAFF a login screen
 * that also asks *who you are* is the right shape, not a longer fan-out.
 *
 * Lockout is per-staff and persisted, so it survives the serverless cold
 * starts that would reset an in-memory counter.
 */
export async function checkStaffPin(pin: string): Promise<PinCheck> {
  await ensureSeeded();

  const everyone = await Staff.find({ active: true })
    .sort({ createdAt: 1 })
    .limit(MAX_ACTIVE_STAFF);

  const now = Date.now();
  let sawLock: number | null = null;

  for (const s of everyone) {
    if (!verifyPin(pin, s.pinHash)) continue;

    // Right PIN — but this account may be locked out.
    if (s.lockedUntil && s.lockedUntil.getTime() > now) {
      return {
        ok: false,
        reason: 'locked',
        retryAfterSeconds: Math.ceil((s.lockedUntil.getTime() - now) / 1000),
      };
    }

    if (s.failedAttempts !== 0 || s.lockedUntil) {
      await Staff.updateOne({ _id: s._id }, { $set: { failedAttempts: 0, lockedUntil: null } });
    }
    await Staff.updateOne({ _id: s._id }, { $set: { lastLoginAt: new Date() } });

    return { ok: true, staff: { id: String(s._id), name: s.name, role: s.role } };
  }

  // No match. Count the failure against every active account: the attacker is
  // guessing at the whole library, and we cannot know which account they meant.
  for (const s of everyone) {
    const attempts = s.failedAttempts + 1;
    const shouldLock = attempts >= MAX_ATTEMPTS;
    if (shouldLock) sawLock = LOCKOUT_MS / 1000;
    await Staff.updateOne(
      { _id: s._id },
      {
        $set: {
          failedAttempts: shouldLock ? 0 : attempts,
          lockedUntil: shouldLock ? new Date(now + LOCKOUT_MS) : null,
        },
      }
    );
  }

  if (sawLock !== null) {
    return { ok: false, reason: 'locked', retryAfterSeconds: sawLock };
  }
  const worst = Math.min(...everyone.map((s) => MAX_ATTEMPTS - (s.failedAttempts + 1)));
  return { ok: false, reason: 'invalid', attemptsLeft: Math.max(0, worst) };
}

/** Change one staff member's PIN. Caller must have verified the current one. */
export async function setStaffPin(staffId: string, newPin: string): Promise<void> {
  if (!PIN_PATTERN.test(newPin)) throw new Error('PIN must be 4-8 digits');
  await dbConnect();
  await Staff.updateOne(
    { _id: staffId },
    { $set: { pinHash: hashPin(newPin), failedAttempts: 0, lockedUntil: null } }
  );
}

/** Reject a PIN already in use — two staff sharing one PIN is ambiguous. */
export async function isPinTaken(pin: string): Promise<boolean> {
  await dbConnect();
  const everyone = await Staff.find({ active: true }).limit(MAX_ACTIVE_STAFF);
  return everyone.some((s) => verifyPin(pin, s.pinHash));
}

export async function createStaff(
  name: string,
  pin: string,
  role: StaffRole
): Promise<StaffIdentity> {
  if (!PIN_PATTERN.test(pin)) throw new Error('PIN must be 4-8 digits');
  await dbConnect();
  const doc = await Staff.create({ name: name.trim(), pinHash: hashPin(pin), role, active: true });
  return { id: String(doc._id), name: doc.name, role: doc.role };
}

export async function listStaff() {
  await ensureSeeded();
  return Staff.find({})
    .select('name role active lastLoginAt createdAt lockedUntil')
    .sort({ createdAt: 1 })
    .lean();
}
