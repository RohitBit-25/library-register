'use client';

import { useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { type AttendanceEntry } from '@/lib/types';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function useAttendance() {
  const { isAdmin } = useAuth();
  const { members } = useMembers();
  
  // Use SWR for remote data fetching, but only if Admin (otherwise it's empty)
  const { data: history = [], mutate } = useSWR<AttendanceEntry[]>(
    isAdmin ? '/api/attendance' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // --- API Helpers ---

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getRecordForDate = (dateStr: string): AttendanceEntry | undefined => {
    return history.find(h => h.date === dateStr);
  };

  const markPresent = useCallback(async (dateStr: string, seat: number) => {
    if (!isAdmin) return;

    // Optimistic UI update
    const newHistory = history.map(h => 
      h.date === dateStr ? { ...h, seats: Array.from(new Set([...h.seats, seat])) } : h
    );
    if (!history.some(h => h.date === dateStr)) {
      newHistory.push({ date: dateStr, seats: [seat] });
    }

    try {
      mutate(newHistory, false);
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, seat, present: true }),
      });
      mutate();
    } catch (error) {
      console.error('Failed to mark present:', error);
      mutate();
    }
  }, [history, isAdmin, mutate]);

  const markAbsent = useCallback(async (dateStr: string, seat: number) => {
    if (!isAdmin) return;

    // Optimistic UI update
    const newHistory = history.map(h => 
      h.date === dateStr ? { ...h, seats: h.seats.filter(s => s !== seat) } : h
    );

    try {
      mutate(newHistory, false);
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, seat, present: false }),
      });
      mutate();
    } catch (error) {
      console.error('Failed to mark absent:', error);
      mutate();
    }
  }, [history, isAdmin, mutate]);

  const markAllPresent = useCallback(async (dateStr: string) => {
    if (!isAdmin) return;

    const occupiedSeats = members.filter(m => !m.vacant).map(m => m.seat);

    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, seats: occupiedSeats, allPresent: true }),
      });
      mutate();
    } catch (error) {
      console.error('Failed to mark all present:', error);
    }
  }, [isAdmin, members, mutate]);

  const isPresent = (dateStr: string, seat: number): boolean => {
    const record = getRecordForDate(dateStr);
    return record?.seats.includes(seat) ?? false;
  };

  // Stats derived from dynamic data
  const totalOccupied = members.filter(m => !m.vacant).length;
  const todayStr = getTodayStr();
  const todayRecord = getRecordForDate(todayStr);
  const presentToday = todayRecord ? todayRecord.seats.length : 0;
  const attendanceRateToday = totalOccupied > 0 ? Math.round((presentToday / totalOccupied) * 100) : 0;

  const getLast30DaysData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const record = history.find(h => h.date === ds);
      const count = record ? record.seats.length : 0;
      let rate = 0;
      if (totalOccupied > 0) rate = Math.round((count / totalOccupied) * 100);

      data.push({
        date: ds,
        day: d.getDate(),
        month: d.getMonth(),
        dayOfWeek: d.getDay(),
        count,
        rate
      });
    }
    return data;
  };

  const weeklySummary = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    let totalRate = 0;
    let daysWithData = 0;
    let bestRate = 0;
    let bestDayName = '—';
    let worstRate = 101;
    let worstDayName = '—';

    for (let i = 0; i <= mondayOffset; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (mondayOffset - i));
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const record = history.find(h => h.date === ds);
      if (record) {
        const rate = totalOccupied > 0 ? Math.round((record.seats.length / totalOccupied) * 100) : 0;
        totalRate += rate;
        daysWithData++;

        if (rate > bestRate) {
          bestRate = rate;
          bestDayName = DAY_NAMES[d.getDay()];
        }
        if (rate < worstRate) {
          worstRate = rate;
          worstDayName = DAY_NAMES[d.getDay()];
        }
      }
    }

    return {
      avgRate: daysWithData > 0 ? Math.round(totalRate / daysWithData) : 0,
      daysWithData,
      bestRate,
      bestDayName,
      worstRate: worstRate > 100 ? 0 : worstRate,
      worstDayName: worstRate > 100 ? '—' : worstDayName,
    };
  }, [history, totalOccupied]);

  return {
    history,
    todayStr,
    totalOccupied,
    presentToday,
    attendanceRateToday,
    getRecordForDate,
    markPresent,
    markAbsent,
    markAllPresent,
    isPresent,
    getLast30DaysData,
    weeklySummary,
    isLoading: isAdmin && !history.length
  };
}
