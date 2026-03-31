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
}

const tileClass: Record<SeatStatus, string> = {
  active: 'tile-active backdrop-blur-md bg-white/40 dark:bg-black/30',
  expiring: 'tile-expiring backdrop-blur-md bg-white/40 dark:bg-black/30',
  expired: 'tile-expired backdrop-blur-md bg-red-50/50 dark:bg-red-900/10',
  due: 'tile-due backdrop-blur-md bg-yellow-50/50 dark:bg-yellow-900/10',
  vacant: 'tile-vacant backdrop-blur-md bg-white/20 dark:bg-black/20',
};

function SeatTileInner({ member, onClick, compact = false, face }: SeatTileProps) {
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
  
  let ringStroke = 'stroke-green-400 dark:stroke-green-500';
  if (status === 'expiring') ringStroke = 'stroke-yellow-400 dark:stroke-yellow-500';
  if (status === 'expired' || status === 'due') ringStroke = 'stroke-red-400 dark:stroke-red-500';

  return (
    <LazyMotion features={domAnimation}>
      <div 
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <m.button
          onClick={() => onClick(member.seat)}
          whileHover={{ scale: 1.06, y: -3 }}
          whileTap={{ scale: 0.93 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
          }}
          className={cn(
            'relative flex flex-col items-center justify-between rounded-xl border transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:ring-2 hover:ring-blue-accent/20 z-10',
            tileClass[status],
            compact ? 'w-[50px] h-[50px] p-1' : 'w-[74px] h-[74px] p-2',
          )}
          aria-label={ariaLabel}
        >
          {/* Chair indicator (relative to the face direction) */}
          {face && (
            <div className={cn(
              "absolute rounded-full transition-colors",
              status === 'vacant' ? 'bg-vacant-border/50 dark:bg-vacant-border-dark/50' : 
              status === 'active' ? 'bg-green-400 dark:bg-green-500 shadow-sm border border-green-500/30' : 
              status === 'expiring' ? 'bg-yellow-400 dark:bg-yellow-500 shadow-sm border border-yellow-500/30' : 
              'bg-red-400 dark:bg-red-500 shadow-sm border border-red-500/30',
              face === 'up' && "bottom-[-6px] left-[15%] right-[15%] h-[4px]",
              face === 'down' && "top-[-6px] left-[15%] right-[15%] h-[4px]",
              face === 'left' && "right-[-6px] top-[15%] bottom-[15%] w-[4px]",
              face === 'right' && "left-[-6px] top-[15%] bottom-[15%] w-[4px]"
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
                className="stroke-card-border dark:stroke-card-border-dark"
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
            'font-mono font-bold self-start leading-none z-10 drop-shadow-sm',
            compact ? 'text-[10px]' : 'text-xs',
          )}>
            {String(member.seat).padStart(2, '0')}
          </span>

          {/* Name or + icon */}
          {member.vacant ? (
            <Plus className={cn('opacity-60 z-10', compact ? 'w-4 h-4' : 'w-5 h-5')} />
          ) : (
            <span className={cn(
              'font-black truncate w-full text-center leading-tight z-10 text-opacity-90',
              compact ? 'text-[9px]' : 'text-[11px]',
            )}>
              {firstName(member.name)}
            </span>
          )}

          {/* Shift icon or days info */}
          <div className={cn('flex items-center gap-0.5 z-10 font-bold', compact ? 'text-[8px]' : 'text-[9px]')}>
            {member.vacant ? (
              <span className="font-medium opacity-60">Add</span>
            ) : (
              <>
                {shiftIcon}
                {status === 'expiring' && (
                  <span className="text-yellow-600 dark:text-yellow-400 ml-0.5">{days}d</span>
                )}
                {status === 'expired' && (
                  <span className="text-red-600 dark:text-red-400 ml-0.5">{-days}d</span>
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
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white dark:border-[#121212] shadow-sm z-20" 
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
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 rounded-xl bg-surface/95 dark:bg-surface-dark/95 backdrop-blur-xl border border-card-border dark:border-card-border-dark shadow-2xl z-50 pointer-events-none"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-black text-text-primary dark:text-text-primary-dark">{member.name}</h4>
                    <p className="text-[10px] text-text-tertiary font-mono">#{String(member.seat).padStart(2, '0')} • {member.phone || 'No phone'}</p>
                  </div>
                  <div className={cn('w-2 h-2 rounded-full mt-1', status === 'active' ? 'bg-green-500' : status === 'expiring' ? 'bg-yellow-500' : 'bg-red-500')} />
                </div>
                
                <div className="pt-1.5 border-t border-card-border/50 dark:border-card-border-dark/50 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-text-secondary">
                    <CalendarIcon className="w-3 h-3 text-blue-accent" />
                    <span>Due: {fmtDateShort(member.expiry)} <span className="opacity-70">({days}d)</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-text-secondary">
                    <Clock className="w-3 h-3 text-blue-accent" />
                    <span className="capitalize">{member.shift} Shift</span>
                  </div>
                </div>
              </div>
              {/* Popover Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 bg-surface/95 dark:bg-surface-dark/95 border-r border-b border-card-border dark:border-card-border-dark"></div>
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
