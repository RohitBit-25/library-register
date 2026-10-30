'use client';

import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useAttendance } from '@/hooks/useAttendance';
import { daysUntil, todayLocalISO } from '@/lib/seat-status';
import { formatINR, planPrice } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * The next 30 days, not the last 30: renewal money that should come in, money
 * at risk on lapsed seats, and which weekdays the hall actually fills — so
 * staffing and reminders can be planned.
 *
 * Every figure is computed from current members and recorded attendance;
 * nothing is projected beyond "these plans end, at these prices".
 */
export default function ForecastCard() {
  const { members } = useMembers();
  const { history } = useAttendance();

  const { dueIn30, dueCount, atRisk, riskCount } = useMemo(() => {
    const today = todayLocalISO();
    let dueIn30 = 0, dueCount = 0, atRisk = 0, riskCount = 0;
    for (const m of members) {
      if (m.vacant || !m.expiry) continue;
      const d = daysUntil(m.expiry, today);
      if (d >= 0 && d <= 30) { dueIn30 += planPrice(m.duration); dueCount++; }
      else if (d < 0) { atRisk += planPrice(m.duration); riskCount++; }
    }
    return { dueIn30, dueCount, atRisk, riskCount };
  }, [members]);

  // Average share of occupied desks present, per weekday, over recorded days.
  const byDay = useMemo(() => {
    const occupied = members.filter((m) => !m.vacant).length || 1;
    const sum = Array(7).fill(0), n = Array(7).fill(0);
    for (const h of history.slice(0, 60)) {
      const [y, mo, d] = h.date.split('-').map(Number);
      const wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
      sum[wd] += h.seats.length / occupied; n[wd]++;
    }
    return WEEKDAYS.map((label, i) => ({ label, pct: n[i] ? Math.round((sum[i] / n[i]) * 100) : null }));
  }, [members, history]);
  const peak = Math.max(...byDay.map((d) => d.pct ?? 0));

  return (
    <section aria-labelledby="forecast-h" className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-xs)]">
      <h2 id="forecast-h" className="flex items-center gap-2 font-display text-sm font-semibold text-[var(--text-primary)]">
        <TrendingUp className="size-4 text-[var(--emerald-600)]" aria-hidden="true" />
        Next 30 days
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-bold text-[var(--text-tertiary)]">Renewals due</dt>
          <dd className="mt-1 font-display text-2xl font-semibold tabular text-[var(--emerald-600)]">{formatINR(dueIn30)}</dd>
          <dd className="text-xs text-[var(--text-secondary)]">{dueCount} plans end — if every one renews</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-[var(--text-tertiary)]">At risk now</dt>
          <dd className="mt-1 font-display text-2xl font-semibold tabular text-[var(--ruby-600)]">{formatINR(atRisk)}</dd>
          <dd className="text-xs text-[var(--text-secondary)]">{riskCount} expired, still on a desk</dd>
        </div>
      </dl>

      <h3 className="mt-6 text-xs font-bold text-[var(--text-tertiary)]">How full the hall is, by weekday</h3>
      <ul className="mt-2 grid grid-cols-7 items-end gap-2" aria-label="Average attendance by weekday">
        {byDay.map((d) => (
          <li key={d.label} className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold tabular text-[var(--text-secondary)]">{d.pct === null ? '—' : `${d.pct}%`}</span>
            <span
              aria-hidden="true"
              className={cn('w-full rounded-t-[4px]', d.pct !== null && d.pct === peak ? 'bg-[var(--saffron-600)]' : 'bg-[var(--saffron-200)]')}
              style={{ height: `${Math.max(4, ((d.pct ?? 0) / Math.max(peak, 1)) * 56)}px` }}
            />
            <span className="text-xs text-[var(--text-tertiary)]">{d.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
