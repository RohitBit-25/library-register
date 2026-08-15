'use client';

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Minus, Plus, Maximize2, Percent } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/hooks/useToast';
import AddMemberSheet from '@/components/seat/AddMemberSheet';
import { type Duration, type Member } from '@/lib/types';
import SeatTile from '@/components/seat/SeatTile';
import SeatDetailPanel from '@/components/seat/SeatDetailPanel';
import { SeatMapContainer, SeatMapWrapper } from '@/components/seat/SeatMap';
import { getSeatStatus } from '@/lib/seat-status';
import { type Shift } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/**
 * The floor plan, on its own.
 *
 * Everywhere else the plan is a card inside a scrolling page: it shares the
 * width with a nav rail and a detail panel, and it only ever fits to *width*,
 * so at 1184px tall the bottom of the room runs off the screen. You could
 * never see the whole hall at once — which is the one thing a floor plan is
 * for.
 *
 * Here it gets the entire viewport and fits to *both* axes, so the room is
 * whole by default. Zoom is then a deliberate act rather than the only way to
 * read the thing: 100% for real detail, and the fit button to get back.
 *
 * Deliberately not a duplicate of the dashboard. No stat chips, no search, no
 * mode toggles — those belong on a page you work *through*. This is a page you
 * *look at*, and everything that is not the room is chrome competing with it.
 */

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/** Same breakpoint the seat grid uses, so the sheet behaves identically. */
function useIsPhone() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(max-width: 639px)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia('(max-width: 639px)').matches,
    () => false,
  );
}

const LEGEND = [
  { label: 'Active', className: 'bg-[var(--emerald-500)]' },
  { label: 'Expiring', className: 'bg-[var(--saffron-500)]' },
  { label: 'Fee due', className: 'bg-[var(--marigold-500)]' },
  { label: 'Expired', className: 'bg-[var(--ruby-500)]' },
  { label: 'Vacant', className: 'bg-[var(--border-default)]' },
];

