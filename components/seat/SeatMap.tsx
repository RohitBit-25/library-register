'use client';

import React, { ReactNode, memo, useState } from 'react';
import { DoorOpen, Snowflake, Wind } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FaceDir = 'up' | 'down' | 'left' | 'right';

export interface SeatPosition {
  x: number;
  y: number;
  face: FaceDir;
}

import { LAYOUT_CONFIG, getSeatPositionConfig, type WallDetail } from '@/lib/layoutConfig';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

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
}) => {
  const w = widthCols * CELL - CELL * 0.6;
  const h = heightRows * CELL - CELL * 0.4;
  return (
    <div
      className="absolute z-0 group"
      style={{
        left: PAD + (leftCol - 1) * CELL + CELL * 0.8,
        top: PAD + (topRow - 1) * CELL + CELL * 0.2,
        width: w,
        height: h,
      }}
    >
      {/* 3D Drop Shadow */}
      <div className="absolute inset-0 rounded-2xl bg-black/60 blur-[6px] translate-y-3 translate-x-1" />
      {/* Table Side/Thickness */}
      <div className="absolute inset-0 rounded-2xl bg-slate-900 translate-y-1.5 border border-white/5" />
      {/* Table Top */}
      <div 
        className="absolute inset-0 rounded-2xl border border-white/10 overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #1e293b, #111827 50%, #0f172a)',
        }}
      >
        {/* Subtle wood-like grain or reflection */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] pointer-events-none" />
        <div className="absolute inset-[1px] rounded-2xl border border-white/[0.06] pointer-events-none" />
      </div>
    </div>
  );
};

/** Layered 3D plant marker */
const Plant = ({ col, row }: { col: number; row: number }) => (
  <div
    className="absolute group hover:scale-105 transition-transform"
    style={{
      left: PAD + (col - 1) * CELL + CELL * 0.2,
      top: PAD + (row - 1) * CELL + CELL * 0.2,
      width: CELL * 0.6,
      height: CELL * 0.6,
    }}
  >
    {/* Pot shadow */}
    <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-black/60 blur-[4px] translate-y-3 translate-x-1" />
    {/* Pot base */}
    <div className="absolute top-[25%] left-[25%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)]" />
    {/* Plant leaves */}
    <div className="absolute inset-0 rotate-0">
      <div className="absolute top-[15%] left-[45%] w-[10%] h-[40%] bg-gradient-to-t from-emerald-700 to-emerald-400 rounded-full origin-bottom rotate-[-30deg] shadow-lg" />
      <div className="absolute top-[15%] left-[45%] w-[10%] h-[40%] bg-gradient-to-t from-emerald-700 to-emerald-400 rounded-full origin-bottom rotate-[30deg] shadow-lg" />
      <div className="absolute top-[25%] left-[45%] w-[10%] h-[35%] bg-gradient-to-t from-emerald-600 to-emerald-300 rounded-full origin-bottom rotate-[90deg] shadow-lg" />
      <div className="absolute top-[25%] left-[45%] w-[10%] h-[35%] bg-gradient-to-t from-emerald-600 to-emerald-300 rounded-full origin-bottom rotate-[-90deg] shadow-lg" />
      <div className="absolute top-[35%] left-[45%] w-[12%] h-[30%] bg-gradient-to-t from-emerald-500 to-emerald-200 rounded-full origin-bottom rotate-[180deg] shadow-lg" />
      <div className="absolute top-[10%] left-[45%] w-[12%] h-[45%] bg-gradient-to-t from-emerald-600 to-emerald-300 rounded-full origin-bottom shadow-lg" />
    </div>
    {/* Ambient glow */}
    <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
  </div>
);

