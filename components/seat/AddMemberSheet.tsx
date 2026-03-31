'use client';

import { useMemo } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import AddMemberForm from '@/components/member/AddMemberForm';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { X, UserPlus } from 'lucide-react';
import { type Member } from '@/lib/types';

interface AddMemberSheetProps {
  open: boolean;
  onClose: () => void;
  seat: number | null;
  vacantSeats: number[];
  onSubmit: (seat: number, data: Omit<Member, 'seat' | 'vacant'>) => void;
  isMobile: boolean;
}

export default function AddMemberSheet({ 
  open, 
  onClose, 
  seat, 
  vacantSeats, 
  onSubmit, 
  isMobile 
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

  // Desktop: right panel
  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {open && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/10 backdrop-blur-sm z-30"
              onClick={onClose}
            />
            <m.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed top-0 right-0 h-screen w-full max-w-[480px] bg-surface dark:bg-surface-dark border-l border-card-border dark:border-card-border-dark shadow-2xl z-40 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-card-border/50 dark:border-card-border-dark/50 bg-bg/50 dark:bg-bg-dark/50 backdrop-blur-md sticky top-0 z-10">
                <h3 className="text-base font-black text-text-primary dark:text-text-primary-dark font-mono flex items-center gap-2">
                  <span className="w-8 h-8 gradient-blue rounded-lg flex items-center justify-center text-white shadow-sm">
                    <UserPlus className="w-4 h-4" />
                  </span>
                  {seat ? `Assign Seat ${String(seat).padStart(2, '0')}` : 'New Registration'}
                </h3>
                <button
                  onClick={onClose}
                  className="cursor-pointer rounded-xl p-2 text-text-tertiary dark:text-text-tertiary-dark hover:bg-surface dark:hover:bg-surface-dark hover:text-text-primary transition-all hover:rotate-90 duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Scrollable form area */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                {content}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
