import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, revokeToken } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const cookieStore = await cookies();

  // Revoke before clearing. Deleting the cookie only made this browser
  // forget the token; anything else holding a copy stayed signed in for the
  // remaining 7 days.
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await revokeToken(token);

  cookieStore.delete({ name: SESSION_COOKIE, path: '/' });
  return NextResponse.json({ success: true });
}
