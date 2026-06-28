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
import { getSeatStatus, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, UserPlus, AlertCircle, Clock } from 'lucide-react';
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
    let occupied = 0, vacant = 0, due = 0, expiring = 0, expired = 0;
    for (const m of members) {
      if (m.vacant) { vacant++; continue; }
      occupied++;
      const status = getSeatStatus(m);
      if (status === 'due') due++;
      if (status === 'expiring') expiring++;
      if (status === 'expired') expired++;
    }
    return { total: members.length, occupied, vacant, due, expiring, expired };
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

  // Handlers
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
    <div className="relative min-h-screen pb-20">
      <div className={cn(
        "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] w-full",
        selectedSeat !== null && !isMobile ? 'pr-[380px]' : ''
      )}>
        
        {/* --- DYNAMIC HEADER --- */}
        <header className="mb-8 flex flex-col gap-5">
          <div className="space-y-2">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-[var(--saffron-600)] mb-1"
            >
              <LayoutDashboard size={14} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--saffron-600)]">
                Live Seat Map
              </span>
            </motion.div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
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
                  Track occupancy, payments, renewals, and member details.
                </motion.p>
              </div>
            </div>
          </div>

          {/* Quick Stats Chips */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar"
          >
            <StatChip 
              label="Total Seats" 
              value={stats.total} 
              icon={<LayoutDashboard size={14} />}
              color="bg-[var(--bg-muted)] text-[var(--text-primary)] border-[var(--border-default)]" 
            />
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
            {stats.due > 0 && (
              <StatChip 
                label="Fee Due" 
                value={stats.due} 
                icon={<Clock size={14} />}
                color="bg-[var(--marigold-50)] text-[var(--marigold-700)] border-[var(--marigold-200)]" 
              />
            )}
            {(stats.expiring > 0 || stats.expired > 0) && (
              <StatChip 
                label="Expiring / Expired" 
                value={stats.expiring + stats.expired} 
                icon={<AlertCircle size={14} />}
                color="bg-[var(--ruby-50)] text-[var(--ruby-700)] border-[var(--ruby-200)]" 
              />
            )}
          </motion.div>
        </header>

        {/* --- MAP TOOLBAR --- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
          <GlobalSearch onSelect={seat => setSelectedSeat(seat)} className="relative w-full xl:w-[320px] z-20 shrink-0" />
          
          {/* Consolidated Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)] bg-[var(--bg-surface)] px-4 py-2 rounded-xl border border-[var(--border-default)] shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--emerald-500)]" /> <span>Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--saffron-500)]" /> <span>Expiring</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--marigold-500)]" /> <span>Fee Due</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--ruby-500)]" /> <span>Expired</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border border-[var(--border-default)] border-dashed bg-[var(--bg-muted)]" /> <span>Vacant</span>
            </div>
          </div>
        </div>

        {/* --- SEATING CANVAS --- */}
        <section className="relative rounded-xl border border-[var(--border-default)] shadow-sm bg-[var(--bg-surface)] overflow-hidden mb-8">
            {isLoading ? (
              <div className="p-8 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-5">
                {Array.from({ length: 40 }).map((_, i) => (
                  <SeatSkeleton key={i} />
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <SeatGrid
                  members={members}
                  onSeatClick={seat => setSelectedSeat(seat)}
                  selectedSeat={selectedSeat}
                />
              </motion.div>
            )}
        </section>
      </div>

      {/* --- SIDE DRAWER MODAL --- */}
      <AnimatePresence>
        {selectedSeat !== null && (
          <>
            {/* Backdrop for mobile */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-sm lg:hidden"
                onClick={closeModal}
              />
            )}
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className={cn(
                "fixed top-0 right-0 z-[100] h-screen bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-2xl overflow-y-auto",
                isMobile ? "w-[90vw] max-w-[400px]" : "w-[380px]"
              )}
              role="dialog"
              aria-modal="true"
            >
              <div className="h-full flex flex-col pt-14 lg:pt-0">
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component for clean stats
function StatChip({ label, value, color, icon }: { label: string, value: number, color: string, icon?: React.ReactNode }) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl border whitespace-nowrap font-medium transition-colors duration-200 shrink-0", color)}>
      {icon && <div className="opacity-90">{icon}</div>}
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-[0.15em] opacity-70 leading-none mb-1.5">{label}</span>
        <span className="text-sm font-bold leading-none">{value}</span>
      </div>
    </div>
  );
}
