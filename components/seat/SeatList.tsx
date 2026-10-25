'use client';

import { useMemo } from 'react';
import { type Member } from '@/lib/types';
import { cn, firstName } from '@/lib/utils';
import { getSeatState } from '@/lib/seat-status';
import { SEAT_GROUPS } from '@/lib/layoutConfig';
import { STATUS_STYLE } from './statusStyle';
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
 * Grouped by the same lettered blocks the plan draws (A–F), from SEAT_ROWS in
 * lib/layoutConfig — one table, so the list and the plan cannot disagree.
 */

const shiftIcon = { morning: Sun, evening: Moon, full: SunMoon } as const;

export default function SeatList({
  members, onSeatClick, selectedSeat,
}: {
  members: Member[];
  onSeatClick: (seat: number) => void;
  selectedSeat?: number | null;
}) {
  const grouped = useMemo(() => {
    // Same groups, in the same reading order, as the plan.
    const bySeat = new Map(members.map((m) => [m.seat, m]));
    return SEAT_GROUPS
      .map((g) => ({ label: g.label, seats: g.seats.map((n) => bySeat.get(n)).filter((m): m is Member => !!m) }))
      .filter((g) => g.seats.length > 0);
  }, [members]);

  return (
    <div className="space-y-5">
      {grouped.map((row) => {
        const taken = row.seats.filter((m) => !m.vacant).length;
        return (
          <section key={row.label}>
            <h3 className="mb-2 flex items-baseline gap-2 px-0.5">
              <span className="font-display text-md font-semibold text-[var(--text-primary)]">
                {row.label}
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">
                <span className="font-mono tabular">{taken}</span> of <span className="font-mono tabular">{row.seats.length}</span> taken
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
                        'flex min-h-[56px] w-full items-center gap-2.5 rounded-[var(--radius-md)] border px-2.5 py-2 text-left transition-ui',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-600)] focus-visible:ring-offset-2',
                        // White rows: the dot and the word already carry the
                        // state; tinting every row as well read as a rainbow.
                        'border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]',
                        m.vacant && 'border-dashed bg-transparent shadow-none',
                        selectedSeat === m.seat && 'ring-2 ring-[var(--text-primary)] ring-offset-1'
                      )}
                    >
                      <span className="w-7 shrink-0 font-mono text-sm font-medium text-[var(--text-primary)] tabular">
                        {m.seat}
                      </span>
                      {m.vacant ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-tertiary)]">
                          <Plus className="size-4" aria-hidden="true" />
                          Vacant
                        </span>
                      ) : (
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold leading-tight text-[var(--text-primary)]">
                            {firstName(m.name)}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)]">
                            <span className={cn('size-1.5 rounded-full', STATUS_STYLE[status].dot)} aria-hidden="true" />
                            {STATUS_STYLE[status].label}
                            {Icon && <Icon className="ml-auto size-3.5 text-[var(--text-tertiary)]" aria-hidden="true" />}
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
