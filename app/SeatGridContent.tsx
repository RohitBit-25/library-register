'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/hooks/useToast';
import SeatGrid from '@/components/seat/SeatGrid';
import SeatDetailPanel from '@/components/seat/SeatDetailPanel';
import AddMemberSheet from '@/components/seat/AddMemberSheet';
import GlobalSearch from '@/components/ui/GlobalSearch';
import { SeatSkeleton } from '@/components/ui/Skeleton';
import { type Duration, type Member } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, UserPlus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SeatGridContent() {
  const { members, update, vacate, renew, add, isLoading } = useMembers();
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const searchParams = useSearchParams();

  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Stats calculation for the header
  const stats = useMemo(() => {
    const total = members.length;
    const occupied = members.filter(m => !m.vacant).length;
    return { total, occupied, vacant: total - occupied };
  }, [members]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const selectedMember = selectedSeat !== null
    ? members.find(m => m.seat === selectedSeat) || null
    : null;

  // Handlers (kept same logic, wrapped in cleaner visual feedback)
  const handleMarkPaid = (seat: number) => {
    update(seat, { fee: 'paid' });
    addToast('success', `Payment confirmed for Seat ${seat}`);
  };

  const handleMarkDue = (seat: number) => {
    update(seat, { fee: 'due' });
    addToast('warning', `Seat ${seat} marked as pending payment`);
  };

  const handleRenew = (seat: number, joinDate: string, duration: Duration) => {
    renew(seat, joinDate, duration as '1M' | '3M' | '6M' | '1Y');
    addToast('success', `Membership extended for Seat ${seat}`);
  };

  const handleRemove = (seat: number) => {
    vacate(seat);
    addToast('success', `Seat ${seat} is now vacant`);
  };

  const handleAddSubmit = async (seat: number, data: Omit<Member, 'seat' | 'vacant'>) => {
    const success = await add(seat, data);
    if (success) {
      addToast('success', `Allotted Seat ${seat} to ${data.name}`);
      setSelectedSeat(null);
    }
  };

  const vacantSeats = useMemo(() => members.filter(m => m.vacant).map(m => m.seat), [members]);

  return (
    <div className="relative min-h-screen">
      <div className={cn(
        "transition-all duration-500 ease-in-out px-4 py-6 md:px-8 lg:px-12",
        selectedSeat !== null && !isMobile ? 'pr-[380px]' : ''
      )}>
        
        {/* --- DYNAMIC HEADER --- */}
        <header className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <div className="space-y-2">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-[var(--saffron-400)] mb-2"
            >
              <LayoutDashboard size={14} className="drop-shadow-[0_0_8px_var(--saffron-500)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] bg-clip-text text-transparent bg-gradient-to-r from-[var(--saffron-300)] to-[var(--saffron-600)]">
                Management Quarters
              </span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-[#F5E8D4] to-[#C4A882] drop-shadow-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              The Reading Hall
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm md:text-base text-[var(--text-secondary)] font-light max-w-md leading-relaxed"
            >
              Real-time spatial overview. Select a coordinate to orchestrate membership or review active occupancies.
            </motion.p>
          </div>

          {/* Quick Stats Chips */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 overflow-x-auto pb-4 xl:pb-0 scrollbar-hide pt-2"
          >
            <StatChip 
              label="Occupied" 
              value={stats.occupied} 
              icon={<Users size={14} />}
              color="bg-[var(--saffron-500)] text-[#0D0905] shadow-[0_0_20px_rgba(232,133,58,0.3)] border-transparent" 
            />
            <StatChip 
              label="Available" 
              value={stats.vacant} 
              icon={<UserPlus size={14} />}
              color="bg-white/5 text-[var(--emerald-400)] border-[var(--emerald-400)]/20 shadow-[0_0_15px_rgba(34,195,106,0.05)] backdrop-blur-md" 
            />
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-[var(--border-strong)] to-transparent mx-2" />
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--saffron-500)] to-[#C8900E] rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <GlobalSearch onSelect={seat => setSelectedSeat(seat)} className="relative w-[260px]" />
            </div>
          </motion.div>
        </header>

        {/* --- SEATING CANVAS --- */}
        <section className="relative rounded-[2.5rem] border border-[var(--border-subtle)] bg-[#120C07]/60 backdrop-blur-2xl p-6 md:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] mb-8 overflow-hidden">
          {/* Elite Ambient Glows */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--saffron-500)]/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[var(--marigold-500)]/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.015%22/%3E%3C/svg%3E')] pointer-events-none mix-blend-overlay"></div>
          
          <div className="relative z-10">
            {isLoading ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-5">
                {Array.from({ length: 40 }).map((_, i) => (
                  <SeatSkeleton key={i} />
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <SeatGrid
                  members={members}
                  onSeatClick={seat => setSelectedSeat(seat)}
                  selectedSeat={selectedSeat}
                />
              </motion.div>
            )}
          </div>

          {/* Legend Overlay */}
          <div className="mt-12 flex items-center justify-center gap-8 text-[11px] font-medium uppercase tracking-[0.2em] text-[#C4A882]/70 relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/20 ring-4 ring-white/5" /> 
              <span>Vacant</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--saffron-400)] shadow-[0_0_12px_var(--saffron-500)] ring-4 ring-[var(--saffron-500)]/20" /> 
              <span className="text-[var(--saffron-100)]">Occupied</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ruby-500)] shadow-[0_0_12px_var(--ruby-500)] ring-4 ring-[var(--ruby-500)]/20" /> 
              <span className="text-[var(--ruby-100)]">Action Req</span>
            </div>
          </div>
        </section>
      </div>

      {/* --- FLOATING DETAILS PANEL (THE SLIDE-OVER) --- */}
      <AnimatePresence>
        {selectedSeat !== null && (
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed inset-y-0 right-0 z-[100] w-full lg:w-[380px] bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-[-30px_0_60px_rgba(0,0,0,0.4)]"
          >
            {/* Backdrop for mobile covered by BottomSheet, for Desktop we just slide the side panel. If we want a backdrop on mobile, BottomSheet handles it. For desktop, the user can click other seats so no backdrop needed. */}
            {!isAdmin ? (
              <SeatDetailPanel
                member={selectedMember}
                open={true}
                onClose={() => setSelectedSeat(null)}
                onMarkPaid={handleMarkPaid}
                onMarkDue={handleMarkDue}
                onRenew={handleRenew}
                onRemove={handleRemove}
                isMobile={isMobile}
                readonly={true}
              />
            ) : selectedMember?.vacant ? (
              <AddMemberSheet
                open={true}
                onClose={() => setSelectedSeat(null)}
                seat={selectedSeat}
                vacantSeats={vacantSeats}
                onSubmit={handleAddSubmit}
                isMobile={isMobile}
              />
            ) : (
              <SeatDetailPanel
                member={selectedMember}
                open={true}
                onClose={() => setSelectedSeat(null)}
                onMarkPaid={handleMarkPaid}
                onMarkDue={handleMarkDue}
                onRenew={handleRenew}
                onRemove={handleRemove}
                isMobile={isMobile}
              />
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component for clean stats
function StatChip({ label, value, color, icon }: { label: string, value: number, color: string, icon?: React.ReactNode }) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-2.5 rounded-2xl border whitespace-nowrap font-medium transition-all duration-300 hover:scale-[1.02]", color)}>
      {icon && <div className="opacity-90">{icon}</div>}
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-[0.15em] opacity-70 leading-none mb-1">{label}</span>
        <span className="text-sm font-bold leading-none">{value}</span>
      </div>
    </div>
  );
}