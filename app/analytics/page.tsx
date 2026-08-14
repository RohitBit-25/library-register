'use client';

import { useMembers } from '@/hooks/useMembers';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useToast } from '@/hooks/useToast';
import StatCard from '@/components/ui/StatCard';
import Badge, { BadgeVariant } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import DurationDonut from '@/components/charts/DurationDonut';
import { Button } from '@/components/ui/Button';
import { getSeatStatus, fmtDate, daysUntilExpiry } from '@/lib/utils';
import { type Member } from '@/lib/types';
import { formatINR, getPlanRates } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import { Users, UserMinus, AlertTriangle, CalendarX, Check, RefreshCw, TrendingUp, IndianRupee } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';

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
  // Counters and alert lists come from the server (MongoDB aggregation).
  // `update` still needs useMembers for the optimistic Mark-Paid write.
  const { update } = useMembers();
  const { stats, refresh: refreshStats } = useDashboardStats();
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


  const handleMarkPaid = async (seat: number) => {
    await update(seat, { fee: 'paid' }, (msg) => addToast('error', msg));
    // Counters live on the server now, so they must be re-fetched — the
    // optimistic member update alone no longer moves them.
    await refreshStats();
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
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Dashboard"
          subtitle={dateStr}
          actions={
            <div className="hidden items-center gap-2 rounded-lg bg-[var(--bg-muted)] px-3 py-1.5 text-xs font-semibold tabular text-[var(--text-secondary)] sm:flex">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--emerald-600)]" aria-hidden="true" />
              {Math.round((stats.occupied / 95) * 100)}% occupied
            </div>
          }
        />
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--space-3)] sm:gap-[var(--space-4)] mb-[var(--space-6)]">
        <StatCard
          value={stats.occupied}
          label="Occupied seats"
          accent="gray"
          icon={<Users className="w-5 h-5" />}
          onClick={() => router.push('/members?filter=active')}
        />
        <StatCard
          value={stats.vacant}
          label="Vacant seats"
          accent="gray"
          icon={<UserMinus className="w-5 h-5" />}
          onClick={() => router.push('/members?filter=vacant')}
        />
        <StatCard
          value={stats.due}
          label="Fee pending"
          accent="amber"
          icon={<AlertTriangle className="w-5 h-5" />}
          onClick={() => router.push('/members?filter=due')}
        />
        <StatCard
          value={stats.expired}
          label="Expired"
          accent="red"
          icon={<CalendarX className="w-5 h-5" />}
          onClick={() => router.push('/members?filter=expired')}
        />
      </motion.div>

      {/* ── Money ──────────────────────────────────────────────────
          The register tracked paid/due but never an amount, so the question
          it exists to answer — how much is outstanding — had no answer.
          Every figure here derives from lib/pricing.ts. */}
      <motion.div variants={itemVariants} className="mb-[var(--space-6)]">
        <Card variant="base" className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-muted)] px-[var(--space-5)] py-[var(--space-4)]">
            <h2 className="font-display flex items-center gap-[var(--space-2)] text-sm font-semibold text-[var(--text-primary)]">
              <IndianRupee className="h-4 w-4 text-[var(--emerald-600)]" aria-hidden="true" />
              Fees
            </h2>
            <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
              at {getPlanRates()['1M']}/mo base rate
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-px bg-[var(--border-subtle)] lg:grid-cols-4">
            <MoneyStat
              label="Outstanding"
              value={formatINR(stats.revenue.outstanding)}
              tone={stats.revenue.outstanding > 0 ? 'warn' : 'ok'}
              hint={`${stats.withDues} member${stats.withDues === 1 ? '' : 's'} owing`}
              onClick={() => router.push('/members?filter=due')}
            />
            <MoneyStat
              label="Collected (30d)"
              value={
                stats.revenue.hasPaymentHistory
                  ? formatINR(stats.revenue.collected30d)
                  : 'Not tracked yet'
              }
              tone={stats.revenue.hasPaymentHistory ? 'ok' : 'neutral'}
              hint={
                stats.revenue.hasPaymentHistory
                  ? `${stats.revenue.paymentCount30d} payment${stats.revenue.paymentCount30d === 1 ? '' : 's'} · ${formatINR(stats.revenue.collectedThisMonth)} this month`
                  : 'starts once fees are marked paid'
              }
            />
            <MoneyStat
              label="Active plan value"
              value={formatINR(stats.revenue.contractValue)}
              hint={`${stats.occupied} active membership${stats.occupied === 1 ? '' : 's'}`}
            />
            <MoneyStat
              label="Monthly run rate"
              value={formatINR(stats.revenue.monthlyRunRate)}
              hint="all plans normalised per month"
            />
          </dl>
        </Card>
      </motion.div>

      {/* Alert banner */}
      {alerts.length > 0 && (
        <motion.div variants={itemVariants} className="mb-[var(--space-6)]">
          <Card variant="base" className="overflow-hidden">
            <div className="px-[var(--space-5)] py-[var(--space-4)] border-b border-[var(--border-subtle)] bg-[var(--bg-muted)]">
              <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] flex items-center gap-[var(--space-2)]">
                <AlertTriangle className="w-4 h-4 text-[var(--marigold-700)]" />
                Alerts
                <span className="tabular rounded-full bg-[var(--marigold-50)] px-2 py-0.5 text-[10px] font-bold text-[var(--marigold-700)]">
                  {alerts.length}
                </span>
              </h2>
            </div>
            <div className="relative">
            <div className="max-h-[280px] divide-y divide-[var(--border-subtle)] overflow-y-auto">
              {alerts.map(m => (
                <div
                  key={`alert-${m.seat}`}
                  className={`flex items-center justify-between px-[var(--space-5)] py-[var(--space-3)] hover:bg-[var(--bg-muted)] transition-colors border-l ${alertBorderColors[m.alertType]}`}
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
                        className="bg-[var(--emerald-600)] text-[var(--text-inverse)] border-transparent hover:bg-[var(--emerald-600)]"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Mark paid
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`/?seat=${m.seat}`)}
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        Renew
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {alerts.length > 4 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--bg-surface)] to-transparent"
              />
            )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Bottom row: Sparkline + Priority table */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--space-4)] mb-[var(--space-6)]">
        {/* Membership mix — byDuration was already computed by /api/stats and
            thrown away; DurationDonut existed but nothing imported it. */}
        <Card variant="base" className="lg:col-span-2 p-[var(--space-5)]">
          <h3 className="font-display mb-[var(--space-4)] text-sm font-semibold text-[var(--text-primary)]">
            Membership Mix
          </h3>
          <DurationDonut data={stats.byDuration} />
        </Card>

        {/* Attendance trend — real records, not a generated curve */}
        <Card variant="base" className="lg:col-span-2 p-[var(--space-5)]">
          <div className="mb-[var(--space-4)] flex items-baseline justify-between gap-2">
            <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
              Daily Attendance
            </h3>
            <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
              last 30 days
            </span>
          </div>

          {stats.trendDaysWithData === 0 ? (
            // Saying so beats drawing a flat line that looks like real zero
            // attendance. This chart previously rendered Math.random() noise.
            <div className="flex h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] text-center">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                No attendance recorded yet
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                Mark attendance to start building this trend
              </p>
            </div>
          ) : (
            <>
              <Sparkline
                data={stats.trend.map((d) => d.present)}
                startLabel={formatShortDate(stats.trend[0]?.date)}
              />
              <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
                {stats.trendDaysWithData} of 30 days have records
                {stats.trendDaysWithData < 30 && ' — gaps show as zero'}
              </p>
            </>
          )}
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
                  <th scope="col" className="w-16 px-[var(--space-5)] py-[var(--space-3)]">Seat</th>
                  <th scope="col" className="px-[var(--space-5)] py-[var(--space-3)]">Name</th>
                  <th scope="col" className="hidden w-32 px-[var(--space-5)] py-[var(--space-3)] sm:table-cell">Expires</th>
                  <th scope="col" className="w-32 px-[var(--space-5)] py-[var(--space-3)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                {priorityMembers.map(m => (
                  <tr key={m.seat} className="hover:bg-[var(--bg-muted)] transition-colors">
                    <td className="px-[var(--space-5)] py-[var(--space-3)] tabular text-[var(--text-secondary)]">
                      {m.seat}
                    </td>
                    <td className="max-w-0 truncate px-[var(--space-5)] py-[var(--space-3)] font-medium text-[var(--text-primary)]">
                      <span title={m.name}>{m.name}</span>
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
                          <Check className="w-6 h-6 text-[var(--emerald-600)]" />
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

