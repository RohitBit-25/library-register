import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ isAdmin: false }, { headers: { 'Cache-Control': 'no-store' } });
  }
  // Identity, so the shell can show who is signed in and gate owner-only UI.
  // Deliberately not staffId — the client has no use for a lookup key.
  return NextResponse.json(
    { isAdmin: true, name: session.name, role: session.role },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
