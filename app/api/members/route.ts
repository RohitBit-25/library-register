import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Member from '@/models/Member';
import { verifyAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const isAdmin = await verifyAdmin();

    if (isAdmin) {
      // Seeding moved to `npm run seed`. A GET that runs insertMany is not
      // idempotent, and two concurrent cold-start requests both saw an empty
      // collection and both inserted — the second threw on the unique index.
      // Reminder bookkeeping is server-side only — the client never reads it.
      const members = await Member.find({})
        .select('-reminderSentFor -reminderSentAt -lastPaymentAt -lastPaymentAmount -__v')
        .sort({ seat: 1 })
        .lean();
      return NextResponse.json(members, { headers: { 'Cache-Control': 'no-store' } });
    }

    // Anonymous / user role: occupancy only. Never names, phones, or dates.
    const members = await Member.find({})
      .select('seat vacant shift')
      .sort({ seat: 1 })
      .lean();

    const redacted = members.map((m) => ({
      _id: String(m._id),
      seat: m.seat,
      vacant: m.vacant,
      shift: m.vacant ? '' : m.shift,
      name: m.vacant ? '' : 'Occupied',
    }));

    return NextResponse.json(redacted, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
