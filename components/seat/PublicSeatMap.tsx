'use client';

import { memo } from 'react';
import { type Member } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SeatMapContainer, SeatMapWrapper } from './SeatMap';
import { Check } from 'lucide-react';

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

function PublicSeatTileInner({
  seat, vacant, selected, requested, onSelect, dimmed,
}: {
  seat: number;
  vacant: boolean;
  selected: boolean;
  requested: boolean;
  onSelect: (seat: number) => void;
  dimmed: boolean;
}) {
  const disabled = !vacant || requested || dimmed;

  return (
    <button
      type="button"
      data-seat={seat}
      onClick={() => !disabled && onSelect(seat)}
      disabled={disabled}
      aria-label={
        vacant
          ? requested
            ? `Seat ${seat}, request already sent`
            : `Seat ${seat}, available — tap to request`
          : `Seat ${seat}, taken`
      }
      aria-pressed={selected}
      className={cn(
        'relative z-10 flex h-full w-full flex-col items-center justify-center rounded-lg border transition-ui duration-200',
        dimmed && 'seat-dimmed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)] focus-visible:ring-offset-2',
        vacant && !requested && 'cursor-pointer border-[var(--emerald-200)] bg-[var(--emerald-50)]/90 backdrop-blur-[2px] text-[var(--emerald-700)] hover:border-[var(--emerald-500)] hover:bg-[var(--emerald-100)]',
        requested && 'cursor-not-allowed border-[#f5c6cb] bg-[#fce4e8]/90 backdrop-blur-[2px] text-[#9a3a47]',
        !vacant && 'cursor-not-allowed border-[var(--border-default)] bg-[var(--bg-muted)]/80 backdrop-blur-[2px] text-[var(--text-tertiary)]',
        selected && 'border-[var(--saffron-500)] bg-[var(--saffron-500)]/95 backdrop-blur-[2px] text-white ring-2 ring-[var(--saffron-500)] ring-offset-2'
      )}
    >
      <span className="tabular text-[11px] font-bold leading-none">{seat}</span>
      {selected && <Check className="mt-0.5 h-3 w-3" aria-hidden="true" />}
    </button>
  );
}

const PublicSeatTile = memo(PublicSeatTileInner);

export default function PublicSeatMap({
  members, selectedSeat, requestedSeats, onSelect, isDimmed, fit = 'width', scale,
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
}) {
  return (
    <SeatMapContainer fit={fit} scale={scale}>
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
              />
            </div>
          )}
        </SeatMapWrapper>
      ))}
    </SeatMapContainer>
  );
}
