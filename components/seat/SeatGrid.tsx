'use client';

import { useState, useMemo } from 'react';
import { type Member, type Shift } from '@/lib/types';
import { getSeatStatus, cn } from '@/lib/utils';
import SeatTile from './SeatTile';

interface SeatGridProps {
  members: Member[];
  onSeatClick: (seat: number) => void;
}

export default function SeatGrid({ members, onSeatClick }: SeatGridProps) {
  const [shiftFilter, setShiftFilter] = useState<Shift | 'all'>('all');

  const filtered = useMemo(() => {
    if (shiftFilter === 'all') return members;
    return members.map(m => {
      if (m.vacant) return m;
      if (m.shift === shiftFilter || m.shift === 'full') return m;
      // hide non-matching — show as dimmed vacant-like
      return m;
    }).filter(m => {
      if (m.vacant) return true;
      return m.shift === shiftFilter || m.shift === 'full';
    });
  }, [members, shiftFilter]);

  // Quick stats
  const stats = useMemo(() => {
    let occupied = 0, vacant = 0, due = 0, expiring = 0;
    for (const m of members) {
      if (m.vacant) { vacant++; continue; }
      occupied++;
      const status = getSeatStatus(m);
      if (status === 'due') due++;
      if (status === 'expiring') expiring++;
    }
    return { occupied, vacant, due, expiring };
  }, [members]);

  const shifts: { value: Shift | 'all'; label: string }[] = [
    { value: 'morning', label: 'Morning' },
    { value: 'evening', label: 'Evening' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div>
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        {/* Shift toggle */}
        <div className="flex items-center gap-1 bg-bg dark:bg-bg-dark rounded-lg p-1">
          {shifts.map(s => (
            <button
              key={s.value}
              onClick={() => setShiftFilter(s.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer',
                shiftFilter === s.value
                  ? 'bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm'
                  : 'text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Quick stats */}
        <p className="text-xs text-text-secondary dark:text-text-secondary-dark font-medium">
          <span className="text-text-primary dark:text-text-primary-dark font-semibold">{stats.occupied}</span> occupied
          <span className="mx-1.5 opacity-40">·</span>
          <span className="text-text-primary dark:text-text-primary-dark font-semibold">{stats.vacant}</span> vacant
          {stats.due > 0 && (
            <>
              <span className="mx-1.5 opacity-40">·</span>
              <span className="text-due-text dark:text-due-text-dark font-semibold">{stats.due}</span> due
            </>
          )}
          {stats.expiring > 0 && (
            <>
              <span className="mx-1.5 opacity-40">·</span>
              <span className="text-expiring-text dark:text-expiring-text-dark font-semibold">{stats.expiring}</span> expiring
            </>
          )}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-[11px] font-medium text-text-secondary dark:text-text-secondary-dark">
        {[
          { cls: 'bg-active-fill dark:bg-active-fill-dark border-active-border', label: 'Active' },
          { cls: 'bg-expiring-fill dark:bg-expiring-fill-dark border-expiring-border', label: 'Expiring' },
          { cls: 'bg-expired-fill dark:bg-expired-fill-dark border-expired-border', label: 'Expired' },
          { cls: 'bg-due-fill dark:bg-due-fill-dark border-due-border', label: 'Fee Due' },
          { cls: 'bg-vacant-fill dark:bg-vacant-fill-dark border-vacant-border dark:border-vacant-border-dark', label: 'Vacant' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={cn('w-3 h-3 rounded border-2', l.cls)} />
            {l.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2 sm:gap-2.5 justify-items-center">
        {(shiftFilter === 'all' ? members : filtered).map(m => (
          <SeatTile
            key={m.seat}
            member={m}
            onClick={onSeatClick}
            compact={false}
          />
        ))}
      </div>
    </div>
  );
}
