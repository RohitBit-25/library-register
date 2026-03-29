'use client';

import { useState, useEffect } from 'react';
import type { AttendanceEntry, Member } from '@/lib/types';
import { useMembers } from '@/hooks/useMembers';

// Fallback empty arr to prevent undefined
const DEFAULT_ATTENDANCE: AttendanceEntry[] = [];

export function useAttendance() {
  const [history, setHistory] = useState<AttendanceEntry[]>([]);
  const { members } = useMembers();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('library_attendance');
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        setHistory(DEFAULT_ATTENDANCE);
      }
    } catch {
      setHistory(DEFAULT_ATTENDANCE);
    }
  }, []);

  // Generic save wrapper
  const save = (newHistory: AttendanceEntry[]) => {
    setHistory(newHistory);
    localStorage.setItem('library_attendance', JSON.stringify(newHistory));
    window.dispatchEvent(new Event('library_attendance_updated'));
  };

  // Listen for updates across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'library_attendance' && e.newValue) {
        setHistory(JSON.parse(e.newValue));
      }
    };
    const handleCustomEvent = () => {
      const stored = localStorage.getItem('library_attendance');
      if (stored) setHistory(JSON.parse(stored));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('library_attendance_updated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('library_attendance_updated', handleCustomEvent);
    };
  }, []);

  // --- API ---

  // Format YYYY-MM-DD string
  const getTodayStr = () => {
    const d = new Date();
    // Use local time zone string yyyy-mm-dd
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getRecordForDate = (dateStr: string): AttendanceEntry | undefined => {
    return history.find(h => h.date === dateStr);
  };

  const markPresent = (dateStr: string, seat: number) => {
    const existingIndex = history.findIndex(h => h.date === dateStr);
    let newHistory = [...history];

    if (existingIndex >= 0) {
      const entry = newHistory[existingIndex];
      if (!entry.seats.includes(seat)) {
        newHistory[existingIndex] = { ...entry, seats: [...entry.seats, seat] };
      }
    } else {
      newHistory.push({ date: dateStr, seats: [seat] });
    }
    save(newHistory);
  };

  const markAbsent = (dateStr: string, seat: number) => {
    const existingIndex = history.findIndex(h => h.date === dateStr);
    if (existingIndex >= 0) {
      let newHistory = [...history];
      newHistory[existingIndex] = {
        ...newHistory[existingIndex],
        seats: newHistory[existingIndex].seats.filter(s => s !== seat)
      };
      save(newHistory);
    }
  };

  const markAllPresent = (dateStr: string) => {
    // get all currently occupied seats
    const occupiedSeats = members.filter(m => !m.vacant).map(m => m.seat);
    
    const existingIndex = history.findIndex(h => h.date === dateStr);
    let newHistory = [...history];
    if (existingIndex >= 0) {
      newHistory[existingIndex] = { date: dateStr, seats: occupiedSeats };
    } else {
      newHistory.push({ date: dateStr, seats: occupiedSeats });
    }
    save(newHistory);
  };

  const isPresent = (dateStr: string, seat: number): boolean => {
    const record = getRecordForDate(dateStr);
    if (!record) return false;
    return record.seats.includes(seat);
  };

  // Daily stats for today
  const todayStr = getTodayStr();
  const todayRecord = getRecordForDate(todayStr);
  const totalOccupied = members.filter(m => !m.vacant).length;
  const presentToday = todayRecord ? todayRecord.seats.length : 0;
  const attendanceRateToday = totalOccupied > 0 ? Math.round((presentToday / totalOccupied) * 100) : 0;

  // We should also return a helper to generate a 30-day heatmap data
  const getLast30DaysData = () => {
    const data = [];
    const today = new Date();
    
    // Total occupied seats assumed roughly constant for historical (for a simple implementation)
    // A true historical attendance system would need to track total occupied per day, 
    // but for our heatmap, we'll just compare against current occupied or absolute count.
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const record = getRecordForDate(ds);
      const count = record ? record.seats.length : 0;
      let rate = 0;
      if (totalOccupied > 0) rate = Math.round((count / totalOccupied) * 100);
      else if (count > 0) rate = 100;

      data.push({
        date: ds,
        day: d.getDate(),
        month: d.getMonth(),
        count,
        rate
      });
    }
    return data;
  };

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
    getLast30DaysData
  };
}
