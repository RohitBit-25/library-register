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
  selectedSeat?: number | null;
}

export default function SeatGrid({ members, onSeatClick, selectedSeat }: SeatGridProps) {
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
          <div className="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-1 shadow-sm">
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
            <StatPill label="Vacant" value={stats.vacant} accent="bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] border-dashed" />
            {stats.due > 0 && (
              <StatPill label="Due" value={stats.due} accent="bg-saffron-500/10 text-saffron-800 dark:text-saffron-300 border-saffron-500/30" />
            )}
            {(stats.expiring + stats.expired) > 0 && (
              <StatPill label="Expiry" value={stats.expiring + stats.expired} accent="bg-ruby-500/10 text-ruby-700 dark:text-ruby-300 border-ruby-500/30" />
            )}
          </div>
        </div>

        {/* Legend — enhanced */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 md:gap-7 mb-7 text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">
  {[
    { cls: 'bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.5)]', label: 'Active' },
    { cls: 'bg-[#fbbf24] shadow-[0_0_10px_rgba(251,191,36,0.5)]', label: 'Expiring' },
    { cls: 'bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.5)]', label: 'Expired' },
    { cls: 'bg-[#f5c842] shadow-[0_0_10px_rgba(245,200,66,0.5)]', label: 'Fee Due' },
    { cls: 'bg-transparent ring-1 ring-white/20 border-dashed opacity-60', label: 'Vacant' },
  ].map(l => (
    <span key={l.label} className="flex items-center gap-2 group">
      <span className={cn('w-2 h-2 rounded-full transition-transform group-hover:scale-150', l.cls)} />
      <span className="group-hover:text-white transition-colors">{l.label}</span>
    </span>
  ))}
</div>

        {/* Grid */}
        <div className="rounded-[3rem] glass-elite overflow-hidden mb-8 relative">
  {/* Add a subtle highlight to the top edge */}
  <div className="absolute top-0 left-0 right-0 h-px bg-[var(--gradient-glass)]"></div>
  
  <div className="flex items-center gap-4 px-8 pt-7 pb-5 border-b border-[var(--border-default)] bg-[var(--bg-elevated)]/30 backdrop-blur-md">
    <div className="p-2.5 rounded-2xl bg-[var(--saffron-500)]/10 ring-1 ring-[var(--saffron-500)]/20 shadow-[inset_0_0_20px_rgba(232,133,58,0.1),0_0_15px_rgba(232,133,58,0.1)]">
      <Grid3X3 className="w-4 h-4 text-[var(--saffron-500)] drop-shadow-[0_0_5px_rgba(232,133,58,0.8)]" />
    </div>
    <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-wider">
      {shiftFilter === 'all' ? 'Topography' : `${shiftFilter.charAt(0).toUpperCase() + shiftFilter.slice(1)} Topography`}
    </h3>
    <span className="text-[10px] font-mono tracking-[0.3em] font-black text-[var(--saffron-400)] ml-auto bg-[var(--saffron-500)]/5 px-4 py-1.5 rounded-full border border-[var(--saffron-500)]/20 shadow-[0_0_15px_rgba(232,133,58,0.15)] glow-saffron-chill">
      {(shiftFilter === 'all' ? members : filtered).length} SEATS
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
                        selected={selectedSeat === member.seat}
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
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_2px_10px_rgba(0,0,0,0.2)] backdrop-blur-sm',
      accent
    )}>
      <span className="text-[13px] font-black tracking-normal opacity-90">{value}</span>
      {label}
    </span>
  );
}
