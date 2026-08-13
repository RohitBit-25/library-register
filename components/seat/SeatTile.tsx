'use client';

import { memo, useState } from 'react';
import { type Member, type SeatStatus } from '@/lib/types';
import { getSeatStatus, firstName, daysUntilExpiry, fmtDateShort, cn } from '@/lib/utils';
import { Sun, Moon, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';

import { type FaceDir } from './SeatMap';
import SeatAvatar from './SeatAvatar';

interface SeatTileProps {
  member: Member;
  onClick: (seat: number) => void;
  compact?: boolean;
  face?: FaceDir;
  selected?: boolean;
}

// Flat, Light-Mode Optimized States
const tileClass: Record<SeatStatus, string> = {
  active: 'bg-white border-[var(--border-default)] hover:border-[var(--emerald-400)] hover:bg-[var(--emerald-50)] text-[var(--text-primary)] shadow-sm',
  expiring: 'bg-[var(--saffron-50)] border-[var(--saffron-200)] hover:border-[var(--saffron-400)] text-[var(--saffron-800)] shadow-sm',
  expired: 'bg-[var(--ruby-50)] border-[var(--ruby-200)] hover:border-[var(--ruby-400)] text-[var(--ruby-800)] shadow-sm',
  due: 'bg-[var(--marigold-50)] border-[var(--marigold-200)] hover:border-[var(--marigold-400)] text-[var(--marigold-800)] shadow-sm',
  vacant: 'bg-[var(--bg-muted)] border-[var(--border-default)] border-dashed opacity-70 hover:opacity-100 hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]',
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
  
  let totalDays = 30;
  if (!member.vacant && member.duration) {
    if (member.duration === '1M') totalDays = 30;
    else if (member.duration === '3M') totalDays = 90;
    else if (member.duration === '6M') totalDays = 180;
    else if (member.duration === '1Y') totalDays = 365;
  }
  
  const progressPercent = Math.max(0, Math.min(100, (days / totalDays) * 100));
  const dashoffset = circumference - (progressPercent / 100) * circumference;
  
  let ringStroke = 'stroke-[var(--emerald-500)]'; 
  if (status === 'expiring') ringStroke = 'stroke-[var(--saffron-500)]';
  if (status === 'expired' || status === 'due') ringStroke = 'stroke-[var(--ruby-500)]';

  return (
    <LazyMotion features={domAnimation}>
      <div 
        className="relative group w-full h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          onClick={() => onClick(member.seat)}
          data-seat={member.seat}
          className={cn(
            'relative flex flex-col items-center justify-between rounded-lg transition-ui duration-200 cursor-pointer z-10 w-full h-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)] focus-visible:ring-offset-2',
            tileClass[status],
            compact ? 'px-[3px] py-[3px]' : 'p-1.5',
            selected ? 'ring-2 ring-[var(--saffron-500)] z-20 border-[var(--saffron-500)]' : ''
          )}
          aria-label={ariaLabel}
        >
          {/* Flat Status Edge Indicator */}
          {face && !member.vacant && (
            <div className={cn(
              "absolute transition-colors duration-200",
              status === 'active' ? 'bg-[var(--emerald-500)]' : 
              status === 'expiring' ? 'bg-[var(--saffron-500)]' : 
              status === 'due' ? 'bg-[var(--marigold-500)]' :
              'bg-[var(--ruby-500)]',
              face === 'up' && "bottom-0 left-0 right-0 h-1 rounded-b-md",
              face === 'down' && "top-0 left-0 right-0 h-1 rounded-t-md",
              face === 'left' && "right-0 top-0 bottom-0 w-1 rounded-r-md",
              face === 'right' && "left-0 top-0 bottom-0 w-1 rounded-l-md"
            )} />
          )}

          {!member.vacant && (
            <svg className="absolute inset-0 w-full h-full -rotate-90 opacity-60">
              <circle
                cx="50%"
                cy="50%"
                r={ringRadius}
                fill="transparent"
                className="stroke-[var(--border-strong)]"
                strokeWidth="2"
              />
              {status !== 'expired' && (
                 <circle
                  cx="50%"
                  cy="50%"
                  r={ringRadius}
                  fill="transparent"
                  className={ringStroke}
                  strokeWidth="2"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashoffset}
                />
              )}
            </svg>
          )}

          <span className={cn(
            'font-mono font-bold self-start leading-none z-10 opacity-70 pl-0.5 pt-0.5 tracking-wider',
            compact ? 'text-[9.5px]' : 'text-xs',
            member.vacant ? 'text-[var(--text-secondary)]' : 'text-inherit'
          )}>
            {String(member.seat).padStart(2, '0')}
          </span>

          {member.vacant ? (
            <Plus className={cn('opacity-40 z-10 mt-0.5 transition-opacity group-hover:opacity-100 group-hover:text-[var(--saffron-600)]', compact ? 'w-4 h-4' : 'w-5 h-5')} />
          ) : (
            <div className="flex flex-col items-center justify-center z-10 w-full overflow-hidden">
              <div 
                className={cn("transition-transform group-hover:scale-105", compact ? "mb-0.5" : "mb-1")}
              >
                <SeatAvatar
                  name={member.name}
                  seat={member.seat}
                  size={compact ? 32 : 44}
                />
              </div>
              <span className={cn(
                'font-bold w-full text-center tracking-tight overflow-hidden text-ellipsis whitespace-nowrap px-0.5',
                compact ? 'text-[9px] leading-tight pb-0.5' : 'text-[11px] leading-normal pb-0.5',
              )}>
                {firstName(member.name)}
              </span>
            </div>
          )}

          <div className={cn('flex items-center justify-center w-full gap-0.5 z-10 font-bold', compact ? 'text-[9.5px] leading-none mb-0.5' : 'text-[10px] leading-none mb-0.5')}>
            {member.vacant ? (
              <span className="font-semibold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity text-[var(--saffron-600)]">Add</span>
            ) : (
              <>
                <span className="opacity-70">{shiftIcon}</span>
                {status === 'expiring' && (
                  <span className="text-[var(--saffron-700)] ml-0.5">{days}d</span>
                )}
                {status === 'expired' && (
                  <span className="text-[var(--ruby-700)] ml-0.5">{-days}d</span>
                )}
              </>
            )}
          </div>
        </button>

        {/* Clean Light Popover */}
        <AnimatePresence>
          {isHovered && !member.vacant && (
            <m.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-lg z-50 pointer-events-none"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] tracking-wide">{member.name}</h4>
                    <p className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">#{String(member.seat).padStart(2, '0')} • {member.phone || 'No phone'}</p>
                  </div>
                  <div className={cn('w-2 h-2 rounded-full mt-1', status === 'active' ? 'bg-[var(--emerald-500)]' : status === 'expiring' ? 'bg-[var(--saffron-500)]' : 'bg-[var(--ruby-500)]')} />
                </div>
                
                <div className="pt-2 border-t border-[var(--border-default)] flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-secondary)]">
                    <CalendarIcon className="w-3 h-3 text-[var(--text-tertiary)]" />
                    <span>Due: <span className="text-[var(--text-primary)]">{fmtDateShort(member.expiry)}</span> <span className="opacity-70">({days}d)</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-secondary)]">
                    <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
                    <span className="capitalize text-[var(--text-primary)]">{member.shift} Shift</span>
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