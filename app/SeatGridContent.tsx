'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { LayoutDashboard, Users, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

export default function SeatGridContent() {
  const { members, update, vacate, renew, add, isLoading } = useMembers();
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const searchParams = useSearchParams();

  const [selectedSeat, setSelectedSeat] = useState<number | null>(() => {
    const seatParam = searchParams.get('seat');
    if (seatParam) {
      const seatNum = parseInt(seatParam, 10);
      if (seatNum >= 1 && seatNum <= 95) {
        return seatNum;
      }
    }
    return null;
  });

  const [isMobile, setIsMobile] = useState(false);

  // Automatically update selected seat if searchParams changes
  useEffect(() => {
    const seatParam = searchParams.get('seat');
    if (seatParam) {
      const seatNum = parseInt(seatParam, 10);
      if (seatNum >= 1 && seatNum <= 95 && seatNum !== selectedSeat) {
        // queueMicrotask prevents the synchronous setState cascade warning
        queueMicrotask(() => setSelectedSeat(seatNum));
      }
    }
  }, [searchParams, selectedSeat]);

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

  const initialRequestData = useMemo(() => {
    if (selectedSeat === null) return undefined;
    const seatParam = Number(searchParams.get('seat'));
    if (seatParam !== selectedSeat) return undefined;

    const name = searchParams.get('name') || '';
    const phone = searchParams.get('phone') || '';
    const paymentModeParam = searchParams.get('paymentMode');
    const paymentMode: 'cash' | 'upi' = paymentModeParam === 'cash' ? 'cash' : 'upi';

    if (!name && !phone) return undefined;
    return { name, phone, paymentMode };
  }, [searchParams, selectedSeat]);

  const closeModal = () => {
    setSelectedSeat(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  // Handlers (kept same logic, wrapped in cleaner visual feedback)
  const handleMarkPaid = (seat: number) => {
    update(seat, { fee: 'paid' }, (msg) => addToast('error', msg));
    addToast('success', `Payment confirmed for Seat ${seat}`);
  };

  const handleMarkDue = (seat: number) => {
    update(seat, { fee: 'due' }, (msg) => addToast('error', msg));
    addToast('warning', `Seat ${seat} marked as pending payment`);
  };

  const handleRenew = (seat: number, joinDate: string, duration: Duration) => {
    renew(seat, joinDate, duration as '1M' | '3M' | '6M' | '1Y', (msg) => addToast('error', msg));
    addToast('success', `Membership extended for Seat ${seat}`);
  };

  const handleRemove = (seat: number) => {
    vacate(seat, (msg) => addToast('error', msg));
    addToast('success', `Seat ${seat} is now vacant`);
  };

  const handleUpdate = (seat: number, patch: Partial<Member>) => {
    update(seat, patch, (msg) => addToast('error', msg));
    addToast('success', `Updated details for Seat ${seat}`);
  };

  const handleAddSubmit = async (seat: number, data: Omit<Member, 'seat' | 'vacant'>) => {
    const success = await add(seat, data);
    if (success) {
      addToast('success', `Allotted Seat ${seat} to ${data.name}`);
      closeModal();
    }
  };

  const vacantSeats = useMemo(() => members.filter(m => m.vacant).map(m => m.seat), [members]);

  return (
    <div className="relative min-h-screen">
      <div className={cn(
        "transition-all duration-500 ease-in-out w-full",
        selectedSeat !== null && !isMobile ? 'pr-[380px]' : ''
      )}>
        
        {/* --- DYNAMIC HEADER --- */}
        <header className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <div className="space-y-2">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-[var(--saffron-600)] mb-2"
            >
              <LayoutDashboard size={14} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--saffron-600)]">
                Live Seat Map
              </span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Reading Hall Seats
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm md:text-base text-[var(--text-secondary)] font-normal max-w-md leading-relaxed"
            >
              Track occupancy, payments, renewals, and member details from one fast floor plan.
            </motion.p>
          </div>

          {/* Quick Stats Chips */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 overflow-x-auto pb-4 xl:pb-0 no-scrollbar pt-2"
          >
            <StatChip 
              label="Occupied" 
              value={stats.occupied} 
              icon={<Users size={14} />}
              color="bg-[var(--saffron-50)] text-[var(--saffron-700)] border-[var(--saffron-200)]" 
            />
            <StatChip 
              label="Available" 
              value={stats.vacant} 
              icon={<UserPlus size={14} />}
              color="bg-[var(--emerald-50)] text-[var(--emerald-700)] border-[var(--emerald-200)]" 
            />
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-[var(--border-strong)] to-transparent mx-2" />
            <div className="relative group">
              <GlobalSearch onSelect={seat => setSelectedSeat(seat)} className="relative w-[260px]" />
            </div>
          </motion.div>
        </header>

        {/* --- SEATING CANVAS --- */}
        <section className="relative rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm p-4 md:p-8 mb-8 overflow-hidden">

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
          {/* Legend Overlay */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)] relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)] ring-4 ring-[var(--bg-muted)]" /> 
              <span>Vacant</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--saffron-500)] ring-4 ring-[var(--saffron-100)]" /> 
              <span className="text-[var(--saffron-700)]">Occupied</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ruby-500)] ring-4 ring-[var(--ruby-100)]" /> 
              <span className="text-[var(--ruby-700)]">Action Req</span>
            </div>
          </div>
        </section>
      </div>

      {/* --- CENTERED MODAL DIALOG --- */}
      <AnimatePresence>
        {selectedSeat !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeModal}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="relative flex flex-col w-full max-w-md max-h-[90vh] overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {!isAdmin ? (
                selectedMember?.vacant ? (
                  <AddMemberSheet
                    open={true}
                    onClose={closeModal}
                    seat={selectedSeat}
                    vacantSeats={vacantSeats}
                    onSubmit={handleAddSubmit}
                    isMobile={isMobile}
                    initialData={initialRequestData}
                  />
                ) : (
                  <SeatDetailPanel
                    member={selectedMember}
                    open={true}
                    onClose={closeModal}
                    onMarkPaid={handleMarkPaid}
                    onMarkDue={handleMarkDue}
                    onRenew={handleRenew}
                    onRemove={handleRemove}
                    isMobile={isMobile}
                    readonly={true}
                  />
                )
              ) : selectedMember?.vacant ? (
                <AddMemberSheet
                  open={true}
                  onClose={closeModal}
                  seat={selectedSeat}
                  vacantSeats={vacantSeats}
                  onSubmit={handleAddSubmit}
                  isMobile={isMobile}
                  initialData={initialRequestData}
                />
              ) : (
                <SeatDetailPanel
                  member={selectedMember}
                  open={true}
                  onClose={closeModal}
                  onMarkPaid={handleMarkPaid}
                  onMarkDue={handleMarkDue}
                  onRenew={handleRenew}
                  onRemove={handleRemove}
                  onUpdate={handleUpdate}
                  isMobile={isMobile}
                />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component for clean stats
function StatChip({ label, value, color, icon }: { label: string, value: number, color: string, icon?: React.ReactNode }) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl border whitespace-nowrap font-medium transition-colors duration-200", color)}>
      {icon && <div className="opacity-90">{icon}</div>}
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-[0.15em] opacity-70 leading-none mb-1">{label}</span>
        <span className="text-sm font-bold leading-none">{value}</span>
      </div>
    </div>
  );
}
