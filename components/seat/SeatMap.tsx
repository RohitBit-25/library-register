'use client';

import React, { ReactNode, memo } from 'react';
import { DoorOpen, Snowflake, Wind } from 'lucide-react';
import {
  LAYOUT_CONFIG,
  getSeatPositionConfig,
  type WallDetail,
  type FaceDir,
  type SeatPosition,
  SEAT_ROWS,
} from '@/lib/layoutConfig';
import { deriveDeskRuns, type DeskRun } from '@/lib/deskLayout';

// Types now live in lib/layoutConfig (the data layer). Re-exported here
// because ~10 components already import them from this module.
export type { FaceDir, SeatPosition };

// ─── Constants ────────────────────────────────────────────────────────────────

const { CELL, PAD, COLS, ROWS, WALL_DETAILS, FLOOR_PLANTS } = LAYOUT_CONFIG;

const CANVAS_W = COLS * CELL + PAD * 2;
const CANVAS_H = ROWS * CELL + PAD * 2;

// ─── Logic ────────────────────────────────────────────────────────────────────

export function getSeatPosition(n: number): SeatPosition {
  return getSeatPositionConfig(n);
}

function toPixel(col: number, row: number) {
  const SIZE = 48;
  const jitter = (col % 2 === 0) ? 2 : -2;
  return {
    left: PAD + (col - 1) * CELL + (CELL - SIZE) / 2,
    top: PAD + (row - 1) * CELL + (CELL - SIZE) / 2 + jitter,
  };
}

// ─── Visual Components ────────────────────────────────────────────────────────

/**
 * A shared desk, derived from a run of seats that face the same way.
 *
 * Replaces four hand-placed grey rectangles that had no relationship to seat
 * positions. Each slab now sits against the seats that use it, with a divider
 * between neighbours — which is what makes the floor read as furniture rather
 * than as squares scattered on a grid.
 */
const DeskSlab = memo(function DeskSlab({ run }: { run: DeskRun }) {
  const vertical = run.face === 'left' || run.face === 'right';
  const dividerCount = Math.max(run.seats.length - 1, 0);

  return (
    <div
      className="absolute z-0 rounded-[3px]"
      style={{ left: run.left, top: run.top, width: run.width, height: run.height }}
      aria-hidden="true"
    >
      {/* Slab. Warm wood tone with a real edge — saffron-50 was so close to
          white that the desks read as faint smudges rather than furniture. */}
      <div className="absolute inset-0 rounded-[3px] bg-[var(--saffron-100)] border border-[var(--saffron-300)] shadow-[0_1px_2px_0_rgba(28,25,23,0.08)]" />

      {/* Lit front edge — the side the seats sit against catches light. */}
      <div
        className={cnLocal(
          'absolute bg-white/70',
          run.face === 'right' && 'left-0 top-0 bottom-0 w-px',
          run.face === 'left' && 'right-0 top-0 bottom-0 w-px',
          run.face === 'down' && 'top-0 left-0 right-0 h-px',
          run.face === 'up' && 'bottom-0 left-0 right-0 h-px',
        )}
      />

      {/* Centre spine on a shared table — the line where two facing rows meet,
          and where a real reading hall puts its divider. */}
      {run.shared && (
        <div
          className={cnLocal(
            'absolute bg-[var(--saffron-300)]',
            vertical ? 'top-0 bottom-0 left-1/2 w-px' : 'left-0 right-0 top-1/2 h-px'
          )}
        />
      )}

      {/* Carrel dividers between neighbouring seats. On a shared table the
          seats are split across both sides, so step by half. */}
      {Array.from({ length: dividerCount }, (_, i) => {
        const perSide = run.shared ? Math.ceil(run.seats.length / 2) : run.seats.length;
        const pct = (((i % perSide) + 1) / perSide) * 100;
        if (pct >= 100) return null;
        return (
          <div
            key={i}
            className="absolute bg-[var(--saffron-200)]"
            style={
              vertical
                ? { top: `${pct}%`, left: 3, right: 3, height: 1 }
                : { left: `${pct}%`, top: 3, bottom: 3, width: 1 }
            }
          />
        );
      })}
    </div>
  );
});

/** Local class joiner — SeatMap has no other reason to import from lib/utils. */
function cnLocal(...v: (string | false | undefined)[]) {
  return v.filter(Boolean).join(' ');
}

