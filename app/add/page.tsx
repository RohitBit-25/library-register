'use client';

import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/hooks/useToast';
import AddMemberForm from '@/components/member/AddMemberForm';
import { type Member } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function AddMemberPage() {
  const { add, getNextVacantSeat } = useMembers();
  const { addToast } = useToast();
  const router = useRouter();

  const nextVacant = getNextVacantSeat();

  const handleSubmit = (data: Omit<Member, 'seat' | 'vacant'>) => {
    const seat = add(data);
    if (seat !== -1) {
      addToast('success', `Seat ${seat} allotted to ${data.name}`);
      router.push('/seat-grid');
    } else {
      addToast('error', 'No vacant seats available');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-primary-dark">
          Add Member
        </h1>
        <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-0.5">
          Seat auto-allotted — fill details below
        </p>
      </div>

      <AddMemberForm
        nextVacantSeat={nextVacant}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
