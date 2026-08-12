import type { Member } from './types.ts';

function makeVacant(seat: number): Member {
  return {
    seat, name: '', phone: '', joinDate: '', duration: '',
    expiry: '', fee: '', shift: 'morning', vacant: true,
  };
}

export function getDefaultMembers(): Member[] {
  // Generate 95 completely vacant seats
  return Array.from({ length: 95 }, (_, i) => makeVacant(i + 1));
}