/** Flat, architectural plant marker */
const Plant = ({ col, row }: { col: number; row: number }) => (
  <div
    className="absolute flex items-center justify-center opacity-60"
    style={{
      left: PAD + (col - 1) * CELL + CELL * 0.2,
      top: PAD + (row - 1) * CELL + CELL * 0.2,
      width: CELL * 0.6,
      height: CELL * 0.6,
    }}
  >
    <div className="w-[60%] h-[60%] rounded-full bg-[var(--emerald-50)] border border-[var(--emerald-200)] flex items-center justify-center">
      <div className="w-[40%] h-[40%] rounded-full bg-[var(--emerald-400)]" />
    </div>
  </div>
);

/**
 * Floor surface.
 *
 * Was a full 76px grid drawn in a visible border colour, which turned the
 * room into graph paper and competed with the furniture for attention. A real
 * floor plan shows the floor, not the drafting grid: this is a warm ground
 * with a faint tile joint, well below the desks in contrast.
 */
const FloorSurface = memo(function FloorSurface() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0 bg-[var(--bg-base)]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(148,140,130,0.055) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,140,130,0.055) 1px, transparent 1px)
        `,
        backgroundSize: `${CELL * 2}px ${CELL * 2}px`,
        backgroundPosition: `${PAD}px ${PAD}px`,
      }}
    />
  );
});

/** Wall fixture — windows & ACs embedded in structural rails */
function WallLabel({ detail }: { detail: WallDetail }) {
  const { label, start, end, wall, type } = detail;
  const size = (end - start + 1) * CELL - 12;
  const offset = PAD + (start - 1) * CELL + 6;
  const isVertical = wall === 'left' || wall === 'right';

  const style: React.CSSProperties = isVertical
    ? { top: offset, height: size, width: 24, [wall]: 8, position: 'absolute' }
    : { left: offset, width: size, height: 24, [wall]: 8, position: 'absolute' };

  const isWindow = type === 'window';

  return (
    <div
      className={`rounded-md border flex items-center justify-center z-10 overflow-hidden bg-[var(--bg-surface)] ${isWindow
        ? 'border-[var(--sapphire-200)] text-[var(--sapphire-600)]'
        : 'border-[var(--ruby-200)] text-[var(--ruby-600)]'
        }`}
      style={style}
    >
      <div
        className="absolute flex items-center justify-center gap-1.5 bg-[var(--bg-surface)]"
        style={isVertical ? { transform: wall === 'right' ? 'rotate(90deg)' : 'rotate(-90deg)', width: size } : {}}
      >
        {isWindow ? <Wind className="w-3 h-3" /> : <Snowflake className="w-3 h-3" />}
        <span className="text-[9px] font-bold tracking-widest uppercase whitespace-nowrap">
          {label}
        </span>
      </div>
    </div>
  );
}

/** Floor decorations — desks & plants */
// Computed once at module load — the seat layout is static.
const DESK_RUNS = deriveDeskRuns();

function FloorDecorations() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {DESK_RUNS.map((run) => <DeskSlab key={run.id} run={run} />)}
      {FLOOR_PLANTS.map((p, i) => <Plant key={i} {...p} />)}
    </div>
  );
}

/** Architecturally-grounded entry gate */
function EntryMarker() {
  return (
    <div
      className="absolute top-0 -translate-x-1/2 z-20"
      style={{ left: PAD + 6 * CELL, width: 4 * CELL }}
    >
      <div className="w-full h-9 bg-[var(--bg-surface)] border-x border-b border-[var(--border-default)] rounded-b-xl flex items-end justify-center pb-1.5 relative shadow-sm">
        <div className="flex items-center gap-2 px-3 py-1 bg-[var(--saffron-50)] rounded-md border border-[var(--saffron-200)]">
          <DoorOpen className="w-3 h-3 text-[var(--saffron-600)]" />
          <span className="text-[9px] font-bold text-[var(--saffron-700)] uppercase tracking-[0.2em]">Entrance</span>
        </div>
      </div>
    </div>
  );
}

// ─── Map Wrappers ─────────────────────────────────────────────────────────────

export const SeatMapWrapper = memo(function SeatMapWrapper({
  seatNum,
  children,
  className = '',
}: {
  seatNum: number;
  children: (face: FaceDir) => ReactNode;
  className?: string;
}) {
  const { x, y, face } = getSeatPosition(seatNum);
  const { left, top } = toPixel(x, y);

  // The backrest sits OPPOSITE the desk — you face the desk, your back is to
  // the aisle. It was a 1.5px hairline on all four sides, which read as a UI
  // chip; a chair needs a visible back with shoulders.
  const backrestStyles: Record<FaceDir, string> = {
    up: 'bottom-0 left-1 right-1 h-[5px] rounded-b-[4px]',
    down: 'top-0    left-1 right-1 h-[5px] rounded-t-[4px]',
    left: 'right-0  top-1 bottom-1 w-[5px] rounded-r-[4px]',
    right: 'left-0   top-1 bottom-1 w-[5px] rounded-l-[4px]',
  };

  return (
    <div
      className={`
        absolute flex items-center justify-center
        transition-ui duration-200 ease-in-out
        hover:z-30
        focus-within:ring-2 focus-within:ring-[var(--saffron-500)] focus-within:z-30
        ${className}
      `}
      style={{ left, top, width: 48, height: 48 }}
      data-seat={seatNum}
      aria-label={`Seat ${seatNum}`}
    >
      {/* Chair back — sits behind the seat, opposite the desk. Drawn first so
          the seat pad and status tile stack on top of it. */}
      <div className={`absolute bg-[var(--border-strong)]/70 ${backrestStyles[face]}`} />
      {/* Seat pad, with a soft contact shadow so the chair sits ON the floor
          rather than floating over it. */}
      <div className="absolute inset-[5px] rounded-[7px] bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[0_1px_2px_0_rgba(28,25,23,0.10)]" />
      {children(face)}
    </div>
  );
});

/**
 * Scales the plan down so the whole room fits the available width.
 *
 * The canvas is a fixed 1160px. Below that the right-hand columns (seats
 * 84–95) were simply cut off — the container scrolled, but nothing indicated
 * there was more room to the right, so a third of the library was invisible
 * on a laptop. Never scales above 1: a small room should not be blown up.
 */
/**
 * Smallest the plan may shrink to. Below this a 48px seat is under 20px and
 * stops being a tap target, so the phone layout offers zoom instead of
 * shrinking further.
 */
const MIN_SCALE = 0.42;

function useFitToWidth() {
  const outerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  /** True when the room is wider than the screen even at MIN_SCALE. */
  const [overflows, setOverflows] = React.useState(false);

  React.useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const measure = () => {
      // Padding is part of the visual frame, so measure against content width.
      const available = el.clientWidth - 32;
      const exact = available / CANVAS_W;
      setScale(Math.min(1, Math.max(MIN_SCALE, exact)));
      setOverflows(exact < MIN_SCALE);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { outerRef, scale, overflows };
}

export function SeatMapContainer({ children }: { children: ReactNode }) {
  const { outerRef, scale, overflows } = useFitToWidth();

  return (
    <div
      ref={outerRef}
      className="w-full relative group rounded-xl overflow-auto custom-scrollbar bg-[var(--bg-surface)] border border-[var(--border-default)]"
      style={{ minHeight: scale < 1 ? undefined : '600px' }}
    >
      {/*
        Scaling from `top center` inside a `w-max` box meant the untransformed
        1160px canvas was centred first and only then shrunk, so on a phone the
        whole plan landed several hundred pixels to the right of the viewport
        and the card rendered blank — every seat in the library, invisible.

        Scale from the top-left and reserve a box of exactly the scaled size,
        then centre that box. The plan now always starts at the left edge.
      */}
      <div
        className="mx-auto"
        style={{
          width: CANVAS_W * scale,
          height: CANVAS_H * scale,
        }}
      >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: CANVAS_W,
          height: CANVAS_H,
        }}
      >
        {/* ── Main Canvas ── */}
        <div
          className="relative shrink-0"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
          }}
        >
          {/* Background layer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-sm">
            {/* ── Grid ── */}
            <FloorSurface />
            {/* ── Floor content ── */}
            <FloorDecorations />
          </div>

          {/* ── Unclipped Elements ── */}
          {/* Section labels — positions come from SEAT_ROWS so the plan and
              the list view can never disagree about which run is which. */}
          {SEAT_ROWS.map((row) => (
            <div
              key={row.label}
              className="absolute pointer-events-none z-10"
              style={{ left: PAD + (row.fromCol - 1) * CELL + 4, top: PAD - 12 }}
            >
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--text-tertiary)]">
                {row.label}
              </span>
            </div>
          ))}

          <EntryMarker />
          {WALL_DETAILS.map((d, i) => <WallLabel key={i} detail={d} />)}

          {/* ── Seats ── */}
          <div className="absolute inset-0 z-20">
            {children}
          </div>
        </div>
      </div>
      </div>

      {/* Below MIN_SCALE the room no longer fits, so say so rather than
          letting a third of the library sit silently off-screen. */}
      {overflows && (
        <p className="px-4 pb-3 text-center text-[11px] font-medium text-[var(--text-tertiary)]">
          Scroll sideways to see the rest of the hall
        </p>
      )}
    </div>
  );
}
