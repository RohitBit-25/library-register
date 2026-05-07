import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Member from '@/models/Member';
import { verifyAdmin } from '@/lib/auth-server';

export async function GET() {
  try {
    await dbConnect();
    let members = await Member.find({}).sort({ seat: 1 }).lean();
    
    // Auto-seed only if collection is completely empty (first-time setup)
    if (members.length === 0) {
      const { getDefaultMembers } = await import('@/lib/defaultData');
      const seeds = getDefaultMembers();
      await Member.insertMany(seeds);
      members = await Member.find({}).sort({ seat: 1 }).lean();
    }
    
    const isAdmin = await verifyAdmin();

    if (isAdmin) {
      return NextResponse.json(members);
    } else {
      // Redact sensitive data
      const redacted = members.map((m) => ({
        _id: (m as { _id?: string })._id,
        seat: m.seat,
        vacant: m.vacant,
        name: m.vacant ? '' : 'Occupied',
      }));
      return NextResponse.json(redacted);
    }
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