/** Holographic grid lines + dot overlay for architectural planning feel */
const GridDots = memo(function GridDots() {
  return (
    <>
      {/* Ultra-faint grid lines */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-100"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: `${CELL}px ${CELL}px`,
          backgroundPosition: `${PAD}px ${PAD}px`,
        }}
      />
      {/* Animated scanline */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="w-full h-24 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent" style={{ animation: 'scan 8s linear infinite' }} />
      </div>
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(${CANVAS_H}px); opacity: 0; }
        }
      `}</style>
      {/* Dot intersections */}
      <svg className="absolute inset-0 pointer-events-none z-0 opacity-40" width={CANVAS_W} height={CANVAS_H}>
        <defs>
          <pattern id="grid-dots" x={PAD} y={PAD} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="1.5" fill="#60a5fa" className="opacity-50" />
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
        {isWindow ? <Wind className="w-3 h-3" /> : <Snowflake className="w-3 h-3" />}
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
      {/* Intense Volumetric Light cast onto the floor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-32 bg-[conic-gradient(from_180deg_at_50%_0%,rgba(245,158,11,0)_0deg,rgba(245,158,11,0.1)_180deg,rgba(245,158,11,0)_360deg)] pointer-events-none blur-xl origin-top animate-pulse" style={{ animationDuration: '3s' }} />
      
      {/* Structural archway */}
      <div className="w-full h-16 bg-[#111827] border-x-2 border-b-2 border-white/10 rounded-b-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.8)] flex items-end justify-center pb-2.5 backdrop-blur-md overflow-hidden relative">
        {/* Doorway glow strip */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-amber-500/20 blur-xl rounded-full" />
        
        {/* Soft amber wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
        
        {/* Badge */}
        <div className="relative flex items-center gap-2 bg-[#0a0f17] px-4 py-1.5 rounded-full border border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.3)] backdrop-blur-xl">
          <DoorOpen className="w-4 h-4 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping absolute left-4 opacity-50" style={{ animationDuration: '2s' }} />
          <div className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(245,158,11,1)]" />
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] drop-shadow-sm ml-1">Entrance</span>
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
  return (
    <div className="w-full relative group rounded-[2rem] overflow-hidden" style={{ minHeight: '600px' }}>
      <TransformWrapper
        initialScale={0.8}
        minScale={0.4}
        maxScale={2}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* ── Zoom Controls — glassmorphism card ── */}
            <div className="absolute left-4 top-4 z-50 flex flex-col gap-2 rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl bg-[#0a0f17]/80 p-2 pointer-events-auto">
              <button
                onClick={() => zoomIn()}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-white font-bold transition-all focus:outline-none"
                aria-label="Zoom in"
              >
                +
              </button>
              <div className="w-full h-px bg-white/10" />
              <button
                onClick={() => zoomOut()}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-white font-bold transition-all focus:outline-none"
                aria-label="Zoom out"
              >
                −
              </button>
            </div>

            <TransformComponent wrapperStyle={{ width: '100%', height: '100%', minHeight: '600px', cursor: 'grab' }} contentStyle={{ cursor: 'inherit' }}>
              {/* ── Main Canvas ── */}
              <div
                className="relative mx-auto rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out overflow-hidden"
                style={{
                  width: CANVAS_W,
                  height: CANVAS_H,
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
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.09),transparent_42%)] pointer-events-none z-0" />
                <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/35 to-transparent pointer-events-none z-0" />

                {/* ── Grid ── */}
                <GridDots />

                {/* ── Volumetric glows ── */}
                <div className="absolute top-0 left-1/4 w-[50%] h-[30%] bg-blue-500/8 blur-[130px] pointer-events-none rounded-full z-0" />
                <div className="absolute bottom-0 right-1/4 w-[40%] h-[40%] bg-emerald-500/5 blur-[130px] pointer-events-none rounded-full z-0" />

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

                {/* ── Section labels ── */}
                <div className="absolute pointer-events-none z-10" style={{ left: PAD + 0 * CELL + 4, top: PAD - 20 }}>
                  <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-blue-400/50">Row A</span>
                </div>
                <div className="absolute pointer-events-none z-10" style={{ left: PAD + 5 * CELL + 4, top: PAD - 20 }}>
                  <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-blue-400/50">Row B</span>
                </div>
                <div className="absolute pointer-events-none z-10" style={{ left: PAD + 8 * CELL + 4, top: PAD - 20 }}>
                  <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-emerald-400/50">Row C</span>
                </div>
                <div className="absolute pointer-events-none z-10" style={{ left: PAD + 12 * CELL + 4, top: PAD - 20 }}>
                  <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-violet-400/50">Row D</span>
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
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* ── Mobile pan hint ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl text-amber-400 text-[11px] uppercase font-bold tracking-[0.2em] px-6 py-3 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 md:hidden border border-amber-500/20 z-50 shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center gap-3 translate-y-4 group-hover:translate-y-0">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
        Pinch to zoom, drag to pan
      </div>
    </div>
  );
}
