'use client';

import React, { ReactNode, memo } from 'react';

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

const CELL = 64;
const PAD = 32;
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
  if (n >= 1 && n <= 10) return { x: 1, y: 2 + (n - 1), face: 'right' }; // Flipped to face desk
  if (n >= 11 && n <= 20) return { x: 3, y: 2 + (n - 11), face: 'left' }; // Flipped to face desk
  if (n >= 23 && n <= 32) return { x: 4, y: 2 + (n - 23), face: 'right' };
  if (n === 21) return { x: 3, y: 1, face: 'down' };
  if (n === 22) return { x: 4, y: 1, face: 'down' };
  if (n >= 33 && n <= 42) return { x: 6, y: 2 + (n - 33), face: 'left' };
  if (n >= 43 && n <= 52) return { x: 7, y: 2 + (n - 43), face: 'right' };
  if (n >= 80 && n <= 84) return { x: 9 + (n - 80), y: 1, face: 'down' };
  if (n >= 53 && n <= 55) return { x: 9 + (n - 53), y: 2, face: 'up' };
  if (n >= 56 && n <= 61) return { x: 9, y: 3 + (n - 55), face: 'left' };
  if (n >= 62 && n <= 70) return { x: 10, y: 3 + (n - 61), face: 'right' };
  if (n >= 71 && n <= 79) return { x: 12, y: 3 + (n - 71), face: 'left' };
  if (n >= 85 && n <= 95) return { x: 14, y: 1 + (n - 84), face: 'left' };
  return { x: 1, y: 1, face: 'up' };
}

function toPixel(col: number, row: number) {
  const SIZE = 48; // Seat size
  return {
    left: PAD + (col - 1) * CELL + (CELL - SIZE) / 2,
    top: PAD + (row - 1) * CELL + (CELL - SIZE) / 2,
  };
}

// ─── Visual Components ────────────────────────────────────────────────────────

// Renders "desks" between facing rows to give the layout architectural context
const Desk = ({ leftCol, topRow, widthCols, heightRows }: { leftCol: number; topRow: number; widthCols: number; heightRows: number }) => (
  <div
    className="absolute rounded-xl bg-gradient-to-br from-[var(--bg-surface)]/40 to-[var(--bg-void)]/80 border border-[var(--border-default)]/40 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
    style={{
      left: PAD + (leftCol - 1) * CELL + CELL * 0.8,
      top: PAD + (topRow - 1) * CELL + CELL * 0.2,
      width: widthCols * CELL - CELL * 0.6,
      height: heightRows * CELL - CELL * 0.4,
    }}
  />
);

const Plant = ({ col, row }: { col: number; row: number }) => (
  <div
    className="absolute flex items-center justify-center rounded-full bg-[var(--emerald-500)]/10 border border-[var(--emerald-500)]/20 blur-[1px]"
    style={{
      left: PAD + (col - 1) * CELL + CELL * 0.2,
      top: PAD + (row - 1) * CELL + CELL * 0.2,
      width: CELL * 0.6,
      height: CELL * 0.6,
    }}
  >
    <div className="w-1/2 h-1/2 bg-[var(--emerald-400)]/30 rounded-full" />
  </div>
);

function FloorDecorations() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {/* Desks spanning between the seat columns */}
      <Desk leftCol={1} topRow={2} widthCols={2} heightRows={10} />
      <Desk leftCol={4} topRow={2} widthCols={2} heightRows={10} />
      <Desk leftCol={9} topRow={3} widthCols={1} heightRows={7} />
      <Desk leftCol={12} topRow={3} widthCols={1} heightRows={9} />

      {/* Decorative Plants */}
      <Plant col={1} row={1} />
      <Plant col={13} row={12} /> {/* Moved to col 13 to avoid overlapping seat 95 */}
      <Plant col={1} row={12} />
    </div>
  );
}

function WallLabel({ detail }: { detail: WallDetail }) {
  const { label, start, end, wall, type } = detail;
  const size = (end - start + 1) * CELL - 12;
  const offset = PAD + (start - 1) * CELL + 6;
  const isVertical = wall === 'left' || wall === 'right';

  const style: React.CSSProperties = isVertical
    ? { top: offset, height: size, width: 24, [wall]: 8, position: 'absolute' }
    : { left: offset, width: size, height: 24, [wall]: 8, position: 'absolute' };

  const isWindow = type === 'window';
  
  // Vibrant colors for Window vs AC
  const colorCls = isWindow
    ? 'bg-gradient-to-r from-[var(--sapphire-500)]/30 via-[var(--sapphire-400)]/50 to-[var(--sapphire-500)]/30 border-[var(--sapphire-400)]/60 shadow-[0_0_15px_rgba(59,130,246,0.3)_inset]'
    : 'bg-gradient-to-r from-[var(--rose-500)]/30 via-[var(--rose-400)]/50 to-[var(--rose-500)]/30 border-[var(--rose-400)]/60 shadow-[0_0_15px_rgba(244,63,94,0.3)_inset]';

  return (
    <div className={`rounded-xl border backdrop-blur-md flex items-center justify-center z-10 overflow-hidden ${colorCls}`} style={style}>
      <div 
        className="absolute flex items-center justify-center gap-1.5"
        style={isVertical ? { transform: wall === 'right' ? 'rotate(90deg)' : 'rotate(-90deg)', width: size } : {}}
      >
        {isWindow ? (
          <span className="text-[var(--sapphire-200)] text-[10px]">🪟</span>
        ) : (
          <span className="text-[var(--rose-200)] text-[10px]">❄️</span>
        )}
        <span className={`text-[9px] font-bold tracking-widest uppercase whitespace-nowrap ${isWindow ? 'text-[var(--sapphire-100)]' : 'text-[var(--rose-100)]'}`}>
          {label}
        </span>
      </div>
    </div>
  );
}

