'use client';

import { memo, useState } from 'react';
import { type Member, type SeatStatus } from '@/lib/types';
import { getSeatStatus, firstName, daysUntilExpiry, fmtDateShort, cn } from '@/lib/utils';
import { Sun, Moon, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';

import { type FaceDir } from './SeatMap';

interface SeatTileProps {
  member: Member;
  onClick: (seat: number) => void;
  compact?: boolean;
  face?: FaceDir;
  selected?: boolean;
}

// ELITE UI: High-contrast, glowing, dark-mode optimized states
const tileClass: Record<SeatStatus, string> = {
  active: 'bg-[#121212]/60 border-white/5 hover:border-[#10b981]/50 hover:bg-[#10b981]/10 text-emerald-100/90 shadow-[0_4px_15px_rgba(0,0,0,0.4)]',
  expiring: 'bg-amber-500/5 border-amber-500/20 hover:border-amber-400/60 text-amber-200/90 shadow-[0_0_15px_rgba(245,154,60,0.05)]',
  expired: 'bg-ruby-500/5 border-ruby-500/20 hover:border-ruby-400/60 text-ruby-200/90 shadow-[0_0_15px_rgba(232,66,66,0.05)]',
  due: 'bg-marigold-500/5 border-marigold-500/20 hover:border-marigold-400/60 text-marigold-200/90 shadow-[inset_0_0_12px_rgba(245,200,66,0.05)]',
  vacant: 'bg-white/[0.02] border-white/5 border-dashed opacity-50 hover:opacity-100 hover:border-white/20 text-white/30',
};

function SeatTileInner({ member, onClick, compact = false, face, selected = false }: SeatTileProps) {
  const [isHovered, setIsHovered] = useState(false);
  const status = getSeatStatus(member);
  const days = !member.vacant ? daysUntilExpiry(member.expiry) : Infinity;

  const shiftIcon = member.shift === 'evening' ? (
    <Moon className={cn(compact ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
  ) : member.shift === 'full' ? (
    <span className="flex items-center gap-0.5">
      <Sun className={cn(compact ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
      <Moon className={cn(compact ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
    </span>
  ) : (
    <Sun className={cn(compact ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
  );

  const ariaLabel = member.vacant
    ? `Seat ${member.seat}, Vacant`
    : `Seat ${member.seat}, ${member.name}, ${status === 'due' ? 'Fee Due' : status}`;

  const ringRadius = compact ? 25 : 34; 
  const circumference = 2 * Math.PI * ringRadius;
  const progressPercent = Math.max(0, Math.min(100, (days / 30) * 100));
  const dashoffset = circumference - (progressPercent / 100) * circumference;
  
  let ringStroke = 'stroke-[#10b981]'; 
  if (status === 'expiring') ringStroke = 'stroke-[#fbbf24]';
  if (status === 'expired' || status === 'due') ringStroke = 'stroke-[#ef4444]';

  return (
    <LazyMotion features={domAnimation}>
      <div 
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <m.button
          onClick={() => onClick(member.seat)}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={cn(
            'relative flex flex-col items-center justify-between rounded-[0.65rem] transition-all duration-300 cursor-pointer z-10 w-full h-full border backdrop-blur-md',
            tileClass[status],
            compact ? 'px-[3px] py-[3px]' : 'p-1.5',
            selected ? 'ring-2 ring-[var(--saffron-500)] shadow-[0_0_25px_rgba(232,133,58,0.5)] z-20 scale-105 border-[var(--saffron-500)]' : ''
          )}
          aria-label={ariaLabel}
        >
          {/* ELITE UI: LED Strip Indicator instead of a dot */}
          {face && (
            <div className={cn(
              "absolute rounded-full transition-all duration-500",
              status === 'vacant' ? 'bg-white/10' : 
              status === 'active' ? 'bg-[#10b981] shadow-[0_0_8px_#10b981,0_0_15px_rgba(16,185,129,0.5)]' : 
              status === 'expiring' ? 'bg-[#fbbf24] shadow-[0_0_8px_#fbbf24,0_0_15px_rgba(251,191,36,0.5)]' : 
              status === 'due' ? 'bg-[#f5c842] shadow-[0_0_8px_#f5c842,0_0_15px_rgba(245,200,66,0.5)]' :
              'bg-[#ef4444] shadow-[0_0_8px_#ef4444,0_0_15px_rgba(239,68,68,0.5)]',
              face === 'up' && "bottom-0 left-[20%] right-[20%] h-[1.5px]",
              face === 'down' && "top-0 left-[20%] right-[20%] h-[1.5px]",
              face === 'left' && "right-0 top-[20%] bottom-[20%] w-[1.5px]",
              face === 'right' && "left-0 top-[20%] bottom-[20%] w-[1.5px]"
            )} />
          )}

          {!member.vacant && (
            <svg className="absolute inset-0 w-full h-full -rotate-90 opacity-40 mix-blend-screen">
              <circle
                cx="50%"
                cy="50%"
                r={ringRadius}
                fill="transparent"
                className="stroke-white/5"
                strokeWidth="1.5"
              />
              {status !== 'expired' && (
                 <m.circle
                  cx="50%"
                  cy="50%"
                  r={ringRadius}
                  fill="transparent"
                  className={ringStroke}
                  strokeWidth="1.5"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: dashoffset }}
                  transition={{ duration: 1.5, type: "spring", bounce: 0 }}
                  style={{ filter: `drop-shadow(0 0 4px ${status === 'active' ? '#10b981' : '#fbbf24'})` }}
                />
              )}
            </svg>
          )}

          <span className={cn(
            'font-mono font-bold self-start leading-none z-10 opacity-70 pl-0.5 pt-0.5 tracking-wider',
            compact ? 'text-[9.5px]' : 'text-xs',
          )}>
            {String(member.seat).padStart(2, '0')}
          </span>

          {member.vacant ? (
            <Plus className={cn('opacity-30 z-10 mt-0.5 transition-opacity group-hover:opacity-100 group-hover:text-white', compact ? 'w-4 h-4' : 'w-5 h-5')} />
          ) : (
            <span className={cn(
              'font-black w-full text-center z-10 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] overflow-hidden text-ellipsis whitespace-nowrap px-0.5',
              compact ? 'text-[10px] leading-tight pb-0.5' : 'text-xs leading-normal pb-0.5',
            )}>
              {firstName(member.name)}
            </span>
          )}

          <div className={cn('flex items-center justify-center w-full gap-0.5 z-10 font-bold opacity-80', compact ? 'text-[8.5px] leading-none mb-0.5' : 'text-[10px] leading-none mb-0.5')}>
            {member.vacant ? (
              <span className="font-semibold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity text-white/50">Add</span>
            ) : (
              <>
                <span className="opacity-70">{shiftIcon}</span>
                {status === 'expiring' && (
                  <span className="text-[#fbbf24] ml-0.5 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]">{days}d</span>
                )}
                {status === 'expired' && (
                  <span className="text-[#ef4444] ml-0.5 drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]">{-days}d</span>
                )}
              </>
            )}
          </div>
        </m.button>

        {/* ELITE UI: Refined ultra-glass popover */}
        <AnimatePresence>
          {isHovered && !member.vacant && (
            <m.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 rounded-xl bg-[#080808]/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] z-50 pointer-events-none"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-black text-white/90 tracking-wide">{member.name}</h4>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">#{String(member.seat).padStart(2, '0')} • {member.phone || 'No phone'}</p>
                  </div>
                  <div className={cn('w-2 h-2 rounded-full mt-1 shadow-[0_0_10px_currentColor]', status === 'active' ? 'bg-[#10b981] text-[#10b981]' : status === 'expiring' ? 'bg-[#fbbf24] text-[#fbbf24]' : 'bg-[#ef4444] text-[#ef4444]')} />
                </div>
                
                <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/60">
                    <CalendarIcon className="w-3 h-3 text-[var(--saffron-500)] opacity-80" />
                    <span>Due: <span className="text-white/80">{fmtDateShort(member.expiry)}</span> <span className="opacity-50">({days}d)</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/60">
                    <Clock className="w-3 h-3 text-[var(--saffron-500)] opacity-80" />
                    <span className="capitalize text-white/80">{member.shift} Shift</span>
                  </div>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}

const SeatTile = memo(SeatTileInner, (prevProps, nextProps) => {
  const prev = prevProps.member;
  const next = nextProps.member;
  return (
    prev.seat === next.seat &&
    prev.name === next.name &&
    prev.vacant === next.vacant &&
    prev.fee === next.fee &&
    prev.expiry === next.expiry &&
    prev.shift === next.shift &&
    prev.phone === next.phone &&
    prevProps.compact === nextProps.compact &&
    prevProps.selected === nextProps.selected
  );
});

SeatTile.displayName = 'SeatTile';

export default SeatTile;