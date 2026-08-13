'use client';

import { useMemo } from 'react';
import { type Member } from '@/lib/types';
import { cn, firstName } from '@/lib/utils';
import { getSeatState } from '@/lib/seat-status';
import { Sun, Moon, SunMoon, Plus } from 'lucide-react';

/**
 * The hall as a list, for phones.
 *
 * The floor plan is 1160px wide. On a 390px screen it has to shrink to about
 * 0.42 before it fits, which puts a 48px seat at 20px — too small to read a
 * name on and too small to hit reliably. The plan is still there for
 * orientation; this is for getting work done on the device the admin is
 * actually holding while walking the hall.
 *
 * Grouped by the same A–D runs the plan labels, so "row C, seat 58" means the
 * same thing in both views.
 */

const ROWS: { label: string; from: number; to: number }[] = [
  { label: 'Row A', from: 1, to: 22 },
  { label: 'Row B', from: 23, to: 42 },
  { label: 'Row C', from: 43, to: 70 },
  { label: 'Row D', from: 71, to: 95 },
];

const shiftIcon = { morning: Sun, evening: Moon, full: SunMoon } as const;

/** Same five states, same colours, as the tiles on the plan. */
const stateStyle: Record<string, string> = {
  active:   'border-[var(--emerald-200)] bg-[var(--emerald-50)]',
  expiring: 'border-[var(--marigold-200)] bg-[var(--marigold-50)]',
  due:      'border-[var(--saffron-200)] bg-[var(--saffron-50)]',
  expired:  'border-[var(--ruby-200)] bg-[var(--ruby-50)]',
  vacant:   'border-dashed border-[var(--border-default)] bg-[var(--bg-muted)]',
};

const stateDot: Record<string, string> = {
  active:   'bg-[var(--emerald-500)]',
  expiring: 'bg-[var(--marigold-500)]',
  due:      'bg-[var(--saffron-500)]',
  expired:  'bg-[var(--ruby-500)]',
  vacant:   'bg-transparent',
};

export default function SeatList({
  members, onSeatClick, selectedSeat,
}: {
  members: Member[];
  onSeatClick: (seat: number) => void;
  selectedSeat?: number | null;
}) {
  const grouped = useMemo(() => {
    const bySeat = new Map(members.map((m) => [m.seat, m]));
    return ROWS.map((row) => ({
      ...row,
      seats: Array.from({ length: row.to - row.from + 1 }, (_, i) => row.from + i)
        .map((n) => bySeat.get(n))
        .filter((m): m is Member => Boolean(m)),
    })).filter((r) => r.seats.length > 0);
  }, [members]);

  return (
    <div className="space-y-5">
      {grouped.map((row) => {
        const taken = row.seats.filter((m) => !m.vacant).length;
        return (
          <section key={row.label}>
            <h3 className="mb-2 flex items-baseline gap-2 px-0.5">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                {row.label}
              </span>
              <span className="tabular text-[11px] font-medium text-[var(--text-tertiary)]">
                {taken}/{row.seats.length} taken
              </span>
            </h3>

            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {row.seats.map((m) => {
                const { status } = getSeatState(m);
                const Icon = m.vacant ? null : shiftIcon[m.shift as keyof typeof shiftIcon] ?? SunMoon;
                return (
                  <li key={m.seat}>
                    <button
                      type="button"
                      data-seat={m.seat}
                      onClick={() => onSeatClick(m.seat)}
                      aria-label={
                        m.vacant
                          ? `Seat ${m.seat}, vacant`
                          : `Seat ${m.seat}, ${m.name}, ${status}`
                      }
                      className={cn(
                        // 56px tall: comfortably above the 44px minimum target,
                        // which the 20px tiles on a shrunken plan were not.
                        'flex min-h-[56px] w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-ui',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)] focus-visible:ring-offset-2',
                        stateStyle[status] ?? stateStyle.vacant,
                        selectedSeat === m.seat && 'ring-2 ring-[var(--saffron-500)]'
                      )}
                    >
                      <span className="tabular w-7 shrink-0 text-sm font-bold text-[var(--text-primary)]">
                        {m.seat}
                      </span>
                      {m.vacant ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-tertiary)]">
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          Vacant
                        </span>
                      ) : (
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold leading-tight text-[var(--text-primary)]">
                            {firstName(m.name)}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-[var(--text-secondary)]">
                            <span className={cn('h-1.5 w-1.5 rounded-full', stateDot[status])} />
                            {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
                            {status === 'active' ? 'Active'
                              : status === 'expiring' ? 'Expiring'
                              : status === 'due' ? 'Fee due'
                              : 'Expired'}
                          </span>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
