'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { type Member } from '@/lib/types';
import { getDefaultMembers } from '@/lib/defaultData';
import { calcExpiry } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useMembers() {
  const { data: members = [], mutate, isLoading } = useSWR<Member[]>('/api/members', fetcher, {
    fallbackData: getDefaultMembers(), // Optimistic initial data
    revalidateOnFocus: true,
  });

  const update = useCallback(async (seat: number, patch: Partial<Member>) => {
    // Optimistic update
    mutate((current) => {
      if (!current) return current;
      return current.map(m => m.seat === seat ? { ...m, ...patch } : m);
    }, false);

    await fetch(`/api/members/${seat}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    
    mutate(); // Revalidate
  }, [mutate]);

  const vacate = useCallback(async (seat: number) => {
    // Optimistic update
    mutate((current) => {
      if (!current) return current;
      return current.map(m => m.seat === seat ? {
        ...m, name: '', phone: '', joinDate: '', duration: '' as Member['duration'], expiry: '', fee: '' as Member['fee'], shift: 'morning', vacant: true, paymentMode: undefined, documentStatus: undefined, termsAccepted: undefined
      } : m);
    }, false);

    await fetch(`/api/members/${seat}`, {
      method: 'DELETE',
    });
    
    mutate();
  }, [mutate]);

  const add = useCallback(async (seatNumber: number, data: Omit<Member, 'seat' | 'vacant'>): Promise<boolean> => {
    // We can't immediately return true/false synchronously, but we rely on the component using await
    const isOccupied = members.some(m => m.seat === seatNumber && !m.vacant);
    if (isOccupied) return false;

    // Optimistic update
    mutate((current) => {
      if (!current) return current;
      return current.map(m => m.seat === seatNumber ? { ...m, ...data, seat: seatNumber, vacant: false } : m);
    }, false);

    const res = await fetch(`/api/members/${seatNumber}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, vacant: false }),
    });

    mutate();
    return res.ok;
  }, [members, mutate]);

  const renew = useCallback((seat: number, joinDate: string, duration: '1M' | '3M' | '6M' | '1Y') => {
    const expiry = calcExpiry(joinDate, duration);
    update(seat, { joinDate, duration, expiry, fee: 'paid' });
  }, [update]);

  const getNextVacantSeat = useCallback((): number => {
    const m = members.find(m => m.vacant);
    return m ? m.seat : -1;
  }, [members]);

  const bulkMarkPaid = useCallback(async (seats: number[]) => {
    // Optimistic
    mutate((current) => {
      if (!current) return current;
      return current.map(m => seats.includes(m.seat) ? { ...m, fee: 'paid' } : m);
    }, false);

    await Promise.all(seats.map(seat => 
      fetch(`/api/members/${seat}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fee: 'paid' }),
      })
    ));
    
    mutate();
  }, [mutate]);

  const bulkRemove = useCallback(async (seats: number[]) => {
    // Optimistic
    mutate((current) => {
       if (!current) return current;
       return current.map(m => seats.includes(m.seat) ? {
         ...m, name: '', phone: '', joinDate: '', duration: '' as Member['duration'], expiry: '', fee: '' as Member['fee'], shift: 'morning', vacant: true, paymentMode: undefined, documentStatus: undefined, termsAccepted: undefined
       } : m);
    }, false);

    await Promise.all(seats.map(seat => 
      fetch(`/api/members/${seat}`, { method: 'DELETE' })
    ));
    
    mutate();
  }, [mutate]);

  return { members, update, vacate, add, renew, getNextVacantSeat, bulkMarkPaid, bulkRemove, isLoading };
}
