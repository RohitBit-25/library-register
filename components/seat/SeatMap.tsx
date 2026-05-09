'use client';

import React, { ReactNode, memo, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FaceDir = 'up' | 'down' | 'left' | 'right';

export interface SeatPosition {
  x: number;
  y: number;
  face: FaceDir;
}

interface WallDetail {
  label: string;
  start: number;
  end: number;
  wall: 'top' | 'bottom' | 'left' | 'right';
  type: 'window' | 'ac';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CELL = 76;   // ↑ from 64 — more breathing room, luxury spacing
const PAD = 48;   // ↑ from 32 — wider margins, architectural framing
const COLS = 14;
const ROWS = 12;

const CANVAS_W = COLS * CELL + PAD * 2;
const CANVAS_H = ROWS * CELL + PAD * 2;

const WALL_DETAILS: WallDetail[] = [
  { label: 'Window', start: 1, end: 1, wall: 'bottom', type: 'window' },
  { label: 'AC', start: 3, end: 4, wall: 'bottom', type: 'ac' },
  { label: 'Window', start: 6, end: 7, wall: 'bottom', type: 'window' },
  { label: 'Window', start: 9, end: 10, wall: 'bottom', type: 'window' },
  { label: 'AC', start: 12, end: 12, wall: 'bottom', type: 'ac' },
  { label: 'Window', start: 14, end: 14, wall: 'bottom', type: 'window' },
  { label: 'Window', start: 3, end: 4, wall: 'right', type: 'window' },
  { label: 'Window', start: 11, end: 12, wall: 'right', type: 'window' },
];

// ─── Logic ────────────────────────────────────────────────────────────────────

export function getSeatPosition(n: number): SeatPosition {
  if (n >= 1 && n <= 10) return { x: 1, y: 2 + (n - 1), face: 'right' };
  if (n >= 11 && n <= 20) return { x: 3, y: 3 + (n - 11), face: 'left' };
  if (n === 21) return { x: 3, y: 2, face: 'down' };
  if (n === 22) return { x: 4, y: 2, face: 'down' };
  if (n >= 23 && n <= 32) return { x: 4, y: 3 + (n - 23), face: 'right' };
  if (n >= 33 && n <= 42) return { x: 6, y: 2 + (n - 33), face: 'left' };
  if (n >= 43 && n <= 52) return { x: 7, y: 2 + (n - 43), face: 'right' };
  if (n >= 80 && n <= 84) return { x: 10 + (n - 80), y: 1, face: 'down' };
  if (n >= 53 && n <= 55) return { x: 9, y: 10 + (n - 53), face: 'left' };
  if (n >= 56 && n <= 61) return { x: 9, y: 3 + (n - 55), face: 'left' };
  if (n >= 62 && n <= 70) return { x: 10, y: 3 + (n - 61), face: 'right' };
  if (n >= 71 && n <= 79) return { x: 12, y: 3 + (n - 71), face: 'left' };
  if (n >= 85 && n <= 95) return { x: 14, y: 1 + (n - 84), face: 'left' };
  return { x: 1, y: 1, face: 'up' };
}

function toPixel(col: number, row: number) {
  const SIZE = 48;
  // Tiny sub-pixel row offset by column parity — breaks robotic alignment
  const jitter = (col % 2 === 0) ? 2 : -2;
  return {
    left: PAD + (col - 1) * CELL + (CELL - SIZE) / 2,
    top: PAD + (row - 1) * CELL + (CELL - SIZE) / 2 + jitter,
  };
}

// ─── Visual Components ────────────────────────────────────────────────────────

/** Deep, bevelled desk with material depth */
const Desk = ({
  leftCol, topRow, widthCols, heightRows,
}: {
  leftCol: number; topRow: number; widthCols: number; heightRows: number;
}) => (
  <div
    className="absolute rounded-2xl border border-white/10"
    style={{
      left: PAD + (leftCol - 1) * CELL + CELL * 0.8,
      top: PAD + (topRow - 1) * CELL + CELL * 0.2,
      width: widthCols * CELL - CELL * 0.6,
      height: heightRows * CELL - CELL * 0.4,
      background: 'linear-gradient(145deg, #1e293b, #111827 50%, #0f172a)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
    }}
  >
    {/* Inner bevel highlight */}
    <div className="absolute inset-[1px] rounded-2xl border border-white/[0.04] pointer-events-none" />
  </div>
);

/** Layered plant — glowing orb instead of blurry blob */
const Plant = ({ col, row }: { col: number; row: number }) => (
  <div
    className="absolute"
    style={{
      left: PAD + (col - 1) * CELL + CELL * 0.2,
      top: PAD + (row - 1) * CELL + CELL * 0.2,
      width: CELL * 0.6,
      height: CELL * 0.6,
    }}
  >
    {/* Outer glow */}
    <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md" />
    {/* Solid core */}
    <div className="absolute inset-[8px] rounded-full bg-gradient-to-br from-emerald-400/80 to-emerald-600/60 shadow-[0_0_12px_rgba(52,211,153,0.4)]" />
  </div>
);

/** Subtle grid lines + dot overlay for architectural planning feel */
const GridDots = memo(function GridDots() {
  return (
    <>
      {/* Ultra-faint grid lines */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-100"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
          `,
          backgroundSize: `${CELL}px ${CELL}px`,
          backgroundPosition: `${PAD}px ${PAD}px`,
        }}
      />
      {/* Dot intersections */}
      <svg className="absolute inset-0 pointer-events-none z-0 opacity-30" width={CANVAS_W} height={CANVAS_H}>
        <defs>
          <pattern id="grid-dots" x={PAD} y={PAD} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="1.2" fill="#94a3b8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-dots)" />
      </svg>
    </>
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
      className={`rounded-xl border backdrop-blur-md flex items-center justify-center z-10 overflow-hidden ${isWindow
          ? 'bg-gradient-to-r from-blue-500/25 via-blue-400/45 to-blue-500/25 border-blue-400/50 shadow-[0_0_18px_rgba(59,130,246,0.35)_inset]'
          : 'bg-gradient-to-r from-rose-500/25 via-rose-400/45 to-rose-500/25 border-rose-400/50 shadow-[0_0_18px_rgba(244,63,94,0.35)_inset]'
        }`}
      style={style}
    >
      <div
        className="absolute flex items-center justify-center gap-1.5"
        style={isVertical ? { transform: wall === 'right' ? 'rotate(90deg)' : 'rotate(-90deg)', width: size } : {}}
      >
        <span className="text-[10px]">{isWindow ? '🪟' : '❄️'}</span>
        <span className={`text-[9px] font-bold tracking-widest uppercase whitespace-nowrap drop-shadow-md ${isWindow ? 'text-blue-100' : 'text-rose-100'}`}>
          {label}
        </span>
      </div>
    </div>
  );
}

/** Floor decorations — desks & plants */
function FloorDecorations() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Desk leftCol={1} topRow={2} widthCols={2} heightRows={10} />
      <Desk leftCol={4} topRow={3} widthCols={2} heightRows={10} />
      <Desk leftCol={9} topRow={3} widthCols={1} heightRows={7} />
      <Desk leftCol={12} topRow={3} widthCols={1} heightRows={9} />

      <Plant col={1} row={1} />
      <Plant col={13} row={12} />
      <Plant col={1} row={12} />
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
      {/* Structural archway */}
      <div className="w-full h-16 bg-[#111827] border-x-2 border-b-2 border-white/10 rounded-b-[2rem] shadow-2xl flex items-end justify-center pb-2.5 backdrop-blur-md overflow-hidden">
        {/* Doorway glow strip */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
        {/* Soft amber wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/8 to-transparent pointer-events-none" />
        {/* Badge */}
        <div className="relative flex items-center gap-2 bg-[#0f172a] px-4 py-1.5 rounded-full border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <span className="text-sm">🚪</span>
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] drop-shadow-sm">Entrance</span>
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

  const backrestStyles: Record<FaceDir, string> = {
    up: 'top-0    left-0 w-full h-1.5 rounded-t-md',
    down: 'bottom-0 left-0 w-full h-1.5 rounded-b-md',
    left: 'top-0    left-0 h-full w-1.5 rounded-l-md',
    right: 'top-0   right-0 h-full w-1.5 rounded-r-md',
  };

  return (
    <div
      className={`
        absolute flex items-center justify-center
        transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
        hover:scale-110 hover:-translate-y-1 hover:z-30
        hover:rotate-[1deg]
        shadow-[0_6px_12px_rgba(0,0,0,0.35)]
        hover:shadow-[0_12px_24px_rgba(0,0,0,0.5)]
        focus-within:ring-2 focus-within:ring-amber-400 focus-within:z-30
        ${className}
      `}
      style={{ left, top, width: 48, height: 48 }}
      data-seat={seatNum}
      aria-label={`Seat ${seatNum}`}
    >
      {/* Seat cushion base */}
      <div className="absolute inset-[6px] rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 opacity-80" />
      {/* Backrest rail */}
      <div className={`absolute bg-slate-500/80 ${backrestStyles[face]}`} />
      {children(face)}
    </div>
  );
});

export function SeatMapContainer({ children }: { children: ReactNode }) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.5));

  return (
    <div
      className="w-full overflow-auto pb-8 pt-4 px-4 relative group scroll-smooth"
      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y pinch-zoom' }}
    >
      {/* ── Zoom Controls — glassmorphism card ── */}
      <div className="sticky left-0 top-0 z-50 flex gap-2 w-max mb-4 rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl bg-white/[0.04] p-2">
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 hover:scale-105 text-white font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Zoom out"
        >
          −
        </button>
        <div className="flex items-center justify-center w-12 text-xs font-mono text-white/60">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 hover:scale-105 text-white font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>

      {/* ── Main Canvas ── */}
      <div
        className="relative mx-auto rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out overflow-hidden"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          minWidth: CANVAS_W,
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          // Cinematic layered floor
          background: `
            radial-gradient(circle at top left,  rgba(255,255,255,0.025), transparent 30%),
            radial-gradient(circle at bottom right, rgba(16,185,129,0.04), transparent 35%),
            linear-gradient(145deg, #111827, #0b1220 40%, #0a0f17)
          `,
          // Structural outer wall rail
          border: '6px solid #1f2937',
        }}
      >
        {/* ── Ambient lighting layers ── */}
        {/* Top-center blue wash — overhead light source */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.09),transparent_42%)] pointer-events-none z-0" />
        {/* Bottom vignette — depth shadow */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/35 to-transparent pointer-events-none z-0" />

        {/* ── Grid ── */}
        <GridDots />

        {/* ── Volumetric glows ── */}
        <div className="absolute top-0 left-1/4 w-[50%] h-[30%] bg-blue-500/8 blur-[130px] pointer-events-none rounded-full z-0" />
        <div className="absolute bottom-0 right-1/4 w-[40%] h-[40%] bg-emerald-500/5 blur-[130px] pointer-events-none rounded-full z-0" />

        {/* ── Inner border frame (inset from wall rail) ── */}
        <div className="absolute inset-[12px] rounded-3xl border border-white/[0.04] pointer-events-none z-10 shadow-[inset_0_0_100px_rgba(0,0,0,0.45)]" />

        {/* ── Noise texture overlay ── */}
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />

        {/* ── Section labels — spatial immersion ── */}
        <div className="absolute pointer-events-none z-10" style={{ left: PAD + 0 * CELL + 4, top: PAD - 20 }}>
          <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-blue-400/50">Cluster A</span>
        </div>
        <div className="absolute pointer-events-none z-10" style={{ left: PAD + 5 * CELL + 4, top: PAD - 20 }}>
          <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-blue-400/50">Cluster B</span>
        </div>
        <div className="absolute pointer-events-none z-10" style={{ left: PAD + 8 * CELL + 4, top: PAD - 20 }}>
          <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-emerald-400/50">AI Lab</span>
        </div>
        <div className="absolute pointer-events-none z-10" style={{ left: PAD + 12 * CELL + 4, top: PAD - 20 }}>
          <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-violet-400/50">Design Bay</span>
        </div>

        {/* ── Floor content ── */}
        <FloorDecorations />
        <EntryMarker />
        {WALL_DETAILS.map((d, i) => <WallLabel key={i} detail={d} />)}

        {/* ── Seats ── */}
        <div className="absolute inset-0 z-20">
          {children}
        </div>
      </div>

      {/* ── Mobile pan hint ── */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl text-amber-400 text-[11px] uppercase font-bold tracking-[0.2em] px-6 py-3 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 md:hidden border border-amber-500/20 z-50 shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center gap-3 translate-y-4 group-hover:translate-y-0">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
        Pan to explore
      </div>
    </div>
  );
}