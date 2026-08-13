import type { Duration } from './types.ts';

// ─── Membership pricing ─────────────────────────────────────────
// The app tracked `fee: 'paid' | 'due'` but had no notion of an amount, so
// "how much is outstanding?" — the question a fee register exists to answer —
// was unanswerable. Rates live here so there is exactly one place to change
// them, and every total in the app derives from this table.

/** Rupees per plan. Override per-deployment via NEXT_PUBLIC_PLAN_RATES. */
export const DEFAULT_PLAN_RATES: Record<Exclude<Duration, ''>, number> = {
  '1M': 700,
  '3M': 1900,
  '6M': 3600,
  '1Y': 6600,
};

/** Months each plan covers — used to normalise plans to a monthly figure. */
export const PLAN_MONTHS: Record<Exclude<Duration, ''>, number> = {
  '1M': 1,
  '3M': 3,
  '6M': 6,
  '1Y': 12,
};

/**
 * Rates, with an optional JSON override so a library can set its own prices
 * without a code change:
 *   NEXT_PUBLIC_PLAN_RATES={"1M":800,"3M":2200,"6M":4000,"1Y":7500}
 */
export function getPlanRates(): Record<string, number> {
  const raw = process.env.NEXT_PUBLIC_PLAN_RATES;
  if (!raw) return DEFAULT_PLAN_RATES;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const rates: Record<string, number> = { ...DEFAULT_PLAN_RATES };
    for (const key of Object.keys(DEFAULT_PLAN_RATES)) {
      const v = parsed[key];
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) rates[key] = v;
    }
    return rates;
  } catch {
    // A malformed override must not take the pricing table down with it.
    console.warn('NEXT_PUBLIC_PLAN_RATES is not valid JSON — using default rates.');
    return DEFAULT_PLAN_RATES;
  }
}

/** Price of one plan. Unknown/empty duration is worth nothing, not NaN. */
export function planPrice(duration: string | undefined | null): number {
  if (!duration) return 0;
  return getPlanRates()[duration] ?? 0;
}

/** A plan's value expressed as a monthly figure, for comparing plans fairly. */
export function monthlyValue(duration: string | undefined | null): number {
  if (!duration) return 0;
  const months = PLAN_MONTHS[duration as Exclude<Duration, ''>];
  if (!months) return 0;
  return planPrice(duration) / months;
}

/** Indian-format currency, no decimals — amounts here are always whole rupees. */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/** Compact form for stat tiles: ₹1.2L, ₹45.6K, ₹800. */
export function formatINRCompact(amount: number): string {
  const n = Math.round(amount);
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n}`;
}
