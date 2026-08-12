import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

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
    .setExpirationTime('7d')
    .sign(getKey());
}

export async function decrypt(input: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(input, getKey(), {
    algorithms: ['HS256'],
  });
  return payload as Record<string, unknown>;
}

export async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return false;
  try {
    const parsed = await decrypt(session);
    return parsed.isAdmin === true;
  } catch {
    // Bad signature, expired, or ADMIN_SECRET unset — all mean "not admin".
    return false;
  }
}
