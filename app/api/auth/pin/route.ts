import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth-server';
import { getAdminPin, setAdminPin } from '@/lib/pin-store';

export async function POST(request: Request) {
  try {
    // Verify admin session
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await decrypt(session);
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPin, newPin } = await request.json();

    // Validate current PIN
    const storedPin = getAdminPin();
    if (currentPin !== storedPin) {
      return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 403 });
    }

    // Validate new PIN
    if (!newPin || typeof newPin !== 'string' || newPin.length < 4 || newPin.length > 8 || !/^\d+$/.test(newPin)) {
      return NextResponse.json({ error: 'New PIN must be 4-8 digits' }, { status: 400 });
    }

    // Save new PIN
    setAdminPin(newPin);

    return NextResponse.json({ success: true, message: 'PIN updated successfully' });
  } catch {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
