import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/log';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';
import { verifyAdmin } from '@/lib/auth-server';
import { seatNumber } from '@/lib/schemas';
import { todayLocalISO, addDaysISO } from '@/lib/seat-status';

export const dynamic = 'force-dynamic';

const MAX_LIMIT = 200;

/**
 * GET /api/payments — the fee ledger. Admin only.
 *
 * Query params (all optional):
 *   ?seat=42       one member's payment history — for receipts and disputes
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD   date range, defaults to the last 90 days
 *   ?limit=50
 *
 * Exists because "when did this member actually pay?" was previously
 * unanswerable — only their current paid/due flag was stored.
 */
export async function GET(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sp = request.nextUrl.searchParams;
    const today = todayLocalISO();

    const filter: Record<string, unknown> = {};

    const seatParam = sp.get('seat');
    if (seatParam !== null) {
      const parsed = seatNumber.safeParse(seatParam);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid seat number' }, { status: 400 });
      }
      filter.seat = parsed.data;
    }

    const isDate = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
    const from = isDate(sp.get('from')) ? sp.get('from')! : addDaysISO(today, -89);
    const to = isDate(sp.get('to')) ? sp.get('to')! : today;
    if (from > to) {
      return NextResponse.json({ error: '`from` must not be after `to`' }, { status: 400 });
    }
    filter.date = { $gte: from, $lte: to };

    const limit = Math.min(
      Math.max(Number(sp.get('limit')) || 100, 1),
      MAX_LIMIT
    );

    await dbConnect();

    const [payments, totals] = await Promise.all([
      Payment.find(filter).sort({ date: -1, createdAt: -1 }).limit(limit).lean(),
      Payment.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const summary = totals[0] ?? { total: 0, count: 0 };

    return NextResponse.json(
      {
        payments: payments.map((p) => ({ ...p, id: String(p._id) })),
        range: { from, to },
        total: summary.total,
        count: summary.count,
        // Tells the caller the list is capped, rather than letting them
        // assume `payments.length` is the whole story.
        truncated: summary.count > payments.length,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return apiError('GET /api/payments', 'Failed to fetch payments', error);
  }
}
