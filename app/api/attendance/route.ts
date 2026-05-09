import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import AuditLog from '@/models/AuditLog';
import { verifyAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

/**
 * GET: Fetch attendance history.
 * Admin only.
 */
export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const history = await Attendance.find({}).sort({ date: -1 }).limit(365);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Attendance GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

/**
 * POST: Mark attendance for a specific date.
 * Payload: { date: string, seat: number, present: boolean }
 * Admin only.
 */
export async function POST(request: Request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { date, seat, present, allPresent, seats: bulkSeats } = body;

    if (allPresent) {
      const seats = bulkSeats || [];
      await Attendance.findOneAndUpdate(
        { date },
        { date, seats },
        { upsert: true, new: true }
      );
      
      await AuditLog.create({
        action: 'Marked Bulk Attendance',
        details: `Marked all ${seats.length} members as present for ${date}`,
      });
      
      return NextResponse.json({ success: true });
    }

    const doc = await Attendance.findOne({ date });
    let seats = doc ? doc.seats : [];

    if (present) {
      if (!seats.includes(seat)) {
        seats.push(seat);
      }
    } else {
      seats = seats.filter((s: number) => s !== seat);
    }

    await Attendance.findOneAndUpdate(
      { date },
      { date, seats },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      action: present ? 'Marked Present' : 'Marked Absent',
      details: `Seat ${seat} marked ${present ? 'present' : 'absent'} for ${date}`,
      seat,
    });

    return NextResponse.json({ success: true, seats });
  } catch (error) {
    console.error('Attendance POST error:', error);
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 });
  }
}
