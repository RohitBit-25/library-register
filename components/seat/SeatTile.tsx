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

const tileClass: Record<SeatStatus, string> = {
  active: 'bg-white/5 border-[var(--border-default)] hover:border-[var(--emerald-500)]/50 hover:bg-emerald-500/10 shadow-sm text-[#C4A882]',
  expiring: 'bg-[var(--saffron-500)]/10 border-[var(--saffron-500)]/30 hover:border-[var(--saffron-400)] text-[var(--saffron-300)] shadow-[0_0_10px_rgba(232,133,58,0.1)]',
  expired: 'bg-[var(--ruby-500)]/10 border-[var(--ruby-500)]/30 hover:border-[var(--ruby-400)] text-[var(--ruby-300)] shadow-[0_0_10px_rgba(232,66,66,0.1)]',
  due: 'bg-white/5 border-[var(--marigold-500)]/30 hover:border-[var(--marigold-400)] text-[var(--marigold-300)] shadow-[inset_0_0_8px_rgba(200,144,14,0.2)]',
  vacant: 'bg-[var(--bg-surface)] border-[var(--border-default)] border-dashed opacity-50 hover:opacity-100 hover:border-white/30 text-[var(--text-disabled)]',
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

  // Calculate Expiry Ring Progress
  const ringRadius = compact ? 26 : 34;
  const circumference = 2 * Math.PI * ringRadius;
  const progressPercent = Math.max(0, Math.min(100, (days / 30) * 100));
  const dashoffset = circumference - (progressPercent / 100) * circumference;
  
  let ringStroke = 'stroke-[#22C36A]'; // Emerald for active
  if (status === 'expiring') ringStroke = 'stroke-[var(--saffron-400)]';
  if (status === 'expired' || status === 'due') ringStroke = 'stroke-[var(--ruby-500)]';

  return (
    <LazyMotion features={domAnimation}>
      <div 
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <m.button
          onClick={() => onClick(member.seat)}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96, y: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            mass: 0.5,
          }}
          className={cn(
            'relative flex flex-col items-center justify-between rounded-[0.65rem] transition-all cursor-pointer z-10 w-full h-full border backdrop-blur-sm',
            tileClass[status],
            compact ? 'p-[5px]' : 'p-2',
            selected ? 'ring-2 ring-[var(--saffron-500)] shadow-[0_0_20px_rgba(232,133,58,0.4)] z-20 scale-105 border-[var(--saffron-500)]' : ''
          )}
          aria-label={ariaLabel}
        >
          {/* Chair indicator (relative to the face direction) */}
          {face && (
            <div className={cn(
              "absolute rounded-full transition-colors",
              status === 'vacant' ? 'bg-white/10' : 
              status === 'active' ? 'bg-[#22C36A] shadow-[0_0_8px_rgba(34,195,106,0.5)]' : 
              status === 'expiring' ? 'bg-[var(--saffron-400)] shadow-[0_0_8px_rgba(245,154,60,0.5)]' : 
              status === 'due' ? 'bg-[var(--marigold-400)] shadow-[0_0_8px_rgba(245,200,66,0.5)]' :
              'bg-[var(--ruby-500)] shadow-[0_0_8px_rgba(232,66,66,0.5)]',
              face === 'up' && "bottom-[-4px] left-[20%] right-[20%] h-[2px]",
              face === 'down' && "top-[-4px] left-[20%] right-[20%] h-[2px]",
              face === 'left' && "right-[-4px] top-[20%] bottom-[20%] w-[2px]",
              face === 'right' && "left-[-4px] top-[20%] bottom-[20%] w-[2px]"
            )} />
          )}
          {/* SVG Expiry Visual Ring Background */}
          {!member.vacant && (
            <svg className="absolute inset-0 w-full h-full -rotate-90 opacity-20 dark:opacity-40">
              <circle
                cx="50%"
                cy="50%"
                r={ringRadius}
                fill="transparent"
                className="stroke-[var(--border-default)]"
                strokeWidth="2"
              />
              {status !== 'expired' && (
                 <m.circle
                  cx="50%"
                  cy="50%"
                  r={ringRadius}
                  fill="transparent"
                  className={ringStroke}
                  strokeWidth="2"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: dashoffset }}
                  transition={{ duration: 1, type: "spring" }}
                />
              )}
            </svg>
          )}

          {/* Seat number */}
          <span className={cn(
            'font-mono font-bold self-start leading-none z-10 opacity-80',
            compact ? 'text-[9px]' : 'text-[11px]',
          )}>
            {String(member.seat).padStart(2, '0')}
          </span>

          {/* Name or + icon */}
          {member.vacant ? (
            <Plus className={cn('opacity-40 z-10 mt-1', compact ? 'w-4 h-4' : 'w-5 h-5')} />
          ) : (
            <span className={cn(
              'font-black truncate w-full text-center leading-tight z-10 tracking-tight drop-shadow-sm',
              compact ? 'text-[9.5px]' : 'text-[11px]',
            )}>
              {firstName(member.name)}
            </span>
          )}

          {/* Shift icon or days info */}
          <div className={cn('flex items-center gap-0.5 z-10 font-bold opacity-80', compact ? 'text-[7.5px]' : 'text-[9px]')}>
            {member.vacant ? (
              <span className="font-semibold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Add</span>
            ) : (
              <>
                <span className="opacity-70">{shiftIcon}</span>
                {status === 'expiring' && (
                  <span className="text-[var(--saffron-400)] ml-0.5 drop-shadow-[0_0_2px_rgba(245,154,60,0.5)]">{days}d</span>
                )}
                {status === 'expired' && (
                  <span className="text-[var(--ruby-400)] ml-0.5 drop-shadow-[0_0_2px_rgba(232,66,66,0.5)]">{-days}d</span>
                )}
              </>
            )}
          </div>

          {/* Warning indicator for due/expired */}
          {(status === 'due' || status === 'expired') && (
            <m.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
              className={cn(
                "absolute -top-1 -right-1 w-3 h-3 rounded-full border border-[#0a0a0a] shadow-sm z-20",
                status === 'due' ? "bg-[var(--marigold-500)] shadow-[0_0_8px_rgba(245,200,66,0.8)]" : "bg-[var(--ruby-500)] shadow-[0_0_8px_rgba(232,66,66,0.8)]"
              )}
            />
          )}
        </m.button>

        {/* Rich Hover Popover */}
        <AnimatePresence>
          {isHovered && !member.vacant && (
            <m.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 rounded-xl bg-surface/95/95 backdrop-blur-xl border border-[var(--border-default)] shadow-2xl z-50 pointer-events-none"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-black text-[var(--text-primary)]">{member.name}</h4>
                    <p className="text-[10px] text-[var(--text-tertiary)] font-mono">#{String(member.seat).padStart(2, '0')} • {member.phone || 'No phone'}</p>
                  </div>
                  <div className={cn('w-2 h-2 rounded-full mt-1', status === 'active' ? 'bg-green-500' : status === 'expiring' ? 'bg-yellow-500' : 'bg-red-500')} />
                </div>
                
                <div className="pt-1.5 border-t border-[var(--border-subtle)] flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-secondary)]">
                    <CalendarIcon className="w-3 h-3 text-[var(--saffron-500)]" />
                    <span>Due: {fmtDateShort(member.expiry)} <span className="opacity-70">({days}d)</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-secondary)]">
                    <Clock className="w-3 h-3 text-[var(--saffron-500)]" />
                    <span className="capitalize">{member.shift} Shift</span>
                  </div>
                </div>
              </div>
              {/* Popover Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 bg-surface/95/95 border-r border-b border-[var(--border-default)]"></div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}

// Wrap with React.memo — only re-renders when member data actually changes
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
    prevProps.compact === nextProps.compact
  );
});

SeatTile.displayName = 'SeatTile';

export default SeatTile;
