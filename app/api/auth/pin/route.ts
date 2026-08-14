import { NextResponse } from 'next/server';
import { apiError } from '@/lib/log';
import { getSession } from '@/lib/auth-server';
import { checkStaffPin, setStaffPin, isPinTaken, PIN_PATTERN } from '@/lib/pin-store';
import AuditLog from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

/** POST /api/auth/pin — change your own PIN. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
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
    // Same lockout path as sign-in, so this cannot be used as an unthrottled
    // oracle for guessing the current PIN.
    const check = await checkStaffPin(currentPin);
    if (!check.ok) {
      if (check.reason === 'locked') {
        return NextResponse.json(
          { error: `Too many failed attempts. Try again in ${Math.ceil(check.retryAfterSeconds / 60)} minute(s).` },
          { status: 429, headers: { 'Retry-After': String(check.retryAfterSeconds) } }
        );
      }
      return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 403 });
    }

    // The PIN identifies the person, so it must stay unique — two staff with
    // the same PIN would make sign-in ambiguous and the audit trail wrong.
    if (await isPinTaken(newPin)) {
      return NextResponse.json(
        { error: 'That PIN is already in use by another staff member' },
        { status: 409 }
      );
    }

    // Change the PIN of whoever the *current* PIN belongs to, not whoever the
    // cookie claims — they must match, and this is the safer of the two.
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
