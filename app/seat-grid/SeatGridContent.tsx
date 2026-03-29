import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/hooks/useToast';
import SeatGrid from '@/components/seat/SeatGrid';
import SeatDetailPanel from '@/components/seat/SeatDetailPanel';
import { type Duration } from '@/lib/types';

export default function SeatGridContent() {
  const { members, update, vacate, renew } = useMembers();
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

  return (
    <div className={selectedSeat !== null && !isMobile ? 'pr-[330px]' : ''}>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-primary-dark">
          Seat Grid
        </h1>
        <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-0.5">
          Click any seat to manage
        </p>
      </div>

      <SeatGrid
        members={members}
        onSeatClick={seat => setSelectedSeat(seat)}
      />

      <SeatDetailPanel
        member={selectedMember}
        open={selectedSeat !== null}
        onClose={() => setSelectedSeat(null)}
        onMarkPaid={handleMarkPaid}
        onMarkDue={handleMarkDue}
        onRenew={handleRenew}
        onRemove={handleRemove}
        isMobile={isMobile}
      />
    </div>
  );
}
