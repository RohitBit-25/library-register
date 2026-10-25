'use client';

import { useState, useMemo, useCallback, useEffect, useSyncExternalStore } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useToast } from '@/hooks/useToast';
import { type Shift, type Duration } from '@/lib/types';
import PublicSeatMap from '@/components/seat/PublicSeatMap';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import SeatRequestSheet from '@/components/seat/SeatRequestSheet';
import Segmented from '@/components/ui/Segmented';
import PixelButton from '@/components/pixel/PixelButton';
import { SeatSkeleton } from '@/components/ui/Skeleton';
import { Minus, Plus as PlusIcon, Maximize2 } from 'lucide-react';
import { seatAmenities, seatRow, isSeat } from '@/lib/layoutConfig';
import { cn } from '@/lib/utils';

/** Below Tailwind's `lg`: no room for the side panel, so a tap goes straight to the form. */
function useIsNarrow() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(max-width: 1023px)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia('(max-width: 1023px)').matches,
    () => false,
  );
}

const LEGEND = [
  // Same mats as the desks on the plan (components/seat/PublicSeatMap).
  { label: 'Available', swatch: 'border-[var(--emerald-500)]/70 bg-[#DDF3E4]' },
  { label: 'Selected', swatch: 'border-[var(--saffron-700)] bg-[var(--saffron-600)]' },
  { label: 'Requested', swatch: 'border-dashed border-[var(--marigold-500)] bg-[#FEF3C7]' },
  { label: 'Booked', swatch: 'border-[var(--ruby-300)] bg-[#FCE1E1]' },
];

