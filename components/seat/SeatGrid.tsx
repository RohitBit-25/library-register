'use client';

import { useState, useMemo, useCallback } from 'react';
import { type Member, type Shift } from '@/lib/types';
import { cn } from '@/lib/utils';
import SeatTile from './SeatTile';
import { SeatMapContainer, SeatMapWrapper, type FaceDir } from './SeatMap';
import { LazyMotion, domAnimation } from 'framer-motion';
import { Sun, Moon, Layers, Grid3X3 } from 'lucide-react';

interface SeatGridProps {
  members: Member[];
  onSeatClick: (seat: number) => void;
  selectedSeat?: number | null;
}

export default function SeatGrid({ members, onSeatClick, selectedSeat }: SeatGridProps) {
  const [shiftFilter, setShiftFilter] = useState<Shift | 'all'>('all');

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

  const shifts: { value: Shift | 'all'; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <Layers className="w-3.5 h-3.5" /> },
    { value: 'morning', label: 'Morning', icon: <Sun className="w-3.5 h-3.5" /> },
    { value: 'evening', label: 'Evening', icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  return (
    <LazyMotion features={domAnimation}>
      <div className="w-full">
        {/* Grid Container */}
        <div className="rounded-xl bg-[var(--bg-surface)] overflow-hidden relative shadow-sm">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-[var(--border-default)] bg-[var(--bg-muted)]/30">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-[var(--saffron-50)] border border-[var(--saffron-200)]">
                <Grid3X3 className="w-4 h-4 text-[var(--saffron-600)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {shiftFilter === 'all' ? 'Floor Plan' : `${shiftFilter.charAt(0).toUpperCase() + shiftFilter.slice(1)} Shift`}
              </h3>
              <span className="text-[10px] font-mono tracking-[0.2em] font-bold text-[var(--saffron-700)] bg-[var(--saffron-50)] px-3 py-1 rounded-md border border-[var(--saffron-200)]">
                {(shiftFilter === 'all' ? members : filtered).length} SEATS
              </span>
            </div>

            {/* Shift Filters */}
            <div className="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-1 shadow-sm shrink-0">
              {shifts.map(s => (
                <button
                  key={s.value}
                  onClick={() => setShiftFilter(s.value)}
                  className={cn(
                    'flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)]',
                    shiftFilter === s.value
                      ? 'bg-[var(--saffron-500)] text-[#1a1a16] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]',
                  )}
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <SeatMapContainer>
            {(shiftFilter === 'all' ? members : filtered).map(member => (
              <SeatMapWrapper key={member.seat} seatNum={member.seat}>
                {(face: FaceDir) => (
                  <div className="w-full h-full animate-in fade-in zoom-in duration-300">
                    <SeatTile
                      member={member}
                      onClick={handleSeatClick}
                      compact={true}
                      face={face}
                      selected={selectedSeat === member.seat}
                    />
                  </div>
                )}
              </SeatMapWrapper>
            ))}
          </SeatMapContainer>
        </div>
      </div>
    </LazyMotion>
  );
}