export default function FloorPlanPage() {
  const router = useRouter();
  const { members, isLoading, update, vacate, renew, add } = useMembers();
  const { addToast } = useToast();
  const isPhone = useIsPhone();
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [shiftFilter, setShiftFilter] = useState<Shift | 'all'>('all');
  // `undefined` means the user has not chosen yet, so the default applies;
  // `null` means fitted to the viewport; a number is an explicit zoom.
  //
  // Derived rather than set from an effect: `useSyncExternalStore` resolves
  // the media query *after* the first client render, so an effect that reads
  // `isPhone` on mount sees `false` and latches the desktop default on a
  // phone. Deriving it has no such window.
  //
  // Why phones differ: fitting a 14×12 room into 390px puts each seat at 24px
  // — the floor of what a thumb can hit and too small to read a number on. So
  // phones open at full size and pan, the way every map application on a phone
  // behaves, with Fit one tap away for the overview.
  const [chosenZoom, setChosenZoom] = useState<number | null | undefined>(undefined);
  const zoom = chosenZoom === undefined ? (isPhone ? 1 : null) : chosenZoom;

  const inShift = useMemo(() => {
    if (shiftFilter === 'all') return null;
    return new Set(
      members.filter((m) => m.vacant || m.shift === shiftFilter || m.shift === 'full')
        .map((m) => m.seat)
    );
  }, [members, shiftFilter]);

  const selectedMember = selectedSeat !== null
    ? members.find((m) => m.seat === selectedSeat) ?? null
    : null;

  const counts = useMemo(() => {
    const occupied = members.filter((m) => !m.vacant);
    return {
      occupied: occupied.length,
      vacant: members.length - occupied.length,
      attention: occupied.filter((m) => {
        const s = getSeatStatus(m);
        return s === 'expiring' || s === 'expired' || m.fee === 'due';
      }).length,
    };
  }, [members]);

  const vacantSeats = useMemo(() => members.filter((m) => m.vacant).map((m) => m.seat), [members]);
  const close = useCallback(() => setSelectedSeat(null), []);

  const onMarkPaid = (seat: number) => {
    update(seat, { fee: 'paid' }, (msg) => addToast('error', msg));
    addToast('success', `Payment confirmed for Seat ${seat}`);
  };
  const onMarkDue = (seat: number) => {
    update(seat, { fee: 'due' }, (msg) => addToast('error', msg));
    addToast('warning', `Seat ${seat} marked as pending payment`);
  };
  const onRenew = (seat: number, joinDate: string, duration: Duration) => {
    renew(seat, joinDate, duration as '1M' | '3M' | '6M' | '1Y', (msg) => addToast('error', msg));
    addToast('success', `Membership extended for Seat ${seat}`);
  };
  const onRemove = (seat: number) => {
    vacate(seat, (msg) => addToast('error', msg)).then((waiting) => {
      if (waiting.length) {
        addToast('warning', `${waiting.length} on the waitlist — ${waiting[0].userName} is first.`);
      }
    });
    addToast('success', `Seat ${seat} is now vacant`);
  };
  const onUpdate = (seat: number, patch: Partial<Member>) => {
    update(seat, patch, (msg) => addToast('error', msg));
    addToast('success', `Updated details for Seat ${seat}`);
  };
  const onAdd = async (seat: number, data: Omit<Member, 'seat' | 'vacant'>) => {
    if (await add(seat, data)) {
      addToast('success', `Allotted Seat ${seat} to ${data.name}`);
      close();
    }
  };

  const stepZoom = useCallback((dir: 1 | -1) => {
    const current = zoom ?? 1;
    const i = ZOOM_STEPS.findIndex((v) => v >= current - 0.001);
    const next = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, i + dir))];
    setChosenZoom(next ?? current);
  }, [zoom]);

  const btn = 'flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border '
    + 'border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm font-semibold '
    + 'text-[var(--text-primary)] transition-ui hover:border-[var(--saffron-300)] '
    + 'hover:bg-[var(--saffron-50)] focus-visible:outline-none focus-visible:ring-2 '
    + 'focus-visible:ring-[var(--saffron-500)] disabled:opacity-40 disabled:hover:bg-[var(--bg-surface)]';

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[var(--bg-void)]">
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 sm:px-6">
        <button type="button" onClick={() => router.push('/')} className={btn} aria-label="Back to the dashboard">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-tight text-[var(--text-primary)] sm:text-md">
            Floor Plan
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            {isLoading ? 'Loading the hall…' : (
              <>
                <span className="tabular font-semibold text-[var(--text-primary)]">{counts.occupied}</span> occupied
                {' · '}
                <span className="tabular font-semibold text-[var(--text-primary)]">{counts.vacant}</span> free
                {counts.attention > 0 && (
                  <>
                    {' · '}
                    <span className="tabular font-semibold text-[var(--ruby-700)]">{counts.attention}</span> need attention
                  </>
                )}
              </>
            )}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Select value={shiftFilter} onValueChange={(v) => setShiftFilter(v as Shift | 'all')}>
            <SelectTrigger className="h-11 w-[150px] font-semibold" aria-label="Filter the plan by shift">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All shifts</SelectItem>
              <SelectItem value="morning">Morning shift</SelectItem>
              <SelectItem value="evening">Evening shift</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1" role="group" aria-label="Zoom">
            <button type="button" onClick={() => stepZoom(-1)} className={btn}
              disabled={zoom !== null && zoom <= ZOOM_STEPS[0]} aria-label="Zoom out">
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setChosenZoom(null)}
              className={cn(btn, zoom === null && 'border-[var(--saffron-500)] bg-[var(--saffron-50)]')}
              aria-label="Fit the whole room on screen" aria-pressed={zoom === null}>
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden lg:inline">Fit</span>
            </button>
            <button type="button" onClick={() => setChosenZoom(1)}
              className={cn(btn, zoom === 1 && 'border-[var(--saffron-500)] bg-[var(--saffron-50)]')}
              aria-label="Show the plan at full size" aria-pressed={zoom === 1}>
              <Percent className="h-4 w-4" aria-hidden="true" />
              <span className="hidden lg:inline">100</span>
            </button>
            <button type="button" onClick={() => stepZoom(1)} className={btn}
              disabled={zoom !== null && zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]} aria-label="Zoom in">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* ── The room ─────────────────────────────────────────────── */}
      <main className="relative min-h-0 flex-1 p-3 sm:p-5">
        <div className="flex h-full w-full items-center justify-center">
          <SeatMapContainer fit="both" scale={zoom ?? undefined} frameless>
            {/* `compact` is not optional despite the extra room here: the full
                tile draws a 44px avatar plus a name into a 54px pad, which
                clips the avatar to a bowl. Same layout as the dashboard map,
                so a seat looks identical in both places. */}
            {members.map((m) => (
              <SeatMapWrapper key={m.seat} seatNum={m.seat}>
                {(face) => (
                  <SeatTile
                    member={m}
                    face={face}
                    compact
                    onClick={() => setSelectedSeat(m.seat)}
                    selected={selectedSeat === m.seat}
                    dimmed={inShift ? !inShift.has(m.seat) : false}
                  />
                )}
              </SeatMapWrapper>
            ))}
          </SeatMapContainer>
        </div>
      </main>

      {/* ── Legend ───────────────────────────────────────────────── */}
      <footer className="flex shrink-0 flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3">
        {LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
            <span className={cn('h-3 w-3 rounded-full', l.className)} aria-hidden="true" />
            {l.label}
          </span>
        ))}
      </footer>

      {selectedSeat !== null && (
        selectedMember?.vacant !== false ? (
          <AddMemberSheet
            open
            onClose={close}
            seat={selectedSeat}
            vacantSeats={vacantSeats}
            onSubmit={onAdd}
            isMobile={isPhone}
          />
        ) : (
          <SeatDetailPanel
            member={selectedMember}
            open
            onClose={close}
            onMarkPaid={onMarkPaid}
            onMarkDue={onMarkDue}
            onRenew={onRenew}
            onRemove={onRemove}
            onUpdate={onUpdate}
            isMobile={isPhone}
          />
        )
      )}
    </div>
  );
}
