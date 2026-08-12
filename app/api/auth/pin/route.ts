import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth-server';
import { checkAdminPin, setAdminPin, PIN_PATTERN } from '@/lib/pin-store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { currentPin?: unknown; newPin?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }

  const { currentPin, newPin } = body;
  if (typeof currentPin !== 'string' || typeof newPin !== 'string') {
    return NextResponse.json({ error: 'Both PINs are required' }, { status: 400 });
  }
  if (!PIN_PATTERN.test(newPin)) {
    return NextResponse.json({ error: 'New PIN must be 4-8 digits' }, { status: 400 });
  }
  if (newPin === currentPin) {
    return NextResponse.json({ error: 'New PIN must differ from the current one' }, { status: 400 });
  }

  try {
    // Goes through the same lockout path as login, so this endpoint can't be
    // used as an unthrottled oracle for guessing the current PIN.
    const check = await checkAdminPin(currentPin);
    if (!check.ok) {
      if (check.reason === 'locked') {
        return NextResponse.json(
          { error: `Too many failed attempts. Try again in ${Math.ceil(check.retryAfterSeconds / 60)} minute(s).` },
          { status: 429, headers: { 'Retry-After': String(check.retryAfterSeconds) } }
        );
      }
      return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 403 });
    }

    await setAdminPin(newPin);
    return NextResponse.json({ success: true, message: 'PIN updated successfully' });
  } catch (error) {
    console.error('PIN change error:', error);
    return NextResponse.json({ error: 'Failed to update PIN' }, { status: 500 });
  }
}
