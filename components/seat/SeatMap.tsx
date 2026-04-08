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

const CELL = 56;
const PAD  = 24;
const COLS = 14;
const ROWS = 12;

const CANVAS_W = COLS * CELL + PAD * 2; // 824px
const CANVAS_H = ROWS * CELL + PAD * 2; // 720px

const ARROW: Record<FaceDir, string> = {
  up: '↑', down: '↓', left: '←', right: '→',
};

const WALL_DETAILS: WallDetail[] = [
  { label: 'Window', start: 1,  end: 1,  wall: 'bottom', type: 'window' },
  { label: 'AC',     start: 3,  end: 4,  wall: 'bottom', type: 'ac'     },
  { label: 'Window', start: 6,  end: 7,  wall: 'bottom', type: 'window' },
  { label: 'Window', start: 9,  end: 10, wall: 'bottom', type: 'window' },
  { label: 'AC',     start: 12, end: 12, wall: 'bottom', type: 'ac'     },
  { label: 'Window', start: 14, end: 14, wall: 'bottom', type: 'window' },
  { label: 'Window', start: 3,  end: 4,  wall: 'right',  type: 'window' },
  { label: 'Window', start: 11, end: 12, wall: 'right',  type: 'window' },
];

// ─── Seat Position Matrix ─────────────────────────────────────────────────────

export function getSeatPosition(n: number): SeatPosition {
  if (n >= 1  && n <= 10) return { x: 1,          y: 2 + (n - 1),   face: 'left'  };
  if (n >= 11 && n <= 20) return { x: 3,          y: 2 + (n - 11),  face: 'right' };
  if (n >= 23 && n <= 32) return { x: 4,          y: 2 + (n - 23),  face: 'left'  };
  if (n === 21)           return { x: 3,          y: 2,             face: 'up'    };
  if (n === 22)           return { x: 4,          y: 2,             face: 'up'    };
  if (n >= 33 && n <= 42) return { x: 6,          y: 2 + (n - 33),  face: 'right' };
  if (n >= 43 && n <= 52) return { x: 7,          y: 2 + (n - 43),  face: 'left'  };
  if (n >= 80 && n <= 84) return { x: 9 + (n-80), y: 2,             face: 'up'    };
  if (n >= 53 && n <= 55) return { x: 9 + (n-53), y: 3,             face: 'down'  };
  if (n >= 56 && n <= 61) return { x: 9,          y: 3 + (n - 55),  face: 'right' };
  if (n >= 62 && n <= 70) return { x: 10,         y: 3 + (n - 61),  face: 'left'  };
  if (n >= 71 && n <= 79) return { x: 12,         y: 3 + (n - 71),  face: 'right' };
  if (n >= 85 && n <= 95) return { x: 14,         y: 1 + (n - 84),  face: 'right' };
  return { x: 1, y: 1, face: 'up' };
}

