import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/auth-server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const adminPin = process.env.ADMIN_PIN;
    if (!adminPin) {
      return NextResponse.json({ success: false, error: 'Auth configuration error' }, { status: 500 });
    }

    if (pin === adminPin) {
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const session = await encrypt({ isAdmin: true, expires });

      const cookieStore = await cookies();
      cookieStore.set('admin_session', session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return NextResponse.json({ success: true, isAdmin: true });
    } else {
      // Basic rate limiting: delay response on failure
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({ success: false, error: 'Invalid PIN' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Bad Request' }, { status: 400 });
  }
}
