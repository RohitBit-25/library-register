'use client';

import { useMembers } from '@/hooks/useMembers';
import { useStats } from '@/hooks/useStats';
import { useToast } from '@/hooks/useToast';
import StatCard from '@/components/ui/StatCard';
import Badge, { BadgeVariant } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getSeatStatus, fmtDate, daysUntilExpiry } from '@/lib/utils';
import { type Member } from '@/lib/types';
import { Users, UserMinus, AlertTriangle, CalendarX, Check, RefreshCw, TrendingUp, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';

const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants: Variants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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

  const alertBorderColors: Record<string, string> = {
    expired: 'border-l-[var(--ruby-500)]',
    due: 'border-l-[var(--marigold-500)]',
    expiring: 'border-l-[var(--emerald-500)]',
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="mb-[var(--space-6)] flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[var(--tracking-tight)] text-[var(--text-primary)] flex items-center gap-[var(--space-2)]">
            Dashboard
            <Sparkles className="w-5 h-5 text-[var(--sapphire-500)]" />
          </h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-[var(--space-1)]">
            {dateStr}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-[var(--space-2)] text-xs font-mono text-[var(--text-tertiary)] bg-[var(--bg-elevated)] border-[1.5px] border-[var(--border-subtle)] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)] shadow-[var(--shadow-sm)]">
          <TrendingUp className="w-3.5 h-3.5 text-[var(--emerald-500)]" />
          {Math.round((stats.occupied / 95) * 100)}% Occupied
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--space-3)] sm:gap-[var(--space-4)] mb-[var(--space-6)]">
        <StatCard
          value={stats.occupied}
          label="Occupied Seats"
          accent="blue"
          icon={<Users className="w-5 h-5" />}
          onClick={() => router.push('/members?filter=active')}
        />
        <StatCard
          value={stats.vacant}
          label="Vacant Seats"
          accent="gray"
          icon={<UserMinus className="w-5 h-5" />}
          onClick={() => router.push('/members?filter=vacant')}
        />
        <StatCard
          value={stats.due}
          label="Fee Pending"
          accent="amber"
          icon={<AlertTriangle className="w-5 h-5" />}
          onClick={() => router.push('/members?filter=due')}
        />
        <StatCard
          value={stats.expiring + stats.expired}
          label="Expiring / Expired"
          accent="red"
          icon={<CalendarX className="w-5 h-5" />}
          onClick={() => router.push('/members?filter=expired')}
        />
      </motion.div>

      {/* Alert banner */}
      {alerts.length > 0 && (
        <motion.div variants={itemVariants} className="mb-[var(--space-6)]">
          <Card variant="base" className="overflow-hidden">
            <div className="px-[var(--space-5)] py-[var(--space-4)] border-b border-[var(--border-subtle)] bg-[var(--bg-muted)]">
              <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] flex items-center gap-[var(--space-2)]">
                <AlertTriangle className="w-4 h-4 text-[var(--marigold-500)]" />
                Alerts
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--marigold-500)]/10 text-[var(--marigold-500)]">
                  {alerts.length}
                </span>
              </h2>
            </div>
            <div className="divide-y divide-[var(--border-subtle)] max-h-[280px] overflow-y-auto">
              {alerts.map(m => (
                <div
                  key={`alert-${m.seat}`}
                  className={`flex items-center justify-between px-[var(--space-5)] py-[var(--space-3)] hover:bg-[var(--bg-muted)] transition-colors border-l-4 ${alertBorderColors[m.alertType]}`}
                >
                  <div className="flex items-center gap-[var(--space-3)] min-w-0">
                    <span className="text-xs font-mono font-bold text-[var(--text-tertiary)] shrink-0 w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]">
                      {m.seat}
                    </span>
                    <div className="min-w-0">
                      <span className="text-sm font-[var(--font-body)] font-medium text-[var(--text-primary)] truncate block">
                        {m.name}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {m.alertType === 'due' && 'Fee not paid'}
                        {m.alertType === 'expired' && `Expired ${fmtDate(m.expiry)}`}
                        {m.alertType === 'expiring' && `Expires in ${daysUntilExpiry(m.expiry)} days`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-[var(--space-2)] shrink-0 ml-[var(--space-3)]">
                    {m.alertType === 'due' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleMarkPaid(m.seat)}
                        className="bg-[var(--emerald-500)] text-[var(--saffron-50)] border-transparent hover:bg-[var(--emerald-600)]"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Mark paid
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`/seat-grid?seat=${m.seat}`)}
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        Renew
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Bottom row: Sparkline + Priority table */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-[var(--space-4)]">
        {/* Sparkline */}
        <Card variant="base" className="lg:col-span-2 p-[var(--space-5)]">
          <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-[var(--space-4)]">
            Occupancy This Month
          </h3>
          <Sparkline data={occupancyData} />
        </Card>

        {/* Priority table */}
        <Card variant="base" className="lg:col-span-3 overflow-hidden">
          <div className="px-[var(--space-5)] py-[var(--space-4)] border-b border-[var(--border-subtle)] bg-[var(--bg-muted)]">
            <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
              Priority Members
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--text-tertiary)] bg-[var(--bg-muted)] uppercase tracking-wider font-semibold">
                  <th className="px-[var(--space-5)] py-[var(--space-3)]">#</th>
                  <th className="px-[var(--space-5)] py-[var(--space-3)]">Name</th>
                  <th className="px-[var(--space-5)] py-[var(--space-3)] hidden sm:table-cell">Expires</th>
                  <th className="px-[var(--space-5)] py-[var(--space-3)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                {priorityMembers.map(m => (
                  <tr key={m.seat} className="hover:bg-[var(--bg-muted)] transition-colors">
                    <td className="px-[var(--space-5)] py-[var(--space-3)] font-mono text-[var(--text-secondary)]">
                      {m.seat}
                    </td>
                    <td className="px-[var(--space-5)] py-[var(--space-3)] font-medium text-[var(--text-primary)]">
                      {m.name.length > 14 ? m.name.slice(0, 12) + '…' : m.name}
                    </td>
                    <td className="px-[var(--space-5)] py-[var(--space-3)] text-[var(--text-secondary)] hidden sm:table-cell">
                      {fmtDate(m.expiry)}
                    </td>
                    <td className="px-[var(--space-5)] py-[var(--space-3)]">
                      <Badge variant={getSeatStatus(m) as BadgeVariant} />
                    </td>
                  </tr>
                ))}
                {priorityMembers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-[var(--space-5)] py-[var(--space-8)] text-center text-[var(--text-tertiary)]">
                      <div className="flex flex-col items-center gap-[var(--space-2)]">
                        <div className="w-12 h-12 rounded-[var(--radius-full)] bg-[var(--emerald-500)]/10 flex items-center justify-center">
                          <Check className="w-6 h-6 text-[var(--emerald-500)]" />
                        </div>
                        <span className="font-[var(--weight-medium)]">No alerts — everything looks good!</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
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
      {/* Gradient Fill */}
      <path d={fillD} fill="url(#sparkGrad)" opacity={0.2} />
      {/* Line */}
      <path d={pathD} fill="none" stroke="url(#sparkLineGrad)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Current dot */}
      <circle
        cx={pad + ((data.length - 1) / (data.length - 1)) * (w - pad * 2)}
        cy={h - pad - ((data[data.length - 1] - min) / (max - min || 1)) * (h - pad * 2)}
        r={5}
        fill="var(--sapphire-500)"
        stroke="var(--bg-elevated)"
        strokeWidth={2.5}
      />
      {/* Outer glow */}
      <circle
        cx={pad + ((data.length - 1) / (data.length - 1)) * (w - pad * 2)}
        cy={h - pad - ((data[data.length - 1] - min) / (max - min || 1)) * (h - pad * 2)}
        r={10}
        fill="var(--sapphire-500)"
        opacity={0.15}
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
          <stop offset="0%" stopColor="var(--sapphire-500)" />
          <stop offset="100%" stopColor="var(--sapphire-500)" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="sparkLineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--sapphire-400)" />
          <stop offset="100%" stopColor="var(--sapphire-500)" />
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
