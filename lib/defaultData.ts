import type { Member } from './types.ts';
import { SEAT_NUMBERS } from './layoutConfig.ts';

function makeVacant(seat: number): Member {
  return {
    seat, name: '', phone: '', joinDate: '', duration: '',
    expiry: '', fee: '', shift: 'morning', vacant: true,
  };
}

export function getDefaultMembers(): Member[] {
  // One vacant document per seat on the plan (95).
  return SEAT_NUMBERS.map(makeVacant);
}
