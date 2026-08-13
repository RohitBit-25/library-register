'use client';

import useSWR from 'swr';
import { useAuth } from '@/hooks/useAuth';

export interface PaymentRow {
  id: string;
  seat: number;
  memberName: string;
  memberPhone: string;
  amount: number;
  duration: string;
  paymentMode: 'upi' | 'cash' | null;
  /** YYYY-MM-DD, local. */
  date: string;
  createdAt: string;
}

export interface PaymentsResult {
  payments: PaymentRow[];
  range: { from: string; to: string };
  total: number;
  count: number;
  /** True when more rows exist than were returned. */
  truncated: boolean;
}

const EMPTY: PaymentsResult = {
  payments: [],
  range: { from: '', to: '' },
  total: 0,
  count: 0,
  truncated: false,
};

const fetcher = async (url: string): Promise<PaymentsResult> => {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`Payments request failed: ${res.status}`);
  return res.json();
};

/**
 * The fee ledger. `/api/payments` existed but nothing rendered it, so every
 * recorded payment was invisible to the person who collected it.
 */
export function usePayments(opts: { from?: string; to?: string; seat?: number } = {}) {
  const { isAdmin } = useAuth();

  const params = new URLSearchParams();
  if (opts.from) params.set('from', opts.from);
  if (opts.to) params.set('to', opts.to);
  if (opts.seat !== undefined) params.set('seat', String(opts.seat));
  const qs = params.toString();

  const { data, error, isLoading, mutate } = useSWR<PaymentsResult>(
    isAdmin ? `/api/payments${qs ? `?${qs}` : ''}` : null,
    fetcher,
    { revalidateOnFocus: true, keepPreviousData: true }
  );

  return {
    data: data ?? EMPTY,
    isLoading: isAdmin && isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
