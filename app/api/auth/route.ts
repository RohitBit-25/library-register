import { NextResponse } from 'next/server';
import { logError } from '@/lib/log';
import { encrypt, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth-server';
import { cookies } from 'next/headers';
import { checkStaffLogin } from '@/lib/pin-store';
import AuditLog from '@/models/AuditLog';
import { consumeRateLimit, callerKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Attempts allowed per caller per 15 minutes, checked before the PIN is.
 *
 * Sign-in takes a name and a PIN, so a wrong PIN only counts against the
 * account it was aimed at (5 failures lock that account for 15 minutes).
 * This limit sits in front: one source gets 12 tries in 15 minutes, far above
 * what a person mistyping needs, so it cannot walk the PIN space or keep
 * every account locked.
 */
const LOGIN_LIMIT = 12;
const LOGIN_WINDOW_SECONDS = 15 * 60;

export async function POST(request: Request) {
  const limit = await consumeRateLimit(
    'auth', callerKey(request), LOGIN_LIMIT, LOGIN_WINDOW_SECONDS
  );
  if (!limit.ok) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many attempts from this connection. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).`,
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  let name: unknown, pin: unknown;
  try {
    ({ name, pin } = await request.json());
  } catch {
    return NextResponse.json({ success: false, error: 'Bad Request' }, { status: 400 });
  }

  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 40) {
    return NextResponse.json({ success: false, error: 'Enter your name' }, { status: 400 });
  }
  if (typeof pin !== 'string' || pin.length === 0 || pin.length > 8) {
    return NextResponse.json({ success: false, error: 'Enter your PIN' }, { status: 400 });
  }

  try {
    const result = await checkStaffLogin(name, pin);

    if (!result.ok) {
      if (result.reason === 'locked') {
        return NextResponse.json(
          {
            success: false,
            error: `Too many failed attempts. Try again in ${Math.ceil(result.retryAfterSeconds / 60)} minute(s).`,
          },
          { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } }
        );
      }
      // One message for an unknown name and a wrong PIN, so the form does
      // not confirm which staff names exist.
      return NextResponse.json(
        { success: false, error: 'That name and PIN do not match.' },
        { status: 401 }
      );
    }

    // Identity travels in the session so every later mutation can stamp who
    // did it, rather than every audit row reading "Admin".
    const session = await encrypt({
      isAdmin: true,
      staffId: result.staff.id,
      name: result.staff.name,
      role: result.staff.role,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, session, {
      maxAge: SESSION_MAX_AGE_SECONDS,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    await AuditLog.create({
      action: 'Signed In',
      details: `${result.staff.name} (${result.staff.role}) signed in`,
      user: result.staff.name,
    });

    return NextResponse.json({
      success: true,
      isAdmin: true,
      name: result.staff.name,
      role: result.staff.role,
    });
  } catch (error) {
    // Misconfiguration (no ADMIN_SECRET / no staff seeded) must fail loudly in
    // logs but must not leak the reason to the caller.
    // The body keeps `success: false` — the sign-in form reads that field.
    const reqId = logError('POST /api/auth', 'Sign-in failed', error);
    return NextResponse.json(
      { success: false, error: 'Sign-in is unavailable. Check server configuration.', reqId },
      { status: 500, headers: { 'x-request-id': reqId } }
    );
  }
}
