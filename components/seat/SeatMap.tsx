'use client';

import React, { ReactNode, memo } from 'react';
import { DoorOpen, Snowflake, Wind } from 'lucide-react';
import { LAYOUT_CONFIG, getSeatPositionConfig, type WallDetail } from '@/lib/layoutConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FaceDir = 'up' | 'down' | 'left' | 'right';

export interface SeatPosition {
  x: number;
  y: number;
  face: FaceDir;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const { CELL, PAD, COLS, ROWS, WALL_DETAILS, FLOOR_DESKS, FLOOR_PLANTS } = LAYOUT_CONFIG;

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

/** Flat, architectural desk */
const Desk = ({
  leftCol, topRow, widthCols, heightRows,
}: {
  leftCol: number; topRow: number; widthCols: number; heightRows: number;
}) => {
  const w = widthCols * CELL - CELL * 0.6;
  const h = heightRows * CELL - CELL * 0.4;
  return (
    <div
      className="absolute z-0"
      style={{
        left: PAD + (leftCol - 1) * CELL + CELL * 0.8,
        top: PAD + (topRow - 1) * CELL + CELL * 0.2,
        width: w,
        height: h,
      }}
    >
      <div className="absolute inset-0 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-default)]" />
    </div>
  );
};

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

/** Architectural grid lines */
const GridDots = memo(function GridDots() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: `
          linear-gradient(var(--border-subtle) 1px, transparent 1px),
          linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)
        `,
        backgroundSize: `${CELL}px ${CELL}px`,
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
function FloorDecorations() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {FLOOR_DESKS.map((d, i) => <Desk key={i} {...d} />)}
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
      <div className="w-full h-12 bg-[var(--bg-surface)] border-x border-b border-[var(--border-default)] rounded-b-xl flex items-end justify-center pb-2 relative shadow-sm">
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
        transition-ui duration-200 ease-in-out
        hover:z-30
        focus-within:ring-2 focus-within:ring-[var(--saffron-500)] focus-within:z-30
        ${className}
      `}
      style={{ left, top, width: 48, height: 48 }}
      data-seat={seatNum}
      aria-label={`Seat ${seatNum}`}
    >
      {/* Seat cushion base */}
      <div className="absolute inset-[6px] rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm" />
      {/* Backrest rail */}
      <div className={`absolute bg-[var(--border-strong)] ${backrestStyles[face]}`} />
      {children(face)}
    </div>
  );
});

export function SeatMapContainer({ children }: { children: ReactNode }) {
  return (
    <div className="w-full relative group rounded-xl overflow-auto custom-scrollbar bg-[var(--bg-surface)] border border-[var(--border-default)]" style={{ minHeight: '600px' }}>
      <div className="min-w-max p-8 sm:p-12 md:p-16 mx-auto w-max">
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
            <GridDots />
            {/* ── Floor content ── */}
            <FloorDecorations />
          </div>

          {/* ── Unclipped Elements ── */}
          {/* Section labels */}
          <div className="absolute pointer-events-none z-10" style={{ left: PAD + 0 * CELL + 4, top: PAD - 20 }}>
            <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--text-tertiary)]">Row A</span>
          </div>
          <div className="absolute pointer-events-none z-10" style={{ left: PAD + 5 * CELL + 4, top: PAD - 20 }}>
            <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--text-tertiary)]">Row B</span>
          </div>
          <div className="absolute pointer-events-none z-10" style={{ left: PAD + 8 * CELL + 4, top: PAD - 20 }}>
            <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--text-tertiary)]">Row C</span>
          </div>
          <div className="absolute pointer-events-none z-10" style={{ left: PAD + 12 * CELL + 4, top: PAD - 20 }}>
            <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--text-tertiary)]">Row D</span>
          </div>

          <EntryMarker />
          {WALL_DETAILS.map((d, i) => <WallLabel key={i} detail={d} />)}

          {/* ── Seats ── */}
          <div className="absolute inset-0 z-20">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
