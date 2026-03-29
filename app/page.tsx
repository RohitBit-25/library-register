'use client';

import { useMembers } from '@/hooks/useMembers';
import { useStats } from '@/hooks/useStats';
import { useToast } from '@/hooks/useToast';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import { getSeatStatus, fmtDate, daysUntilExpiry } from '@/lib/utils';
import { type Member } from '@/lib/types';
import { Users, UserMinus, AlertTriangle, CalendarX, X, Check, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { members, update } = useMembers();
  const stats = useStats(members);
  const { addToast } = useToast();
  const router = useRouter();

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Alerts: expired first, then due, then expiring
  const alerts: (Member & { alertType: 'expired' | 'due' | 'expiring' })[] = [
    ...stats.expiredMembers.map(m => ({ ...m, alertType: 'expired' as const })),
    ...stats.dueMembers.map(m => ({ ...m, alertType: 'due' as const })),
    ...stats.expiringThisWeek.map(m => ({ ...m, alertType: 'expiring' as const })),
  ];

  // Priority members (top 10 needing attention)
  const priorityMembers = [...alerts].slice(0, 10);

  // Sparkline: last 30 days (mockable occupancy data)
  const occupancyData = generateSparklineData(stats.occupied);

  const handleMarkPaid = (seat: number) => {
    update(seat, { fee: 'paid' });
    addToast('success', `Seat ${seat} — fee marked as paid`);
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-primary-dark">
          Dashboard
        </h1>
        <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-0.5">
          {dateStr}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          value={stats.occupied}
          label="Occupied Seats"
          accent="blue"
          icon={<Users className="w-5 h-5 text-blue-accent" />}
          onClick={() => router.push('/members?filter=active')}
        />
        <StatCard
          value={stats.vacant}
          label="Vacant Seats"
          accent="gray"
          icon={<UserMinus className="w-5 h-5 text-gray-accent" />}
          onClick={() => router.push('/members?filter=vacant')}
        />
        <StatCard
          value={stats.due}
          label="Fee Pending"
          accent="amber"
          icon={<AlertTriangle className="w-5 h-5 text-due-border" />}
          onClick={() => router.push('/members?filter=due')}
        />
        <StatCard
          value={stats.expiring + stats.expired}
          label="Expiring / Expired"
          accent="red"
          icon={<CalendarX className="w-5 h-5 text-expired-border" />}
          onClick={() => router.push('/members?filter=expired')}
        />
      </div>

      {/* Alert banner */}
      {alerts.length > 0 && (
        <div className="mb-6 rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark overflow-hidden">
          <div className="px-4 py-3 border-b border-card-border dark:border-card-border-dark bg-bg dark:bg-bg-dark">
            <h2 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-due-border" />
              Alerts
              <span className="text-xs font-normal text-text-tertiary dark:text-text-tertiary-dark">
                ({alerts.length})
              </span>
            </h2>
          </div>
          <div className="divide-y divide-card-border/50 dark:divide-card-border-dark/50 max-h-[280px] overflow-y-auto">
            {alerts.map(m => (
              <div
                key={`alert-${m.seat}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-bg/50 dark:hover:bg-bg-dark/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono font-semibold text-text-tertiary dark:text-text-tertiary-dark shrink-0">
                    #{m.seat}
                  </span>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-text-primary dark:text-text-primary-dark truncate block">
                      {m.name}
                    </span>
                    <span className="text-xs text-text-tertiary dark:text-text-tertiary-dark">
                      {m.alertType === 'due' && 'Fee not paid'}
                      {m.alertType === 'expired' && `Expired ${fmtDate(m.expiry)}`}
                      {m.alertType === 'expiring' && `Expires in ${daysUntilExpiry(m.expiry)} days`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {m.alertType === 'due' ? (
                    <button
                      onClick={() => handleMarkPaid(m.seat)}
                      className="cursor-pointer flex items-center gap-1 rounded-md bg-active-fill dark:bg-active-fill-dark text-active-text dark:text-active-text-dark px-2.5 py-1.5 text-xs font-medium hover:shadow-sm transition-all"
                    >
                      <Check className="w-3 h-3" />
                      Mark paid
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push(`/seat-grid?seat=${m.seat}`)}
                      className="cursor-pointer flex items-center gap-1 rounded-md bg-blue-accent/10 text-blue-accent px-2.5 py-1.5 text-xs font-medium hover:shadow-sm transition-all"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Renew
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom row: Sparkline + Priority table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Sparkline */}
        <div className="lg:col-span-2 rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-4">
          <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-3">
            Occupancy This Month
          </h3>
          <Sparkline data={occupancyData} />
        </div>

        {/* Priority table */}
        <div className="lg:col-span-3 rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark overflow-hidden">
          <div className="px-4 py-3 border-b border-card-border dark:border-card-border-dark">
            <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
              Priority Members
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-tertiary dark:text-text-tertiary-dark">
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium hidden sm:table-cell">Expires</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/30 dark:divide-card-border-dark/30">
                {priorityMembers.map(m => (
                  <tr key={m.seat} className="hover:bg-bg/50 dark:hover:bg-bg-dark/50 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-medium text-text-primary dark:text-text-primary-dark">
                      {m.seat}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-text-primary dark:text-text-primary-dark">
                      {m.name.length > 14 ? m.name.slice(0, 12) + '…' : m.name}
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary dark:text-text-secondary-dark hidden sm:table-cell">
                      {fmtDate(m.expiry)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge status={getSeatStatus(m)} size="sm" />
                    </td>
                  </tr>
                ))}
                {priorityMembers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-text-tertiary dark:text-text-tertiary-dark">
                      No alerts — everything looks good!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sparkline SVG Component ────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const w = 400;
  const h = 100;
  const pad = 10;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
    return `${x},${y}`;
  });

  const pathD = `M${points.join(' L')}`;
  const fillD = `${pathD} L${pad + ((data.length - 1) / (data.length - 1)) * (w - pad * 2)},${h - pad} L${pad},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(pct => {
        const y = h - pad - (pct / 100) * (h - pad * 2);
        return (
          <line
            key={pct}
            x1={pad}
            y1={y}
            x2={w - pad}
            y2={y}
            stroke="currentColor"
            strokeOpacity={0.06}
            strokeWidth={1}
          />
        );
      })}
      {/* Fill */}
      <path d={fillD} fill="url(#sparkGrad)" opacity={0.15} />
      {/* Line */}
      <path d={pathD} fill="none" stroke="#2563EB" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Current dot */}
      <circle
        cx={pad + ((data.length - 1) / (data.length - 1)) * (w - pad * 2)}
        cy={h - pad - ((data[data.length - 1] - min) / (max - min || 1)) * (h - pad * 2)}
        r={4}
        fill="#2563EB"
        stroke="white"
        strokeWidth={2}
      />
      {/* Labels */}
      <text x={pad} y={h - 1} fontSize={10} fill="currentColor" opacity={0.4} className="font-mono">
        Mar 1
      </text>
      <text x={w - pad} y={h - 1} fontSize={10} fill="currentColor" opacity={0.4} textAnchor="end" className="font-mono">
        Today
      </text>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Generate mock sparkline data ───────────────────────────────

function generateSparklineData(current: number): number[] {
  const data: number[] = [];
  for (let i = 0; i < 30; i++) {
    const noise = Math.floor(Math.random() * 8) - 4;
    data.push(Math.max(30, Math.min(95, current + noise - Math.floor((29 - i) * 0.3))));
  }
  data[data.length - 1] = current;
  return data;
}
