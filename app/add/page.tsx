import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/hooks/useToast';
import AddMemberForm from '@/components/member/AddMemberForm';
import { type Member } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function AddMemberPage() {
  const { add, members } = useMembers();
  const { addToast } = useToast();
  const router = useRouter();

  const vacantSeats = members.filter(m => m.vacant).map(m => m.seat);

  const handleSubmit = (seat: number, data: Omit<Member, 'seat' | 'vacant'>) => {
    const success = add(seat, data);
    if (success) {
      addToast('success', `Seat ${seat} allotted to ${data.name}`);
      router.push('/seat-grid');
    } else {
      addToast('error', 'Failed to allot seat. It might be occupied.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-1">
          LIBRARY Admission Form
        </h1>
        <p className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark mt-0.5">
          Fill out the details carefully. All fields marked with * are mandatory.
        </p>
      </div>

      <AddMemberForm
        vacantSeats={vacantSeats}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
