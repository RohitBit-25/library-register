'use client';

import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import { type Member, type NewMember } from '@/lib/types';
import { calcExpiry } from '@/lib/utils';

// ─── Resilient fetcher with error handling ─────────────────────────
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error(`API Error: ${res.status} ${res.statusText}`);
    Object.assign(error, { status: res.status });
    throw error;
  }
  return res.json();
};

// ─── Retry helper for transient failures ───────────────────────────
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  delay = 500
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) return res; // Don't retry client errors
      if (attempt < retries) await new Promise(r => setTimeout(r, delay * (attempt + 1)));
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, delay * (attempt + 1)));
    }
  }
  throw new Error(`Failed after ${retries + 1} attempts: ${url}`);
}

// ─── Hook ──────────────────────────────────────────────────────────

/** Someone queued for a seat while the library was full. */
export type WaitlistEntry = {
  id: string;
  seat: number;
  userName: string;
  userPhone: string;
};

export type MemberError = {
  message: string;
  action: string;
  seat?: number;
  timestamp: number;
};

/**
 * Every failure this app returns carries an `x-request-id` that also appears
 * in the server's log line (lib/log.ts). Without surfacing it, a report of
 * "adding a member failed this morning" cannot be matched to a log entry —
 * so the id rides along on the thrown error and ends up in the toast.
 */
function errorRef(res: Response): string {
  const id = res.headers.get('x-request-id');
  return id ? ` (ref ${id})` : '';
}

/** The ref stashed on a thrown error by `errorRef`, or nothing. */
function refOf(err: unknown): string {
  const cause = err instanceof Error ? err.cause : undefined;
  return typeof cause === 'string' ? cause : '';
}

