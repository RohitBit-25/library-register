'use client';

import { useState, useMemo, useCallback } from 'react';
import { type Member, type Shift } from '@/lib/types';
import { cn } from '@/lib/utils';
import SeatTile from './SeatTile';
import AttendanceTile from './AttendanceTile';
import { SeatMapContainer, SeatMapWrapper, type FaceDir } from './SeatMap';
import { nextSeatInDirection } from '@/lib/layoutConfig';
import { useAttendance } from '@/hooks/useAttendance';
import { useToast } from '@/hooks/useToast';
import { LazyMotion, domAnimation } from 'framer-motion';
import { Sun, Moon, Layers, ClipboardCheck, Settings2, CheckCheck } from 'lucide-react';
import Segmented from '@/components/ui/Segmented';
import { STATUS_STYLE, STATUS_ORDER } from './statusStyle';
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
  const { addToast } = useToast();

  const handleSeatClick = useCallback((seat: number) => {
    onSeatClick(seat);
  }, [onSeatClick]);

  // In attendance mode a tap toggles presence rather than opening the panel.
  // The map already knows who sits where, so walking the room and tapping
  // seats beats leaving for a separate list of 95 rows.
  const handleToggleAttendance = useCallback((seat: number) => {
    const write = isPresent(todayStr, seat) ? markAbsent(todayStr, seat) : markPresent(todayStr, seat);
    write.then((ok) => { if (!ok) addToast('error', `Could not save attendance for seat ${seat}. Try again.`); });
  }, [isPresent, markAbsent, markPresent, todayStr, addToast]);

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
    { value: 'all', label: 'All shifts', icon: <Layers className="size-3.5" /> },
    { value: 'morning', label: 'Morning', icon: <Sun className="size-3.5" /> },
    { value: 'evening', label: 'Evening', icon: <Moon className="size-3.5" /> },
  ];

  return (
    <LazyMotion features={domAnimation}>
      <div className="w-full">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {/* Plan / list. On a phone the plan has to shrink past the point
              where a seat is readable, so the list is the working view there. */}
          <Segmented
            className="sm:hidden"
            label="View"
            value={effectiveView}
            onChange={setView}
            options={[
              { value: 'plan', label: 'Plan' },
              { value: 'list', label: 'List' },
            ]}
          />
          {/* Attendance is a different job from management — same map,
              different question, so it gets its own mode. */}
          <Segmented
            className="hidden sm:inline-flex"
            label="Mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'manage', label: 'Manage', icon: <Settings2 className="size-3.5" /> },
              { value: 'attendance', label: 'Attendance', icon: <ClipboardCheck className="size-3.5" /> },
            ]}
          />
          {mode === 'manage' && (
            <Segmented label="Shift" value={shiftFilter} onChange={setShiftFilter} options={shifts} />
          )}

          <div className="ml-auto flex items-center gap-3">
            {mode === 'attendance' ? (
              <>
                <span className="text-sm text-[var(--text-secondary)]" aria-live="polite">
                  <span className="font-mono font-medium text-[var(--text-primary)] tabular">{presentToday}</span> of{' '}
                  <span className="font-mono tabular">{occupiedCount}</span> present
                </span>
                <button
                  type="button"
                  onClick={() => markAllPresent(todayStr).then((ok) => { if (!ok) addToast('error', 'Could not mark everyone present. Try again.'); })}
                  className="flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-medium text-[var(--text-primary)] transition-ui hover:bg-[var(--bg-muted)]"
                >
                  <CheckCheck className="size-4 text-[var(--emerald-600)]" aria-hidden="true" />
                  Mark all present
                </button>
              </>
            ) : statusFilter ? (
              // A filtered plan looks like a plan, so it has to say so —
              // otherwise you come back and read a dimmed map as the library.
              <span className="text-sm text-[var(--text-secondary)]" aria-live="polite">
                Showing <span className="font-mono font-medium text-[var(--text-primary)] tabular">{filtered.length}</span>{' '}
                {STATUS_FILTER_LABEL[statusFilter]}
              </span>
            ) : (
              <SeatLegend className="hidden sm:flex" />
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
    </LazyMotion>
  );
}

/** The key to the plan's colours, from the same table the tiles use. */
export function SeatLegend({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-[var(--text-secondary)]', className)} aria-label="Legend">
      {STATUS_ORDER.map((k) => (
        <li key={k} className="flex items-center gap-1.5 whitespace-nowrap">
          <span className={cn('size-2.5 rounded-[3px] border', STATUS_STYLE[k].swatch)} aria-hidden="true" />
          {STATUS_STYLE[k].label}
        </li>
      ))}
    </ul>
  );
}
