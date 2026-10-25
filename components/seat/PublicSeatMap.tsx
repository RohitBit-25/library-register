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
        'relative z-10 flex h-full w-full flex-col items-center justify-center rounded-[9px] border font-mono transition-ui',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plan-floor)]',
        dimmed && 'seat-dimmed',
        // Free: the one state a student is looking for, so the one with colour.
        vacant && !requested && !selected && 'cursor-pointer border-[var(--emerald-500)]/60 bg-[var(--bg-surface)] text-[var(--emerald-700)] shadow-[var(--shadow-sm)] hover:border-[var(--emerald-500)] hover:bg-[var(--emerald-50)]',
        // Already asked for: hatched, so it reads as "on hold", not "free".
        requested && 'cursor-not-allowed border-dashed border-[var(--indigo-400)] bg-[var(--indigo-50)] text-[var(--indigo-600)]',
        // Taken: recedes into the floor.
        !vacant && 'cursor-not-allowed border-transparent bg-[var(--plan-desk)] text-[var(--text-tertiary)]',
        selected && 'border-[var(--saffron-700)] bg-[var(--saffron-600)] text-[var(--text-inverse)] shadow-[var(--shadow-md)]',
      )}
    >
      <span className="tabular text-[15px] font-medium leading-none">{seat}</span>
      {selected && <Check className="mt-1 size-3.5" aria-hidden="true" />}
    </button>
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
              />
            </div>
          )}
        </SeatMapWrapper>
      ))}
    </SeatMapContainer>
  );
}