export default function BrowsePage() {
  const { members, isLoading } = useMembers();
  const { addRequest, requests } = useSeatRequests();
  const { addToast } = useToast();
  const narrow = useIsNarrow();

  const [shiftFilter, setShiftFilter] = useState<Shift | 'all'>('all');
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  /** The form is a separate step from choosing: you look at the seat first. */
  const [requestOpen, setRequestOpen] = useState(false);
  const [sent, setSent] = useState(false);
  /**
   * null   — fill the width, scroll for the rest (seats ~50px, readable).
   * 'room' — the whole hall on screen.
   * number — an explicit scale.
   * Width is the default: a student needs to read the number and hit the
   * target more than they need the whole room in one glance.
   */
  const [zoom, setZoom] = useState<number | 'room' | null>(null);

  // /browse?seat=41 — the landing page's plan links straight to a seat.
  useEffect(() => {
    const n = Number(new URLSearchParams(window.location.search).get('seat'));
    if (isSeat(n)) queueMicrotask(() => setSelectedSeat(n));
  }, []);

  const filtered = useMemo(() => {
    if (shiftFilter === 'all') return members;
    return members.filter(m => m.vacant || m.shift === shiftFilter || m.shift === 'full');
  }, [members, shiftFilter]);

  const inShift = useMemo(() => new Set(filtered.map((m) => m.seat)), [filtered]);

  const requestedSeats = useMemo(
    () => new Set(requests.filter((r) => r.status === 'pending').map((r) => r.seat)),
    [requests]
  );

  const selectedMember = selectedSeat !== null
    ? members.find(m => m.seat === selectedSeat) ?? null
    : null;

  const availableSeats = useMemo(
    () => members
      .filter((m) => m.vacant && inShift.has(m.seat) && !requestedSeats.has(m.seat))
      .map((m) => m.seat)
      .sort((a, b) => a - b),
    [members, inShift, requestedSeats]
  );
  const freeCount = members.filter((m) => m.vacant).length;

  const handleSeatClick = useCallback((seat: number) => {
    const member = members.find(m => m.seat === seat);
    if (!member?.vacant) return;
    if (requestedSeats.has(seat)) {
      addToast('warning', `Seat ${seat} already has a request waiting`);
      return;
    }
    setSelectedSeat(seat);
    if (narrow) setRequestOpen(true);
  }, [members, requestedSeats, addToast, narrow]);

  const handleSubmitRequest = async (
    seat: number, name: string, phone: string, message: string, joinDate: string, duration: Duration, shift: Shift,
    transactionId: string, paymentMode: 'upi' | 'cash', documentUrl: string, amount?: number
  ) => {
    const result = await addRequest({
      seat, userName: name, userPhone: phone, message, joinDate, duration, shift,
      transactionId, paymentMode, documentUrl, amount,
    });
    // Not closed here: the sheet shows its own "request sent" state and
    // calls onClose when it is done. Closing on success hid that
    // confirmation entirely, so a student never saw that it worked.
    if (result.success) setSent(true);
    return result;
  };

  const closeRequest = () => {
    setRequestOpen(false);
    if (sent) { setSelectedSeat(null); setSent(false); }
  };

  const zoomBtn = 'flex size-10 cursor-pointer items-center justify-center bg-[var(--bg-surface)] text-[var(--warm-ink-2)] transition-ui hover:bg-[var(--warm-band)] hover:text-[var(--warm-ink)]';

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--warm-bg)] text-[var(--warm-ink)]">
      <UnifiedHeader wide />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-6 sm:px-6 lg:py-8">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-[2rem] font-bold tracking-tight leading-none sm:text-[2.5rem]">
              Pick a free desk
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--warm-ink-2)]">
              <span className="px-box m-1 inline-flex items-center gap-2 bg-[var(--px-hud)] px-3 py-1 font-display text-sm font-semibold text-[var(--px-hud-text)]" aria-live="polite">
                <span className="size-2 bg-[var(--px-hud-text)]" aria-hidden="true" />
                {isLoading ? 'Loading…' : `Free ${freeCount} / ${members.length}`}
              </span>
              Tap a green desk to request it.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              pixel
              label="Shift"
              value={shiftFilter}
              onChange={setShiftFilter}
              options={[
                { value: 'all', label: 'Any shift' },
                { value: 'morning', label: 'Morning' },
                { value: 'evening', label: 'Evening' },
              ]}
            />
            <div className="px-box m-1 hidden items-center divide-x-4 divide-[var(--warm-ink)] sm:flex" role="group" aria-label="Zoom">
              <button type="button" className={zoomBtn} aria-label="Zoom out"
                onClick={() => setZoom((z) => typeof z === 'number' ? Math.max(0.5, z - 0.25) : 0.75)}>
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <button type="button" className={cn(zoomBtn, zoom === 'room' && 'bg-[var(--warm-band)] text-[var(--warm-ink)]')}
                aria-label="Fit the whole room on screen" aria-pressed={zoom === 'room'}
                onClick={() => setZoom((z) => (z === 'room' ? null : 'room'))}>
                <Maximize2 className="size-4" aria-hidden="true" />
              </button>
              <button type="button" className={zoomBtn} aria-label="Zoom in"
                onClick={() => setZoom((z) => typeof z === 'number' ? Math.min(2, z + 0.25) : 1.25)}>
                <PlusIcon className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 lg:flex-row">
          <section className="flex min-w-0 flex-1 flex-col">
            {/* Fitting both axes needs a container with a real height. */}
            <div className="flex flex-1 sm:min-h-[60vh] lg:min-h-[calc(100dvh-260px)]">
              {isLoading ? (
                <div className="px-box m-1 grid flex-1 grid-cols-6 gap-2 bg-[var(--bg-surface)] p-4 sm:grid-cols-8 md:grid-cols-10">
                  {Array.from({ length: 40 }, (_, i) => <SeatSkeleton key={i} />)}
                </div>
              ) : (
                <div className="px-box m-1 flex min-w-0 flex-1 overflow-hidden bg-[var(--bg-surface)]">
                <PublicSeatMap
                  frameless
                  fit={zoom === 'room' ? 'both' : 'width'}
                  scale={typeof zoom === 'number' ? zoom : undefined}
                  members={members}
                  selectedSeat={selectedSeat}
                  requestedSeats={requestedSeats}
                  onSelect={handleSeatClick}
                  isDimmed={(m) => !inShift.has(m.seat)}
                />
                </div>
              )}
            </div>

            <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[var(--warm-ink-2)]" aria-label="Legend">
              {LEGEND.map((l) => {
                // Live counts; "Selected" is your own pick, so it has none.
                const n = l.label === 'Available' ? availableSeats.length
                  : l.label === 'Requested' ? requestedSeats.size
                  : l.label === 'Booked' ? members.length - freeCount
                  : null;
                return (
                  <li key={l.label} className="flex items-center gap-1.5">
                    <span className={cn('size-3.5 border-2', l.swatch)} aria-hidden="true" />
                    {l.label}
                    {n !== null && !isLoading && <span className="font-display tabular text-[var(--warm-ink)]">{n}</span>}
                  </li>
                );
              })}
            </ul>

            {/* On a phone the plan shrinks past a usable tap size, so the same
                action is offered as full-size targets. The plan stays above for
                orientation, which is what a map is good for on a phone. */}
            {!isLoading && (
              <div data-equivalent-for="seat-map" className="mt-6 sm:hidden">
                <h2 className="mb-4 font-display text-xl font-bold">
                  Free desks <span className="text-[var(--warm-ink-3)] tabular">{availableSeats.length}</span>
                </h2>
                {availableSeats.length === 0 ? (
                  <p className="text-sm text-[var(--warm-ink-2)]">
                    No free seats{shiftFilter === 'all' ? '' : ' in this shift'} right now. Requests still go on the waitlist.
                  </p>
                ) : (
                  <div className="grid grid-cols-5 gap-3 p-1">
                    {availableSeats.map((seat) => (
                      <button
                        key={seat}
                        type="button"
                        onClick={() => handleSeatClick(seat)}
                        aria-label={`Seat ${seat}, free — tap to request`}
                        className="px-btn px-box min-h-[48px] cursor-pointer bg-[var(--emerald-50)] font-display text-lg font-semibold text-[var(--emerald-700)] tabular"
                      >
                        {seat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Desktop side panel: always present, so the layout does not jump
              when a seat is chosen. Empty state explains the three steps. */}
          <aside className="hidden w-[300px] shrink-0 lg:block">
            <div className="px-raised sticky top-6 m-1 bg-[var(--bg-surface)] p-5">
              {selectedMember?.vacant ? (
                <>
                  <p className="font-display text-sm uppercase text-[var(--warm-ink-3)]">{seatRow(selectedMember.seat)}</p>
                  <h2 className="mt-1 font-display text-[2.75rem] font-bold tracking-tight leading-none">
                    Desk <span className="tabular">{selectedMember.seat}</span>
                  </h2>
                  {/* Derived from where this seat actually sits in the hall. */}
                  <ul className="mt-5 space-y-2 border-t-4 border-[var(--warm-line)] pt-4 text-sm text-[var(--warm-ink-2)]">
                    {seatAmenities(selectedMember.seat).map((a) => (
                      <li key={a} className="flex items-start gap-2">
                        <span className="mt-1.5 size-2 shrink-0 bg-[var(--px-green)]" aria-hidden="true" />
                        {a}
                      </li>
                    ))}
                  </ul>
                  <PixelButton className="mt-6 w-[calc(100%-8px)]" onClick={() => setRequestOpen(true)}>
                    Request desk {selectedMember.seat} ▶
                  </PixelButton>
                  <button
                    type="button"
                    onClick={() => setSelectedSeat(null)}
                    className="mt-3 w-full cursor-pointer py-2 text-sm text-[var(--warm-ink-2)] underline-offset-4 hover:text-[var(--warm-ink)] hover:underline"
                  >
                    Choose a different desk
                  </button>
                </>
              ) : (
                <>
                  <h2 className="font-display text-xl font-bold">How it works</h2>
                  <ol className="mt-4 space-y-4 text-sm">
                    {[
                      ['Pick a free seat', 'Green seats are open. Use the shift filter if you only need mornings or evenings.'],
                      ['Send a request', 'Your name and phone number. No account needed.'],
                      ['Pay and get allotted', 'Pay by UPI or cash at the desk. The librarian confirms it and allots your seat — follow it under My requests.'],
                    ].map(([t, d], i) => (
                      <li key={t} className="flex gap-3">
                        <span className="w-6 shrink-0 font-display text-lg font-bold leading-5 text-[var(--saffron-700)]">
                          {i + 1}
                        </span>
                        <span>
                          <span className="block font-semibold text-[var(--warm-ink)]">{t}</span>
                          <span className="mt-0.5 block text-[var(--warm-ink-2)]">{d}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          </aside>
        </div>
      </main>

      <SeatRequestSheet
        member={selectedMember}
        open={requestOpen && selectedMember?.vacant === true}
        onClose={closeRequest}
        onSubmit={handleSubmitRequest}
      />
    </div>
  );
}
