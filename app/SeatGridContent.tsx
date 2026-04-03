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

export default function SeatGridContent() {
  const { members, update, vacate, renew, add, isLoading } = useMembers();
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const searchParams = useSearchParams();

  const initialSeat = useMemo(() => {
    const seat = searchParams.get('seat');
    return seat ? Number(seat) : null;
  }, [searchParams]);

  const [selectedSeat, setSelectedSeat] = useState<number | null>(initialSeat);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const selectedMember = selectedSeat !== null
    ? members.find(m => m.seat === selectedSeat) || null
    : null;

  const handleMarkPaid = (seat: number) => {
    update(seat, { fee: 'paid' });
    addToast('success', `Seat ${seat} — fee marked as paid`);
  };

  const handleMarkDue = (seat: number) => {
    update(seat, { fee: 'due' });
    addToast('warning', `Seat ${seat} — fee marked as due`);
  };

  const handleRenew = (seat: number, joinDate: string, duration: Duration) => {
    renew(seat, joinDate, duration as '1M' | '3M' | '6M' | '1Y');
    const member = members.find(m => m.seat === seat);
    addToast('success', `Seat ${seat} renewed${member ? ` for ${member.name}` : ''}`);
  };

  const handleRemove = (seat: number) => {
    const member = members.find(m => m.seat === seat);
    vacate(seat);
    addToast('warning', `Seat ${seat} vacated${member ? ` — ${member.name} removed` : ''}`);
  };

  const handleAddSubmit = async (seat: number, data: Omit<Member, 'seat' | 'vacant'>) => {
    const success = await add(seat, data);
    if (success) {
      addToast('success', `Seat ${seat} allotted to ${data.name}`);
      setSelectedSeat(null);
    } else {
      addToast('error', 'Failed to allot seat. It might be occupied.');
    }
  };

  const vacantSeats = useMemo(() => members.filter(m => m.vacant).map(m => m.seat), [members]);

  return (
    <div className={selectedSeat !== null && !isMobile ? 'pr-[330px]' : ''}>
      {/* Header */}
      <div className="mb-3 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            Library Floorplan
          </h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-0.5">
            Tap any seat to manage, or search below
          </p>
        </div>
      </div>

      <GlobalSearch onSelect={seat => setSelectedSeat(seat)} />

      {isLoading ? (
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
          {Array.from({ length: 40 }).map((_, i) => (
            <SeatSkeleton key={i} />
          ))}
        </div>
      ) : (
        <SeatGrid
          members={members}
          onSeatClick={seat => setSelectedSeat(seat)}
        />
      )}

      {!isAdmin ? (
        <SeatDetailPanel
          member={selectedMember}
          open={selectedSeat !== null}
          onClose={() => setSelectedSeat(null)}
          onMarkPaid={() => {}}
          onMarkDue={() => {}}
          onRenew={() => {}}
          onRemove={() => {}}
          isMobile={isMobile}
          readonly={true}
        />
      ) : selectedMember?.vacant ? (
        <AddMemberSheet
          open={selectedSeat !== null}
          onClose={() => setSelectedSeat(null)}
          seat={selectedSeat}
          vacantSeats={vacantSeats}
          onSubmit={handleAddSubmit}
          isMobile={isMobile}
          initialData={{
            name: searchParams.get('name') || '',
            phone: searchParams.get('phone') || '',
            paymentMode: (searchParams.get('paymentMode') as 'upi' | 'cash') || 'upi'
          }}
        />
      ) : (
        <SeatDetailPanel
          member={selectedMember}
          open={selectedSeat !== null && !selectedMember?.vacant}
          onClose={() => setSelectedSeat(null)}
          onMarkPaid={handleMarkPaid}
          onMarkDue={handleMarkDue}
          onRenew={handleRenew}
          onRemove={handleRemove}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