const GridDots = memo(function GridDots() {
  return (
    <svg className="absolute inset-0 pointer-events-none z-0 opacity-40" width={CANVAS_W} height={CANVAS_H}>
      <defs>
        <pattern id="grid-dots" x={PAD} y={PAD} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
          <circle cx="0" cy="0" r="1" fill="var(--text-disabled, #888)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-dots)" />
    </svg>
  );
});

function EntryMarker() {
  return (
    <div
      className="absolute top-0 -translate-x-1/2 h-14 border-x-2 border-b-2 border-[var(--amber-500)]/40 bg-gradient-to-b from-[var(--amber-500)]/5 to-[var(--amber-500)]/20 rounded-b-3xl flex items-end justify-center pb-2.5 z-20 backdrop-blur-md shadow-[0_15px_30px_rgba(245,158,11,0.1)]"
      style={{ left: PAD + 6 * CELL, width: 4 * CELL }}
    >
      <div className="flex items-center gap-2 bg-[var(--bg-surface)] px-4 py-1.5 rounded-full border border-[var(--amber-500)]/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
        <span className="text-sm">🚪</span>
        <div className="w-2 h-2 bg-[var(--amber-400)] rounded-full animate-pulse shadow-[0_0_10px_var(--amber-400)]" />
        <span className="text-[10px] font-black text-[var(--amber-400)] uppercase tracking-[0.2em]">Entrance</span>
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

  const backrestStyles = {
    up: "top-0 left-0 w-full h-1.5 rounded-t-md",
    down: "bottom-0 left-0 w-full h-1.5 rounded-b-md",
    left: "top-0 left-0 h-full w-1.5 rounded-l-md",
    right: "top-0 right-0 h-full w-1.5 rounded-r-md"
  };

  return (
    <div
      className={`absolute transition-transform duration-300 hover:scale-105 hover:z-30 ${className}`}
      style={{ left, top, width: 48, height: 48 }}
      data-seat={seatNum}
    >
      <div className={`absolute bg-[var(--border-strong)] ${backrestStyles[face]}`} />
      {children(face)}
    </div>
  );
});

export function SeatMapContainer({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-auto pb-8 pt-4 px-4 relative group scroll-smooth" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y pinch-zoom' }}>

      <div
        className="relative mx-auto rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] transform-origin-top-left transition-transform duration-500 ease-out border border-white/5 bg-[#0f1115] overflow-hidden"
        style={{ width: CANVAS_W, height: CANVAS_H, minWidth: CANVAS_W }}
      >
        {/* Architectural grid */}
        <GridDots />

        {/* Soft studio lighting effect */}
        <div className="absolute top-0 left-1/4 w-[50%] h-[30%] bg-[var(--sapphire-500)]/10 blur-[120px] pointer-events-none rounded-full z-0" />
        <div className="absolute bottom-0 right-1/4 w-[40%] h-[40%] bg-[var(--emerald-500)]/5 blur-[120px] pointer-events-none rounded-full z-0" />

        {/* Structural walls */}
        <div className="absolute inset-[12px] rounded-3xl border-2 border-[var(--border-strong)]/40 pointer-events-none z-10 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] bg-gradient-to-br from-white/[0.01] to-transparent" />

        <FloorDecorations />
        <EntryMarker />

        {WALL_DETAILS.map((d, i) => <WallLabel key={i} detail={d} />)}

        <div className="absolute inset-0 z-20">
          {children}
        </div>
      </div>

      {/* Mobile Hint - Fades out naturally as user scrolls */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[var(--bg-surface)]/90 backdrop-blur-xl text-[var(--saffron-400)] text-[11px] uppercase font-bold tracking-[0.2em] px-6 py-3 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 md:hidden border border-[var(--saffron-500)]/20 z-50 shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center gap-3 translate-y-4 group-hover:translate-y-0">
        <span className="w-2 h-2 rounded-full bg-[var(--saffron-500)] animate-pulse shadow-[0_0_10px_var(--saffron-500)]" />
        Pan to explore
      </div>
    </div>
  );
}