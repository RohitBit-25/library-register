'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Member } from '@/lib/types';
import { getDefaultMembers } from '@/lib/defaultData';
import { calcExpiry } from '@/lib/utils';

const STORAGE_KEY = 'library-members';

function loadMembers(): Member[] {
  if (typeof window === 'undefined') return getDefaultMembers();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 95) return parsed;
    }
  } catch { /* ignore parse errors */ }
  const defaults = getDefaultMembers();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveMembers(members: Member[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  // Dispatch event for cross-tab sync
  window.dispatchEvent(new Event('members-updated'));
}

export function useMembers() {
  const [members, setMembers] = useState<Member[]>(getDefaultMembers);

  // Load from localStorage on mount
  useEffect(() => {
    setTimeout(() => setMembers(loadMembers()), 0);
  }, []);

  // Listen for cross-tab / cross-component updates
  useEffect(() => {
    const handler = () => setMembers(loadMembers());
    window.addEventListener('storage', handler);
    window.addEventListener('members-updated', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('members-updated', handler);
    };
  }, []);

  const update = useCallback((seat: number, patch: Partial<Member>) => {
    setMembers(prev => {
      const next = prev.map(m => m.seat === seat ? { ...m, ...patch } : m);
      saveMembers(next);
      return next;
    });
  }, []);

  const vacate = useCallback((seat: number) => {
    setMembers(prev => {
      const next = prev.map(m =>
        m.seat === seat
          ? { ...m, name: '', phone: '', joinDate: '', duration: '' as const, expiry: '', fee: '' as const, shift: 'morning' as const, vacant: true, paymentMode: undefined, documentStatus: undefined, termsAccepted: undefined }
          : m,
      );
      saveMembers(next);
      return next;
    });
  }, []);

  const add = useCallback((seatNumber: number, data: Omit<Member, 'seat' | 'vacant'>): boolean => {
    let success = false;
    setMembers(prev => {
      const targetIdx = prev.findIndex(m => m.seat === seatNumber && m.vacant);
      if (targetIdx === -1) return prev;
      success = true;
      const next = prev.map(m =>
        m.seat === seatNumber
          ? { ...m, ...data, seat: seatNumber, vacant: false }
          : m,
      );
      saveMembers(next);
      return next;
    });
    return success;
  }, []);

  const renew = useCallback((seat: number, joinDate: string, duration: '1M' | '3M' | '6M' | '1Y') => {
    const expiry = calcExpiry(joinDate, duration);
    update(seat, { joinDate, duration, expiry, fee: 'paid' });
  }, [update]);

  const getNextVacantSeat = useCallback((): number => {
    const m = members.find(m => m.vacant);
    return m ? m.seat : -1;
  }, [members]);

  const bulkMarkPaid = useCallback((seats: number[]) => {
    setMembers(prev => {
      const next = prev.map(m =>
        seats.includes(m.seat) ? { ...m, fee: 'paid' as const } : m,
      );
      saveMembers(next);
      return next;
    });
  }, []);

  const bulkRemove = useCallback((seats: number[]) => {
    setMembers(prev => {
      const next = prev.map(m =>
        seats.includes(m.seat)
          ? { ...m, name: '', phone: '', joinDate: '', duration: '' as const, expiry: '', fee: '' as const, shift: 'morning' as const, vacant: true, paymentMode: undefined, documentStatus: undefined, termsAccepted: undefined }
          : m,
      );
      saveMembers(next);
      return next;
    });
  }, []);

  return { members, update, vacate, add, renew, getNextVacantSeat, bulkMarkPaid, bulkRemove };
}
