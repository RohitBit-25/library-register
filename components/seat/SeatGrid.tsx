'use client';

import { useState, useMemo, useCallback } from 'react';
import { type Member, type Shift } from '@/lib/types';
import { getSeatStatus, cn } from '@/lib/utils';
import SeatTile from './SeatTile';
import { SeatMapContainer, SeatMapWrapper } from './SeatMap';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Layers, Grid3X3 } from 'lucide-react';

interface SeatGridProps {
  members: Member[];
  onSeatClick: (seat: number) => void;
}

export default function SeatGrid({ members, onSeatClick }: SeatGridProps) {
  const [shiftFilter, setShiftFilter] = useState<Shift | 'all'>('all');

  // Stable callback for tile clicks
  const handleSeatClick = useCallback((seat: number) => {
    onSeatClick(seat);
  }, [onSeatClick]);

  const filtered = useMemo(() => {
    if (shiftFilter === 'all') return members;
    return members.filter(m => {
      if (m.vacant) return true;
      return m.shift === shiftFilter || m.shift === 'full';
    });
  }, [members, shiftFilter]);

  // Quick stats
  const stats = useMemo(() => {
    let occupied = 0, vacant = 0, due = 0, expiring = 0, expired = 0;
    for (const m of members) {
      if (m.vacant) { vacant++; continue; }
      occupied++;
      const status = getSeatStatus(m);
      if (status === 'due') due++;
      if (status === 'expiring') expiring++;
      if (status === 'expired') expired++;
    }
    return { occupied, vacant, due, expiring, expired };
  }, [members]);

  const shifts: { value: Shift | 'all'; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <Layers className="w-3.5 h-3.5" /> },
    { value: 'morning', label: 'Morning', icon: <Sun className="w-3.5 h-3.5" /> },
    { value: 'evening', label: 'Evening', icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  return (
    <LazyMotion features={domAnimation}>
      <div>
        {/* Controls bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          {/* Shift toggle — pill style */}
          <div className="flex items-center gap-1 bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark rounded-xl p-1 shadow-sm">
            {shifts.map(s => (
              <button
                key={s.value}
                onClick={() => setShiftFilter(s.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer',
                  shiftFilter === s.value
                    ? 'bg-[var(--saffron-500)] text-[#1a1a16] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]',
                )}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>

          {/* Quick stats — pill badges */}
          <div className="flex flex-wrap items-center gap-2">
            <StatPill label="Occupied" value={stats.occupied} accent="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" />
            <StatPill label="Vacant" value={stats.vacant} accent="bg-surface dark:bg-surface-dark text-text-secondary dark:text-text-secondary-dark border-card-border dark:border-card-border-dark border-dashed" />
            {stats.due > 0 && (
              <StatPill label="Due" value={stats.due} accent="bg-saffron-500/10 text-saffron-800 dark:text-saffron-300 border-saffron-500/30" />
            )}
            {(stats.expiring + stats.expired) > 0 && (
              <StatPill label="Expiry" value={stats.expiring + stats.expired} accent="bg-ruby-500/10 text-ruby-700 dark:text-ruby-300 border-ruby-500/30" />
            )}
          </div>
        </div>

        {/* Legend — enhanced */}
        <div className="flex flex-wrap items-center gap-3 mb-4 text-[11px] font-bold text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
          {[
            { cls: 'bg-emerald-500/20 ring-emerald-500/50', label: 'Active' },
            { cls: 'bg-amber-500/20 ring-amber-500/50', label: 'Expiring' },
            { cls: 'bg-ruby-500/20 ring-ruby-500/50', label: 'Expired' },
            { cls: 'bg-saffron-500/20 ring-saffron-500/50', label: 'Fee Due' },
            { cls: 'bg-surface dark:bg-surface-dark ring-card-border/50 border-dashed', label: 'Vacant' },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={cn('w-3 h-3 rounded-md ring-2', l.cls)} />
              {l.label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="card-base rounded-[2.5rem] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] overflow-hidden mb-8">
          <div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-[var(--border-subtle)]">
            <Grid3X3 className="w-4 h-4 text-[var(--saffron-500)]" />
            <h3 className="text-sm font-black text-text-primary dark:text-text-primary-dark">
              {shiftFilter === 'all' ? 'Floorplan Map' : `${shiftFilter.charAt(0).toUpperCase() + shiftFilter.slice(1)} Shift Mapping`}
            </h3>
            <span className="text-xs font-mono font-bold text-text-tertiary ml-auto">
              {(shiftFilter === 'all' ? members : filtered).length} seats shown
            </span>
          </div>

          <SeatMapContainer>
            <AnimatePresence mode="popLayout">
              {(shiftFilter === 'all' ? members : filtered).map(member => (
                <SeatMapWrapper key={member.seat} seatNum={member.seat}>
                  {(face) => (
                    <m.div
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="w-full h-full"
                    >
                      <SeatTile
                        member={member}
                        onClick={handleSeatClick}
                        compact={true}
                        face={face}
                      />
                    </m.div>
                  )}
                </SeatMapWrapper>
              ))}
            </AnimatePresence>
          </SeatMapContainer>
        </div>
      </div>
    </LazyMotion>
  );
}

// ─── StatPill ────────────────────────────────────

function StatPill({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold shadow-sm',
      accent
    )}>
      <span className="text-base font-black">{value}</span>
      {label}
    </span>
  );
}
