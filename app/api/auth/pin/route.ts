import { NextResponse } from 'next/server';
import { apiError } from '@/lib/log';
import { getSession } from '@/lib/auth-server';
import { checkStaffPinFor, setStaffPin, PIN_PATTERN } from '@/lib/pin-store';
import AuditLog from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

/** POST /api/auth/pin — change your own PIN. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.staffId) {
    return NextResponse.json({ error: 'Please sign out and sign in again first.' }, { status: 401 });
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
    // Checked against the signed-in person only, with the same per-account
    // lockout as sign-in, so this is not an unthrottled PIN oracle.
    const check = await checkStaffPinFor(session.staffId, currentPin);
    if (!check.ok) {
      if (check.reason === 'locked') {
        return NextResponse.json(
          { error: `Too many failed attempts. Try again in ${Math.ceil(check.retryAfterSeconds / 60)} minute(s).` },
          { status: 429, headers: { 'Retry-After': String(check.retryAfterSeconds) } }
        );
      }
      return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 403 });
    }

    // No "PIN already in use" check any more: names identify people now, and
    // that 409 let any staff member test PINs until they found a colleague's.
    await setStaffPin(check.staff.id, newPin);

    await AuditLog.create({
      user: check.staff.name,
      action: 'Changed PIN',
      details: `${check.staff.name} changed their own PIN`,
    });

    return NextResponse.json({ success: true, message: 'PIN updated successfully' });
  } catch (error) {
    return apiError('POST /api/auth/pin', 'Failed to update PIN', error);
  }
}
