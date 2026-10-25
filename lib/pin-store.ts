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
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'locked'; retryAfterSeconds: number };

type StaffDoc = Awaited<ReturnType<typeof Staff.find>>[number];

/** Burned when no account matches, so an unknown name takes as long as a
 *  wrong PIN and timing does not reveal which names exist. */
const DUMMY_HASH = hashPin('00000000');

/**
 * Try a PIN against specific accounts, with a lockout per account.
 *
 * Sign-in used to identify staff from the PIN alone, testing it against every
 * hash — so a wrong PIN had to count against *every* account, and anyone
 * could lock the whole staff out with five guesses. Now a failure only counts
 * against the account(s) it was aimed at.
 */
async function tryAccounts(accounts: StaffDoc[], pin: string): Promise<PinCheck> {
  const now = Date.now();
  if (accounts.length === 0) {
    verifyPin(pin, DUMMY_HASH);
    return { ok: false, reason: 'invalid' };
  }

  for (const s of accounts) {
    // Locked accounts are not even checked, so guessing cannot continue
    // through a lockout.
    if (s.lockedUntil && s.lockedUntil.getTime() > now) continue;
    if (!verifyPin(pin, s.pinHash)) continue;
    await Staff.updateOne(
      { _id: s._id },
      { $set: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } }
    );
    return { ok: true, staff: { id: String(s._id), name: s.name, role: s.role } };
  }

  let lockedFor = 0;
  for (const s of accounts) {
    if (s.lockedUntil && s.lockedUntil.getTime() > now) {
      lockedFor = Math.max(lockedFor, Math.ceil((s.lockedUntil.getTime() - now) / 1000));
      continue;
    }
    const attempts = s.failedAttempts + 1;
    const lock = attempts >= MAX_ATTEMPTS;
    if (lock) lockedFor = Math.max(lockedFor, LOCKOUT_MS / 1000);
    await Staff.updateOne(
      { _id: s._id },
      { $set: { failedAttempts: lock ? 0 : attempts, lockedUntil: lock ? new Date(now + LOCKOUT_MS) : null } }
    );
  }
  return lockedFor > 0
    ? { ok: false, reason: 'locked', retryAfterSeconds: lockedFor }
    : { ok: false, reason: 'invalid' };
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Active staff with this name, ignoring case and surrounding spaces. */
function byName(name: string) {
  return { active: true, name: { $regex: `^${escapeRegex(name.trim())}$`, $options: 'i' } };
}

/** Sign-in: the name says who, the PIN proves it. */
export async function checkStaffLogin(name: string, pin: string): Promise<PinCheck> {
  await ensureSeeded();
  return tryAccounts(await Staff.find(byName(name)).limit(5), pin);
}

/** Re-check the signed-in person's own PIN (e.g. before changing it). */
export async function checkStaffPinFor(staffId: string, pin: string): Promise<PinCheck> {
  await dbConnect();
  return tryAccounts(await Staff.find({ _id: staffId, active: true }), pin);
}

/** Names identify people at sign-in, so two active staff cannot share one. */
export async function isNameTaken(name: string, exceptId?: string): Promise<boolean> {
  await dbConnect();
  return !!(await Staff.exists({ ...byName(name), ...(exceptId ? { _id: { $ne: exceptId } } : {}) }));
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
