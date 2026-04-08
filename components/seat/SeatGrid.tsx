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
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 mb-5 md:mb-8 mt-2">
          {/* Shift toggle — elite segmented control */}
          <div className="inline-flex items-center p-1 bg-[#120C07]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[var(--shadow-md)]">
            {shifts.map(s => (
              <button
                key={s.value}
                onClick={() => setShiftFilter(s.value)}
                className={cn(
                  'relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 overflow-hidden outline-none',
                  shiftFilter === s.value
                    ? 'text-[#0D0905] shadow-[0_0_20px_rgba(232,133,58,0.4)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer hover:bg-white/5',
                )}
              >
                {shiftFilter === s.value && (
                  <m.div
                    layoutId="shiftIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-[var(--saffron-400)] to-[var(--saffron-600)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center -mt-0.5">{s.icon}</span>
                <span className="relative z-10">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Quick stats — pill badges */}
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <StatPill label="Occupied" value={stats.occupied} accent="bg-[#22C36A]/10 text-[#22C36A] border-[#22C36A]/30 shadow-[0_2px_8px_rgba(34,195,106,0.15)] ring-1 ring-inset ring-[#22C36A]/20" />
            <StatPill label="Vacant" value={stats.vacant} accent="bg-[var(--bg-surface)] text-[var(--text-tertiary)] border-[var(--border-default)] border-dashed ring-1 ring-inset ring-white/5 opacity-80 hover:opacity-100" />
            {stats.due > 0 && (
              <StatPill label="Due" value={stats.due} accent="bg-[var(--marigold-500)]/15 text-[var(--marigold-400)] border-[var(--marigold-500)]/30 ring-1 ring-inset ring-[var(--marigold-500)]/20 shadow-[0_2px_8px_rgba(245,200,66,0.15)] drop-shadow-[0_0_2px_rgba(245,200,66,0.8)]" />
            )}
            {(stats.expiring + stats.expired) > 0 && (
              <StatPill label="Expiry" value={stats.expiring + stats.expired} accent="bg-[var(--ruby-500)]/15 text-[var(--ruby-400)] border-[var(--ruby-500)]/30 ring-1 ring-inset ring-[var(--ruby-500)]/20 shadow-[0_2px_8px_rgba(232,66,66,0.15)] drop-shadow-[0_0_2px_rgba(232,66,66,0.8)]" />
            )}
          </div>
        </div>

        {/* Legend — enhanced */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 md:gap-6 mb-6 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.15em]">
          {[
            { cls: 'bg-emerald-500/20 shadow-[0_0_8px_rgba(34,195,106,0.3)] ring-1 ring-emerald-500/50', label: 'Active' },
            { cls: 'bg-[var(--saffron-500)]/20 shadow-[0_0_8px_rgba(245,154,60,0.3)] ring-1 ring-[var(--saffron-500)]/50', label: 'Expiring' },
            { cls: 'bg-[var(--ruby-500)]/20 shadow-[0_0_8px_rgba(232,66,66,0.3)] ring-1 ring-[var(--ruby-500)]/50', label: 'Expired' },
            { cls: 'bg-[var(--marigold-500)]/20 shadow-[0_0_8px_rgba(245,200,66,0.3)] ring-1 ring-[var(--marigold-500)]/50', label: 'Fee Due' },
            { cls: 'bg-transparent ring-1 ring-[var(--border-default)] border-dashed opacity-60', label: 'Vacant' },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-2 group">
              <span className={cn('w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-125', l.cls)} />
              <span className="group-hover:text-[var(--text-primary)] transition-colors">{l.label}</span>
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="card-base rounded-[2.5rem] border border-[var(--border-subtle)] bg-[#0a0a0a]/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] backdrop-blur-md overflow-hidden mb-8">
          <div className="flex items-center gap-3 px-7 pt-6 pb-4 border-b border-[var(--border-subtle)] bg-[#120c07]/50">
            <div className="p-2 rounded-xl bg-[var(--saffron-500)]/10 ring-1 ring-[var(--saffron-500)]/20 shadow-[inset_0_0_12px_rgba(232,133,58,0.1)]">
              <Grid3X3 className="w-4 h-4 text-[var(--saffron-500)]" />
            </div>
            <h3 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-tertiary)] drop-shadow-sm tracking-wide">
              {shiftFilter === 'all' ? 'Topography' : `${shiftFilter.charAt(0).toUpperCase() + shiftFilter.slice(1)} Topography`}
            </h3>
            <span className="text-[10px] font-mono tracking-widest font-bold text-[var(--saffron-600)] ml-auto bg-[var(--saffron-500)]/10 px-3 py-1 rounded-full border border-[var(--saffron-500)]/20 shadow-[0_0_10px_rgba(232,133,58,0.05)]">
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
