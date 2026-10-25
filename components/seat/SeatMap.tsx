'use client';

import React, { ReactNode, memo } from 'react';
import {
  LAYOUT_CONFIG,
  getSeatPositionConfig,
  type FaceDir,
  type SeatPosition,
  SEAT_ROWS,
} from '@/lib/layoutConfig';
import {
  ROOM, DESK_W, DESK_H, CHAIR_DEPTH, ISLAND_X, DESK_TOP,
  seatPixel, islandCenter,
} from '@/lib/deskLayout';

// Types live in lib/layoutConfig (the data layer). Re-exported here because
// several components already import them from this module.
export type { FaceDir, SeatPosition };

export function getSeatPosition(n: number): SeatPosition {
  return getSeatPositionConfig(n);
}

const { WIDTH: CANVAS_W, HEIGHT: CANVAS_H, WALL } = ROOM;

/** Local class joiner — SeatMap has no other reason to import from lib/utils. */
function cnLocal(...v: (string | false | undefined)[]) {
  return v.filter(Boolean).join(' ');
}

// ─── The room ────────────────────────────────────────────────────────────────
//
// Drawn to the owner's reference (2026-10-25): a warm top-down reading hall —
// tiled floor, wooden double door, windows looking onto greenery, wall AC
// units, potted plants, and dark ROW pills over each island. All of it is one
// static SVG in a single consistent hand, so nothing clashes; the desks and
// chairs are HTML on top because they are the interactive part.

/** Bottom-wall fixtures, centred on the aisles and islands they sit beside. */
const AISLE = (a: number) => (ISLAND_X[a] + 2 * DESK_W + CHAIR_DEPTH + ISLAND_X[a + 1] - CHAIR_DEPTH) / 2;
const BOTTOM_WINDOWS = [AISLE(1), AISLE(2)];
const AC_UNITS = [islandCenter(0), islandCenter(4)];
const PLANTS: [number, number][] = [
  [80, 112], [CANVAS_W - 80, 112],
  [70, CANVAS_H - 92], [CANVAS_W - 70, CANVAS_H - 92],
  [AISLE(0), CANVAS_H - 70], [islandCenter(2), CANVAS_H - 70], [AISLE(3), CANVAS_H - 70],
];
/** Side windows span these desk rows (LAYOUT_CONFIG.WALL_DETAILS). */
const SIDE_WINDOWS = LAYOUT_CONFIG.WALL_DETAILS
  .filter((d) => d.type === 'window' && (d.wall === 'left' || d.wall === 'right'))
  .map((d) => ({
    wall: d.wall,
    top: DESK_TOP + (d.start - 1) * DESK_H - 8,
    height: (d.end - d.start + 1) * DESK_H + 16,
  }));

function Plant({ x, y }: { x: number; y: number }) {
  const leaves = Array.from({ length: 9 }, (_, i) => i * 40);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="2" cy="4" rx="21" ry="19" fill="#000" opacity="0.10" />
      <circle r="17" fill="#8A5A33" />
      <circle r="13" fill="#5E3B20" />
      {leaves.map((a) => (
        <ellipse key={a} cx="0" cy="-15" rx="7" ry="17" fill={a % 80 === 0 ? '#3F7D34' : '#2F6A28'} transform={`rotate(${a})`} />
      ))}
      {leaves.map((a) => (
        <ellipse key={`i${a}`} cx="0" cy="-9" rx="4.5" ry="10" fill="#5C9E45" transform={`rotate(${a + 20})`} />
      ))}
    </g>
  );
}

function Window({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const vertical = h > w;
  const panes = vertical ? Math.max(2, Math.round(h / 52)) : Math.max(2, Math.round(w / 46));
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill="#2B2F33" />
      <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} fill="url(#glass)" />
      {Array.from({ length: panes - 1 }, (_, i) => {
        const t = (i + 1) / panes;
        return vertical
          ? <rect key={i} x={x + 4} y={y + 4 + t * (h - 8) - 1.5} width={w - 8} height="3" fill="#2B2F33" />
          : <rect key={i} x={x + 4 + t * (w - 8) - 1.5} y={y + 4} width="3" height={h - 8} fill="#2B2F33" />;
      })}
      {vertical
        ? <rect x={x + w / 2 - 1} y={y + 4} width="2" height={h - 8} fill="#2B2F33" />
        : <rect x={x + 4} y={y + h / 2 - 1} width={w - 8} height="2" fill="#2B2F33" />}
    </g>
  );
}

