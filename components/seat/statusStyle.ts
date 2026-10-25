import type { SeatStatus } from '@/lib/types';

/**
 * One colour per seat state, used by every view that shows one.
 *
 * Before this file the tiles and legends painted "expiring" saffron and "fee
 * due" marigold, while the badges and the list view did the opposite — so the
 * legend under the plan described a different map from the table beside it.
 *
 * Ramp contract (globals.css): -50 tint, -200 border, -500 dot, -600/-700 text.
 */
export const STATUS_STYLE: Record<SeatStatus, {
  label: string;
  tint: string;
  border: string;
  text: string;
  dot: string;
  /** Legend chip: tint fill with the saturated edge. */
  swatch: string;
}> = {
  active:   { label: 'Active',   tint: 'bg-[var(--emerald-50)]',  border: 'border-[var(--emerald-500)]/45',  text: 'text-[var(--emerald-700)]',  dot: 'bg-[var(--emerald-500)]', swatch: 'bg-[var(--emerald-50)] border-[var(--emerald-500)]' },
  expiring: { label: 'Expiring', tint: 'bg-[var(--marigold-50)]', border: 'border-[var(--marigold-500)]/45', text: 'text-[var(--marigold-800)]', dot: 'bg-[var(--marigold-500)]', swatch: 'bg-[var(--marigold-50)] border-[var(--marigold-500)]' },
  due:      { label: 'Fee due',  tint: 'bg-[var(--saffron-50)]',  border: 'border-[var(--saffron-500)]/45',  text: 'text-[var(--saffron-800)]',  dot: 'bg-[var(--saffron-500)]', swatch: 'bg-[var(--saffron-50)] border-[var(--saffron-500)]' },
  expired:  { label: 'Expired',  tint: 'bg-[var(--ruby-50)]',     border: 'border-[var(--ruby-500)]/45',     text: 'text-[var(--ruby-800)]',     dot: 'bg-[var(--ruby-500)]', swatch: 'bg-[var(--ruby-50)] border-[var(--ruby-500)]' },
  vacant:   { label: 'Vacant',   tint: 'bg-[var(--bg-surface)]',  border: 'border-[var(--border-default)]', text: 'text-[var(--text-secondary)]', dot: 'bg-[var(--bg-surface)] ring-1 ring-inset ring-[var(--border-strong)]', swatch: 'bg-[var(--bg-surface)] border-[var(--border-strong)]' },
};

export const STATUS_ORDER: SeatStatus[] = ['active', 'expiring', 'due', 'expired', 'vacant'];
