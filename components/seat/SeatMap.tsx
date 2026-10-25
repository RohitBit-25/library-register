'use client';

import React, { ReactNode, memo } from 'react';
import {
  getSeatPositionConfig,
  isSeat,
  SEAT_NUMBERS,
  type FaceDir,
  type SeatPosition,
  ROOM, DESK_W, DESK_H, CHAIR, AC_CENTERS, DOOR,
  chairRect, SEAT_GROUPS,
} from '@/lib/layoutConfig';

// Types live in lib/layoutConfig (the data layer). Re-exported here because
// several components already import them from this module.
export type { FaceDir, SeatPosition };

export function getSeatPosition(n: number): SeatPosition {
  return getSeatPositionConfig(n);
}

const { WIDTH: CANVAS_W, HEIGHT: CANVAS_H, WALL } = ROOM;

/** The owner's palette for the plan (seat-layout spec, 2026-10-25). */
const C = {
  floor: '#F3EFE6',
  floorLine: '#E9E3D6',
  desk: '#DDB57A',
  deskBorder: '#A67C3E',
  chair: '#1F1F1F',
  wall: '#D0D0D0',
  wallBorder: '#888888',
  door: '#6B3E26',
  handle: '#C9A64A',
};

/** Local class joiner — SeatMap has no other reason to import from lib/utils. */
function cnLocal(...v: (string | false | undefined)[]) {
  return v.filter(Boolean).join(' ');
}

// ─── The room: walls, floor, AC, door, chairs ────────────────────────────────
//
// Static, so it is one SVG drawn once. Chairs are part of it: each sits in its
// own clear space behind its desk (lib/layoutConfig chairRect), never under
// the desk in front.

/** Top-down office chair, drawn facing down (backrest at the top) in a W×D box. */
function ChairShape({ n }: { n: number }) {
  const r = chairRect(n);
  const face = getSeatPositionConfig(n).face;
  const rot = { down: 0, left: 90, up: 180, right: -90 }[face];
  const { W, D } = CHAIR;
  return (
    <g transform={`translate(${r.x + r.w / 2} ${r.y + r.h / 2}) rotate(${rot})`}>
      {/* soft floor shadow */}
      <rect x={-W / 2 + 1} y={-D / 2 + 3} width={W} height={D} rx="9" fill="#000" opacity="0.13" />
      {/* armrests */}
      <rect x={-W / 2} y={-D / 2 + 8} width="7" height={D - 9} rx="3.5" fill={C.chair} />
      <rect x={W / 2 - 7} y={-D / 2 + 8} width="7" height={D - 9} rx="3.5" fill={C.chair} />
      {/* seat cushion */}
      <rect x={-W / 2 + 6} y={-D / 2 + 6} width={W - 12} height={D - 6} rx="6" fill="#303030" />
      <rect x={-W / 2 + 10} y={-D / 2 + 10} width={W - 20} height={D - 14} rx="4" fill="#3A3A3A" />
      {/* backrest */}
      <rect x={-W / 2 + 2} y={-D / 2} width={W - 4} height="10" rx="5" fill={C.chair} />
      <rect x={-W / 2 + 7} y={-D / 2 + 2.5} width={W - 14} height="2.5" rx="1.25" fill="#4A4A4A" />
    </g>
  );
}

function AirConditioner({ cx }: { cx: number }) {
  const w = 200, h = 62, x = cx - w / 2, y = WALL - 4;
  return (
    <g>
      <path
        d={`M ${x + 22} ${y + h} L ${x - 4} ${y + h + 46} L ${x + w + 4} ${y + h + 46} L ${x + w - 22} ${y + h} Z`}
        fill="url(#airflow)"
      />
      <rect x={x + 2} y={y + 5} width={w} height={h} rx="8" fill="#000" opacity="0.12" />
      <rect x={x} y={y} width={w} height={h} rx="8" fill="#FCFCFC" stroke="#CFCFCF" />
      <rect x={x + 6} y={y + 6} width={w - 12} height={h - 28} rx="5" fill="#F4F4F3" />
      <rect x={x + 14} y={y + h - 16} width={w - 28} height="7" rx="3.5" fill="#2B2B2B" />
      <rect x={x + w - 34} y={y + 12} width="14" height="3" rx="1.5" fill="#2F6FD8" />
    </g>
  );
}

