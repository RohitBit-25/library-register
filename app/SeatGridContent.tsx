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
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[var(--saffron-500)] mb-1">
              <LayoutDashboard size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Management Floor</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Library Workspace
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] max-w-sm">
              Real-time seating overview. Select a node to manage membership or status.
            </p>
          </div>

          {/* Quick Stats Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <StatChip label="Occupied" value={stats.occupied} color="bg-[var(--saffron-500)] text-[#1a1a16] border-[var(--saffron-500)]" />
            <StatChip label="Available" value={stats.vacant} color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" />
            <div className="h-8 w-px bg-[var(--border-subtle)] mx-2" />
            <GlobalSearch onSelect={seat => setSelectedSeat(seat)} className="w-[240px]" />
          </div>
        </header>

        {/* --- SEATING CANVAS --- */}
        <section className="relative rounded-[2.5rem] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] backdrop-blur-md p-6 md:p-10 shadow-[var(--shadow-xl)] mb-8">
          {isLoading ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
              {Array.from({ length: 40 }).map((_, i) => (
                <SeatSkeleton key={i} />
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <SeatGrid
                members={members}
                onSeatClick={seat => setSelectedSeat(seat)}
                selectedSeat={selectedSeat}
              />
            </motion.div>
          )}

          {/* Legend Overlay */}
          <div className="mt-8 flex items-center justify-center gap-6 text-[10px] font-medium uppercase tracking-widest text-white/30">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white/10" /> Vacant</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--saffron-500)] shadow-[0_0_8px_var(--saffron-500)]" /> Occupied</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> Payment Due</div>
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
function StatChip({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className={cn("flex items-center gap-2 px-3.5 py-2 rounded-xl border whitespace-nowrap shadow-sm font-bold", color)}>
      <span className="text-[10px] uppercase tracking-wider opacity-80">{label}:</span>
      <span className="text-sm font-black">{value}</span>
    </div>
  );
}