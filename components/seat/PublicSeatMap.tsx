'use client';

import { memo, useMemo, type KeyboardEvent } from 'react';
import { type Member } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SeatMapContainer, SeatMapWrapper } from './SeatMap';
import { Check } from 'lucide-react';
import { seatRow, nextSeatInDirection, type FaceDir } from '@/lib/layoutConfig';
import { useLang } from '@/hooks/useLang';

/**
 * The floor plan as a student sees it.
 *
 * This page previously drew its own map with @alisaitteke/seatmap-canvas —
 * plain circles on a blank rectangle, with hardcoded "Reading Table" and
 * "Librarian Desk" boxes that matched nothing in the actual hall. It also
 * threw on mount, so the page had never rendered for anyone.
 *
 * Reusing the real plan means a student picking seat 43 sees the same desks,
 * windows, air conditioning and entrance the admin sees, in the same
 * positions they will find when they walk in. That is the entire point of
 * showing a map instead of a dropdown.
 *
 * Availability only — never names. The public /api/members response is
 * redacted, and this component would have nothing to show even if it were not.
 */

const ARROWS: Record<string, FaceDir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

function PublicSeatTileInner({
  seat, vacant, selected, requested, onSelect, dimmed, tabStop, onArrow,
}: {
  seat: number;
  vacant: boolean;
  selected: boolean;
  requested: boolean;
  onSelect: (seat: number) => void;
  dimmed: boolean;
  /** The one desk in the plan that Tab lands on; arrows move from there. */
  tabStop: boolean;
  onArrow: (from: number, dir: FaceDir) => void;
}) {
  const { t } = useLang();
  const disabled = !vacant || requested || dimmed;
  const state = !vacant ? 'Booked' : requested ? 'Request pending' : 'Available — click to request';

  return (
    <div className="group/tip relative h-full w-full">
    <button
      type="button"
      data-seat={seat}
      onClick={() => !disabled && onSelect(seat)}
      onKeyDown={(e: KeyboardEvent) => {
        const dir = ARROWS[e.key];
        if (dir) { e.preventDefault(); onArrow(seat, dir); }
      }}
      tabIndex={tabStop ? 0 : -1}
      disabled={disabled}
      aria-label={
        vacant
          ? requested
            ? `Desk ${seat}, request already sent`
            : `Desk ${seat}, ${seatRow(seat)}, free — tap to request`
          : `Desk ${seat}, booked`
      }
      aria-pressed={selected}
      className={cn(
        // A desk mat on the wood desk, coloured by what a student can do with it.
        'relative z-10 flex h-full w-full flex-col items-center justify-center rounded-[6px] border transition-ui',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E2B97F]',
        dimmed && 'seat-dimmed',
        // Free: the one state a student is looking for, so the one with colour.
        vacant && !requested && !selected && 'cursor-pointer border-[var(--emerald-500)]/70 bg-[#DDF3E4] text-[var(--emerald-700)] shadow-[0_1px_2px_rgba(80,50,20,0.25)] hover:bg-[#C9EBD5]',
        // Already asked for: hatched, so it reads as "on hold", not "free".
        requested && 'cursor-not-allowed border-dashed border-[var(--marigold-500)] bg-[#FEF3C7] text-[var(--marigold-800)]',
        // Taken: recedes into the floor.
        !vacant && 'cursor-not-allowed border-[var(--ruby-300)] bg-[#FCE1E1] text-[var(--ruby-800)]',
        selected && 'border-[var(--saffron-700)] bg-[var(--saffron-600)] text-[var(--text-inverse)] shadow-[0_2px_6px_rgba(120,60,10,0.35)] ring-[3px] ring-[var(--saffron-500)]/40 ring-offset-2 ring-offset-[#DDB57A]',
      )}
    >
      <span className="text-[20px] font-semibold leading-none tabular">{seat}</span>
      {selected && <Check className="mt-1 size-3.5" aria-hidden="true" />}
    </button>
    {/* Hover tooltip for a mouse: the seat, where it is, what you can do.
        Counter-scaled to stay readable at any zoom. Hidden from touch, where
        a tap goes straight to the request. */}
    {!dimmed && (
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden -translate-x-1/2 [@media(hover:hover)]:block"
        aria-hidden="true"
      >
        <span
          className="block origin-bottom whitespace-nowrap rounded-[var(--radius-sm)] bg-[var(--ink)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-inverse)] opacity-0 shadow-[var(--shadow-md)] transition-opacity duration-150 group-hover/tip:opacity-100"
          style={{ transform: 'scale(calc(1 / var(--plan-scale, 1)))' }}
        >
          {t('Desk {n}', { n: seat })} · {t(seatRow(seat))} · {t(state)}
        </span>
      </span>
    )}
    </div>
  );
}

const PublicSeatTile = memo(PublicSeatTileInner);

export default function PublicSeatMap({
  members, selectedSeat, requestedSeats, onSelect, isDimmed, fit = 'width', scale, frameless = false, minScale,
}: {
  members: Member[];
  selectedSeat: number | null;
  requestedSeats: Set<number>;
  onSelect: (seat: number) => void;
  /** Outside the current shift filter — shown, but not offered. */
  isDimmed?: (m: Member) => boolean;
  /** See SeatMapContainer — `both` fits the whole room on screen. */
  fit?: 'width' | 'both';
  /** Absolute scale from the page's zoom control, if any. */
  scale?: number;
  /** Drop the card chrome when the page already frames the plan. */
  frameless?: boolean;
  /** Read-only previews may shrink below the tap-target floor. */
  minScale?: number;
}) {
  // Roving tab stop: one Tab into the plan, arrow keys between free desks.
  // Every free desk used to be its own Tab stop — 24 presses to get past it.
  const enabled = useMemo(
    () => members.filter((m) => m.vacant && !requestedSeats.has(m.seat) && !(isDimmed?.(m) ?? false)).map((m) => m.seat),
    [members, requestedSeats, isDimmed],
  );
  const tabStop = selectedSeat !== null && enabled.includes(selectedSeat) ? selectedSeat : enabled[0];
  const onArrow = (from: number, dir: FaceDir) => {
    const next = nextSeatInDirection(from, dir, enabled);
    if (next !== null) document.querySelector<HTMLButtonElement>(`button[data-seat="${next}"]`)?.focus();
  };

  return (
    <SeatMapContainer fit={fit} scale={scale} frameless={frameless} minScale={minScale}>
      {members.map((m) => (
        <SeatMapWrapper key={m.seat} seatNum={m.seat}>
          {() => (
            <div className="h-full w-full">
              <PublicSeatTile
                seat={m.seat}
                vacant={m.vacant}
                selected={selectedSeat === m.seat}
                requested={requestedSeats.has(m.seat)}
                onSelect={onSelect}
                dimmed={isDimmed?.(m) ?? false}
                tabStop={m.seat === tabStop}
                onArrow={onArrow}
              />
            </div>
          )}
        </SeatMapWrapper>
      ))}
    </SeatMapContainer>
  );
}
