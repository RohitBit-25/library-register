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
import { deriveDeskRuns, type DeskRun, seatPixel } from '@/lib/deskLayout';

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

// Removed duplicate toPixel: it conflicted with deskLayout.ts sizing. We now use seatPixel directly.

// ─── Visual Components ────────────────────────────────────────────────────────

/**
 * A shared desk, derived from a run of seats that face the same way.
 *
 * Replaces four hand-placed grey rectangles that had no relationship to seat
 * positions. Each slab now sits against the seats that use it, with a divider
 * between neighbours — which is what makes the floor read as furniture rather
 * than as squares scattered on a grid.
 */
// desk.png is 2073×758: a top-down table with a moulded cap at each end and a
// run of power sockets along the middle.
const DESK_SRC_W = 2073;
const DESK_SRC_H = 758;
/** Fraction of the sprite taken by one end cap. */
const DESK_CAP = 0.12;

const DeskSlab = memo(function DeskSlab({ run }: { run: DeskRun }) {
  const isVertical = run.face === 'left' || run.face === 'right';

  // Drawn along its length, then rotated for runs that travel down a column.
  const length = isVertical ? run.height : run.width;
  const depth = isVertical ? run.width : run.height;

  // Three ways to fill a 950px table from a 2073px sprite, and only one of
  // them looks like furniture:
  //
  //   stretch — what this did before. A 3.3× horizontal smear: the grain
  //             turns to streaks and each socket becomes a pale slab.
  //   repeat  — tiles the whole sprite, so the moulded end caps reappear
  //             every 280px down the middle of the table.
  //   round   — border-image keeps the two caps at the two ends and tiles
  //             only the middle, rounding the tile so a whole number fits.
  //
  // `round` is the one that reads as a single long desk with sockets spaced
  // along it, which is what a reading hall actually has.
  const cap = Math.round(depth * (DESK_SRC_W / DESK_SRC_H) * DESK_CAP);

  return (
    <div
      className="absolute z-0"
      style={{ left: run.left, top: run.top, width: run.width, height: run.height }}
      aria-hidden="true"
    >
      <div
        className="absolute drop-shadow-md"
        style={{
          width: length,
          height: depth,
          top: '50%',
          left: '50%',
          transform: isVertical
            ? 'translate(-50%, -50%) rotate(90deg)'
            : 'translate(-50%, -50%)',
          borderImageSource: "url('/assets/desk.png')",
          borderImageSlice: `0 ${DESK_CAP * 100}% 0 ${DESK_CAP * 100}% fill`,
          borderImageWidth: `0 ${cap}px 0 ${cap}px`,
          borderImageRepeat: 'round round',
          borderStyle: 'solid',
          borderColor: 'transparent',
        }}
      />
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
    className="absolute flex items-center justify-center pointer-events-none drop-shadow-md"
    style={{
      left: PAD + (col - 1) * CELL + CELL * 0.1,
      top: PAD + (row - 1) * CELL + CELL * 0.1,
      width: CELL * 0.8,
      height: CELL * 0.8,
    }}
  >
    <img src="/assets/plant.png" alt="Plant" className="w-full h-full object-contain" />
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
      className="absolute inset-0 pointer-events-none z-0 bg-[#EFECE6]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(148,140,130,0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,140,130,0.15) 1px, transparent 1px)
        `,
        backgroundSize: `${CELL}px ${CELL}px`,
        backgroundPosition: `${PAD}px ${PAD}px`,
      }}
    />
  );
});

function WallLabel({ detail }: { detail: WallDetail }) {
  const { start, end, wall, type } = detail;
  const size = (end - start + 1) * CELL;
  const offset = PAD + (start - 1) * CELL;
  const isVertical = wall === 'left' || wall === 'right';

  const depth = 48; // Thicker so it's visible
  const style: React.CSSProperties = isVertical
    ? { top: offset, height: size, width: depth, [wall]: 0, position: 'absolute' }
    : { left: offset, width: size, height: depth, [wall]: 0, position: 'absolute' };

  const isWindow = type === 'window';
  const imgSrc = isWindow ? '/assets/windows.png' : '/assets/ac.png';

  return (
    <div
      className="flex items-center justify-center z-10 pointer-events-none drop-shadow-sm"
      style={style}
    >
      <img 
        src={imgSrc} 
        alt="" 
        className="object-contain" 
        style={{
          width: isVertical ? depth : size,
          height: isVertical ? size : depth,
          transform: isVertical ? (wall === 'right' ? 'rotate(-90deg)' : 'rotate(90deg)') : (wall === 'top' ? 'rotate(180deg)' : 'rotate(0deg)')
        }}
      />
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
      className="absolute top-0 -translate-x-1/2 z-20 pointer-events-none flex items-start justify-center"
      style={{ left: PAD + 6 * CELL, width: 4 * CELL, height: 96, top: -8 }}
    >
      <img src="/assets/door.png" alt="Entrance" className="h-full object-contain drop-shadow-md" />
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
  const { left, top: baseTop } = seatPixel(x, y);
  const jitter = (x % 2 === 0) ? 2 : -2;
  const top = baseTop + jitter;

  // The new chair asset has its backrest at the top, so it naturally faces DOWN.
  const rotation: Record<FaceDir, string> = {
    up: 'rotate(180deg)',
    down: 'rotate(0deg)',
    left: 'rotate(90deg)',
    right: 'rotate(-90deg)',
  };

  // Adjust translation to pull the chair slightly away from the desk so it doesn't clip into the table
  const chairOffset: Record<FaceDir, string> = {
    up: 'translateY(14px)',
    down: 'translateY(-14px)',
    left: 'translateX(14px)',
    right: 'translateX(-14px)',
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
      style={{ left, top, width: 60, height: 60 }}
      data-seat={seatNum}
      aria-label={`Seat ${seatNum}`}
    >
      {/* Chair graphic underneath the seat tile, kept small and properly oriented */}
      <img 
        src="/assets/chair.png" 
        alt="" 
        className="absolute w-[42px] h-[42px] object-contain pointer-events-none drop-shadow-sm" 
        style={{ transform: `${chairOffset[face]} ${rotation[face]}` }} 
      />
      {/* Seat pad interactive container */}
      <div className="relative w-[56px] h-[56px] z-10 m-auto flex items-center justify-center">
        {children(face)}
      </div>
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

/**
 * `width` fits the room across the container and lets it run off the bottom —
 * right for a card embedded in a scrolling page. `both` fits the whole room
 * inside the container, which is what a floor plan is for: seeing the entire
 * hall at once rather than scrolling a picture of it.
 */
type FitMode = 'width' | 'both';

function useFitToWidth(mode: FitMode = 'width') {
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
      const byWidth = available / CANVAS_W;
      const exact = mode === 'both'
        ? Math.min(byWidth, (el.clientHeight - 32) / CANVAS_H)
        : byWidth;
      setScale(Math.min(1, Math.max(MIN_SCALE, exact)));
      setOverflows(exact < MIN_SCALE);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  return { outerRef, scale, overflows };
}

export function SeatMapContainer({
  children,
  fit = 'width',
  scale: scaleProp,
  frameless = false,
}: {
  children: ReactNode;
  /** See FitMode. Defaults to the embedded-card behaviour. */
  fit?: FitMode;
  /**
   * An absolute scale that replaces the fitted one, for the dedicated plan
   * page's zoom control. Absolute rather than a multiplier of the fit, so
   * "100%" means 100% everywhere — as a multiplier it happened to be right on
   * a desktop, where fit-to-width lands near 1, and meant 42% on a phone.
   */
  scale?: number;
  /** Drop the card chrome when the page already provides a frame. */
  frameless?: boolean;
}) {
  const { outerRef, scale: fitted, overflows } = useFitToWidth(fit);
  const scale = scaleProp ?? fitted;

  return (
    <div
      ref={outerRef}
      className={cnLocal(
        'w-full relative group overflow-auto custom-scrollbar',
        !frameless && 'rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]',
        frameless && 'h-full',
      )}
      style={{ minHeight: frameless ? undefined : (scale < 1 ? undefined : '600px') }}
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
        className={frameless ? 'mx-auto my-auto' : 'mx-auto'}
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
          {/* Section labels */}
          {SEAT_ROWS.map((row) => (
            <div
              key={row.label}
              className="absolute pointer-events-none z-10"
              style={{ left: PAD + (row.fromCol - 1) * CELL + 4, top: PAD - 32 }}
            >
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-white bg-slate-700 px-3 py-1.5 rounded-full shadow-sm">
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
