import { NextResponse } from 'next/server';
import { apiError, logError, newRequestId } from '@/lib/log';
import dbConnect from '@/lib/mongodb';
import Member from '@/models/Member';
import AuditLog from '@/models/AuditLog';
import { todayLocalISO, addDaysISO } from '@/lib/seat-status';
import { sendExpiryReminder } from '@/lib/notify';

export const dynamic = 'force-dynamic';

/** Remind anyone expiring within this many days. */
export const REMINDER_WINDOW_DAYS = 3;

/**
 * GET /api/cron/reminders — daily expiry reminders. Trigger from Vercel Cron
 * or any scheduler with `Authorization: Bearer $CRON_SECRET`.
 *
 * Three properties this job needs, none of which it had before:
 *
 * 1. **Idempotent.** It stamps `reminderSentFor` with the expiry it reminded
 *    about, and skips anyone already stamped. Re-running sends nothing.
 *    Previously every run re-sent to the same people.
 *
 * 2. **Self-healing.** It matches a *window* (expiring within N days and not
 *    yet expired), not `expiry === today + 3`. With exact matching, one failed
 *    or skipped run meant that day's cohort was never reminded at all —
 *    silently. With a window, the next successful run catches them.
 *
 * 3. **Honest.** A member is only stamped if the send actually succeeded, so a
 *    provider outage doesn't silently mark everyone as notified.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return apiError('GET /api/cron/reminders', 'Not configured', 'CRON_SECRET is not set — refusing to run the reminder job.', 503);
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // This handler can report many failures in one run — one per member it
  // could not reach — so unlike every other route it mints the id up front
  // and threads it through, keeping the whole run greppable as one unit.
  const reqId = newRequestId();

  try {
    await dbConnect();

    // Local date, not toISOString(): that is UTC, so in IST this job used to
    // target the wrong day's cohort whenever it ran before 05:30.
    const today = todayLocalISO();
    const windowEnd = addDaysISO(today, REMINDER_WINDOW_DAYS);

    const candidates = await Member.find({
      vacant: false,
      expiry: { $nin: ['', null], $gte: today, $lte: windowEnd },
      // Not already reminded about *this* expiry.
      $expr: { $ne: ['$reminderSentFor', '$expiry'] },
    }).lean<{ seat: number; name: string; phone: string; expiry: string }[]>();

    const result = { eligible: candidates.length, sent: 0, skippedNoPhone: 0, failed: 0 };

    for (const m of candidates) {
      if (!m.phone) {
        result.skippedNoPhone++;
        continue;
      }

      const outcome = await sendExpiryReminder({
        name: m.name,
        phone: m.phone,
        seat: m.seat,
        expiry: m.expiry,
        today,
      }, reqId);

      if (!outcome.ok) {
        result.failed++;
        logError('GET /api/cron/reminders', 'Reminder delivery failed', outcome.error, {
          reqId, seat: m.seat, expiry: m.expiry,
        });
        continue; // Deliberately not stamped — retried on the next run.
      }

      await Member.updateOne(
        { seat: m.seat, expiry: m.expiry },
        { $set: { reminderSentFor: m.expiry, reminderSentAt: new Date() } }
      );
      result.sent++;
    }

    if (result.sent > 0 || result.failed > 0) {
      await AuditLog.create({
        action: 'Automated Reminders',
        details:
          `Expiry reminders for ${today}..${windowEnd}: ` +
          `${result.sent} sent, ${result.failed} failed, ` +
          `${result.skippedNoPhone} skipped (no phone).`,
      });
    }

    return NextResponse.json({ success: true, window: { from: today, to: windowEnd }, ...result });
  } catch (error) {
    return apiError('GET /api/cron/reminders', 'Internal Server Error', error, 500, { reqId });
  }
}
