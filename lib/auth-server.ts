import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import dbConnect from '@/lib/mongodb';
import RevokedSession from '@/models/RevokedSession';

// No fallback. A hardcoded default here would be published in the repo, and
// anyone could forge an admin_session cookie with it. Generate one with:
//   openssl rand -base64 48
function getKey(): Uint8Array {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'ADMIN_SECRET is missing or too short (need 32+ chars). ' +
      'Generate one with: openssl rand -base64 48'
    );
  }
  return new TextEncoder().encode(secret);
}

export const SESSION_COOKIE = 'admin_session';
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    // A unique ID per token, so signing out can revoke this session
    // specifically rather than every session the staff member holds.
    .setJti(randomUUID())
    .setExpirationTime('7d')
    .sign(getKey());
}

/**
 * Stop accepting a token before it expires on its own.
 *
 * Stores the token's own expiry so the row lives exactly as long as the
 * token it invalidates, and no longer.
 */
export async function revokeToken(token: string): Promise<void> {
  try {
    const p = await decrypt(token);
    if (typeof p.jti !== 'string' || typeof p.exp !== 'number') return;
    await dbConnect();
    await RevokedSession.updateOne(
      { jti: p.jti },
      { $set: { jti: p.jti, expiresAt: new Date(p.exp * 1000) } },
      { upsert: true }
    );
  } catch {
    // An unparseable token is already useless — nothing to revoke.
  }
}

export async function decrypt(input: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(input, getKey(), {
    algorithms: ['HS256'],
  });
  return payload as Record<string, unknown>;
}

export interface Session {
  isAdmin: true;
  staffId: string;
  name: string;
  role: 'owner' | 'staff';
}

/**
 * The signed-in staff member, or null.
 *
 * The session used to carry only `{ isAdmin: true }`, so the server knew
 * someone was authorised but never who — which is why every audit row said
 * "Admin". It now carries identity, and every mutation stamps it.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const p = await decrypt(token);
    if (p.isAdmin !== true) return null;

    // Signed out, but the holder still has the token.
    if (typeof p.jti === 'string') {
      await dbConnect();
      if (await RevokedSession.exists({ jti: p.jti })) return null;
    }

    return {
      isAdmin: true,
      staffId: typeof p.staffId === 'string' ? p.staffId : '',
      // Sessions issued before staff accounts existed carry no name; they
      // stay valid until expiry and report the old label rather than crashing.
      name: typeof p.name === 'string' ? p.name : 'Admin',
      role: p.role === 'owner' ? 'owner' : 'staff',
    };
  } catch {
    // Bad signature, expired, or ADMIN_SECRET unset — all mean "not signed in".
    return null;
  }
}

export async function verifyAdmin(): Promise<boolean> {
  return (await getSession()) !== null;
}

/** Owner-only actions: managing staff, and anything destructive. */
export async function verifyOwner(): Promise<boolean> {
  return (await getSession())?.role === 'owner';
}
