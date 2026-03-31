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
        left: `calc(${(x - 1)} * 58px + 24px)`, // Cell width = 58px + nice padding
        top: `calc(${(y - 1)} * 58px + 24px)`,  
        width: '50px',                          // Inner tile 50px (leaves 8px gap)
        height: '50px'
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
    <div className="w-full overflow-x-auto pb-8 pt-4 custom-scrollbar smooth-scroll relative z-0">
      <div 
        className="relative mx-auto bg-[#e5e5f7]/50 dark:bg-[#1a1a24]/50 rounded-[2rem] border-2 border-card-border/60 dark:border-card-border-dark/60 shadow-inner" 
        style={{ 
          width: `${width}px`, 
          height: `${height}px`, 
          minWidth: `${width}px`,
          backgroundImage: 'radial-gradient(#444cf7 0.5px, transparent 0.5px), radial-gradient(#444cf7 0.5px, #e5e5f7 0.5px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px'
        }}
      >
        <div className="absolute inset-0 bg-surface/90 dark:bg-surface-dark/95 rounded-[2rem] backdrop-blur-[2px]" />
        
        {/* Entry Placeholder */}
        <div className="absolute top-0 left-[38.5%] w-32 h-2 -translate-x-[50%] -translate-y-full flex flex-col items-center opacity-80 z-10">
           <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#d32f2f] dark:text-[#ef5350] mb-2 drop-shadow-sm">Entry</span>
        </div>

        {/* Windows / AC units matching diagram aesthetic */}
        <div className="z-10">
          <MapDetail label="Window" x={20} y={0} color="text-blue-600 dark:text-blue-400" />
          <MapDetail label="Window" x={86} y={0} color="text-blue-600 dark:text-blue-400" />
          <MapDetail label="Window" x={15} y={100} color="text-blue-600 dark:text-blue-400" />
          <MapDetail label="AC" x={28} y={100} color="text-[#d32f2f] dark:text-[#ef5350]" />
          <MapDetail label="Window" x={45} y={100} color="text-blue-600 dark:text-blue-400" />
          <MapDetail label="Window" x={63} y={100} color="text-blue-600 dark:text-blue-400" />
          <MapDetail label="AC" x={75} y={100} color="text-[#d32f2f] dark:text-[#ef5350]" />
          <MapDetail label="Window" x={85} y={100} color="text-blue-600 dark:text-blue-400" />
        </div>

        <div className="z-20 relative">{children}</div>
      </div>
    </div>
  );
}

function MapDetail({ label, x, y, color }: { label: string, x: number, y: number, color: string }) {
  return (
    <div 
      className={cn("absolute bg-transparent text-[13px] font-black uppercase tracking-wider opacity-90", color)}
      style={{
        left: `${x}%`,
        top: y === 0 ? '-26px' : 'auto',
        bottom: y === 100 ? '-26px' : 'auto',
        transform: 'translateX(-50%)'
      }}
    >
      {label}
    </div>
  );
}
