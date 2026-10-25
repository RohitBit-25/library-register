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
import { Button } from '@/components/ui/Button';
import { SeatSkeleton } from '@/components/ui/Skeleton';
import { Check, Minus, Plus as PlusIcon, Maximize2, ArrowRight } from 'lucide-react';
import { seatAmenities, seatRow } from '@/lib/layoutConfig';
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
  { label: 'Free', swatch: 'border-[var(--emerald-500)]/70 bg-[#DDF3E4]' },
  { label: 'Your pick', swatch: 'border-[var(--saffron-700)] bg-[var(--saffron-600)]' },
  { label: 'Requested', swatch: 'border-dashed border-[var(--saffron-400)] bg-[#FDE8D6]' },
  { label: 'Taken', swatch: 'border-[#CFCAC3] bg-[#E6E3DF]' },
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
    if (n >= 1 && n <= 95) queueMicrotask(() => setSelectedSeat(n));
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
    transactionId: string, paymentMode: 'upi' | 'cash', documentUrl: string
  ) => {
    const result = await addRequest({
      seat, userName: name, userPhone: phone, message, joinDate, duration, shift,
      transactionId, paymentMode, documentUrl,
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

  const zoomBtn = 'flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-ui hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]';

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg-void)] text-[var(--text-primary)]">
      <UnifiedHeader />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-6 sm:px-6 lg:py-8">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-lg font-semibold leading-tight sm:text-xl">
              Pick a free seat
            </h1>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
              {isLoading ? 'Loading the hall…' : (
                <><span className="font-mono tabular text-[var(--text-primary)]">{freeCount}</span> of 95 free right now. Tap a green seat to request it.</>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              label="Shift"
              value={shiftFilter}
              onChange={setShiftFilter}
              options={[
                { value: 'all', label: 'Any shift' },
                { value: 'morning', label: 'Morning' },
                { value: 'evening', label: 'Evening' },
              ]}
            />
            <div className="hidden items-center gap-1 sm:flex" role="group" aria-label="Zoom">
              <button type="button" className={zoomBtn} aria-label="Zoom out"
                onClick={() => setZoom((z) => typeof z === 'number' ? Math.max(0.5, z - 0.25) : 0.75)}>
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <button type="button" className={cn(zoomBtn, zoom === 'room' && 'border-[var(--text-primary)] text-[var(--text-primary)]')}
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
                <div className="grid w-full grid-cols-6 gap-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:grid-cols-8 md:grid-cols-10 shadow-[var(--shadow-xs)]">
                  {Array.from({ length: 40 }, (_, i) => <SeatSkeleton key={i} />)}
                </div>
              ) : (
                <PublicSeatMap
                  fit={zoom === 'room' ? 'both' : 'width'}
                  scale={typeof zoom === 'number' ? zoom : undefined}
                  members={members}
                  selectedSeat={selectedSeat}
                  requestedSeats={requestedSeats}
                  onSelect={handleSeatClick}
                  isDimmed={(m) => !inShift.has(m.seat)}
                />
              )}
            </div>

            <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]" aria-label="Legend">
              {LEGEND.map((l) => (
                <li key={l.label} className="flex items-center gap-1.5">
                  <span className={cn('size-3 rounded-[3px] border', l.swatch)} aria-hidden="true" />
                  {l.label}
                </li>
              ))}
            </ul>

            {/* On a phone the plan shrinks past a usable tap size, so the same
                action is offered as full-size targets. The plan stays above for
                orientation, which is what a map is good for on a phone. */}
            {!isLoading && (
              <div data-equivalent-for="seat-map" className="mt-6 sm:hidden">
                <h2 className="mb-3 font-display text-md font-semibold">
                  Free seats <span className="font-mono text-sm font-normal text-[var(--text-tertiary)] tabular">{availableSeats.length}</span>
                </h2>
                {availableSeats.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    No free seats{shiftFilter === 'all' ? '' : ' in this shift'} right now. Requests still go on the waitlist.
                  </p>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    {availableSeats.map((seat) => (
                      <button
                        key={seat}
                        type="button"
                        onClick={() => handleSeatClick(seat)}
                        aria-label={`Seat ${seat}, free — tap to request`}
                        className="min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--emerald-500)] bg-[var(--bg-surface)] font-mono text-sm font-medium text-[var(--emerald-700)] tabular transition-ui active:bg-[var(--emerald-50)]"
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
            <div className="sticky top-6 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-xs)]">
              {selectedMember?.vacant ? (
                <>
                  <p className="text-xs text-[var(--text-tertiary)]">{seatRow(selectedMember.seat)} · reading hall</p>
                  <h2 className="mt-1 font-display text-xl font-semibold leading-none">
                    Seat <span className="tabular">{selectedMember.seat}</span>
                  </h2>
                  {/* Derived from where this seat actually sits in the hall. */}
                  <ul className="mt-5 space-y-2 border-t border-[var(--border-default)] pt-4 text-sm text-[var(--text-secondary)]">
                    {seatAmenities(selectedMember.seat).map((a) => (
                      <li key={a} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-[var(--emerald-600)]" aria-hidden="true" />
                        {a}
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-6 w-full" onClick={() => setRequestOpen(true)}>
                    Request seat {selectedMember.seat}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                  <button
                    type="button"
                    onClick={() => setSelectedSeat(null)}
                    className="mt-2 w-full cursor-pointer py-2 text-sm text-[var(--text-secondary)] underline-offset-4 hover:text-[var(--text-primary)] hover:underline"
                  >
                    Choose a different seat
                  </button>
                </>
              ) : (
                <>
                  <h2 className="font-display text-md font-semibold">How it works</h2>
                  <ol className="mt-4 space-y-4 text-sm">
                    {[
                      ['Pick a free seat', 'Green seats are open. Use the shift filter if you only need mornings or evenings.'],
                      ['Send a request', 'Your name and phone number. No account needed.'],
                      ['Pay and get allotted', 'Pay by UPI or cash at the desk. The librarian confirms it and allots your seat — follow it under My requests.'],
                    ].map(([t, d], i) => (
                      <li key={t} className="flex gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] font-mono text-xs text-[var(--text-secondary)]">
                          {i + 1}
                        </span>
                        <span>
                          <span className="block font-semibold text-[var(--text-primary)]">{t}</span>
                          <span className="mt-0.5 block text-[var(--text-secondary)]">{d}</span>
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
