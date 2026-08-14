import { NextResponse } from 'next/server';
import { apiError } from '@/lib/log';
import dbConnect from '@/lib/mongodb';
import Member from '@/models/Member';
import Attendance from '@/models/Attendance';
import Payment from '@/models/Payment';
import OccupancySnapshot from '@/models/OccupancySnapshot';
import { verifyAdmin } from '@/lib/auth-server';
import { todayLocalISO, addDaysISO, EXPIRING_WINDOW_DAYS } from '@/lib/seat-status';
import { planPrice, monthlyValue } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

/** Days of attendance history returned for the dashboard trend. */
const TREND_DAYS = 30;

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
          // Every occupied seat's plan, so money can be totalled in JS where
          // the rate table lives (one source of truth for prices).
          plans: [
            { $match: occupied },
            {
              $project: {
                _id: 0,
                duration: 1,
                fee: 1,
                lastPaymentAt: 1,
                lastPaymentAmount: 1,
              },
            },
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

    // ── Money ──────────────────────────────────────────────────
    // Only what the data actually supports. `collected30d` counts real
    // stamped payments, so it reads 0 until the first payment is recorded
    // after deploy — it does not back-fill history that was never captured.
    const plans = result.plans as {
      duration?: string; fee?: string;
      lastPaymentAt?: Date | null; lastPaymentAmount?: number;
    }[];

    let outstanding = 0;      // owed right now — exact
    let contractValue = 0;    // total value of all active plans
    let monthlyRunRate = 0;   // plans normalised to a monthly figure

    for (const p of plans) {
      const price = planPrice(p.duration);
      contractValue += price;
      monthlyRunRate += monthlyValue(p.duration);
      if (p.fee === 'due') outstanding += price;
    }

    // Collections come from the append-only Payment ledger, not from a field
    // on the member. A per-member field holds one payment, so a member paying
    // twice inside the window overwrote their own first payment and the total
    // undercounted.
    const since30 = addDaysISO(today, -29);
    const monthStart = today.slice(0, 8) + '01';
    const [collections] = await Payment.aggregate([
      { $match: { date: { $gte: since30 <= monthStart ? since30 : monthStart } } },
      {
        $facet: {
          last30: [
            { $match: { date: { $gte: since30 } } },
            { $group: { _id: null, total: { $sum: '$amount' }, n: { $sum: 1 } } },
          ],
          thisMonth: [
            { $match: { date: { $gte: monthStart } } },
            { $group: { _id: null, total: { $sum: '$amount' }, n: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const c30 = collections?.last30?.[0] ?? { total: 0, n: 0 };
    const cMonth = collections?.thisMonth?.[0] ?? { total: 0, n: 0 };
    const anyPaymentEver = await Payment.estimatedDocumentCount();

    // ── Real attendance trend ──────────────────────────────────
    // The dashboard used to render Math.random() noise as a 30-day occupancy
    // history. This is the genuine article, from the attendance records that
    // were already being collected. Days with no record read 0 — the library
    // was closed or nobody marked attendance, and inventing a value there is
    // exactly the bug being fixed.
    const trendStart = addDaysISO(today, -(TREND_DAYS - 1));
    const records = await Attendance
      .find({ date: { $gte: trendStart, $lte: today } })
      .select('date seats')
      .lean<{ date: string; seats: number[] }[]>();

    const byDate = new Map(records.map((r) => [r.date, r.seats?.length ?? 0]));
    const trend: { date: string; present: number }[] = [];
    for (let i = 0; i < TREND_DAYS; i++) {
      const d = addDaysISO(trendStart, i);
      trend.push({ date: d, present: byDate.get(d) ?? 0 });
    }
    const daysWithData = records.length;

    // ── Occupancy history ──────────────────────────────────────
    // Only real snapshot rows. Gaps stay gaps: a day the job did not run is
    // absent from the series rather than interpolated, so the chart cannot
    // imply a measurement that was never taken.
    const snapshots = await OccupancySnapshot
      .find({ date: { $gte: addDaysISO(today, -89), $lte: today } })
      .select('date occupied vacant collected contractValue -_id')
      .sort({ date: 1 })
      .lean<{ date: string; occupied: number; vacant: number; collected: number; contractValue: number }[]>();

    const occupancyHistory = snapshots;

    // Month-over-month change, only when both ends actually exist.
    let growth: { from: string; to: string; occupiedDelta: number; pct: number } | null = null;
    if (snapshots.length >= 2) {
      const latest = snapshots[snapshots.length - 1];
      const monthAgo = addDaysISO(today, -30);
      // Nearest snapshot at or before the 30-day mark.
      const baseline = [...snapshots].reverse().find((s) => s.date <= monthAgo);
      if (baseline && baseline.date !== latest.date) {
        const delta = latest.occupied - baseline.occupied;
        growth = {
          from: baseline.date,
          to: latest.date,
          occupiedDelta: delta,
          pct: baseline.occupied > 0 ? Math.round((delta / baseline.occupied) * 100) : 0,
        };
      }
    }

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
        revenue: {
          outstanding,
          contractValue,
          monthlyRunRate: Math.round(monthlyRunRate),
          collected30d: c30.total,
          collectedThisMonth: cMonth.total,
          paymentCount30d: c30.n,
          // Lets the UI say "no payments recorded yet" instead of implying
          // the library collected nothing.
          hasPaymentHistory: anyPaymentEver > 0,
        },
        trend,
        // Days in the window that actually have an attendance record. The UI
        // uses this to avoid drawing a confident line through mostly-empty data.
        trendDaysWithData: daysWithData,
        // Real occupancy history from the nightly snapshot. Empty until the
        // job has run — never back-filled with guesses.
        occupancyHistory,
        growth,
        asOf: today,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return apiError('GET /api/stats', 'Failed to compute stats', error);
  }
}
