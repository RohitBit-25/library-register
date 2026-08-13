'use client';

import useSWR from 'swr';
import { useAuth } from '@/hooks/useAuth';
import type { Member } from '@/lib/types';

/**
 * Dashboard counters, computed by MongoDB rather than in the browser.
 *
 * The dashboard used to call `useStats(members)`, which derived every counter
 * client-side from `GET /api/members` — meaning all 95 records, with names,
 * phones and join dates, were shipped just to render five numbers. This asks
 * the server for the numbers instead.
 */
export interface DashboardStats {
  occupied: number;
  vacant: number;
  total: number;
  expired: number;
  due: number;
  expiring: number;
  /** Everyone owing money, including those also expired (`due` excludes them). */
  withDues: number;
  byDuration: Record<string, number>;
  expiredMembers: Member[];
  dueMembers: Member[];
  expiringThisWeek: Member[];
  truncated: { expired: boolean; due: boolean; expiring: boolean };
  revenue: {
    /** Owed right now — exact, derived from the plan rate table. */
    outstanding: number;
    /** Total value of every active plan. */
    contractValue: number;
    /** All plans normalised to a per-month figure. */
    monthlyRunRate: number;
    /** Real stamped payments in the last 30 days. */
    collected30d: number;
    collectedThisMonth: number;
    paymentCount30d: number;
    /** False until a payment is recorded — lets the UI say "not tracked yet"
     *  rather than implying the library collected nothing. */
    hasPaymentHistory: boolean;
  };
  /** Genuine daily attendance, not a generated curve. */
  trend: { date: string; present: number }[];
  trendDaysWithData: number;
  /** Real snapshot rows. Gaps are absent, never interpolated. */
  occupancyHistory: { date: string; occupied: number; vacant: number; collected: number; contractValue: number }[];
  /** Month-over-month change, or null when there is not enough history. */
  growth: { from: string; to: string; occupiedDelta: number; pct: number } | null;
  asOf: string;
}

const EMPTY: DashboardStats = {
  occupied: 0, vacant: 0, total: 0,
  expired: 0, due: 0, expiring: 0, withDues: 0,
  byDuration: { '1M': 0, '3M': 0, '6M': 0, '1Y': 0 },
  expiredMembers: [], dueMembers: [], expiringThisWeek: [],
  truncated: { expired: false, due: false, expiring: false },
  revenue: {
    outstanding: 0, contractValue: 0, monthlyRunRate: 0,
    collected30d: 0, collectedThisMonth: 0, paymentCount30d: 0, hasPaymentHistory: false,
  },
  trend: [], trendDaysWithData: 0,
  occupancyHistory: [], growth: null,
  asOf: '',
};

const fetcher = async (url: string): Promise<DashboardStats> => {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`Stats request failed: ${res.status}`);
  return res.json();
};

export function useDashboardStats() {
  const { isAdmin } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    isAdmin ? '/api/stats' : null,
    fetcher,
    { revalidateOnFocus: true, keepPreviousData: true }
  );

  return {
    stats: data ?? EMPTY,
    isLoading: isAdmin && isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