function AirConditioner({ cx }: { cx: number }) {
  const w = 150, h = 44, x = cx - w / 2, y = CANVAS_H - WALL - h - 4;
  return (
    <g>
      {[-42, -14, 14, 42].map((dx, i) => (
        <path
          key={dx}
          d={`M ${cx + dx * 0.6} ${y - 6} q ${dx * 0.18} -26 ${dx * 0.45} -56`}
          stroke="#8EC3EA" strokeWidth="5" strokeLinecap="round" fill="none" opacity={0.55 - i * 0.04}
        />
      ))}
      <rect x={x + 2} y={y + 4} width={w} height={h} rx="10" fill="#000" opacity="0.10" />
      <rect x={x} y={y} width={w} height={h} rx="10" fill="#FBFBFA" stroke="#D5D5D2" />
      <rect x={x + 10} y={y + h - 14} width={w - 20} height="6" rx="3" fill="#E4E4E1" />
      <rect x={x + 10} y={y + h - 12} width={w - 20} height="1.5" fill="#BDBDB9" />
      <circle cx={x + w - 18} cy={y + 12} r="2" fill="#7CC4F0" />
      <circle cx={x + w - 26} cy={y + 12} r="2" fill="#B9B9B5" />
    </g>
  );
}

function Door() {
  const w = 176, x = CANVAS_W / 2 - w / 2, y = 2, h = 116;
  return (
    <g>
      <rect x={x + 3} y={y + 6} width={w} height={h} rx="3" fill="#000" opacity="0.14" />
      <rect x={x} y={y} width={w} height={h} rx="3" fill="#4E2A14" />
      <rect x={x + 8} y={y + 10} width={w - 16} height={h - 18} fill="#6B3A1D" />
      {[0, 1].map((i) => {
        const lx = x + 12 + i * ((w - 24) / 2 + 2);
        const lw = (w - 24) / 2 - 2;
        return (
          <g key={i}>
            <rect x={lx} y={y + 14} width={lw} height={h - 26} rx="2" fill="url(#doorWood)" />
            <rect x={lx + 9} y={y + 24} width={lw - 18} height={h - 48} rx="3" fill="none" stroke="#5A2F16" strokeWidth="3" />
            <rect x={i === 0 ? lx + lw - 10 : lx + 5} y={y + h / 2 - 12} width="5" height="22" rx="2.5" fill="#D6A93F" />
          </g>
        );
      })}
      <rect x={x - 6} y={y + h - 4} width={w + 12} height="8" rx="2" fill="#3E200F" />
    </g>
  );
}

const RoomDrawing = memo(function RoomDrawing() {
  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={CANVAS_W}
      height={CANVAS_H}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      aria-hidden="true"
    >
      <defs>
        <pattern id="tiles" width="56" height="56" patternUnits="userSpaceOnUse">
          <rect width="56" height="56" fill="#EFE8DC" />
          <path d="M56 0H0V56" fill="none" stroke="#E2D9CA" strokeWidth="1.5" />
        </pattern>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9DBF86" />
          <stop offset="0.55" stopColor="#5F8A4C" />
          <stop offset="1" stopColor="#3F6B35" />
        </linearGradient>
        <linearGradient id="doorWood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8A4B26" />
          <stop offset="1" stopColor="#6E3A1C" />
        </linearGradient>
      </defs>

      {/* Walls, then the floor inset inside them. */}
      <rect width={CANVAS_W} height={CANVAS_H} rx="10" fill="#D4CEC4" />
      <rect x={WALL} y={WALL} width={CANVAS_W - 2 * WALL} height={CANVAS_H - 2 * WALL} rx="4" fill="url(#tiles)" />
      <rect x={WALL} y={WALL} width={CANVAS_W - 2 * WALL} height={CANVAS_H - 2 * WALL} rx="4" fill="none" stroke="#BDB6AA" strokeWidth="2" />

      {SIDE_WINDOWS.map((w, i) => (
        <Window key={i} x={w.wall === 'left' ? 4 : CANVAS_W - 40} y={w.top} w={36} h={w.height} />
      ))}
      {BOTTOM_WINDOWS.map((cx) => (
        <Window key={cx} x={cx - 95} y={CANVAS_H - 60} w={190} h={56} />
      ))}
      {AC_UNITS.map((cx) => <AirConditioner key={cx} cx={cx} />)}
      <Door />
      {PLANTS.map(([x, y]) => <Plant key={`${x}-${y}`} x={x} y={y} />)}

      {SEAT_ROWS.map((r, i) => {
        const cx = islandCenter(i), w = 84, h = 28, y = DESK_TOP - 46;
        return (
          <g key={r.letter}>
            <rect x={cx - w / 2} y={y} width={w} height={h} rx={h / 2} fill="#2C3644" />
            <text x={cx} y={y + h / 2 + 4.5} textAnchor="middle" fontSize="13" fontWeight="600" fill="#FFFFFF" fontFamily="var(--font-body)">
              ROW {r.letter}
            </text>
          </g>
        );
      })}
    </svg>
  );
});

