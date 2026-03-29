'use client';

import { type Member, type SeatStatus } from '@/lib/types';
import { getSeatStatus, firstName, daysUntilExpiry, cn } from '@/lib/utils';
import { Sun, Moon, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface SeatTileProps {
  member: Member;
  onClick: (seat: number) => void;
  compact?: boolean;
}

const tileClass: Record<SeatStatus, string> = {
  active: 'tile-active',
  expiring: 'tile-expiring',
  expired: 'tile-expired',
  due: 'tile-due',
  vacant: 'tile-vacant',
};

export default function SeatTile({ member, onClick, compact = false }: SeatTileProps) {
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

  return (
    <motion.button
      onClick={() => onClick(member.seat)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
      }}
      className={cn(
        'relative flex flex-col items-center justify-between rounded-lg border-2 transition-colors duration-200 cursor-pointer',
        'hover:shadow-lg',
        tileClass[status],
        compact ? 'w-[56px] h-[56px] p-1' : 'w-[72px] h-[72px] p-1.5',
      )}
      aria-label={ariaLabel}
    >
      {/* Seat number */}
      <span className={cn(
        'font-mono font-medium self-start leading-none',
        compact ? 'text-[10px]' : 'text-xs',
      )}>
        {String(member.seat).padStart(2, '0')}
      </span>

      {/* Name or + icon */}
      {member.vacant ? (
        <Plus className={cn('opacity-60', compact ? 'w-4 h-4' : 'w-5 h-5')} />
      ) : (
        <span className={cn(
          'font-medium truncate w-full text-center leading-tight',
          compact ? 'text-[9px]' : 'text-[11px]',
        )}>
          {firstName(member.name)}
        </span>
      )}

      {/* Shift icon or days info */}
      <div className={cn('flex items-center gap-0.5', compact ? 'text-[8px]' : 'text-[9px]')}>
        {member.vacant ? (
          <span className="font-medium opacity-60">Add</span>
        ) : (
          <>
            {shiftIcon}
            {status === 'expiring' && (
              <span className="font-medium ml-0.5">{days}d</span>
            )}
            {status === 'expired' && (
              <span className="font-medium ml-0.5">{Math.abs(days)}d</span>
            )}
          </>
        )}
      </div>

      {/* Warning indicator for due/expired */}
      {(status === 'due' || status === 'expired') && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-expired-border border-2 border-surface dark:border-surface-dark" 
        />
      )}
    </motion.button>
  );
}
