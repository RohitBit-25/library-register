import { NextResponse } from 'next/server';
import { logError } from '@/lib/log';
import { encrypt, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth-server';
import { cookies } from 'next/headers';
import { checkStaffPin } from '@/lib/pin-store';
import AuditLog from '@/models/AuditLog';
import { consumeRateLimit, callerKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Attempts allowed per caller per 15 minutes, checked before the PIN is.
 *
 * The per-staff lockout in pin-store cannot tell which account a wrong PIN
 * was meant for — there is no username — so a failure counts against every
 * account. Left alone, anyone could lock the whole staff out of the system
 * for 15 minutes on repeat, without credentials.
 *
 * This limit means a single source burns its own quota long before it burns
 * the staff's. It does not stop a distributed attempt; that is a real
 * residual risk of PIN-only auth, and the reason `/setup` should be used to
 * move to per-staff PINs rather than one shared one.
 *
 * 12 in 15 minutes is far above what a human mistyping a 6-digit PIN needs,
 * and well below the 5 failures that trigger a staff lockout across a
 * realistic number of attackers.
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

  let pin: unknown;
  try {
    ({ pin } = await request.json());
  } catch {
    return NextResponse.json({ success: false, error: 'Bad Request' }, { status: 400 });
  }

  if (typeof pin !== 'string' || pin.length === 0) {
    return NextResponse.json({ success: false, error: 'PIN is required' }, { status: 400 });
  }

  try {
    const result = await checkStaffPin(pin);

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
      return NextResponse.json(
        { success: false, error: `Invalid PIN. ${result.attemptsLeft} attempt(s) left.` },
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
