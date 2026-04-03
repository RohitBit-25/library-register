'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { type SeatRequest } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export function useSeatRequests() {
  const { isAdmin } = useAuth();

  const { data, mutate } = useSWR<SeatRequest[]>(
    isAdmin ? '/api/requests' : null,
    fetcher,
    { revalidateOnFocus: true }
  );

  const requests = Array.isArray(data) ? data : [];

  const addRequest = useCallback(async (request: Omit<SeatRequest, 'id' | 'status' | 'createdAt'>) => {
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, status: 'pending' }),
      });
      
      if (!response.ok) throw new Error('Failed to submit request');
      
      // If we are admin, we might want to see the new request immediately
      if (isAdmin) mutate();
      
      return true;
    } catch (err) {
      console.error('Failed to submit seat request:', err);
      return false;
    }
  }, [isAdmin, mutate]);

  const approveRequest = useCallback(async (id: string | number) => {
    if (!isAdmin) return;

    try {
      await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' }),
      });
      mutate();
    } catch (err) {
      console.error('Failed to approve request:', err);
    }
  }, [isAdmin, mutate]);

  const rejectRequest = useCallback(async (id: string | number) => {
    if (!isAdmin) return;

    try {
      await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' }),
      });
      mutate();
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  }, [isAdmin, mutate]);

  const deleteRequest = useCallback(async (id: string | number) => {
    if (!isAdmin) return;

    try {
      await fetch(`/api/requests?id=${id}`, {
        method: 'DELETE',
      });
      mutate();
    } catch (err) {
      console.error('Failed to delete request:', err);
    }
  }, [isAdmin, mutate]);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return {
    requests,
    pendingCount,
    addRequest,
    approveRequest,
    rejectRequest,
    deleteRequest,
    isLoading: isAdmin && !requests.length
  };
}