export function useMembers() {
  const [lastError, setLastError] = useState<MemberError | null>(null);

  const { data: rawMembers, mutate, isLoading, error: swrError } = useSWR<Member[]>(
    '/api/members',
    fetcher,
    {
      // No fallbackData. Seeding this with 95 vacant seats made every load
      // flash "all seats free" before the real data arrived — callers should
      // render <Skeleton> while `isLoading` instead.
      revalidateOnFocus: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onError: (err) => {
        setLastError({
          message: `Failed to load members: ${err.message}`,
          action: 'fetch',
          timestamp: Date.now(),
        });
      },
    }
  );

  const members = useMemo(() => Array.isArray(rawMembers) ? rawMembers : [], [rawMembers]);
  const isError = !!swrError || !!lastError;
  /**
   * The list could not be loaded at all — nothing to show. Distinct from
   * `isError`, which also fires when a save fails over data that is fine.
   * Pages must show this as an error: rendered as an empty list it read as
   * "no free seats" / "0 members", which was simply untrue.
   */
  const loadFailed = !!swrError && rawMembers === undefined;
  const retry = useCallback(() => { mutate(); }, [mutate]);
  /** Show a change on screen without saving it (for held actions — see
   *  useUndoable). `retry()` puts the server's version back. */
  const preview = useCallback((seat: number, patch: Partial<Member>) => {
    mutate((cur) => cur?.map((m) => (m.seat === seat ? { ...m, ...patch } : m)), false);
  }, [mutate]);

  // ─── Clear error ──────────────────────────────────────────────
  const clearError = useCallback(() => setLastError(null), []);

  // ─── Update member with rollback ─────────────────────────────
  const update = useCallback(async (
    seat: number,
    patch: Partial<Member> & { renewal?: boolean; amount?: number },
    onError?: (msg: string) => void
  ) => {
    // Snapshot for rollback
    const previousData = rawMembers ? [...rawMembers] : undefined;

    // Optimistic update
    mutate(
      (current) => {
        if (!current) return current;
        return current.map(m => m.seat === seat ? { ...m, ...patch } : m);
      },
      false
    );

    try {
      const res = await fetchWithRetry(`/api/members/${seat}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`, { cause: errorRef(res) });
      }

      mutate(); // Revalidate
    } catch (err) {
      // Rollback optimistic update
      if (previousData) mutate(previousData, false);

      const msg = `Failed to update Seat ${seat}. Please retry.${refOf(err)}`;
      setLastError({ message: msg, action: 'update', seat, timestamp: Date.now() });
      onError?.(msg);
    }
  }, [mutate, rawMembers]);

  // ─── Vacate member with rollback ─────────────────────────────
  // Returns the people waiting for a seat, so the caller can say so straight
  // away. A freed seat is the only moment the waitlist is actionable.
  const vacate = useCallback(async (
    seat: number,
    onError?: (msg: string) => void
  ): Promise<WaitlistEntry[]> => {
    const previousData = rawMembers ? [...rawMembers] : undefined;

    mutate(
      (current) => {
        if (!current) return current;
        return current.map(m => m.seat === seat ? {
          ...m,
          name: '',
          phone: '',
          joinDate: '',
          duration: '' as Member['duration'],
          expiry: '',
          fee: '' as Member['fee'],
          shift: 'morning',
          vacant: true,
          paymentMode: undefined,
          documentStatus: undefined,
          termsAccepted: undefined,
        } : m);
      },
      false
    );

    try {
      const res = await fetchWithRetry(`/api/members/${seat}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Server returned ${res.status}`, { cause: errorRef(res) });
      const body = await res.json().catch(() => null);
      mutate();
      return Array.isArray(body?.waitlist) ? body.waitlist : [];
    } catch (err) {
      if (previousData) mutate(previousData, false);

      const msg = `Failed to vacate Seat ${seat}. Please retry.${refOf(err)}`;
      setLastError({ message: msg, action: 'vacate', seat, timestamp: Date.now() });
      onError?.(msg);
      return [];
    }
  }, [mutate, rawMembers]);

  // ─── Add member with rollback ────────────────────────────────
  const add = useCallback(async (
    seatNumber: number,
    data: NewMember,
    onError?: (msg: string) => void
  ): Promise<boolean> => {
    const isOccupied = members.some(m => m.seat === seatNumber && !m.vacant);
    if (isOccupied) return false;

    const previousData = rawMembers ? [...rawMembers] : undefined;

    mutate(
      (current) => {
        if (!current) return current;
        return current.map(m => m.seat === seatNumber ? { ...m, ...data, seat: seatNumber, vacant: false } : m);
      },
      false
    );

    try {
      const res = await fetchWithRetry(`/api/members/${seatNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, vacant: false }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`, { cause: errorRef(res) });
      mutate();
      return true;
    } catch (err) {
      if (previousData) mutate(previousData, false);

      const msg = `Failed to add member to Seat ${seatNumber}. Please retry.${refOf(err)}`;
      setLastError({ message: msg, action: 'add', seat: seatNumber, timestamp: Date.now() });
      onError?.(msg);
      return false;
    }
  }, [members, mutate, rawMembers]);

  // ─── Renew membership ────────────────────────────────────────
  const renew = useCallback((
    seat: number,
    joinDate: string,
    duration: '1M' | '3M' | '6M' | '1Y',
    onError?: (msg: string) => void,
    /** Rupees actually paid; omitted = the plan price. */
    amount?: number,
  ) => {
    const expiry = calcExpiry(joinDate, duration);
    // `renewal` tells the server this is a newly paid term, so it is ledgered
    // even when the previous term was already paid.
    update(seat, { joinDate, duration, expiry, fee: 'paid', renewal: true, ...(amount ? { amount } : {}) }, onError);
  }, [update]);

  // ─── Get next vacant seat ────────────────────────────────────
  const getNextVacantSeat = useCallback((): number => {
    const m = members.find(m => m.vacant);
    return m ? m.seat : -1;
  }, [members]);

  // ─── Bulk mark paid with rollback ────────────────────────────
  const bulkMarkPaid = useCallback(async (
    seats: number[],
    onError?: (msg: string) => void
  ) => {

    mutate(
      (current) => {
        if (!current) return current;
        return current.map(m => seats.includes(m.seat) ? { ...m, fee: 'paid' } : m);
      },
      false
    );

    try {
      const results = await Promise.allSettled(
        seats.map(seat =>
          fetchWithRetry(`/api/members/${seat}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fee: 'paid' }),
          })
        )
      );

      // fetchWithRetry resolves on a 4xx (an expired session, a seat that
      // changed underneath us), so a refused response counts as a failure too.
      const failures = results.filter(r => r.status === 'rejected' || !r.value.ok);
      if (failures.length > 0) {
        throw new Error(`${failures.length} of ${seats.length} updates failed`);
      }

      mutate();
    } catch (err) {
      // Some seats may have gone through: reload what the server holds rather
      // than restoring a snapshot that would hide them.
      mutate();

      const msg = `Bulk payment update failed. ${(err as Error).message}`;
      setLastError({ message: msg, action: 'bulkMarkPaid', timestamp: Date.now() });
      onError?.(msg);
    }
  }, [mutate]);

  // ─── Bulk remove with rollback ───────────────────────────────
  const bulkRemove = useCallback(async (
    seats: number[],
    onError?: (msg: string) => void
  ) => {

    mutate(
      (current) => {
        if (!current) return current;
        return current.map(m => seats.includes(m.seat) ? {
          ...m,
          name: '',
          phone: '',
          joinDate: '',
          duration: '' as Member['duration'],
          expiry: '',
          fee: '' as Member['fee'],
          shift: 'morning',
          vacant: true,
          paymentMode: undefined,
          documentStatus: undefined,
          termsAccepted: undefined,
        } : m);
      },
      false
    );

    try {
      const results = await Promise.allSettled(
        seats.map(seat =>
          fetchWithRetry(`/api/members/${seat}`, { method: 'DELETE' })
        )
      );

      // fetchWithRetry resolves on a 4xx (an expired session, a seat that
      // changed underneath us), so a refused response counts as a failure too.
      const failures = results.filter(r => r.status === 'rejected' || !r.value.ok);
      if (failures.length > 0) {
        throw new Error(`${failures.length} of ${seats.length} removals failed`);
      }

      mutate();
    } catch (err) {
      // Some seats may have gone through: reload what the server holds rather
      // than restoring a snapshot that would hide them.
      mutate();

      const msg = `Bulk remove failed. ${(err as Error).message}`;
      setLastError({ message: msg, action: 'bulkRemove', timestamp: Date.now() });
      onError?.(msg);
    }
  }, [mutate]);

  // ─── Move a member to another desk ───────────────────────────
  const move = useCallback(async (from: number, to: number, onError?: (msg: string) => void) => {
    try {
      const res = await fetch('/api/members/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Server returned ${res.status}`);
      return true;
    } catch (err) {
      onError?.(`Couldn't move seat ${from} to ${to}. ${(err as Error).message}`);
      return false;
    } finally {
      mutate();
    }
  }, [mutate]);

  return {
    members,
    move,
    update,
    vacate,
    add,
    renew,
    getNextVacantSeat,
    bulkMarkPaid,
    bulkRemove,
    isLoading,
    isError,
    loadFailed,
    retry,
    preview,
    lastError,
    clearError,
  };
}
