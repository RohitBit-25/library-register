import { NextResponse } from 'next/server';
import { apiError } from '@/lib/log';
import dbConnect from '@/lib/mongodb';
import Member from '@/models/Member';
import Payment from '@/models/Payment';
import Attendance from '@/models/Attendance';
import OccupancySnapshot from '@/models/OccupancySnapshot';
import { todayLocalISO } from '@/lib/seat-status';
import { planPrice } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/snapshot — record today's state for history.
 *
 * Run nightly, after close. Accepts `?date=YYYY-MM-DD` to backfill a missed
 * day; the write is an upsert keyed on date, so a retry overwrites rather
 * than double-counting.
 *
 * Deliberately stores counts rather than recomputing from history later:
 * a member who is deleted, or a plan whose price changes, would silently
 * rewrite the past if the numbers were derived on read.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return apiError('GET /api/cron/snapshot', 'Not configured', 'CRON_SECRET is not set — refusing to run the snapshot job.', 503);
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const url = new URL(request.url);
    const param = url.searchParams.get('date');
    const date = param && /^\d{4}-\d{2}-\d{2}$/.test(param) ? param : todayLocalISO();

    const members = await Member.find({})
      .select('vacant expiry fee duration')
      .lean<{ vacant: boolean; expiry: string; fee: string; duration: string }[]>();

    let occupied = 0, vacant = 0, expired = 0, withDues = 0, contractValue = 0;
    for (const m of members) {
      if (m.vacant) { vacant++; continue; }
      occupied++;
      contractValue += planPrice(m.duration);
      if (m.fee === 'due') withDues++;
      if (m.expiry && m.expiry < date) expired++;
    }

    const [collectedAgg, attendance] = await Promise.all([
      Payment.aggregate([
        { $match: { date } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Attendance.findOne({ date }).select('seats').lean<{ seats: number[] } | null>(),
    ]);

    const snapshot = {
      occupied,
      vacant,
      expired,
      withDues,
      contractValue,
      collected: collectedAgg[0]?.total ?? 0,
      // null, not 0 — "nobody marked attendance" is not "nobody came".
      present: attendance ? attendance.seats.length : null,
    };

    await OccupancySnapshot.updateOne(
      { date },
      { $set: { date, ...snapshot } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, date, ...snapshot });
  } catch (error) {
    return apiError('GET /api/cron/snapshot', 'Internal Server Error', error);
  }
}
