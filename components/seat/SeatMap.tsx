'use client';

import React, { ReactNode, memo } from 'react';
import {
  LAYOUT_CONFIG,
  getSeatPositionConfig,
  type WallDetail,
  type FaceDir,
  type SeatPosition,
  SEAT_ROWS,
} from '@/lib/layoutConfig';
import { deriveDeskRuns, type DeskRun, seatPixel, SEAT_SIZE } from '@/lib/deskLayout';

// Types now live in lib/layoutConfig (the data layer). Re-exported here
// because ~10 components already import them from this module.
export type { FaceDir, SeatPosition };

// ─── Constants ────────────────────────────────────────────────────────────────

const { CELL, PAD, COLS, ROWS, WALL_DETAILS, ENTRANCE_COL } = LAYOUT_CONFIG;

const CANVAS_W = COLS * CELL + PAD * 2;
const CANVAS_H = ROWS * CELL + PAD * 2;

/** Wall centre-line, inset from the canvas edge. */
const WALL = 14;
/** Wall stroke. Heavy enough to read as structure at 42% zoom. */
const WALL_T = 4;

export function getSeatPosition(n: number): SeatPosition {
  return getSeatPositionConfig(n);
}

/** Local class joiner — SeatMap has no other reason to import from lib/utils. */
function cnLocal(...v: (string | false | undefined)[]) {
  return v.filter(Boolean).join(' ');
}

// ─── The drawing ──────────────────────────────────────────────────────────────
//
// This was six clip-art PNGs — wood-grain desks, blue office chairs, potted
// plants, a cartoon door, AC units — in three different illustration styles,
// with each chair sprite peeking out from behind its seat tile so every seat
// read as two overlapping objects. A floor plan is a drawing: walls, openings,
// furniture as plain shapes, and the seats carrying the only colour, because
// the seats are the only thing on it that changes.

/**
 * A desk, derived from the run of seats that use it.
 *
 * Hairline dividers mark each person's share of the table — the thing that
 * makes a long slab read as twenty places rather than one plank — and shared
 * tables get a spine down the middle where the two sides meet.
 */
const DeskSlab = memo(function DeskSlab({ run }: { run: DeskRun }) {
  const vertical = run.face === 'left' || run.face === 'right';

  // Cell boundaries between consecutive seats along the run.
  const steps = [...new Set(run.seats.map((n) => {
    const p = getSeatPositionConfig(n);
    return vertical ? p.y : p.x;
  }))].sort((a, b) => a - b);
  const dividers = steps.slice(0, -1).map((v) => PAD + v * CELL - (vertical ? run.top : run.left));

  return (
    <div
      className="absolute rounded-[6px] border border-[var(--plan-desk-edge)] bg-[var(--plan-desk)]"
      style={{ left: run.left, top: run.top, width: run.width, height: run.height }}
      aria-hidden="true"
    >
      {run.shared && (
        <span
          className="absolute bg-[var(--plan-desk-edge)]"
          style={vertical
            ? { left: '50%', top: 0, bottom: 0, width: 1 }
            : { top: '50%', left: 0, right: 0, height: 1 }}
        />
      )}
      {dividers.map((d) => (
        <span
          key={d}
          className="absolute bg-[var(--plan-desk-edge)] opacity-70"
          style={vertical
            ? { top: d, left: 0, right: 0, height: 1 }
            : { left: d, top: 0, bottom: 0, width: 1 }}
        />
      ))}
    </div>
  );
});

/** A window: a break in the wall, drawn as the architectural double line. */
function WallOpening({ detail }: { detail: WallDetail }) {
  const { start, end, wall, type } = detail;
  const span = (end - start + 1) * CELL;
  const offset = PAD + (start - 1) * CELL;
  const vertical = wall === 'left' || wall === 'right';
  const wallPos = wall === 'top' || wall === 'left' ? WALL : (vertical ? CANVAS_W : CANVAS_H) - WALL;

  if (type === 'window') {
    const len = span - 16;
    const style: React.CSSProperties = vertical
      ? { left: wallPos - 5, top: offset + 8, width: 10, height: len, borderLeftWidth: 2, borderRightWidth: 2 }
      : { top: wallPos - 5, left: offset + 8, height: 10, width: len, borderTopWidth: 2, borderBottomWidth: 2 };
    return (
      <span
        className="absolute border-solid border-[var(--plan-window)] bg-[var(--plan-floor)]"
        style={style}
        aria-hidden="true"
      />
    );
  }

  // Air conditioner: a small labelled unit on the inside face of the wall.
  const w = Math.min(span - 20, 120);
  const h = 22;
  const inner = wall === 'top' || wall === 'left' ? wallPos + WALL_T / 2 + 4 : wallPos - WALL_T / 2 - 4 - h;
  const style: React.CSSProperties = vertical
    ? { left: inner, top: offset + (span - w) / 2, width: h, height: w }
    : { top: inner, left: offset + (span - w) / 2, width: w, height: h };
  return (
    <span
      className="absolute flex items-center justify-center rounded-[3px] border border-[var(--plan-wall)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-secondary)]"
      style={style}
      aria-hidden="true"
    >
      AC
    </span>
  );
}

