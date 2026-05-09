'use client';

import { useMemo } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import AddMemberForm from '@/components/member/AddMemberForm';

import { X, UserPlus } from 'lucide-react';
import { type Member } from '@/lib/types';

interface AddMemberSheetProps {
  open: boolean;
  onClose: () => void;
  seat: number | null;
  vacantSeats: number[];
  onSubmit: (seat: number, data: Omit<Member, 'seat' | 'vacant'>) => void;
  isMobile: boolean;
  initialData?: { name: string; phone: string; paymentMode: 'upi' | 'cash' };
}

export default function AddMemberSheet({ 
  open, 
  onClose, 
  seat, 
  vacantSeats, 
  onSubmit, 
  isMobile,
  initialData
}: AddMemberSheetProps) {
  
  // Reorder vacant seats so the tapped seat is pre-selected first
  const orderedVacant = useMemo(() => {
    if (!seat) return vacantSeats;
    return [seat, ...vacantSeats.filter(s => s !== seat)];
  }, [seat, vacantSeats]);

  const content = (
    <div className="pb-8">
      <AddMemberForm 
        vacantSeats={orderedVacant}
        initialData={initialData}
        onSubmit={(s, data) => {
          onSubmit(s, data);
          onClose(); // Auto-close on successful submit
        }}
      />
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title={seat ? `Assign Seat ${seat}` : 'Assign New Member'}
        snapPoint="90%"
      >
        {content}
      </BottomSheet>
    );
  }

  // Desktop: fill container
  return (
    <div className="h-full flex flex-col bg-transparent text-[var(--text-primary)]">
      <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/50 backdrop-blur-md sticky top-0 z-10">
        <h3 className="text-base font-black text-[var(--text-primary)] font-mono flex items-center gap-2">
          <span className="w-8 h-8 bg-sapphire-500 rounded-lg flex items-center justify-center text-[var(--saffron-50)] shadow-sm">
            <UserPlus className="w-4 h-4" />
          </span>
          {seat ? `Assign Seat ${String(seat).padStart(2, '0')}` : 'Registration'}
        </h3>
        <button
          onClick={onClose}
          className="cursor-pointer rounded-xl p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-all hover:rotate-90 duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {content}
      </div>
    </div>
  );
}
