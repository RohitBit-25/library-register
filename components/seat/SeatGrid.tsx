'use client';

import { useState, useMemo, useCallback } from 'react';
import { type Member, type Shift } from '@/lib/types';
import { cn } from '@/lib/utils';
import SeatTile from './SeatTile';
import AttendanceTile from './AttendanceTile';
import { SeatMapContainer, SeatMapWrapper, type FaceDir } from './SeatMap';
import { nextSeatInDirection } from '@/lib/layoutConfig';
import { useAttendance } from '@/hooks/useAttendance';
import { LazyMotion, domAnimation } from 'framer-motion';
import { Sun, Moon, Layers, Grid3X3, ClipboardCheck, Settings2, CheckCheck, Map as MapIcon, List } from 'lucide-react';
import SeatList from './SeatList';
import { getSeatState } from '@/lib/seat-status';
import { useSyncExternalStore } from 'react';

type MapMode = 'manage' | 'attendance';
type ViewMode = 'plan' | 'list';

/**
 * True below Tailwind's `sm`. Read through useSyncExternalStore rather than
 * a resize effect, so the first paint already knows which view to render and
 * a phone never flashes the plan before switching.
 */
function useIsPhone() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(max-width: 639px)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia('(max-width: 639px)').matches,
    () => false // server render: assume desktop, the plan is the canonical view
  );
}

/** A status the counters above the map can filter down to. */
export type StatusFilter = 'due' | 'expiring' | 'expired' | 'vacant' | null;

const STATUS_FILTER_LABEL: Record<Exclude<StatusFilter, null>, string> = {
  due: 'with fees due',
  expiring: 'expiring soon',
  expired: 'expired',
  vacant: 'available',
};

interface SeatGridProps {
  members: Member[];
  onSeatClick: (seat: number) => void;
  selectedSeat?: number | null;
  /** Set by the counters above the map; null means show everything. */
  statusFilter?: StatusFilter;
}

