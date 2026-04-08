'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type FaceDir = 'up' | 'down' | 'left' | 'right';

export function getSeatPosition(seatNum: number): { x: number, y: number, face: FaceDir } {
  if (seatNum >= 1 && seatNum <= 10) return { x: 1, y: 2 + seatNum, face: 'left' };
  if (seatNum >= 11 && seatNum <= 20) return { x: 3, y: 2 + (seatNum - 10), face: 'right' };
  if (seatNum === 21) return { x: 3, y: 1, face: 'up' };
  if (seatNum === 22) return { x: 4, y: 1, face: 'up' };
  if (seatNum >= 23 && seatNum <= 32) return { x: 4, y: 2 + (seatNum - 22), face: 'left' };
  if (seatNum >= 33 && seatNum <= 42) return { x: 6, y: 2 + (seatNum - 32), face: 'right' };
  if (seatNum >= 43 && seatNum <= 52) return { x: 7, y: 2 + (seatNum - 42), face: 'left' };
  if (seatNum >= 53 && seatNum <= 55) return { x: 9 + (seatNum - 53), y: 2, face: 'down' };
  if (seatNum >= 56 && seatNum <= 61) return { x: 9, y: 3 + (seatNum - 56), face: 'right' };
  if (seatNum >= 62 && seatNum <= 70) return { x: 10, y: 3 + (seatNum - 62), face: 'left' };
  if (seatNum >= 71 && seatNum <= 79) return { x: 12, y: 3 + (seatNum - 71), face: 'right' };
  if (seatNum >= 80 && seatNum <= 84) return { x: 9 + (seatNum - 80), y: 1, face: 'up' };
  if (seatNum >= 85 && seatNum <= 95) return { x: 14, y: 2 + (seatNum - 85), face: 'right' };
  return { x: 1, y: 1, face: 'up' };
}

export function SeatMapWrapper({ 
  seatNum, 
  children,
  className
}: { 
  seatNum: number, 
  children: (face: FaceDir) => ReactNode,
  className?: string,
}) {
  const { x, y, face } = getSeatPosition(seatNum);
  return (
    <div 
      className={cn("absolute", className)}
      style={{
        left: `calc(${(x - 1)} * 58px + 21px)`, // Cell width = 58px + padding
        top: `calc(${(y - 1)} * 58px + 21px)`,  
        width: '54px',                          // Inner tile 54px (leaves 4px gap)
        height: '54px'
      }}
      data-seat={seatNum}
    >
      {children(face)}
    </div>
  );
}

export function SeatMapContainer({ children }: { children: ReactNode }) {
  // 14 cols, 12 rows, cells are 58px, plus 48px global padding (24 on each side)
  const width = 14 * 58 + 48; 
  const height = 12 * 58 + 48;
  
  return (
    <div className="w-full overflow-x-auto pb-8 pt-6 custom-scrollbar smooth-scroll relative z-0">
      <div 
        className="relative mx-auto bg-[#0a0a0a]/80 dark:bg-[#0a0a0a]/80 rounded-[2.5rem] border border-[var(--border-subtle)] shadow-2xl" 
        style={{ 
          width: `${width}px`, 
          height: `${height}px`, 
          minWidth: `${width}px`,
          backgroundImage: `
            linear-gradient(to right, rgba(232, 133, 58, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(232, 133, 58, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '58px 58px',
          backgroundPosition: '24px 24px'
        }}
      >
        <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-white/5 pointer-events-none" />
        
        {/* Soft Ambient Glow within the Map */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[var(--saffron-500)]/5 blur-[100px] pointer-events-none rounded-full" />
        
        {/* Entry Placeholder */}
        <div className="absolute top-0 left-[38.5%] w-40 h-10 -translate-x-[50%] -translate-y-[60%] flex flex-col items-center justify-end opacity-90 z-10">
           <div className="flex items-center gap-3 w-full">
             <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--saffron-500)]/50"></div>
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--saffron-400)] drop-shadow-[0_0_8px_rgba(232,133,58,0.5)]">Entry</span>
             <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--saffron-500)]/50"></div>
           </div>
        </div>

        {/* Windows / AC units matching diagram aesthetic */}
        <div className="z-10 relative">
          <MapDetail label="Window" x={20} y={0} color="text-[#60B4FF]/60" />
          <MapDetail label="Window" x={86} y={0} color="text-[#60B4FF]/60" />
          <MapDetail label="Window" x={15} y={100} color="text-[#60B4FF]/60" />
          <MapDetail label="AC" x={28} y={100} color="text-[var(--ruby-400)]/70" />
          <MapDetail label="Window" x={45} y={100} color="text-[#60B4FF]/60" />
          <MapDetail label="Window" x={63} y={100} color="text-[#60B4FF]/60" />
          <MapDetail label="AC" x={75} y={100} color="text-[var(--ruby-400)]/70" />
          <MapDetail label="Window" x={85} y={100} color="text-[#60B4FF]/60" />
        </div>

        <div className="z-20 relative">{children}</div>
      </div>
    </div>
  );
}

function MapDetail({ label, x, y, color }: { label: string, x: number, y: number, color: string }) {
  return (
    <div 
      className={cn("absolute flex flex-col items-center gap-1 bg-transparent text-[9px] font-bold uppercase tracking-[0.25em]", color)}
      style={{
        left: `${x}%`,
        top: y === 0 ? '-32px' : 'auto',
        bottom: y === 100 ? '-32px' : 'auto',
        transform: 'translateX(-50%)'
      }}
    >
      {y === 100 && <div className={cn("w-12 h-px mb-1 opacity-50", label === "AC" ? "bg-[var(--ruby-500)]" : "bg-[#60B4FF]")} />}
      <span className="drop-shadow-sm">{label}</span>
      {y === 0 && <div className={cn("w-12 h-px mt-1 opacity-50", label === "AC" ? "bg-[var(--ruby-500)]" : "bg-[#60B4FF]")} />}
    </div>
  );
}
