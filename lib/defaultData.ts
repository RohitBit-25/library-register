import { type Member } from './types';

function makeDynamicMember(
  seat: number,
  name: string,
  phone: string,
  duration: '1M' | '3M' | '6M' | '1Y',
  fee: 'paid' | 'due',
  shift: 'morning' | 'evening' | 'full',
  daysOffset: number // offset for expiry relative to today
): Member {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const expiry = d.toISOString().split('T')[0];

  // Approximate joinDate based on duration backwards from expiry
  const prevD = new Date(d);
  if (duration === '1M') prevD.setMonth(prevD.getMonth() - 1);
  else if (duration === '3M') prevD.setMonth(prevD.getMonth() - 3);
  else if (duration === '6M') prevD.setMonth(prevD.getMonth() - 6);
  else if (duration === '1Y') prevD.setFullYear(prevD.getFullYear() - 1);
  const joinDate = prevD.toISOString().split('T')[0];

  return { seat, name, phone, joinDate, duration, expiry, fee, shift, vacant: false };
}

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
