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
import { UserPlus } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { STATUS_STYLE } from '@/components/seat/statusStyle';
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
    <div className="relative min-h-dvh pb-20">
      <div className={cn(
        "transition-ui duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] w-full",
        selectedSeat !== null && !isMobile ? 'pr-[380px]' : ''
      )}>
        
        <PageHeader
          title="Reading hall"
          subtitle={
            <>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              {' · '}
              <span className="font-mono tabular">{stats.occupied}</span> of{' '}
              <span className="font-mono tabular">{stats.total}</span> seats taken
            </>
          }
          actions={<GlobalSearch onSelect={seat => setSelectedSeat(seat)} className="relative z-20 w-full sm:w-[300px]" />}
        />

        {/* The day's register. Each count is also a filter for the plan —
            "who do I need to deal with today, and where are they sitting" is
            the question this screen is opened to answer. */}
        <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] sm:grid-cols-4 shadow-[var(--shadow-xs)]">
          {([
            { key: 'vacant', label: 'Free now', value: stats.vacant },
            { key: 'due', label: 'Fee due', value: stats.due },
            { key: 'expiring', label: 'Expiring this week', value: stats.expiring },
            { key: 'expired', label: 'Expired', value: stats.expired },
          ] as const).map((c, i) => {
            const on = statusFilter === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => toggleStatus(c.key)}
                aria-pressed={on}
                aria-label={`${c.label}: ${c.value}. ${on ? 'Showing only these seats' : 'Show only these seats on the plan'}`}
                className={cn(
                  'group relative flex cursor-pointer flex-col items-start gap-1 px-4 py-3 text-left transition-ui sm:px-5 sm:py-4',
                  i % 2 === 1 && 'border-l border-[var(--border-default)]',
                  i >= 2 && 'border-t border-[var(--border-default)] sm:border-t-0',
                  i === 2 && 'sm:border-l',
                  on ? 'bg-[var(--bg-muted)]' : 'hover:bg-[var(--bg-base)]',
                )}
              >
                <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                  <span className={cn('size-2 rounded-full', STATUS_STYLE[c.key].dot)} aria-hidden="true" />
                  {c.label}
                </span>
                <span className={cn('font-display text-xl font-semibold leading-none tabular', c.value === 0 ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]')}>
                  {c.value}
                </span>
                {on && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--text-primary)]" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <section className="relative mb-8">
            {isLoading ? (
              <div className="grid grid-cols-4 gap-5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 shadow-[var(--shadow-xs)]">
                {Array.from({ length: 40 }).map((_, i) => (
                  <SeatSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                {/* A brand-new library: the plan is still the page, with one
                    line above it saying what to do. Hiding the plan behind an
                    empty state meant a new owner never saw their own hall. */}
                {stats.occupied === 0 && (
                  <div className="mb-4 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between shadow-[var(--shadow-xs)]">
                    <div>
                      <h2 className="font-display text-md font-semibold text-[var(--text-primary)]">All {stats.total} seats are free</h2>
                      <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                        Tap any seat on the plan to allot it, or share the request link so students can ask for one.
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button size="sm" onClick={() => setSelectedSeat(1)}>
                        <UserPlus className="size-4" aria-hidden="true" />
                        Allot seat 1
                      </Button>
                      <Link
                        href="/setup"
                        className="inline-flex min-h-[36px] items-center whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-medium text-[var(--text-primary)] transition-ui hover:bg-[var(--bg-muted)]"
                      >
                        Share request link
                      </Link>
                    </div>
                  </div>
                )}
                {/* anime.js reveals tiles outward from the centre of the room —
                    see hooks/useStaggerReveal. */}
                <div ref={mapRef}>
                  <SeatGrid
                    members={members}
                    onSeatClick={seat => setSelectedSeat(seat)}
                    selectedSeat={selectedSeat}
                    statusFilter={statusFilter}
                  />
                </div>
              </>
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
                className="fixed inset-0 z-40 bg-[var(--text-primary)]/20 lg:hidden"
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
                  : "fixed top-0 right-0 z-50 h-dvh w-[380px] overflow-y-auto border-l border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xl"
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
