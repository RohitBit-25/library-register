import { type Member, type SeatStatus, type Duration } from './types';

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
 * Days until expiry (negative = expired)
 */
export function daysUntilExpiry(expiry: string): number {
  if (!expiry) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiry);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Derive seat status from member record
 */
export function getSeatStatus(m: Member): SeatStatus {
  if (m.vacant) return 'vacant';
  if (m.fee === 'due') return 'due';
  const daysLeft = daysUntilExpiry(m.expiry);
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 7) return 'expiring';
  return 'active';
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
 * Get today's date as YYYY-MM-DD
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
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