function toPixel(col: number, row: number) {
  return {
    left: PAD + (col - 1) * CELL + (CELL - 44) / 2,
    top:  PAD + (row - 1) * CELL + (CELL - 44) / 2,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeatArrow({ face }: { face: FaceDir }) {
  const positions: Record<FaceDir, string> = {
    up:    'top-[3px] left-1/2 -translate-x-1/2',
    down:  'bottom-[3px] left-1/2 -translate-x-1/2',
    left:  'left-[3px] top-1/2 -translate-y-1/2',
    right: 'right-[3px] top-1/2 -translate-y-1/2',
  };
  return (
    <span
      className={`absolute text-[8px] leading-none opacity-40 text-slate-500 ${positions[face]}`}
      aria-hidden
    >
      {ARROW[face]}
    </span>
  );
}

function Seat({
  data,
  onToggle,
}: {
  data: SeatData;
  onToggle: (n: number) => void;
}) {
  const { number, status } = data;
  const { x, y, face } = getSeatPosition(number);
  const { left, top } = toPixel(x, y);

  const isOccupied = status === 'occupied';
  const isSelected = status === 'selected';

  const seatStyle: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width: 44,
    height: 44,
  };

  const baseClass = `
    relative flex items-center justify-center rounded-[8px] w-full h-full
    transition-all duration-[120ms] ease-out select-none
    ${isOccupied
      ? 'bg-[rgba(248,113,113,0.07)] border border-[rgba(248,113,113,0.18)] opacity-50 cursor-not-allowed'
      : isSelected
        ? 'bg-[rgba(99,179,237,0.14)] border border-[rgba(99,179,237,0.6)] shadow-[0_0_12px_rgba(99,179,237,0.18)] cursor-pointer hover:scale-[1.07] active:scale-[0.96]'
        : 'bg-[#0f1623] border border-[rgba(255,255,255,0.08)] cursor-pointer hover:scale-[1.07] hover:border-[rgba(255,255,255,0.18)] active:scale-[0.96]'
    }
  `.trim();

  return (
    <div style={seatStyle} data-seat={number}>
      <button
        className={baseClass}
        onClick={() => !isOccupied && onToggle(number)}
        disabled={isOccupied}
        aria-label={`Seat ${number} — ${status}`}
        aria-pressed={isSelected}
      >
        <SeatArrow face={face} />
        <span
          className={`text-[10px] font-medium z-10 font-mono leading-none ${
            isSelected ? 'text-[#93c5fd]' : 'text-[#475569]'
          }`}
        >
          {number}
        </span>
      </button>
    </div>
  );
}

function WallLabel({ detail }: { detail: WallDetail }) {
  const { label, start, end, wall, type } = detail;
  const isWindow = type === 'window';

  const size   = (end - start + 1) * CELL - 16;
  const offset = PAD + (start - 1) * CELL + 8;

  const colorCls = isWindow
    ? 'text-[#63b3ed] border-[rgba(99,179,237,0.35)]'
    : 'text-[#f87171] border-[rgba(248,113,113,0.35)]';

  const isVertical = wall === 'left' || wall === 'right';

  const style: React.CSSProperties = isVertical
    ? { top: offset, height: size, width: 16, [wall]: 10, position: 'absolute', writingMode: 'vertical-rl' }
    : { left: offset, width: size, height: 16, [wall]: 10, position: 'absolute' };

  return (
    <div
      className={`flex items-center justify-center rounded-[3px] border border-dashed bg-[#080a0f] pointer-events-none z-10 ${colorCls}`}
      style={style}
    >
      <span className="text-[8px] font-semibold tracking-[0.2em] uppercase leading-none">
        {label}
      </span>
    </div>
  );
}

function GridDots() {
  const dots: JSX.Element[] = []; 
  for (let cx = 0; cx <= COLS; cx++) {
    for (let cy = 0; cy <= ROWS; cy++) {
      dots.push(
        <circle
          key={`${cx}-${cy}`}
          cx={PAD + cx * CELL}
          cy={PAD + cy * CELL}
          r={1}
          fill="rgba(255,255,255,0.035)"
        />
      );
    }
  }
  return (
    <svg
      className="absolute inset-0 pointer-events-none rounded-[20px] overflow-hidden"
      width={CANVAS_W}
      height={CANVAS_H}
    >
      {dots}
    </svg>
  );
}

function EntryMarker() {
  const left = PAD + (5 - 1) * CELL;
  const width = 4 * CELL;
  return (
    <div
      className="absolute flex items-center justify-center gap-2 top-[20px] -translate-y-1/2 bg-[#080a0f] px-3 z-20"
      style={{ left, width }}
    >
      <span className="w-[5px] h-[5px] rounded-full bg-[rgba(248,113,113,0.35)] border border-[rgba(248,113,113,0.65)] flex-shrink-0" />
      <span
        className="text-[9px] font-black uppercase tracking-[0.38em] text-[#f87171]"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        Entry
      </span>
      <span className="w-[5px] h-[5px] rounded-full bg-[rgba(248,113,113,0.35)] border border-[rgba(248,113,113,0.65)] flex-shrink-0" />
    </div>
  );
}

function Legend() {
  const items = [
    { label: 'Available', bg: 'bg-[#0f1623]',                  border: 'border-[rgba(255,255,255,0.1)]'   },
    { label: 'Selected',  bg: 'bg-[rgba(99,179,237,0.14)]',    border: 'border-[rgba(99,179,237,0.55)]'   },
    { label: 'Occupied',  bg: 'bg-[rgba(248,113,113,0.07)]',   border: 'border-[rgba(248,113,113,0.22)]'  },
  ];
  return (
    <div className="flex items-center gap-4">
      {items.map(({ label, bg, border }) => (
        <div key={label} className="flex items-center gap-[6px]">
          <span className={`inline-block w-[9px] h-[9px] rounded-[2px] border ${bg} ${border}`} />
          <span className="text-[10px] tracking-[0.1em] uppercase text-[#4b5563]">{label}</span>
        </div>
      ))}
    </div>
  );
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`
        fixed bottom-5 left-1/2 -translate-x-1/2 z-50
        bg-[#1e293b] border border-[rgba(99,179,237,0.28)] text-[#93c5fd]
        text-[11px] tracking-[0.1em] px-5 py-[10px] rounded-[8px] pointer-events-none
        transition-all duration-[250ms] ease-out
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
    >
      {message}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TOTAL_SEATS = 95;

// Demo: pre-mark some seats as occupied
const DEFAULT_OCCUPIED = new Set([3, 7, 15, 28, 36, 45, 52, 63, 72, 88]);

function buildInitialSeats(): Map<number, SeatData> {
  const map = new Map<number, SeatData>();
  for (let n = 1; n <= TOTAL_SEATS; n++) {
    map.set(n, {
      number: n,
      status: DEFAULT_OCCUPIED.has(n) ? 'occupied' : 'available',
    });
  }
  return map;
}

export function SeatMap() {
  const [seats, setSeats] = useState<Map<number, SeatData>>(buildInitialSeats);
  const [toast, setToast]     = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const selectedSeats = [...seats.values()].filter(s => s.status === 'selected');

  const toggleSeat = useCallback((n: number) => {
    setSeats(prev => {
      const next = new Map(prev);
      const seat = next.get(n);
      if (!seat || seat.status === 'occupied') return prev;
      next.set(n, {
        ...seat,
        status: seat.status === 'selected' ? 'available' : 'selected',
      });
      return next;
    });
  }, []);

  const handleConfirm = () => {
    if (selectedSeats.length === 0) return;
    const nums = selectedSeats.map(s => s.number).sort((a, b) => a - b).join(', ');
    setToast(`Seats ${nums} confirmed ✓`);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  };

  const handleClearAll = () => {
    setSeats(prev => {
      const next = new Map(prev);
      for (const [n, seat] of next) {
        if (seat.status === 'selected') next.set(n, { ...seat, status: 'available' });
      }
      return next;
    });
  };

  return (
    <>
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');`}</style>

      <div
        className="bg-[#080a0f] min-h-screen p-6 text-[#e2e8f0]"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 px-1">
          <h1
            className="text-[13px] font-bold uppercase tracking-[0.22em] text-[#94a3b8]"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Seat Map
          </h1>
          <Legend />
        </div>

        {/* Canvas scroll container */}
        <div className="w-full overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-thumb]:bg-[#1e293b] [&::-webkit-scrollbar-track]:bg-transparent">
          <div
            className="relative mx-auto bg-[#080a0f] rounded-[20px] border border-[rgba(255,255,255,0.05)]"
            style={{ width: CANVAS_W, height: CANVAS_H, minWidth: CANVAS_W }}
          >
            {/* Background dots */}
            <GridDots />

            {/* Room boundary */}
            <div className="absolute inset-[20px] rounded-[14px] border border-[rgba(99,179,237,0.16)] pointer-events-none z-0" />

            {/* Entry marker */}
            <EntryMarker />

            {/* Wall labels */}
            {WALL_DETAILS.map((d, i) => (
              <WallLabel key={i} detail={d} />
            ))}

            {/* Seats */}
            {[...seats.values()].map(seat => (
              <Seat key={seat.number} data={seat} onToggle={toggleSeat} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-5 px-1">
          <div className="text-[11px] text-[#4b5563] tracking-[0.08em]">
            Selected:{' '}
            <span className="text-[#93c5fd] font-medium">{selectedSeats.length}</span>
            {selectedSeats.length > 0 && (
              <button
                onClick={handleClearAll}
                className="ml-3 text-[10px] text-[#475569] hover:text-[#94a3b8] transition-colors underline underline-offset-2"
              >
                Clear all
              </button>
            )}
          </div>

          <button
            onClick={handleConfirm}
            disabled={selectedSeats.length === 0}
            className={`
              font-mono text-[11px] font-medium uppercase tracking-[0.14em]
              px-5 py-[8px] rounded-[6px] border transition-all duration-150
              ${selectedSeats.length > 0
                ? 'bg-[rgba(99,179,237,0.08)] border-[rgba(99,179,237,0.4)] text-[#93c5fd] hover:bg-[rgba(99,179,237,0.15)] hover:border-[rgba(99,179,237,0.7)] cursor-pointer'
                : 'bg-transparent border-[rgba(255,255,255,0.06)] text-[#2d3748] cursor-not-allowed'
              }
            `}
          >
            Confirm
          </button>
        </div>
      </div>

      <Toast message={toast} visible={toastVisible} />
    </>
  );
}

// ─── Legacy wrappers (backward-compatible) ───────────────────────────────────
// These mirror the original API so existing usage continues to work.

export function SeatMapWrapper({
  seatNum,
  children,
  className = '',
}: {
  seatNum: number;
  children: (face: FaceDir) => ReactNode;
  className?: string;
}) {
  const { x, y, face } = getSeatPosition(seatNum);
  return (
    <div
      className={`absolute ${className}`}
      style={{
        left:   PAD + (x - 1) * CELL + (CELL - 44) / 2,
        top:    PAD + (y - 1) * CELL + (CELL - 44) / 2,
        width:  44,
        height: 44,
      }}
      data-seat={seatNum}
    >
      {children(face)}
    </div>
  );
}

export function SeatMapContainer({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto pb-4">
      <div
        className="relative mx-auto bg-[#080a0f] rounded-[20px] border border-[rgba(255,255,255,0.05)]"
        style={{ width: CANVAS_W, height: CANVAS_H, minWidth: CANVAS_W }}
      >
        <GridDots />
        <div className="absolute inset-[20px] rounded-[14px] border border-[rgba(99,179,237,0.16)] pointer-events-none z-0" />
        <EntryMarker />
        {WALL_DETAILS.map((d, i) => <WallLabel key={i} detail={d} />)}
        <div className="absolute inset-0 z-20">{children}</div>
      </div>
    </div>
  );
}

export default SeatMap;