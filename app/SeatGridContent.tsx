'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/hooks/useToast';
import SeatGrid, { type StatusFilter } from '@/components/seat/SeatGrid';
import SeatDetailPanel from '@/components/seat/SeatDetailPanel';
import AddMemberSheet from '@/components/seat/AddMemberSheet';
import GlobalSearch from '@/components/ui/GlobalSearch';
import { SeatSkeleton } from '@/components/ui/Skeleton';
import { type Duration, type Member } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useStaggerReveal } from '@/hooks/useStaggerReveal';
import { getSeatStatus, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, UserPlus, AlertCircle, Clock, IndianRupee } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { springUI } from '@/lib/motion';
import Link from 'next/link';

export default function SeatGridContent() {
  const { members, update, vacate, renew, add, isLoading } = useMembers();
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const mapRef = useStaggerReveal<HTMLDivElement>(!isLoading && members.length > 0);

  // Which counter is currently narrowing the map. Null = show everything.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);
  const toggleStatus = useCallback(
    (k: Exclude<StatusFilter, null>) => setStatusFilter((cur) => (cur === k ? null : k)),
    []
  );

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
    vacate(seat, (msg) => addToast('error', msg)).then((waiting) => {
      if (waiting.length) {
        addToast('warning', `${waiting.length} on the waitlist — ${waiting[0].userName} is first.`);
      }
    });
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
        "transition-ui duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] w-full",
        selectedSeat !== null && !isMobile ? 'pr-[380px]' : ''
      )}>
        
        {/* --- DYNAMIC HEADER --- */}
        <header className="mb-8 flex flex-col gap-5">
          {/* No eyebrow. "Live Seat Map" sat above "Reading Hall Seats" and
              said nothing the heading didn't — the heading carries itself. */}
          <div className="space-y-2">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)]"
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
            className="flex flex-wrap items-center gap-2 sm:gap-3"
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
              active={statusFilter === 'vacant'}
              onToggle={() => toggleStatus('vacant')}
            />
            {stats.due > 0 && (
              <StatChip 
                label="Fee Due"
                value={stats.due}
                icon={<IndianRupee size={14} />}
                color="bg-[var(--saffron-50)] text-[var(--saffron-700)] border-[var(--saffron-200)]"
                active={statusFilter === 'due'}
                onToggle={() => toggleStatus('due')}
              />
            )}
            {stats.expiring > 0 && (
              <StatChip
                label="Expiring"
                value={stats.expiring}
                icon={<Clock size={14} />}
                color="bg-[var(--marigold-50)] text-[var(--marigold-700)] border-[var(--marigold-200)]"
                active={statusFilter === 'expiring'}
                onToggle={() => toggleStatus('expiring')}
              />
            )}
            {stats.expired > 0 && (
              <StatChip
                label="Expired"
                value={stats.expired}
                icon={<AlertCircle size={14} />}
                color="bg-[var(--ruby-50)] text-[var(--ruby-700)] border-[var(--ruby-200)]"
                active={statusFilter === 'expired'}
                onToggle={() => toggleStatus('expired')}
              />
            )}
          </motion.div>
        </header>

        {/* --- MAP TOOLBAR --- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
          <GlobalSearch onSelect={seat => setSelectedSeat(seat)} className="relative w-full xl:w-[320px] z-20 shrink-0" />
          
          {/* Consolidated Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)] bg-[var(--bg-surface)] px-4 py-2 rounded-xl border border-[var(--border-default)] shadow-sm">
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
            ) : stats.occupied === 0 ? (
              /* A brand-new library showed 95 dashed squares and no
                 explanation of what to do with them. This is the state the
                 real database is in today, so it is the first thing a new
                 owner sees. */
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-muted)]">
                  <LayoutDashboard className="h-7 w-7 text-[var(--text-tertiary)]" aria-hidden="true" />
                </div>
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  All {stats.total} seats are free
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
                  The floor plan is ready. Allot a seat to your first member and
                  they will appear here, colour-coded by whether their fee is
                  paid and how long their plan has left.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedSeat(1)}
                    className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-[var(--saffron-700)] px-5 text-sm font-bold text-[var(--text-inverse)] transition-ui hover:bg-[var(--saffron-800)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)] focus-visible:ring-offset-2"
                  >
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Add your first member
                  </button>
                  <Link
                    href="/setup"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-5 text-sm font-bold text-[var(--text-secondary)] transition-ui hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)] focus-visible:ring-offset-2"
                  >
                    Let students request seats
                  </Link>
                </div>
              </div>
            ) : (
              // anime.js reveals tiles outward from the centre of the room —
              // see hooks/useStaggerReveal. Replaces a single whole-canvas
              // fade, which told you nothing about the layout.
              <div ref={mapRef}>
                <SeatGrid
                  members={members}
                  onSeatClick={seat => setSelectedSeat(seat)}
                  selectedSeat={selectedSeat}
                  statusFilter={statusFilter}
                />
              </div>
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
            
            {/* Desktop only. On a phone the BottomSheet inside these
                components is the whole presentation; wrapping it here made
                two nested modals, the outer one claiming `aria-modal` while
                managing no focus at all. */}
            <motion.div
              initial={isMobile ? false : { transform: 'translateX(100%)' }}
              animate={isMobile ? {} : { transform: 'translateX(0%)' }}
              exit={isMobile ? {} : { transform: 'translateX(100%)' }}
              transition={springUI}
              className={cn(
                isMobile
                  ? 'contents'
                  : "fixed top-0 right-0 z-[100] h-screen w-[380px] overflow-y-auto border-l border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xl"
              )}
              {...(isMobile ? {} : { role: 'dialog' as const, 'aria-modal': true })}
            >
              <div className={isMobile ? 'contents' : 'h-full flex flex-col pt-14 lg:pt-0'}>
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
/**
 * A counter that does something.
 *
 * These were read-only chips: the map told you eight members owed money and
 * then left you to find them among ninety-five tiles. Clicking one now dims
 * everything else on the plan, which is the question an admin actually opens
 * this screen to ask — "who do I need to deal with today, and where are they
 * sitting". Chips without a filter (Total, Occupied) stay plain text.
 */
function StatChip({ label, value, color, icon, active, onToggle }: {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
  active?: boolean;
  onToggle?: () => void;
}) {
  const inner = (
    <>
      {icon && <div className="opacity-90">{icon}</div>}
      <div className="flex flex-col items-start">
        <span className="mb-1.5 text-xs font-semibold uppercase leading-none tracking-[0.12em]">{label}</span>
        <span className="tabular text-sm font-bold leading-none">{value}</span>
      </div>
    </>
  );

  const shared = "flex items-center gap-3 px-4 py-2.5 rounded-xl border whitespace-nowrap font-medium transition-ui";

  if (!onToggle) {
    return <div className={cn(shared, color)}>{inner}</div>;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={`${label}: ${value}. ${active ? 'Showing only these seats' : 'Show only these seats'}`}
      className={cn(
        shared,
        'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)] focus-visible:ring-offset-2',
        color,
        active
          ? 'ring-2 ring-offset-1 ring-[var(--text-primary)]'
          : 'hover:brightness-[0.97]'
      )}
    >
      {inner}
    </button>
  );
}

