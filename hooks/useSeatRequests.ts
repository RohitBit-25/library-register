'use client';

import { useCallback, useMemo } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

/** What an admin action actually did — callers surface `error` to the user. */
export type ActionResult =
  | { ok: true }
  | { ok: false; status?: number; error?: string };
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
        body: JSON.stringify({
          seat: request.seat,
          userName: request.userName,
          userPhone: request.userPhone,
          message: request.message,
          joinDate: request.joinDate || '',
          duration: request.duration || '3M',
          shift: request.shift || 'full',
          transactionId: request.transactionId || '',
          paymentMode: request.paymentMode || 'upi',
          documentUrl: request.documentUrl || '',
          status: 'pending',
        }),
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

  // These three used to `await fetch(...)` without checking res.ok and swallow
  // the error in a catch, so a 401/409 looked identical to success and the UI
  // cheerfully reported "approved". They now report what actually happened.
  const setStatus = useCallback(async (
    id: string | number,
    status: 'approved' | 'rejected'
  ): Promise<ActionResult> => {
    if (!isAdmin) return { ok: false, error: 'Admin only' };
    try {
      const res = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, status: res.status, error: body.error };
      }

      // Approving allots a seat server-side, so the member list is now stale.
      mutate();
      if (status === 'approved') globalMutate('/api/members');
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error. Check your connection.' };
    }
  }, [isAdmin, mutate]);

  const approveRequest = useCallback(
    (id: string | number) => setStatus(id, 'approved'), [setStatus]);

  const rejectRequest = useCallback(
    (id: string | number) => setStatus(id, 'rejected'), [setStatus]);

  const deleteRequest = useCallback(async (id: string | number): Promise<ActionResult> => {
    if (!isAdmin) return { ok: false, error: 'Admin only' };
    try {
      const res = await fetch(`/api/requests?id=${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, status: res.status, error: body.error };
      }
      mutate();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error. Check your connection.' };
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
