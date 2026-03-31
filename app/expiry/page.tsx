'use client';

import { useMemo, useState } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/hooks/useToast';
import { daysUntilExpiry, fmtDate, cn } from '@/lib/utils';
import { type Member } from '@/lib/types';
import {
  CalendarSearch,
  AlertTriangle,
  Clock,
  CalendarDays,
  ShieldCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Flame,
  Timer,
  Search,
  X,
  MessageCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

/* ─── Types ───────────────────────────────────────────────────── */

type ExpiryBucket = 'expired' | 'today' | 'thisWeek' | 'thisMonth' | 'safe';

interface BucketMeta {
  key: ExpiryBucket;
  label: string;
  description: string;
  icon: React.ReactNode;
  accentClass: string;
  dotColor: string;
  barColor: string;
  headerBg: string;
  emptyMessage: string;
}

/* ─── Bucket Config ───────────────────────────────────────────── */

const BUCKETS: BucketMeta[] = [
  {
    key: 'expired',
    label: 'Expired',
    description: 'Membership already ended',
    icon: <Flame className="w-4 h-4" />,
    accentClass: 'accent-red',
    dotColor: 'bg-expired-border',
    barColor: 'bg-gradient-to-r from-[#E24B4A] to-[#F87171]',
    headerBg: 'bg-expired-fill/60 dark:bg-expired-fill-dark/60',
    emptyMessage: 'No expired memberships 🎉',
  },
  {
    key: 'today',
    label: 'Expires Today',
    description: 'Needs immediate attention',
    icon: <AlertTriangle className="w-4 h-4" />,
    accentClass: 'accent-red',
    dotColor: 'bg-[#DC2626]',
    barColor: 'bg-gradient-to-r from-[#DC2626] to-[#EF4444]',
    headerBg: 'bg-expired-fill/40 dark:bg-expired-fill-dark/40',
    emptyMessage: 'No memberships expiring today',
  },
  {
    key: 'thisWeek',
    label: 'This Week',
    description: 'Expiring in 1–7 days',
    icon: <Timer className="w-4 h-4" />,
    accentClass: 'accent-amber',
    dotColor: 'bg-expiring-border',
    barColor: 'bg-gradient-to-r from-[#EF9F27] to-[#FBBF24]',
    headerBg: 'bg-expiring-fill/50 dark:bg-expiring-fill-dark/50',
    emptyMessage: 'No memberships expiring this week',
  },
  {
    key: 'thisMonth',
    label: 'This Month',
    description: 'Expiring in 8–30 days',
    icon: <CalendarDays className="w-4 h-4" />,
    accentClass: 'accent-blue',
    dotColor: 'bg-blue-accent',
    barColor: 'bg-gradient-to-r from-[#2563EB] to-[#60A5FA]',
    headerBg: 'bg-blue-accent/8 dark:bg-blue-accent/10',
    emptyMessage: 'No memberships expiring this month',
  },
  {
    key: 'safe',
    label: 'Safe (30+ days)',
    description: 'No action needed yet',
    icon: <ShieldCheck className="w-4 h-4" />,
    accentClass: 'accent-green',
    dotColor: 'bg-active-border',
    barColor: 'bg-gradient-to-r from-[#639922] to-[#A3E635]',
    headerBg: 'bg-active-fill/50 dark:bg-active-fill-dark/50',
    emptyMessage: 'No members in this range',
  },
];

/* ─── Main Page ───────────────────────────────────────────────── */

export default function ExpiryPage() {
  const { members } = useMembers();
  const { addToast } = useToast();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [collapsedBuckets, setCollapsedBuckets] = useState<Set<ExpiryBucket>>(
    new Set(['safe'])
  );

  // ── Bucket members ────────────────────────────────────────────
  const bucketedMembers = useMemo(() => {
    const occupied = members.filter(m => !m.vacant && m.expiry);
    const result: Record<ExpiryBucket, (Member & { daysLeft: number })[]> = {
      expired: [],
      today: [],
      thisWeek: [],
      thisMonth: [],
      safe: [],
    };

    for (const m of occupied) {
      const d = daysUntilExpiry(m.expiry);
      const entry = { ...m, daysLeft: d };
      if (d < 0) result.expired.push(entry);
      else if (d === 0) result.today.push(entry);
      else if (d <= 7) result.thisWeek.push(entry);
      else if (d <= 30) result.thisMonth.push(entry);
      else result.safe.push(entry);
    }

    // Sort each bucket by urgency (most urgent first)
    result.expired.sort((a, b) => a.daysLeft - b.daysLeft);
    result.today.sort((a, b) => a.seat - b.seat);
    result.thisWeek.sort((a, b) => a.daysLeft - b.daysLeft);
    result.thisMonth.sort((a, b) => a.daysLeft - b.daysLeft);
    result.safe.sort((a, b) => a.daysLeft - b.daysLeft);

    return result;
  }, [members]);

  // ── Filtered by search ────────────────────────────────────────
  const filteredBuckets = useMemo(() => {
    if (!search.trim()) return bucketedMembers;
    const q = search.toLowerCase();
    const result: Record<ExpiryBucket, (Member & { daysLeft: number })[]> = {
      expired: [],
      today: [],
      thisWeek: [],
      thisMonth: [],
      safe: [],
    };
    for (const key of Object.keys(bucketedMembers) as ExpiryBucket[]) {
      result[key] = bucketedMembers[key].filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          String(m.seat).includes(q) ||
          m.phone.includes(q)
      );
    }
    return result;
  }, [bucketedMembers, search]);

  // ── Stats bar ─────────────────────────────────────────────────
  const totalExpired = bucketedMembers.expired.length;
  const totalToday = bucketedMembers.today.length;
  const totalWeek = bucketedMembers.thisWeek.length;
  const totalMonth = bucketedMembers.thisMonth.length;
  const totalUrgent = totalExpired + totalToday + totalWeek;

  const toggleBucket = (key: ExpiryBucket) => {
    setCollapsedBuckets(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleRenew = (seat: number) => {
    router.push(`/seat-grid?seat=${seat}`);
  };

  const handleWhatsApp = (m: Member) => {
    if (!m.phone) {
      addToast('error', 'No phone number available');
      return;
    }
    const dLeft = daysUntilExpiry(m.expiry);
    const expiryText =
      dLeft < 0
        ? `expired on ${fmtDate(m.expiry)}`
        : dLeft === 0
          ? `expires today`
          : `expires in ${dLeft} day${dLeft === 1 ? '' : 's'} (${fmtDate(m.expiry)})`;
    const message = encodeURIComponent(
      `Hello ${m.name.split(' ')[0]}, your library membership (Seat #${m.seat}) ${expiryText}. Please visit us to renew. Thank you! — Gangaur Library`
    );
    window.open(`https://wa.me/91${m.phone}?text=${message}`, '_blank');
  };

  return (
    <div className="animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary dark:text-text-primary-dark tracking-tight flex items-center gap-2">
            <CalendarSearch className="w-6 h-6 text-expired-border" />
            Expiry Tracker
          </h1>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-0.5">
            Members arranged by membership expiry urgency
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary dark:text-text-tertiary-dark" />
          <input
            type="text"
            placeholder="Search name, seat, phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl text-sm bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark text-text-primary dark:text-text-primary-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary-dark focus:outline-none focus:ring-2 focus:ring-blue-accent/40"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary dark:text-text-tertiary-dark hover:text-text-primary dark:hover:text-text-primary-dark cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Urgency Summary Bar ──────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <UrgencyStat
          count={totalExpired}
          label="Expired"
          gradient="from-[#E24B4A] to-[#F87171]"
          iconBg="bg-expired-fill dark:bg-expired-fill-dark"
          icon={<Flame className="w-4 h-4 text-expired-border" />}
        />
        <UrgencyStat
          count={totalToday}
          label="Today"
          gradient="from-[#DC2626] to-[#EF4444]"
          iconBg="bg-expired-fill dark:bg-expired-fill-dark"
          icon={<AlertTriangle className="w-4 h-4 text-[#DC2626]" />}
        />
        <UrgencyStat
          count={totalWeek}
          label="This Week"
          gradient="from-[#EF9F27] to-[#FBBF24]"
          iconBg="bg-expiring-fill dark:bg-expiring-fill-dark"
          icon={<Clock className="w-4 h-4 text-expiring-border" />}
        />
        <UrgencyStat
          count={totalMonth}
          label="This Month"
          gradient="from-[#2563EB] to-[#60A5FA]"
          iconBg="bg-blue-accent/10"
          icon={<CalendarDays className="w-4 h-4 text-blue-accent" />}
        />
      </div>

      {/* ── Urgency Progress bar ─────────────────────────────────── */}
      {totalUrgent > 0 && (
        <div className="mb-5 card-premium accent-red rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
              ⚠️ {totalUrgent} member{totalUrgent !== 1 ? 's' : ''} need attention
            </span>
            <span className="text-[11px] font-mono text-text-tertiary dark:text-text-tertiary-dark">
              {totalExpired} expired · {totalToday} today · {totalWeek} this week
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-bg dark:bg-bg-dark overflow-hidden flex">
            {totalExpired > 0 && (
              <div
                className="h-full bg-gradient-to-r from-[#E24B4A] to-[#F87171] transition-all duration-700"
                style={{
                  width: `${(totalExpired / totalUrgent) * 100}%`,
                }}
              />
            )}
            {totalToday > 0 && (
              <div
                className="h-full bg-gradient-to-r from-[#DC2626] to-[#EF4444] transition-all duration-700"
                style={{
                  width: `${(totalToday / totalUrgent) * 100}%`,
                }}
              />
            )}
            {totalWeek > 0 && (
              <div
                className="h-full bg-gradient-to-r from-[#EF9F27] to-[#FBBF24] transition-all duration-700"
                style={{
                  width: `${(totalWeek / totalUrgent) * 100}%`,
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Bucket Swim Lanes ─────────────────────────────────────── */}
      <div className="space-y-4 pb-20">
        {BUCKETS.map(bucket => {
          const items = filteredBuckets[bucket.key];
          const isCollapsed = collapsedBuckets.has(bucket.key);
          const totalInBucket = bucketedMembers[bucket.key].length;

          return (
            <div
              key={bucket.key}
              className={cn(
                'card-premium rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark overflow-hidden shadow-sm',
                bucket.accentClass
              )}
            >
              {/* Bucket Header */}
              <button
                onClick={() => toggleBucket(bucket.key)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors',
                  bucket.headerBg
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center',
                      bucket.key === 'expired'
                        ? 'bg-expired-fill dark:bg-expired-fill-dark text-expired-text dark:text-expired-text-dark'
                        : bucket.key === 'today'
                          ? 'bg-expired-fill dark:bg-expired-fill-dark text-expired-text dark:text-expired-text-dark'
                          : bucket.key === 'thisWeek'
                            ? 'bg-expiring-fill dark:bg-expiring-fill-dark text-expiring-text dark:text-expiring-text-dark'
                            : bucket.key === 'thisMonth'
                              ? 'bg-blue-accent/15 text-blue-accent'
                              : 'bg-active-fill dark:bg-active-fill-dark text-active-text dark:text-active-text-dark'
                    )}
                  >
                    {bucket.icon}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                        {bucket.label}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold',
                          totalInBucket > 0
                            ? bucket.key === 'safe'
                              ? 'bg-active-fill dark:bg-active-fill-dark text-active-text dark:text-active-text-dark'
                              : bucket.key === 'thisMonth'
                                ? 'bg-blue-accent/15 text-blue-accent'
                                : bucket.key === 'thisWeek'
                                  ? 'bg-expiring-fill dark:bg-expiring-fill-dark text-expiring-text dark:text-expiring-text-dark'
                                  : 'bg-expired-fill dark:bg-expired-fill-dark text-expired-text dark:text-expired-text-dark'
                            : 'bg-bg dark:bg-bg-dark text-text-tertiary dark:text-text-tertiary-dark'
                        )}
                      >
                        {totalInBucket}
                      </span>
                    </div>
                    <span className="text-[11px] text-text-tertiary dark:text-text-tertiary-dark">
                      {bucket.description}
                    </span>
                  </div>
                </div>
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-text-tertiary dark:text-text-tertiary-dark" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-text-tertiary dark:text-text-tertiary-dark" />
                )}
              </button>

              {/* Bucket Body */}
              {!isCollapsed && (
                <div className="divide-y divide-card-border/40 dark:divide-card-border-dark/40">
                  {items.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <span className="text-sm text-text-tertiary dark:text-text-tertiary-dark">
                        {bucket.emptyMessage}
                      </span>
                    </div>
                  ) : (
                    items.map(m => (
                      <MemberExpiryRow
                        key={m.seat}
                        member={m}
                        bucket={bucket}
                        onRenew={() => handleRenew(m.seat)}
                        onWhatsApp={() => handleWhatsApp(m)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Urgency Stat Card ───────────────────────────────────────── */

function UrgencyStat({
  count,
  label,
  gradient,
  iconBg,
  icon,
}: {
  count: number;
  label: string;
  gradient: string;
  iconBg: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card-premium rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-3 flex items-center gap-3">
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          iconBg
        )}
      >
        {icon}
      </div>
      <div>
        <div className="text-lg font-extrabold text-text-primary dark:text-text-primary-dark leading-none">
          {count}
        </div>
        <div className="text-[11px] font-medium text-text-tertiary dark:text-text-tertiary-dark mt-0.5">
          {label}
        </div>
      </div>
      {count > 0 && (
        <div
          className={cn(
            'ml-auto w-1.5 h-8 rounded-full bg-gradient-to-b animate-pulse-subtle',
            gradient
          )}
        />
      )}
    </div>
  );
}

/* ─── Member Expiry Row ───────────────────────────────────────── */

function MemberExpiryRow({
  member,
  bucket,
  onRenew,
  onWhatsApp,
}: {
  member: Member & { daysLeft: number };
  bucket: BucketMeta;
  onRenew: () => void;
  onWhatsApp: () => void;
}) {
  const dLeft = member.daysLeft;
  const isExpired = dLeft < 0;
  const absDays = Math.abs(dLeft);

  // Progress: percentage of 365 days remaining (capped)
  const maxDays = 365;
  const fillPct = isExpired ? 100 : Math.max(2, 100 - (dLeft / maxDays) * 100);

  // Days text
  const daysText = isExpired
    ? `${absDays}d overdue`
    : dLeft === 0
      ? 'Today!'
      : `${dLeft}d left`;

  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-bg/50 dark:hover:bg-bg-dark/50 transition-colors">
      {/* Seat badge */}
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0',
          isExpired
            ? 'bg-expired-fill dark:bg-expired-fill-dark text-expired-text dark:text-expired-text-dark'
            : dLeft <= 7
              ? 'bg-expiring-fill dark:bg-expiring-fill-dark text-expiring-text dark:text-expiring-text-dark'
              : 'bg-bg dark:bg-bg-dark text-text-primary dark:text-text-primary-dark'
        )}
      >
        {member.seat}
      </div>

      {/* Member info + countdown bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-text-primary dark:text-text-primary-dark truncate">
            {member.name}
          </span>
          <span
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap',
              isExpired
                ? 'bg-expired-fill dark:bg-expired-fill-dark text-expired-text dark:text-expired-text-dark'
                : dLeft === 0
                  ? 'bg-expired-fill dark:bg-expired-fill-dark text-expired-text dark:text-expired-text-dark'
                  : dLeft <= 7
                    ? 'bg-expiring-fill dark:bg-expiring-fill-dark text-expiring-text dark:text-expiring-text-dark'
                    : dLeft <= 30
                      ? 'bg-blue-accent/10 text-blue-accent'
                      : 'bg-active-fill dark:bg-active-fill-dark text-active-text dark:text-active-text-dark'
            )}
          >
            {daysText}
          </span>
        </div>

        {/* Expiry bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-bg dark:bg-bg-dark overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-1000 ease-out',
                bucket.barColor
              )}
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-text-tertiary dark:text-text-tertiary-dark whitespace-nowrap shrink-0">
            {fmtDate(member.expiry)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onWhatsApp}
          title="Send WhatsApp reminder"
          className="cursor-pointer w-7 h-7 rounded-lg flex items-center justify-center bg-active-fill dark:bg-active-fill-dark text-active-text dark:text-active-text-dark hover:shadow-sm transition-all active:scale-95"
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRenew}
          title="Renew membership"
          className="cursor-pointer w-7 h-7 rounded-lg flex items-center justify-center bg-blue-accent/10 text-blue-accent hover:shadow-sm transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
