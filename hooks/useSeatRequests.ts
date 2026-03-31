'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  type SeatRequest,
  getStoredRequests,
  saveRequests,
  generateRequestId,
} from '@/lib/auth';

export function useSeatRequests() {
  const [requests, setRequests] = useState<SeatRequest[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    setRequests(getStoredRequests());
  }, []);

  // Listen for cross-tab / cross-component updates
  useEffect(() => {
    const handler = () => setRequests(getStoredRequests());
    window.addEventListener('storage', handler);
    window.addEventListener('requests-updated', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('requests-updated', handler);
    };
  }, []);

  const addRequest = useCallback(
    (seat: number, userName: string, userPhone: string, message: string) => {
      const newRequest: SeatRequest = {
        id: generateRequestId(),
        seat,
        userName,
        userPhone,
        message,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setRequests(prev => {
        const next = [newRequest, ...prev];
        saveRequests(next);
        return next;
      });
      return newRequest;
    },
    []
  );

  const approveRequest = useCallback((id: string) => {
    setRequests(prev => {
      const next = prev.map(r =>
        r.id === id ? { ...r, status: 'approved' as const } : r
      );
      saveRequests(next);
      return next;
    });
  }, []);

  const rejectRequest = useCallback((id: string) => {
    setRequests(prev => {
      const next = prev.map(r =>
        r.id === id ? { ...r, status: 'rejected' as const } : r
      );
      saveRequests(next);
      return next;
    });
  }, []);

  const deleteRequest = useCallback((id: string) => {
    setRequests(prev => {
      const next = prev.filter(r => r.id !== id);
      saveRequests(next);
      return next;
    });
  }, []);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return {
    requests,
    addRequest,
    approveRequest,
    rejectRequest,
    deleteRequest,
    pendingCount,
  };
}
