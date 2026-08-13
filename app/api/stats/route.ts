import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Member from '@/models/Member';
import { verifyAdmin } from '@/lib/auth-server';
import { todayLocalISO, addDaysISO, EXPIRING_WINDOW_DAYS } from '@/lib/seat-status';

export const dynamic = 'force-dynamic';

/** Cap on each alert list so one very neglected library can't return 95 rows
 *  of PII in a dashboard payload. */
const ALERT_LIMIT = 25;

const MEMBER_FIELDS = { _id: 0, seat: 1, name: 1, phone: 1, expiry: 1, duration: 1, shift: 1, fee: 1 };

/**
 * GET /api/stats — dashboard aggregates, computed in MongoDB.
 *
 * The dashboard used to derive all of this in the browser from `GET
 * /api/members`, which meant shipping all 95 records — every name, phone and
 * join date — just to render five counters.
 *
 * The $match stages below mirror getSeatState() in lib/seat-status.ts exactly,
 * including the precedence where **expired outranks due**. `expiry` is stored
 * as a bare YYYY-MM-DD string, which sorts lexicographically the same as
 * chronologically, so plain $lt/$gte comparisons are correct here.
 */
export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const today = todayLocalISO();
    const weekOut = addDaysISO(today, EXPIRING_WINDOW_DAYS);

    // A member with no expiry recorded is never "expired" or "expiring" —
    // there is no date to have passed.
    const hasExpiry = { expiry: { $nin: ['', null] } };
    const occupied = { vacant: false };

    const isExpired = { ...occupied, ...hasExpiry, expiry: { $nin: ['', null], $lt: today } };
    // Expired wins, so the due bucket excludes anyone already past their term.
    const isDue = {
      ...occupied,
      fee: 'due',
      $or: [{ expiry: { $in: ['', null] } }, { expiry: { $gte: today } }],
    };
    const isExpiring = {
      ...occupied,
      fee: { $ne: 'due' },
      expiry: { $nin: ['', null], $gte: today, $lte: weekOut },
    };

    const [result] = await Member.aggregate([
      {
        $facet: {
          occupancy: [{ $group: { _id: '$vacant', n: { $sum: 1 } } }],
          byDuration: [
            { $match: occupied },
            { $group: { _id: '$duration', n: { $sum: 1 } } },
          ],
          expired: [
            { $match: isExpired },
            { $sort: { expiry: 1 } },
            { $limit: ALERT_LIMIT },
            { $project: MEMBER_FIELDS },
          ],
          due: [
            { $match: isDue },
            { $sort: { seat: 1 } },
            { $limit: ALERT_LIMIT },
            { $project: MEMBER_FIELDS },
          ],
          expiring: [
            { $match: isExpiring },
            { $sort: { expiry: 1 } },
            { $limit: ALERT_LIMIT },
            { $project: MEMBER_FIELDS },
          ],
          counts: [
            {
              $group: {
                _id: null,
                expired: { $sum: { $cond: [{ $and: [
                  { $eq: ['$vacant', false] },
                  { $ne: ['$expiry', ''] },
                  { $lt: ['$expiry', today] },
                ] }, 1, 0] } },
                due: { $sum: { $cond: [{ $and: [
                  { $eq: ['$vacant', false] },
                  { $eq: ['$fee', 'due'] },
                  { $or: [{ $eq: ['$expiry', ''] }, { $gte: ['$expiry', today] }] },
                ] }, 1, 0] } },
                expiring: { $sum: { $cond: [{ $and: [
                  { $eq: ['$vacant', false] },
                  { $ne: ['$fee', 'due'] },
                  { $ne: ['$expiry', ''] },
                  { $gte: ['$expiry', today] },
                  { $lte: ['$expiry', weekOut] },
                ] }, 1, 0] } },
                withDues: { $sum: { $cond: [{ $and: [
                  { $eq: ['$vacant', false] },
                  { $eq: ['$fee', 'due'] },
                ] }, 1, 0] } },
              },
            },
          ],
        },
      },
    ]);

    const occupancy = result.occupancy as { _id: boolean; n: number }[];
    const occupiedCount = occupancy.find((o) => o._id === false)?.n ?? 0;
    const vacantCount = occupancy.find((o) => o._id === true)?.n ?? 0;

    const byDuration: Record<string, number> = { '1M': 0, '3M': 0, '6M': 0, '1Y': 0 };
    for (const d of result.byDuration as { _id: string; n: number }[]) {
      if (d._id && d._id in byDuration) byDuration[d._id] = d.n;
    }

    const c = result.counts[0] ?? { expired: 0, due: 0, expiring: 0, withDues: 0 };

    return NextResponse.json(
      {
        occupied: occupiedCount,
        vacant: vacantCount,
        total: occupiedCount + vacantCount,
        expired: c.expired,
        due: c.due,
        expiring: c.expiring,
        // Every member owing money, regardless of whether they are also
        // expired — the count `due` deliberately excludes those.
        withDues: c.withDues,
        byDuration,
        expiredMembers: result.expired,
        dueMembers: result.due,
        expiringThisWeek: result.expiring,
        truncated: {
          expired: c.expired > ALERT_LIMIT,
          due: c.due > ALERT_LIMIT,
          expiring: c.expiring > ALERT_LIMIT,
        },
        asOf: today,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Stats GET error:', error);
    return NextResponse.json({ error: 'Failed to compute stats' }, { status: 500 });
  }
}
