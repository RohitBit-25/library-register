import type { SeatStatus, Duration } from './types.ts';

// ─── Date Utilities ─────────────────────────────────────────────

/**
 * Calculate expiry date from join date and duration
 */
export function calcExpiry(joinDate: string, duration: Duration): string {
  if (!joinDate || !duration) return '';
  const d = new Date(joinDate);
  switch (duration) {
    case '1M': d.setMonth(d.getMonth() + 1); break;
    case '3M': d.setMonth(d.getMonth() + 3); break;
    case '6M': d.setMonth(d.getMonth() + 6); break;
    case '1Y': d.setFullYear(d.getFullYear() + 1); break;
    default: return '';
  }
  return d.toISOString().split('T')[0];
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
 * Format date short: "4 Mar"
 */
export function fmtDateShort(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
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
 * Merge class names (simple utility)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
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
