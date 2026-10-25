import { twMerge } from 'tailwind-merge';
import type { SeatStatus, Duration } from './types.ts';

// ─── Date Utilities ─────────────────────────────────────────────

/**
 * Calculate expiry date from join date and duration.
 *
 * Calendar months, clamped to the end of the target month: 31 Jan + 1 month
 * is 28/29 Feb, not 3 March. The old version used Date#setMonth, which rolls
 * the overflow into the next month — so a member joining on the 31st got up
 * to three free days on every plan.
 *
 * Pure date arithmetic on the Y-M-D parts, so the result does not depend on
 * the server's timezone either.
 */
export function calcExpiry(joinDate: string, duration: Duration): string {
  if (!joinDate || !duration) return '';
  const months = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 }[duration];
  if (!months) return '';
  const [y, m, d] = joinDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  const total = (m - 1) + months;
  const ty = y + Math.floor(total / 12);
  const tm = total % 12; // 0-based
  const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  const td = Math.min(d, lastDay);
  return `${ty}-${String(tm + 1).padStart(2, '0')}-${String(td).padStart(2, '0')}`;
}

/**
 * The date a renewal should be measured from: the later of the member's
 * current expiry and today.
 *
 * Renewing used to always start from today, so a member who renewed *before*
 * their term ended silently forfeited the days they had already paid for
 * (expires 20th, renews on the 15th → lost 5 days). Starting from the old
 * expiry instead would hand free time to someone renewing late, so it is the
 * later of the two.
 */
export function renewalStartDate(currentExpiry: string, today = todayISO()): string {
  if (!currentExpiry) return today;
  return currentExpiry > today ? currentExpiry : today;
}

// Seat state lives in lib/seat-status.ts so the server, the /api/stats
// aggregation and the browser all derive it from one place. Re-exported here
// because ~16 call sites already import it from utils.
export {
  getSeatState,
  getSeatStatus,
  todayLocalISO,
  addDaysISO,
  daysUntil,
  EXPIRING_WINDOW_DAYS,
  type SeatState,
} from './seat-status.ts';

import { daysUntil as _daysUntil, todayLocalISO as _todayLocalISO } from './seat-status.ts';

/** Days until expiry (negative = expired). Alias kept for existing call sites. */
export function daysUntilExpiry(expiry: string): number {
  return _daysUntil(expiry);
}

/**
 * Format date for display: "4 Mar 2025"
 */
export function fmtDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Short date, with the year only when it is not the current one: "4 Mar",
 * "4 Mar 2027".
 *
 * The year used to be dropped unconditionally, so a member who joined on
 * 22 Aug 2026 on a one-year plan showed "Joined 22 Aug · Expiry 22 Aug" —
 * two identical strings twelve months apart, on the column an admin uses to
 * decide who to chase. Same-year dates stay short, which is the common case
 * and the reason the year was dropped in the first place.
 */
export function fmtDateShort(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/**
 * Today as YYYY-MM-DD in the *local* timezone.
 *
 * This used to be `new Date().toISOString().split('T')[0]`, which is UTC. In
 * IST (UTC+5:30) that returns yesterday's date every day between midnight and
 * 05:30 — so overnight, new members got a join date one day early and the
 * reminder cron targeted the wrong cohort.
 */
export function todayISO(): string {
  return _todayLocalISO();
}

/**
 * Format duration label
 */
export function durationLabel(d: Duration): string {
  switch (d) {
    case '1M': return '1 Month';
    case '3M': return '3 Months';
    case '6M': return '6 Months';
    case '1Y': return '1 Year';
    default: return '—';
  }
}

/**
 * Get shift label
 */
export function shiftLabel(s: string): string {
  switch (s) {
    case 'morning': return 'Morning';
    case 'evening': return 'Evening';
    case 'full': return 'Full Day';
    default: return '—';
  }
}

// ─── Status Colour Mapping ──────────────────────────────────────

export const STATUS_COLORS: Record<SeatStatus, {
  fill: string;
  border: string;
  text: string;
  darkFill: string;
  darkBorder: string;
  darkText: string;
}> = {
  active: {
    fill: '#EAF3DE', border: '#639922', text: '#27500A',
    darkFill: '#27500A', darkBorder: '#639922', darkText: '#C0DD97',
  },
  expiring: {
    fill: '#FAEEDA', border: '#BA7517', text: '#633806',
    darkFill: '#633806', darkBorder: '#BA7517', darkText: '#FAC775',
  },
  expired: {
    fill: '#FCEBEB', border: '#E24B4A', text: '#791F1F',
    darkFill: '#791F1F', darkBorder: '#E24B4A', darkText: '#F7C1C1',
  },
  due: {
    fill: '#FAEEDA', border: '#EF9F27', text: '#633806',
    darkFill: '#633806', darkBorder: '#EF9F27', darkText: '#FAC775',
  },
  vacant: {
    fill: '#F1EFE8', border: '#D3D1C7', text: '#5F5E5A',
    darkFill: '#2C2C2A', darkBorder: '#444441', darkText: '#888780',
  },
};

// ─── Misc ───────────────────────────────────────────────────────

/**
 * Join class names, letting later Tailwind classes override earlier ones.
 *
 * This used to be a plain join, so a caller's `hidden` lost to a component's
 * built-in `inline-flex` whenever Tailwind happened to emit inline-flex later
 * in the stylesheet — overrides worked or failed by CSS source order, not by
 * intent. tailwind-merge resolves the conflict in the caller's favour.
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return twMerge(classes.filter(Boolean).join(' '));
}

/**
 * Generate a unique ID for toasts
 */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Get first name from full name
 */
export function firstName(name: string): string {
  if (!name) return '';
  const parts = name.split(' ');
  return parts[0].length > 7 ? parts[0].slice(0, 6) + '.' : parts[0];
}