function Door() {
  const { cx, w } = DOOR, h = 104, x = cx - w / 2, y = CANVAS_H - h;
  return (
    <g>
      <rect x={x - 4} y={y - 6} width={w + 8} height={h + 6} rx="3" fill="#000" opacity="0.14" />
      <rect x={x} y={y} width={w} height={h} rx="3" fill={C.door} />
      <rect x={x} y={y} width={w} height="10" rx="2" fill="#4E2C1A" />
      {[0, 1].map((i) => {
        const lx = x + 10 + i * ((w - 20) / 2 + 1);
        const lw = (w - 20) / 2 - 1;
        return (
          <g key={i}>
            <rect x={lx} y={y + 16} width={lw} height={h - 22} rx="2" fill="#7A4A2E" />
            <rect x={lx + 8} y={y + 26} width={lw - 16} height={h - 46} rx="3" fill="none" stroke="#5A3420" strokeWidth="3" />
            <rect x={i === 0 ? lx + lw - 9 : lx + 4} y={y + 40} width="5" height="24" rx="2.5" fill={C.handle} />
          </g>
        );
      })}
    </g>
  );
}

/**
 * A pill over each group, named as on the owner's spec. Centred over the
 * group's top row; the bottom row's sits above its chairs.
 */
const GROUP_LABELS = SEAT_GROUPS.map((g) => {
  const pos = g.seats.map((n) => getSeatPositionConfig(n));
  const top = Math.min(...pos.map((p) => p.y));
  const row = pos.filter((p) => p.y === top);
  const cx = (Math.min(...row.map((p) => p.x)) + Math.max(...row.map((p) => p.x)) + DESK_W) / 2;
  const chairsAbove = pos.some((p) => p.face === 'down');
  return { id: g.id, text: g.label.toUpperCase(), cx, y: top - 34 - (chairsAbove ? CHAIR.D + CHAIR.GAP : 0) };
});

function GroupLabel({ text, cx, y }: { text: string; cx: number; y: number }) {
  const w = text.length * 8 + 26;
  return (
    <g>
      <rect x={cx - w / 2} y={y} width={w} height="24" rx="12" fill="#2C3644" />
      <text x={cx} y={y + 16} textAnchor="middle" fontSize="12" fontWeight="600" fill="#FFFFFF">
        {text}
      </text>
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
      // A presentation attribute cannot hold var(), so the font is set here.
      // geometricPrecision: Chromium otherwise rasterised the labels at the
      // plan's unscaled size and left them painted outside their pills once
      // the plan was scaled down to fit.
      style={{ fontFamily: 'var(--font-body)', textRendering: 'geometricPrecision' }}
    >
      <defs>
        <pattern id="floorTiles" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill={C.floor} />
          <path d="M40 0H0V40" fill="none" stroke={C.floorLine} strokeWidth="1" />
        </pattern>
        {/* Soft darkening where the floor meets the walls, for depth. */}
        <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.62" stopColor="#5A4A30" stopOpacity="0" />
          <stop offset="1" stopColor="#5A4A30" stopOpacity="0.10" />
        </radialGradient>
        <linearGradient id="airflow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BFE0F7" stopOpacity="0.85" />
          <stop offset="1" stopColor="#BFE0F7" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width={CANVAS_W} height={CANVAS_H} rx="6" fill={C.wall} stroke={C.wallBorder} strokeWidth="3" />
      <rect x={WALL} y={WALL} width={CANVAS_W - 2 * WALL} height={CANVAS_H - 2 * WALL} fill="url(#floorTiles)" stroke={C.wallBorder} strokeWidth="2" />

      <rect x={WALL} y={WALL} width={CANVAS_W - 2 * WALL} height={CANVAS_H - 2 * WALL} fill="url(#vignette)" />

      {AC_CENTERS.map((cx) => <AirConditioner key={cx} cx={cx} />)}
      <Door />
      <text x={DOOR.cx} y={CANVAS_H - 116} textAnchor="middle" fontSize="13" fontWeight="700" fill={C.door}>
        ENTRANCE
      </text>

      {SEAT_NUMBERS.map((n) => <ChairShape key={n} n={n} />)}
      {GROUP_LABELS.map((l) => <GroupLabel key={l.id} {...l} />)}
    </svg>
  );
});

