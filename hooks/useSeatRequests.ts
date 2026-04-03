'use client';

import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { type SeatRequest } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

// ─── Storage key for user's phone (persisted across sessions) ────
const USER_PHONE_KEY = 'library-user-phone';

function getStoredUserPhone(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(USER_PHONE_KEY) || '';
}

function setStoredUserPhone(phone: string): void {
  if (typeof window === 'undefined') return;
  if (phone) {
    localStorage.setItem(USER_PHONE_KEY, phone);
  }
}

// ─── Fetcher ─────────────────────────────────────────────────────

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

// ─── Hook ────────────────────────────────────────────────────────

export function useSeatRequests() {
  const { isAdmin } = useAuth();

  // Admin: fetch all requests
  const { data: adminData, mutate: adminMutate } = useSWR<SeatRequest[]>(
    isAdmin ? '/api/requests' : null,
    fetcher,
    { revalidateOnFocus: true }
  );

  // User: fetch own requests by phone
  const storedPhone = getStoredUserPhone();
  const { data: userData, mutate: userMutate } = useSWR<SeatRequest[]>(
    !isAdmin && storedPhone ? `/api/requests/my?phone=${encodeURIComponent(storedPhone)}` : null,
    fetcher,
    { revalidateOnFocus: true }
  );

  const requests = useMemo(() => {
    const data = isAdmin ? adminData : userData;
    return Array.isArray(data) ? data : [];
  }, [isAdmin, adminData, userData]);

  const mutate = isAdmin ? adminMutate : userMutate;

  // ─── Add Request (public) ──────────────────────────────────────

  const addRequest = useCallback(async (request: Omit<SeatRequest, 'id' | 'status' | 'createdAt'>) => {
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, status: 'pending' }),
      });

      if (response.status === 409) {
        return { success: false, error: 'duplicate' as const };
      }

      if (!response.ok) {
        return { success: false, error: 'failed' as const };
      }

      // Remember the user's phone for future lookups
      if (request.userPhone) {
        setStoredUserPhone(request.userPhone);
      }

      // Revalidate the relevant list
      mutate();

      return { success: true, error: null };
    } catch (err) {
      console.error('Failed to submit seat request:', err);
      return { success: false, error: 'failed' as const };
    }
  }, [mutate]);

  // ─── Lookup requests by phone (for My Requests page) ───────────

  const lookupByPhone = useCallback(async (phone: string): Promise<SeatRequest[]> => {
    if (!phone || phone.length < 10) return [];
    try {
      const res = await fetch(`/api/requests/my?phone=${encodeURIComponent(phone)}`);
      if (!res.ok) return [];
      const data = await res.json();
      // Persist phone for future auto-lookups
      setStoredUserPhone(phone);
      // Also trigger SWR revalidation with the new phone
      userMutate();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }, [userMutate]);

  // ─── Admin-only actions ────────────────────────────────────────

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

  // ─── Computed values ───────────────────────────────────────────

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const storedUserPhone = getStoredUserPhone();

  return {
    requests,
    pendingCount,
    storedUserPhone,
    addRequest,
    lookupByPhone,
    approveRequest,
    rejectRequest,
    deleteRequest,
    isLoading: isAdmin ? !adminData : (!userData && !!storedPhone),
  };
}
