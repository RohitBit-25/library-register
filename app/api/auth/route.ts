import { NextResponse } from 'next/server';
import { encrypt, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth-server';
import { cookies } from 'next/headers';
import { checkStaffPin } from '@/lib/pin-store';
import AuditLog from '@/models/AuditLog';

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
    console.error('Sign-in error:', error);
    return NextResponse.json(
      { success: false, error: 'Sign-in is unavailable. Check server configuration.' },
      { status: 500 }
    );
  }
}
