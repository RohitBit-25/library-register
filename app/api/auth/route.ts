import { NextResponse } from 'next/server';
import { encrypt, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth-server';
import { cookies } from 'next/headers';
import { checkAdminPin } from '@/lib/pin-store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
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
    const result = await checkAdminPin(pin);

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

    const session = await encrypt({ isAdmin: true });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, session, {
      maxAge: SESSION_MAX_AGE_SECONDS,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ success: true, isAdmin: true });
  } catch (error) {
    // Misconfiguration (no ADMIN_SECRET / no seed PIN) must fail loudly in logs
    // but must not leak the reason to the caller.
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login is unavailable. Check server configuration.' },
      { status: 500 }
    );
  }
}
