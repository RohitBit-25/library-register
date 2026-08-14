import { NextResponse } from 'next/server';
import { apiError } from '@/lib/log';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import AuditLog from '@/models/AuditLog';
import { getSession } from '@/lib/auth-server';
import { attendanceSchema, formatZodError } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

/** GET: attendance history (last 365 days). Admin only. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const history = await Attendance.find({}).sort({ date: -1 }).limit(365).lean();
    return NextResponse.json(history);
  } catch (error) {
    return apiError('GET /api/attendance', 'Failed to fetch attendance', error);
  }
}

/**
 * POST: mark attendance. Admin only.
 *   { date, seat, present }            — toggle one seat
 *   { date, seats[], allPresent:true } — set the whole day
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parsed = attendanceSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const body = parsed.data;

    await dbConnect();

    if ('allPresent' in body && body.allPresent === true) {
      const seats = Array.from(new Set(body.seats));
      await Attendance.updateOne(
        { date: body.date },
        { $set: { seats } },
        { upsert: true }
      );

      await AuditLog.create({
        user: session.name,
        action: 'Marked Bulk Attendance',
        details: `Marked all ${seats.length} members as present for ${body.date}`,
      });

      return NextResponse.json({ success: true, seats });
    }

    const { date, seat, present } = body as { date: string; seat: number; present: boolean };

    // One atomic operator, no read-modify-write. The previous version did
    // findOne → mutate array → replace, so two staff marking attendance at the
    // same moment each wrote their own copy and one seat was silently lost.
    const updated = await Attendance.findOneAndUpdate(
      { date },
      present ? { $addToSet: { seats: seat } } : { $pull: { seats: seat } },
      { upsert: true, new: true }
    ).lean<{ seats: number[] } | null>();

    await AuditLog.create({
      user: session.name,
      action: present ? 'Marked Present' : 'Marked Absent',
      details: `Seat ${seat} marked ${present ? 'present' : 'absent'} for ${date}`,
      seat,
    });

    return NextResponse.json({ success: true, seats: updated?.seats ?? [] });
  } catch (error) {
    return apiError('POST /api/attendance', 'Failed to update attendance', error);
  }
}