// ─── A seat: desk + chair ────────────────────────────────────────────────────

/** Office chair, drawn facing up; rotated to face the desk. */
function Chair({ face }: { face: FaceDir }) {
  const rot = { up: 0, right: 90, down: 180, left: -90 }[face];
  // Sits outside the desk on the side away from the direction faced.
  const pos: React.CSSProperties = face === 'right'
    ? { left: -CHAIR_DEPTH - 4, top: (DESK_H - 44) / 2 }
    : face === 'left'
      ? { right: -CHAIR_DEPTH - 4, top: (DESK_H - 44) / 2 }
      : face === 'down'
        ? { top: -CHAIR_DEPTH - 4, left: (DESK_W - 44) / 2 }
        : { bottom: -CHAIR_DEPTH - 4, left: (DESK_W - 44) / 2 };
  const horizontal = face === 'left' || face === 'right';
  return (
    <svg
      className="pointer-events-none absolute"
      style={{ ...pos, width: horizontal ? 26 : 44, height: horizontal ? 44 : 26 }}
      viewBox={horizontal ? '0 0 26 44' : '0 0 44 26'}
      aria-hidden="true"
    >
      <g transform={horizontal ? `translate(13 22) rotate(${rot}) translate(-22 -13)` : `translate(22 13) rotate(${rot}) translate(-22 -13)`}>
        <rect x="2" y="15" width="40" height="9" rx="4.5" fill="#15181C" />
        <rect x="6" y="3" width="32" height="15" rx="5" fill="#2A2F35" />
        <rect x="9" y="5" width="26" height="9" rx="3.5" fill="#363C44" />
        <rect x="0" y="9" width="5" height="13" rx="2.5" fill="#15181C" />
        <rect x="39" y="9" width="5" height="13" rx="2.5" fill="#15181C" />
      </g>
    </svg>
  );
}

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
  const { left, top } = seatPixel(x, y);
  // The seam side of the desk — where the two halves of an island meet, and
  // where the power sockets are in the reference.
  const seamRight = face === 'right';

  return (
    <div
      className={`absolute hover:z-30 focus-within:z-30 ${className}`}
      style={{ left, top, width: DESK_W, height: DESK_H }}
      data-seat={seatNum}
    >
      <Chair face={face} />
      {/* Desk top: light oak with a darker front edge and a hairline seam. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(160deg, #EBCB99 0%, #E2B97F 55%, #D8AC6F 100%)',
          boxShadow: 'inset 0 0 0 1px #C0935A, inset 0 -3px 0 #B98A50',
        }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute top-1/2 h-4 w-[7px] -translate-y-1/2 rounded-[2px] bg-[#F7F5F0] shadow-[0_0_0_1px_#B9A487]"
        style={seamRight ? { right: 3 } : { left: 3 }}
        aria-hidden="true"
      />
      <div className="absolute inset-[7px]">
        {children(face)}
      </div>
    </div>
  );
});

// ─── Fit-to-container ────────────────────────────────────────────────────────

/**
 * Smallest the plan may shrink to while seats stay tappable. Read-only
 * previews pass their own floor.
 */
const MIN_SCALE = 0.42;

/**
 * `width` fits the room across the container and lets it run off the bottom —
 * right for a card in a scrolling page. `both` fits the whole room inside the
 * container, which is what the full-screen plan is for.
 */
type FitMode = 'width' | 'both';

function useFitToWidth(mode: FitMode = 'width', minScale = MIN_SCALE) {
  const outerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  /** True when the room is wider than the screen even at the floor. */
  const [overflows, setOverflows] = React.useState(false);

  React.useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const measure = () => {
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
  fit?: FitMode;
  /** An absolute scale from a page's zoom control, replacing the fitted one. */
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
        // Fitting both axes measures this element's height, so it needs one.
        (frameless || fit === 'both') && 'h-full',
      )}
    >
      {/* Scale from the top-left inside a box of exactly the scaled size, then
          centre the box, so the plan never lands off-screen on a phone. */}
      <div
        className={frameless ? 'mx-auto my-auto' : 'mx-auto'}
        style={{ width: CANVAS_W * scale, height: CANVAS_H * scale }}
      >
        <div
          className="relative"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: CANVAS_W, height: CANVAS_H }}
        >
          <RoomDrawing />
          <div className="absolute inset-0">
            {children}
          </div>
        </div>
      </div>

      {overflows && (
        <p className="pt-2 text-center text-xs font-medium text-[var(--text-tertiary)]">
          Scroll sideways to see the rest of the hall
        </p>
      )}
    </div>
  );
}