export default function SeatGrid({ members, onSeatClick, selectedSeat, statusFilter = null }: SeatGridProps) {
  const [shiftFilter, setShiftFilter] = useState<Shift | 'all'>('all');
  const [mode, setMode] = useState<MapMode>('manage');
  const isPhone = useIsPhone();
  // Phones open on the list; the plan is one tap away and still the default
  // everywhere it actually fits.
  const [view, setView] = useState<ViewMode | null>(null);
  const effectiveView: ViewMode = view ?? (isPhone ? 'list' : 'plan');

  const { isPresent, markPresent, markAbsent, markAllPresent, todayStr, presentToday } =
    useAttendance();

  const handleSeatClick = useCallback((seat: number) => {
    onSeatClick(seat);
  }, [onSeatClick]);

  // In attendance mode a tap toggles presence rather than opening the panel.
  // The map already knows who sits where, so walking the room and tapping
  // seats beats leaving for a separate list of 95 rows.
  const handleToggleAttendance = useCallback((seat: number) => {
    if (isPresent(todayStr, seat)) markAbsent(todayStr, seat);
    else markPresent(todayStr, seat);
  }, [isPresent, markAbsent, markPresent, todayStr]);

  // Arrow keys walk the floor plan. Tab order follows seat number, which
  // jumps across the room between runs, so reaching seat 90 by keyboard meant
  // 90 presses. Handled at the container so it works for both tile types.
  const handleMapKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const DIRS: Record<string, FaceDir> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    };
    const dir = DIRS[e.key];
    if (!dir) return;

    const active = document.activeElement as HTMLElement | null;
    const current = Number(active?.dataset?.seat);
    if (!current) return;

    // SeatMapWrapper puts data-seat on its positioning div too, and that div
    // is not focusable — match the button or focus() silently does nothing.
    const container = e.currentTarget;
    const seats = Array.from(container.querySelectorAll<HTMLElement>('button[data-seat]'))
      .map((el) => Number(el.dataset.seat));

    const next = nextSeatInDirection(current, dir, seats);
    if (next === null) return;

    // Only swallow the key once a move is certain, so an edge seat still lets
    // the page scroll rather than trapping focus.
    e.preventDefault();
    container.querySelector<HTMLElement>(`button[data-seat="${next}"]`)?.focus();
  }, []);

  const occupiedCount = useMemo(() => members.filter(m => !m.vacant).length, [members]);

  // One predicate, two presentations. A list is not a spatial reference, so
  // removing rows there is right; a floor plan is, so removing tiles there
  // leaves holes in a drawing of a real room. The plan dims instead.
  //
  // Shift and status are separate questions and combine — "morning seats that
  // owe money" is a real thing to want, and is how an admin plans a shift.
  const matchesFilters = useCallback((m: Member) => {
    const shiftOk = shiftFilter === 'all' || m.vacant
      || m.shift === shiftFilter || m.shift === 'full';
    if (!shiftOk) return false;

    if (!statusFilter) return true;
    if (statusFilter === 'vacant') return m.vacant;
    if (m.vacant) return false;
    // Match the counter exactly. `status` applies the app's precedence —
    // expired outranks due — which is what the "Fee Due" chip counts. Using
    // `hasDues` here instead would highlight 12 seats under a chip reading 8,
    // because four of them are expired and counted in that chip instead.
    const { status } = getSeatState(m);
    return status === statusFilter;
  }, [shiftFilter, statusFilter]);

  const filtered = useMemo(() => members.filter(matchesFilters), [members, matchesFilters]);

  const shifts: { value: Shift | 'all'; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <Layers className="w-3.5 h-3.5" /> },
    { value: 'morning', label: 'Morning', icon: <Sun className="w-3.5 h-3.5" /> },
    { value: 'evening', label: 'Evening', icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  return (
    <LazyMotion features={domAnimation}>
      <div className="w-full">
        {/* Grid Container */}
        <div className="rounded-xl bg-[var(--bg-surface)] overflow-hidden relative shadow-sm">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-[var(--border-default)] bg-[var(--bg-muted)]/30">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-[var(--saffron-50)] border border-[var(--saffron-200)]">
                <Grid3X3 className="w-4 h-4 text-[var(--saffron-600)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {mode === 'attendance'
                  ? "Today's Attendance"
                  : shiftFilter === 'all'
                    ? 'Floor Plan'
                    : `${shiftFilter.charAt(0).toUpperCase() + shiftFilter.slice(1)} Shift`}
              </h3>
              {mode === 'attendance' ? (
                // Live progress during a check-in pass — the librarian needs to
                // know how many are left, not how many seats exist.
                <span
                  className="tabular rounded-md border border-[var(--emerald-200)] bg-[var(--emerald-50)] px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--emerald-600)]"
                  aria-live="polite"
                >
                  {presentToday} / {occupiedCount} PRESENT
                </span>
              ) : statusFilter ? (
                // A filtered plan looks like a plan, so it has to say so —
                // otherwise you scroll away, come back, and read a dimmed map
                // as the whole library.
                <span className="tabular flex items-center gap-2 rounded-md border border-[var(--text-primary)] bg-[var(--bg-surface)] px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-[var(--text-primary)] uppercase">
                  {filtered.length} {STATUS_FILTER_LABEL[statusFilter]}
                  <span className="font-normal normal-case tracking-normal text-[var(--text-tertiary)]">
                    of {members.length}
                  </span>
                </span>
              ) : (
                <span className="tabular rounded-md border border-[var(--saffron-200)] bg-[var(--saffron-50)] px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-[var(--saffron-700)]">
                  {filtered.length} SEATS
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Plan / list. The plan is 1160px wide; on a phone it has to
                  shrink past the point where a seat is readable or tappable,
                  so the list is the working view there. */}
              <div className="flex shrink-0 items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 shadow-sm sm:hidden">
                {([
                  { value: 'plan' as const, label: 'Plan', icon: <MapIcon className="h-3.5 w-3.5" /> },
                  { value: 'list' as const, label: 'List', icon: <List className="h-3.5 w-3.5" /> },
                ]).map(v => (
                  <button
                    key={v.value}
                    onClick={() => setView(v.value)}
                    aria-pressed={effectiveView === v.value}
                    className={cn(
                      'flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-600)]',
                      effectiveView === v.value
                        ? 'bg-[var(--saffron-600)] text-[var(--text-inverse)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]',
                    )}
                  >
                    {v.icon}
                    {v.label}
                  </button>
                ))}
              </div>

              {/* Mode switch. Attendance is a different job from management —
                  same map, different question, so it gets its own mode rather
                  than more controls crowded into the seat panel. */}
              <div className="flex shrink-0 items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 shadow-sm">
                {([
                  { value: 'manage' as const, label: 'Manage', icon: <Settings2 className="h-3.5 w-3.5" /> },
                  { value: 'attendance' as const, label: 'Attendance', icon: <ClipboardCheck className="h-3.5 w-3.5" /> },
                ]).map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    aria-pressed={mode === m.value}
                    className={cn(
                      'flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-600)]',
                      mode === m.value
                        ? 'bg-[var(--saffron-600)] text-[var(--text-inverse)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]',
                    )}
                  >
                    {m.icon}
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Shift filter is only meaningful when managing seats. */}
              {mode === 'manage' && (
                <div className="flex shrink-0 items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 shadow-sm">
                  {shifts.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setShiftFilter(s.value)}
                      className={cn(
                        'flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-600)]',
                        shiftFilter === s.value
                          ? 'bg-[var(--saffron-600)] text-[var(--text-inverse)] shadow-sm'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]',
                      )}
                    >
                      {s.icon}
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              {mode === 'attendance' && (
                <button
                  onClick={() => markAllPresent(todayStr)}
                  className="flex min-h-[36px] shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--emerald-200)] bg-[var(--emerald-50)] px-3.5 text-xs font-bold text-[var(--emerald-600)] transition-ui hover:bg-[var(--emerald-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--emerald-600)]"
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Mark all present
                </button>
              )}
            </div>
          </div>

          {effectiveView === 'list' && mode === 'manage' ? (
            <SeatList
              members={shiftFilter === 'all' ? members : filtered}
              onSeatClick={handleSeatClick}
              selectedSeat={selectedSeat}
            />
          ) : (
          <div onKeyDown={handleMapKeyDown} role="group" aria-label="Seat map — use arrow keys to move between seats">
          <SeatMapContainer>
            {members.map(member => (
              <SeatMapWrapper key={member.seat} seatNum={member.seat}>
                {(face: FaceDir) => (
                  <div className="h-full w-full">
                    {mode === 'attendance' ? (
                      <AttendanceTile
                        member={member}
                        present={isPresent(todayStr, member.seat)}
                        onToggle={handleToggleAttendance}
                      />
                    ) : (
                      <SeatTile
                        member={member}
                        onClick={handleSeatClick}
                        compact={true}
                        face={face}
                        selected={selectedSeat === member.seat}
                        dimmed={mode === 'manage' && !matchesFilters(member)}
                      />
                    )}
                  </div>
                )}
              </SeatMapWrapper>
            ))}
          </SeatMapContainer>
          </div>
          )}
        </div>
      </div>
    </LazyMotion>
  );
}
