'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMembers } from '@/hooks/useMembers';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useToast } from '@/hooks/useToast';
import { type Shift, type Duration } from '@/lib/types';
import PublicSeatMap from '@/components/seat/PublicSeatMap';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import StudentSidebar from '@/components/layout/StudentSidebar';
import SeatRequestSheet from '@/components/seat/SeatRequestSheet';
import { SeatSkeleton } from '@/components/ui/Skeleton';
import { ArrowLeft, MapPin, Check, Armchair } from 'lucide-react';
import { seatAmenities } from '@/lib/layoutConfig';
import { cn } from '@/lib/utils';

export default function BrowsePage() {
  const router = useRouter();
  const { members, isLoading } = useMembers();
  const { addRequest, requests } = useSeatRequests();
  const { addToast } = useToast();

  const [shiftFilter, setShiftFilter] = useState<Shift | 'all'>('all');
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (shiftFilter === 'all') return members;
    return members.filter(m => m.vacant || m.shift === shiftFilter || m.shift === 'full');
  }, [members, shiftFilter]);

  // Set membership, not `filtered.includes(m)` — the latter is a linear scan
  // per seat, so 95 tiles cost 95 × 95 comparisons on every render.
  const inShift = useMemo(
    () => new Set(filtered.map((m) => m.seat)),
    [filtered]
  );

  const requestedSeats = useMemo(
    () => new Set(requests.filter((r) => r.status === 'pending').map((r) => r.seat)),
    [requests]
  );

  const selectedMember = selectedSeat !== null
    ? members.find(m => m.seat === selectedSeat) ?? null
    : null;

  // Free seats in the current filter, for the phone list below the map.
  const availableSeats = useMemo(
    () => members
      .filter((m) => m.vacant && inShift.has(m.seat) && !requestedSeats.has(m.seat))
      .map((m) => m.seat)
      .sort((a, b) => a - b),
    [members, inShift, requestedSeats]
  );

  const handleSeatClick = useCallback((seat: number) => {
    const member = members.find(m => m.seat === seat);
    if (!member?.vacant) return;
    if (requests.some(r => r.seat === seat && r.status === 'pending')) {
      addToast('warning', `Already have a pending request for Seat #${seat}`);
      return;
    }
    setSelectedSeat(seat);
  }, [members, requests, addToast]);

  const handleSubmitRequest = async (
    seat: number, name: string, phone: string, message: string, joinDate: string, duration: Duration, shift: Shift,
    transactionId: string, paymentMode: 'upi' | 'cash', documentUrl: string
  ) => {
    const result = await addRequest({
      seat, userName: name, userPhone: phone, message, joinDate, duration, shift,
      transactionId, paymentMode, documentUrl,
    });
    if (result.success) {
      addToast('success', `Seat #${seat} request submitted.`);
      setSelectedSeat(null);
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)] font-body selection:bg-[var(--saffron-500)] selection:text-[var(--bg-void)] flex flex-col">
      <UnifiedHeader />

      <main className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full p-4 md:p-6 lg:p-8">
        <section className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 border border-[var(--border-default)] rounded-3xl bg-[var(--bg-surface)] p-2 sm:p-4 lg:p-6 shadow-sm overflow-hidden">
          
          <StudentSidebar />

          {/* Seat Map Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 px-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/landing')}
                  aria-label="Back to home"
                  className="rounded-lg p-1.5 text-[var(--text-tertiary)] transition-ui hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)]"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  Choose your seat
                </h1>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                {/* "All Zones" named something this app does not have — the
                    field filters by shift. */}
                <Select value={shiftFilter} onValueChange={(v) => setShiftFilter(v as Shift | 'all')}>
                  <SelectTrigger className="min-h-[40px] w-[168px] font-semibold" aria-label="Filter seats by shift">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All shifts</SelectItem>
                    <SelectItem value="morning">Morning shift</SelectItem>
                    <SelectItem value="evening">Evening shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-muted)]/30">
              <div className="flex-1 p-2 sm:p-4">
                {isLoading ? (
                  <div className="grid w-full grid-cols-6 gap-2 p-4 sm:grid-cols-8 md:grid-cols-10">
                    {Array.from({ length: 40 }, (_, i) => <SeatSkeleton key={i} />)}
                  </div>
                ) : (
                  <PublicSeatMap
                    members={members}
                    selectedSeat={selectedSeat}
                    requestedSeats={requestedSeats}
                    onSelect={handleSeatClick}
                    isDimmed={(m) => !inShift.has(m.seat)}
                  />
                )}
              </div>

              {/* The map scales to fit a phone, which puts every seat tile at
                  16×16 — well under the 24px WCAG 2.5.8 floor, and far under
                  what a thumb can hit. Rather than fight the map's scaling,
                  small screens get the same action as a list of full-size
                  targets; the map stays above it for orientation, which is
                  what a map is actually good for on a phone.

                  Not shown on `sm` and up, where the tiles are big enough. */}
              {!isLoading && (
                <div data-equivalent-for="seat-map" className="border-t border-[var(--border-default)] p-4 sm:hidden">
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                    Available seats
                    <span className="ml-1.5 font-semibold text-[var(--text-tertiary)]">
                      ({availableSeats.length})
                    </span>
                  </h2>
                  {availableSeats.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">
                      No free seats{shiftFilter === 'all' ? '' : ' in this shift'} right now.
                      Requests still go on the waitlist.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableSeats.map((seat) => (
                        <button
                          key={seat}
                          type="button"
                          onClick={() => handleSeatClick(seat)}
                          aria-label={`Seat ${seat}, available — tap to request`}
                          aria-pressed={selectedSeat === seat}
                          className={cn(
                            'tabular min-h-[44px] min-w-[44px] rounded-xl border px-3 text-sm font-bold transition-ui',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)] focus-visible:ring-offset-2',
                            selectedSeat === seat
                              ? 'border-[var(--saffron-500)] bg-[var(--saffron-500)] text-white'
                              : 'border-[var(--emerald-200)] bg-[var(--emerald-50)] text-[var(--emerald-700)]'
                          )}
                        >
                          {seat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Three states, which is all this map has. The old legend also
                  listed "Blocked" and "You" — neither exists in this app. */}
              <div className="mt-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-xs font-bold text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-[4px] border border-[var(--emerald-200)] bg-[var(--emerald-50)]">
                    <Armchair className="h-2 w-2 text-[var(--emerald-600)]" aria-hidden="true" />
                  </span>
                  Available
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-[4px] bg-[var(--saffron-500)]" />
                  Your pick
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-[4px] border border-[var(--saffron-200)] bg-[var(--saffron-50)]" />
                  Requested
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-[4px] border border-[var(--border-default)] bg-[var(--bg-muted)]" />
                  Taken
                </div>
              </div>
            </div>
          </div>

          {/* Right Detail Sidebar */}
          <aside className="w-full lg:w-[280px] xl:w-[320px] shrink-0 flex flex-col gap-6">
            
            {selectedMember?.vacant ? (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Seat {selectedMember.seat}</h3>
                  <span className="text-xs uppercase font-bold tracking-wider text-[var(--emerald-600)] bg-[var(--emerald-50)] border border-[var(--emerald-200)] px-2 py-1 rounded-full">
                    Available
                  </span>
                </div>
                
                {/* Derived from where this seat actually sits in the hall.
                    Every seat used to advertise the same seven amenities,
                    window included, whichever corner it was in. */}
                <div className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-tertiary)]">
                  <MapPin className="h-4 w-4" aria-hidden="true" /> Reading hall · seat {selectedSeat}
                </div>

                <ul className="mb-6 space-y-2 text-sm font-medium text-[var(--text-secondary)]">
                  {seatAmenities(selectedSeat!).map((a) => (
                    <li key={a} className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[var(--emerald-600)]" aria-hidden="true" />
                      {a}
                    </li>
                  ))}
                </ul>
                
                <div className="mb-8">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">Best for</div>
                  <span className="inline-block bg-[var(--saffron-50)] text-[var(--saffron-700)] text-xs font-bold px-3 py-1 rounded-full border border-[var(--saffron-200)]">
                    Focused Study
                  </span>
                </div>
                
                <div className="mt-auto flex flex-col gap-3">
                  <button onClick={() => setSelectedSeat(selectedMember.seat)} className="w-full py-3.5 rounded-xl bg-[var(--saffron-700)] hover:bg-[var(--saffron-800)] text-white font-bold text-sm transition-colors">
                    Reserve This Seat
                  </button>
                  <button onClick={() => setSelectedSeat(null)} className="w-full py-3.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold text-sm transition-colors">
                    View Other Seats
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm h-full flex flex-col">
                <h2 className="text-sm font-bold text-[var(--text-primary)] mb-6">My Booking</h2>
                
                <div className="flex-1 flex flex-col items-center justify-center text-center pb-8">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--bg-muted)]">
                    <Armchair className="h-9 w-9 text-[var(--text-tertiary)]" aria-hidden="true" />
                  </div>
                  <div className="text-lg font-bold text-[var(--text-primary)] mb-2">No seat booked yet</div>
                  <div className="text-sm text-[var(--text-secondary)] mb-8">Choose your perfect seat and get started.</div>
                  
                  <button onClick={() => setSelectedSeat(null)} className="px-6 py-2.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border-default)] text-[var(--saffron-700)] font-bold text-sm transition-colors">
                    Choose Seat
                  </button>
                </div>
              </div>
            )}
            
          </aside>
          
        </section>

      </main>

      <SeatRequestSheet
        member={selectedMember}
        open={selectedSeat !== null && selectedMember?.vacant === true}
        onClose={() => setSelectedSeat(null)}
        onSubmit={handleSubmitRequest}
      />
    </div>
  );
}