/** "2026-07-15" → "15 Jul". Parsed as parts, never `new Date(string)`,
 *  which reads a bare date as UTC and shifts it a day back in IST. */
function formatShortDate(iso?: string): string {
  if (!iso) return '';
  const [, m, d] = iso.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[m - 1] ?? ''}`.trim();
}

// ─── Sparkline SVG Component ────────────────────────────────────

/**
 * `startLabel` is the first date in the series, not a constant. The axis used
 * to read "Mar 1" whatever the window actually covered — on a 30-day trend
 * ending 13 August it was mislabelling the range by four months.
 */
function Sparkline({ data, startLabel }: { data: number[]; startLabel: string }) {
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
    <>
    {/*
      The SVG stretches to the container width, so anything sized in viewBox
      units scales with it. The two axis labels were `fontSize={10}` inside
      that viewBox and rendered at roughly 28px on a desktop — larger than the
      card's own heading. They live in HTML now, where 11px means 11px.
    */}
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
        fill="var(--saffron-600)"
        stroke="var(--bg-elevated)"
        strokeWidth={2.5}
      />
      {/* Outer glow */}
      <circle
        cx={pad + ((data.length - 1) / (data.length - 1)) * (w - pad * 2)}
        cy={h - pad - ((data[data.length - 1] - min) / (max - min || 1)) * (h - pad * 2)}
        r={10}
        fill="var(--saffron-600)"
        opacity={0.15}
      />
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--saffron-500)" />
          <stop offset="100%" stopColor="var(--saffron-500)" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="sparkLineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--saffron-500)" />
          <stop offset="100%" stopColor="var(--saffron-700)" />
        </linearGradient>
      </defs>
    </svg>
    <div className="flex items-center justify-between px-1 pt-1 text-[11px] font-medium tabular text-[var(--text-tertiary)]">
      <span>{startLabel}</span>
      <span>Today</span>
    </div>
    </>
  );
}

// The 30-day "occupancy" curve used to be generated here with Math.random()
// and rendered as though it were history. It is now real attendance data from
// /api/stats — see the Daily Attendance card above.

/* ─── Money stat tile ─────────────────────────────────────────── */

function MoneyStat({
  label,
  value,
  hint,
  tone = 'neutral',
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'ok' | 'warn';
  onClick?: () => void;
}) {
  const toneClass =
    tone === 'warn' ? 'text-[var(--marigold-700)]'
    : tone === 'ok' ? 'text-[var(--emerald-600)]'
    : 'text-[var(--text-primary)]';

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      {...(onClick ? { onClick, type: 'button' as const } : {})}
      className={cn(
        'bg-[var(--bg-surface)] p-[var(--space-4)] text-left',
        onClick && 'cursor-pointer transition-colors hover:bg-[var(--bg-muted)]'
      )}
    >
      <dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
        {label}
      </dt>
      <dd>
        <span className={cn('tabular mt-1 block font-display text-xl font-semibold', toneClass)}>
          {value}
        </span>
        {hint && (
          <span className="mt-0.5 block text-[11px] text-[var(--text-tertiary)]">{hint}</span>
        )}
      </dd>
    </Wrapper>
  );
}