// ─── A seat: the desk, with the state mat on it ──────────────────────────────

export const SeatMapWrapper = memo(function SeatMapWrapper({
  seatNum,
  children,
  className = '',
}: {
  seatNum: number;
  children: (face: FaceDir) => ReactNode;
  className?: string;
}) {
  // A number not on the plan (a stray database row) is never drawn.
  if (!isSeat(seatNum)) return null;
  const { x, y, face } = getSeatPosition(seatNum);

  return (
    <div
      className={`group/desk absolute transition-transform duration-150 ease-out hover:z-30 focus-within:z-30 [@media(hover:hover)]:hover:-translate-y-0.5 ${className}`}
      style={{ left: x, top: y, width: DESK_W, height: DESK_H }}
      data-seat={seatNum}
    >
      {/* Lift shadow, faded in on hover (opacity only — no layout). */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[3px] opacity-0 shadow-[0_8px_16px_rgba(60,40,15,0.28)] transition-opacity duration-150 group-hover/desk:opacity-100"
        aria-hidden="true"
      />
      {/* Desk top: oak with a fine grain, a lit top edge and a darker front lip. */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[3px]"
        style={{
          background: `repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 2px, rgba(120,80,30,0.05) 2px 6px), linear-gradient(180deg, #E6C38C 0%, ${C.desk} 55%, #D4A96A 100%)`,
          boxShadow: `inset 0 0 0 1.5px ${C.deskBorder}, inset 0 1.5px 0 rgba(255,255,255,0.45), inset 0 -5px 0 #C99A5B, 0 2px 3px rgba(60,40,15,0.18)`,
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-x-[7px] top-[5px] bottom-[9px]">
        {children(face)}
      </div>
    </div>
  );
});

// ─── Fit-to-container ────────────────────────────────────────────────────────

/** Smallest the plan may shrink to while seats stay tappable. */
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

  // Drag to pan, for a mouse, when the plan is larger than its box (zoomed in
  // or on a small screen). Touch already scrolls natively. A drag that moved
  // more than a few pixels swallows the click it ends with, so panning never
  // opens a seat by accident.
  const [canPan, setCanPan] = React.useState(false);
  const drag = React.useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const swallowClick = React.useRef(false);
  React.useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const check = () => setCanPan(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [outerRef, scale]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canPan || e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = outerRef.current!;
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    d.moved = true;
    const el = outerRef.current!;
    el.scrollLeft = d.left - dx;
    el.scrollTop = d.top - dy;
  };
  const endDrag = () => {
    if (drag.current?.moved) swallowClick.current = true;
    drag.current = null;
  };

  return (
    <div
      ref={outerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onClickCapture={(e) => {
        if (swallowClick.current) { e.stopPropagation(); e.preventDefault(); swallowClick.current = false; }
      }}
      className={cnLocal(
        'relative w-full overflow-auto custom-scrollbar',
        canPan && 'cursor-grab active:cursor-grabbing',
        !frameless && 'rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-sm)] sm:p-4',
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
          style={{
            transform: `scale(${scale})`, transformOrigin: 'top left', width: CANVAS_W, height: CANVAS_H,
            // Lets hover cards inside the plan counter-scale to true size.
            ['--plan-scale' as string]: scale,
          }}
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