/** The entrance: an opening in the top wall with the door's swing drawn in. */
function Entrance() {
  const width = Math.round(CELL * 1.4);
  const left = PAD + (ENTRANCE_COL - 0.5) * CELL - width / 2;
  return (
    <div className="absolute" style={{ left, top: WALL - WALL_T, width, height: width + WALL_T }} aria-hidden="true">
      {/* Cut the wall. */}
      <span className="absolute inset-x-0 top-0 bg-[var(--plan-floor)]" style={{ height: WALL_T * 2 }} />
      <svg className="absolute inset-0 overflow-visible" width={width} height={width + WALL_T}>
        {/* Door leaf, standing open, and its swing. */}
        <line x1={0} y1={WALL_T} x2={0} y2={WALL_T + width} stroke="var(--plan-wall)" strokeWidth={2} />
        <path
          d={`M 0 ${WALL_T + width} A ${width} ${width} 0 0 0 ${width} ${WALL_T}`}
          fill="none"
          stroke="var(--plan-chair)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      </svg>
      <span className="absolute left-3 top-4 text-xs font-medium text-[var(--text-secondary)]">
        Entrance
      </span>
    </div>
  );
}

/**
 * Block letters, placed in the floor next to the block they name.
 *
 * A–D sit in the free row under their blocks (the row above is taken by the
 * door swing and the front-wall counter); E sits beside the counter; F in the
 * gap above its own block.
 */
const BLOCK_LABELS = SEAT_ROWS.map((b) => {
  const pos = Array.from({ length: b.last - b.first + 1 }, (_, i) => getSeatPositionConfig(b.first + i));
  const minX = Math.min(...pos.map((p) => p.x));
  const maxX = Math.max(...pos.map((p) => p.x));
  const minY = Math.min(...pos.map((p) => p.y));
  const maxY = Math.max(...pos.map((p) => p.y));

  let cx = PAD + ((minX + maxX) / 2 - 0.5) * CELL;
  let cy: number;
  if (b.letter === 'E') {
    cx = PAD + (minX - 1.5) * CELL;
    cy = PAD + (minY - 0.5) * CELL;
  } else if (b.letter === 'F') {
    cy = PAD + (minY - 1.5) * CELL;
  } else {
    cy = PAD + (maxY + 0.5) * CELL;
  }
  return { ...b, cx, cy };
});

function BlockLabel({ letter, first, last, cx, cy }: (typeof BLOCK_LABELS)[number]) {
  return (
    <div
      className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap"
      style={{ left: cx, top: cy }}
    >
      <span className="flex size-7 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-semibold leading-none text-[var(--text-inverse)]">{letter}</span>
      <span className="font-mono text-[13px] text-[var(--text-secondary)]">{first}–{last}</span>
    </div>
  );
}

// Computed once at module load — the seat layout is static.
const DESK_RUNS = deriveDeskRuns();

/** Everything that is not a seat. Static, so it renders once. */
const FloorPlanDrawing = memo(function FloorPlanDrawing() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* Floor + walls */}
      <div
        className="absolute rounded-[10px] bg-[var(--plan-floor)]"
        style={{
          left: WALL - WALL_T / 2,
          top: WALL - WALL_T / 2,
          right: WALL - WALL_T / 2,
          bottom: WALL - WALL_T / 2,
          border: `${WALL_T}px solid var(--plan-wall)`,
          // No floor grid: the desks and their per-seat dividers already
          // give the room its rhythm; a third set of lines was decoration.
        }}
      />
      {WALL_DETAILS.map((d, i) => <WallOpening key={i} detail={d} />)}
      <Entrance />
      {DESK_RUNS.map((run) => <DeskSlab key={run.id} run={run} />)}
      {BLOCK_LABELS.map((b) => <BlockLabel key={b.letter} {...b} />)}
    </div>
  );
});

