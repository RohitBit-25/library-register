import type { Member, SeatStatus } from './types.ts';

// ─── Seat state — the single source of truth ────────────────────
//
// Both the browser and the server derive seat state from this file, and the
// /api/stats aggregation mirrors these exact rules. Business logic that lives
// only in the client drifts from what the database reports.

/**
 * The library's clock. "Local" must mean India, not whatever machine runs the
 * code: Vercel functions run in UTC, so `getDate()` there rolls over at 05:30
 * IST — payments got yesterday's date and seats expired a day late overnight.
 */
export const LIBRARY_TZ = 'Asia/Kolkata';

// en-CA formats as YYYY-MM-DD.
const libraryDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: LIBRARY_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
});

/** Today's date in the library's timezone, as YYYY-MM-DD. Never use
 *  `new Date().toISOString()` (UTC) or `getDate()` (the host's zone). */
export function todayLocalISO(now = new Date()): string {
  return libraryDate.format(now);
}

/** Add days to a YYYY-MM-DD string, returning YYYY-MM-DD. Pure calendar
 *  arithmetic in UTC, so the host's timezone cannot shift the result. */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Whole days from today until `expiry`. Negative = overdue. */
export function daysUntil(expiry: string, today = todayLocalISO()): number {
  if (!expiry) return Infinity;
  const [ay, am, ad] = today.split('-').map(Number);
  const [by, bm, bd] = expiry.split('-').map(Number);
  const MS = 86_400_000;
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / MS);
}

/** Days remaining at or below which a membership counts as "expiring soon". */
export const EXPIRING_WINDOW_DAYS = 7;

export interface SeatState {
  /** Primary state — drives the tile colour. One value, mutually exclusive. */
  status: SeatStatus;
  /**
   * Orthogonal to `status`: the member owes money.
   *
   * `status` alone cannot express "expired AND owes money". Precedence used to
   * put `due` above `expired`, so a member six months past their term who had
   * never paid displayed as merely "Fee Due" — hiding that the seat should be
   * reclaimed, and counting them in the wrong dashboard tile. Expired now wins
   * (the required action differs: renew-or-reclaim vs. collect), and this flag
   * keeps the money signal visible on top of it.
   */
  hasDues: boolean;
  /** Negative when overdue; Infinity when the member has no expiry set. */
  daysLeft: number;
}

export function getSeatState(m: Member, today = todayLocalISO()): SeatState {
  if (m.vacant) {
    return { status: 'vacant', hasDues: false, daysLeft: Infinity };
  }

  const daysLeft = daysUntil(m.expiry, today);
  const hasDues = m.fee === 'due';

  // Order matters. Expired first: the term being over outranks an unpaid fee.
  let status: SeatStatus;
  if (daysLeft < 0) status = 'expired';
  else if (hasDues) status = 'due';
  else if (daysLeft <= EXPIRING_WINDOW_DAYS) status = 'expiring';
  else status = 'active';

  return { status, hasDues, daysLeft };
}

/** Convenience wrapper — most call sites only need the primary status. */
export function getSeatStatus(m: Member, today = todayLocalISO()): SeatStatus {
  return getSeatState(m, today).status;
}
