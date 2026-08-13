import type { Member, SeatStatus } from './types.ts';

// ─── Seat state — the single source of truth ────────────────────
//
// Both the browser and the server derive seat state from this file, and the
// /api/stats aggregation mirrors these exact rules. Business logic that lives
// only in the client drifts from what the database reports.

/** Local-midnight ISO date. Never use `new Date().toISOString()` — that is UTC,
 *  which rolls over at 05:30 IST and would mark seats expired a day early. */
export function todayLocalISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Add days to a YYYY-MM-DD string, returning YYYY-MM-DD. */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return todayLocalISO(dt);
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