// ─── Map Wrappers ─────────────────────────────────────────────────────────────

/** Where the chair back sits: on the side away from the desk. */
const CHAIR_BACK: Record<FaceDir, React.CSSProperties> = {
  right: { left: -6, top: '50%', width: 4, height: 30, transform: 'translateY(-50%)' },
  left:  { right: -6, top: '50%', width: 4, height: 30, transform: 'translateY(-50%)' },
  down:  { top: -6, left: '50%', height: 4, width: 30, transform: 'translateX(-50%)' },
  up:    { bottom: -6, left: '50%', height: 4, width: 30, transform: 'translateX(-50%)' },
};

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
  // No wobble. The old ±2px row jitter was there "so the room does not look
  // machine-stamped"; on a plan read for alignment it just looked crooked.
  const { left, top } = seatPixel(x, y);

  return (
    <div
      className={`absolute hover:z-30 focus-within:z-30 ${className}`}
      style={{ left, top, width: SEAT_SIZE, height: SEAT_SIZE }}
      data-seat={seatNum}
    >
      {/* The chair back: shows which way the person sits, in one stroke. */}
      <span
        className="pointer-events-none absolute rounded-full bg-[var(--plan-chair)]"
        style={CHAIR_BACK[face]}
        aria-hidden="true"
      />
      <div className="absolute inset-0.5">
        {children(face)}
      </div>
    </div>
  );
});

/**
 * Smallest the plan may shrink to. Below this a seat is under 25px and
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

function useFitToWidth(mode: FitMode = 'width', minScale = MIN_SCALE) {
  const outerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  /** True when the room is wider than the screen even at MIN_SCALE. */
  const [overflows, setOverflows] = React.useState(false);

  React.useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const measure = () => {
      // Padding is part of the visual frame, so measure against content width.
      const available = el.clientWidth - 24;
      const byWidth = available / CANVAS_W;
      const exact = mode === 'both'
        ? Math.min(byWidth, (el.clientHeight - 24) / CANVAS_H)
        : byWidth;
      setScale(Math.min(1, Math.max(minScale, exact)));
      setOverflows(exact < minScale);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode, minScale]);

  return { outerRef, scale, overflows };
}

export function SeatMapContainer({
  children,
  fit = 'width',
  scale: scaleProp,
  frameless = false,
  minScale,
}: {
  children: ReactNode;
  /** See FitMode. Defaults to the embedded-card behaviour. */
  fit?: FitMode;
  /**
   * An absolute scale that replaces the fitted one, for the dedicated plan
   * page's zoom control. Absolute rather than a multiplier of the fit, so
   * "100%" means 100% everywhere.
   */
  scale?: number;
  /** Drop the card chrome when the page already provides a frame. */
  frameless?: boolean;
  /** Override the tap-target floor — only for read-only previews. */
  minScale?: number;
}) {
  const { outerRef, scale: fitted, overflows } = useFitToWidth(fit, minScale);
  const scale = scaleProp ?? fitted;

  return (
    <div
      ref={outerRef}
      className={cnLocal(
        'relative w-full overflow-auto custom-scrollbar',
        !frameless && 'rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-sm)] sm:p-4',
        // Fitting both axes measures this element's height, so it has to have
        // one. Without it the box is content-sized and the fit converges on a
        // scale smaller than fitting width alone.
        (frameless || fit === 'both') && 'h-full',
      )}
    >
      {/*
        Scale from the top-left and reserve a box of exactly the scaled size,
        then centre that box. Scaling from `top center` inside a `w-max` box
        landed the plan off-screen on a phone.
      */}
      <div
        className={frameless ? 'mx-auto my-auto' : 'mx-auto'}
        style={{ width: CANVAS_W * scale, height: CANVAS_H * scale }}
      >
        <div
          className="relative"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: CANVAS_W,
            height: CANVAS_H,
          }}
        >
          <FloorPlanDrawing />
          <div className="absolute inset-0">
            {children}
          </div>
        </div>
      </div>

      {/* Below MIN_SCALE the room no longer fits, so say so rather than
          letting a third of the library sit silently off-screen. */}
      {overflows && (
        <p className="pt-2 text-center text-xs font-medium text-[var(--text-tertiary)]">
          Scroll sideways to see the rest of the hall
        </p>
      )}
    </div>
  );
}
