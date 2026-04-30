'use client';

import { useState, useCallback, ReactNode, JSX } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FaceDir = 'up' | 'down' | 'left' | 'right';
export type SeatStatus = 'available' | 'selected' | 'occupied';

export interface SeatPosition {
  x: number;
  y: number;
  face: FaceDir;
}

export interface SeatData {
  number: number;
  status: SeatStatus;
}

export interface WallDetail {
  label: string;
  start: number;
  end: number;
  wall: 'top' | 'bottom' | 'left' | 'right';
  type: 'window' | 'ac';
}

// ─── Constants ────────────────────────────────────────────────────────────────
// Increased CELL from 56 to 64 to stop text clipping and crowding
const CELL = 64;
const PAD = 32;
const COLS = 14;
const ROWS = 12;

const CANVAS_W = COLS * CELL + PAD * 2;
const CANVAS_H = ROWS * CELL + PAD * 2;

const ARROW: Record<FaceDir, string> = {
  up: '▲', down: '▼', left: '◀', right: '▶', // Using solid arrows for better visibility
};

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
  if (n >= 1 && n <= 10) return { x: 1, y: 2 + (n - 1), face: 'left' };
  if (n >= 11 && n <= 20) return { x: 3, y: 2 + (n - 11), face: 'right' };
  if (n >= 23 && n <= 32) return { x: 4, y: 2 + (n - 23), face: 'left' };
  if (n === 21) return { x: 3, y: 1, face: 'up' };
  if (n === 22) return { x: 4, y: 1, face: 'up' };
  if (n >= 33 && n <= 42) return { x: 6, y: 2 + (n - 33), face: 'right' };
  if (n >= 43 && n <= 52) return { x: 7, y: 2 + (n - 43), face: 'left' };
  if (n >= 80 && n <= 84) return { x: 9 + (n - 80), y: 1, face: 'up' };
  if (n >= 53 && n <= 55) return { x: 9 + (n - 53), y: 2, face: 'down' };
  if (n >= 56 && n <= 61) return { x: 9, y: 3 + (n - 55), face: 'right' };
  if (n >= 62 && n <= 70) return { x: 10, y: 3 + (n - 61), face: 'left' };
  if (n >= 71 && n <= 79) return { x: 12, y: 3 + (n - 71), face: 'right' };
  if (n >= 85 && n <= 95) return { x: 14, y: 1 + (n - 84), face: 'right' };
  return { x: 1, y: 1, face: 'up' };
}

function toPixel(col: number, row: number) {
  const SIZE = 48; // Seat size
  return {
    left: PAD + (col - 1) * CELL + (CELL - SIZE) / 2,
    top: PAD + (row - 1) * CELL + (CELL - SIZE) / 2,
  };
}

// ─── Components ───────────────────────────────────────────────────────────────

function SeatArrow({ face }: { face: FaceDir }) {
  const positions: Record<FaceDir, string> = {
    up: 'top-1 left-1/2 -translate-x-1/2',
    down: 'bottom-1 left-1/2 -translate-x-1/2',
    left: 'left-1 top-1/2 -translate-y-1/2',
    right: 'right-1 top-1/2 -translate-y-1/2',
  };
  return (
    <span
      className={`absolute text-[7px] leading-none opacity-50 ${positions[face]}`}
      aria-hidden
    >
      {ARROW[face]}
    </span>
  );
}

function Seat({ data, onToggle }: { data: SeatData; onToggle: (n: number) => void; }) {
  const { number, status } = data;
  const { x, y, face } = getSeatPosition(number);
  const { left, top } = toPixel(x, y);

  const isOccupied = status === 'occupied';
  const isSelected = status === 'selected';

  const baseClass = `
    relative flex items-center justify-center rounded-lg w-12 h-12
    transition-all duration-150 ease-in-out select-none border-2
    ${isOccupied
      ? 'bg-emerald-500/20 border-emerald-500/40 opacity-40 cursor-not-allowed'
      : isSelected
        ? 'bg-blue-600 border-blue-400 text-white shadow-lg z-20 scale-110'
        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-700 z-10'
    }
  `.trim();

  return (
    <div style={{ position: 'absolute', left, top }} data-seat={number}>
      <button
        className={baseClass}
        onClick={() => !isOccupied && onToggle(number)}
        disabled={isOccupied}
        aria-label={`Seat ${number}`}
      >
        <SeatArrow face={face} />
        <span className="text-[12px] font-black tracking-tighter">
          {number}
        </span>
      </button>
    </div>
  );
}

function WallLabel({ detail }: { detail: WallDetail }) {
  const { label, start, end, wall, type } = detail;
  const size = (end - start + 1) * CELL - 8;
  const offset = PAD + (start - 1) * CELL + 4;
  const isVertical = wall === 'left' || wall === 'right';

  const style: React.CSSProperties = isVertical
    ? { top: offset, height: size, width: 20, [wall]: 4, position: 'absolute', writingMode: 'vertical-rl' }
    : { left: offset, width: size, height: 20, [wall]: 4, position: 'absolute' };

  const colorCls = type === 'window' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  return (
    <div className={`flex items-center justify-center rounded border font-bold uppercase tracking-[0.1em] text-[10px] ${colorCls}`} style={style}>
      {label}
    </div>
  );
}

function GridDots() {
  const dots: JSX.Element[] = [];
  for (let cx = 0; cx <= COLS; cx++) {
    for (let cy = 0; cy <= ROWS; cy++) {
      dots.push(
        <circle key={`${cx}-${cy}`} cx={PAD + cx * CELL} cy={PAD + cy * CELL} r={1} fill="white" opacity="0.1" />
      );
    }
  }
  return <svg className="absolute inset-0 pointer-events-none" width={CANVAS_W} height={CANVAS_H}>{dots}</svg>;
}

function EntryMarker() {
  return (
    <div
      className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-1 border border-amber-500/50 bg-amber-500/10 rounded-full flex items-center gap-2"
      style={{ left: PAD + 4.5 * CELL, width: 3 * CELL }}
    >
      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Entrance</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SeatMap() {
  const [seats, setSeats] = useState<Map<number, SeatData>>(() => {
    const map = new Map();
    const occupied = [3, 7, 15, 28, 36, 45, 52, 63, 72, 88];
    for (let n = 1; n <= 95; n++) {
      map.set(n, { number: n, status: occupied.includes(n) ? 'occupied' : 'available' });
    }
    return map;
  });

  const toggleSeat = useCallback((n: number) => {
    setSeats(prev => {
      const next = new Map(prev);
      const seat = next.get(n);
      if (!seat || seat.status === 'occupied') return prev;
      next.set(n, { ...seat, status: seat.status === 'selected' ? 'available' : 'selected' });
      return next;
    });
  }, []);

  return (
    <div className="bg-zinc-950 min-h-screen text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-black uppercase tracking-tighter">Select Seats</h1>
          <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-zinc-800 border border-zinc-700 rounded" /> Available</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded" /> Selected</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/40 rounded" /> Occupied</div>
          </div>
        </header>

        <div className="overflow-auto border border-zinc-800 rounded-3xl bg-zinc-900/50 shadow-2xl custom-scrollbar">
          <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
            <GridDots />
            <EntryMarker />
            {WALL_DETAILS.map((d, i) => <WallLabel key={i} detail={d} />)}
            {[...seats.values()].map(s => <Seat key={s.number} data={s} onToggle={toggleSeat} />)}
          </div>
        </div>
      </div>
    </div>
  );
}