'use client';

import Link from 'next/link';
import { ArrowRight, Inbox, IndianRupee, RefreshCw, UserCheck } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useAttendance } from '@/hooks/useAttendance';
import { formatINR } from '@/lib/pricing';
import { cn } from '@/lib/utils';

/**
 * What needs doing today, each item one tap from the page that does it.
 *
 * Staff open the dashboard to act; the plan answers "where", this answers
 * "what next". Items with nothing to do drop out rather than reading "0".
 */
export default function TodayCard() {
  const { stats, isLoading } = useDashboardStats();
  const { pendingCount } = useSeatRequests();
  const { presentToday, totalOccupied } = useAttendance();
  if (isLoading) return null;

  const renew = stats.expired + stats.expiring;
  const items = [
    pendingCount > 0 && {
      href: '/requests', icon: Inbox, tone: 'indigo',
      text: `${pendingCount} request${pendingCount === 1 ? '' : 's'} waiting`, cta: 'Review',
    },
    stats.withDues > 0 && {
      href: '/members?filter=due', icon: IndianRupee, tone: 'saffron',
      text: `${formatINR(stats.revenue.outstanding)} owed by ${stats.withDues}`, cta: 'Collect',
    },
    renew > 0 && {
      href: '/expiry', icon: RefreshCw, tone: 'ruby',
      text: `${renew} to renew${stats.expired ? ` (${stats.expired} expired)` : ''}`, cta: 'Renew',
    },
    {
      href: '/attendance', icon: UserCheck, tone: 'emerald',
      text: `${presentToday} of ${totalOccupied} checked in`, cta: 'Attendance',
    },
  ].filter(Boolean) as { href: string; icon: typeof Inbox; tone: string; text: string; cta: string }[];

  const tones: Record<string, string> = {
    indigo: 'bg-[var(--indigo-50)] text-[var(--indigo-600)]',
    saffron: 'bg-[var(--saffron-50)] text-[var(--saffron-700)]',
    ruby: 'bg-[var(--ruby-50)] text-[var(--ruby-600)]',
    emerald: 'bg-[var(--emerald-50)] text-[var(--emerald-600)]',
  };

  return (
    <section aria-label="Today" className="mb-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-xs)] sm:p-4">
      <h2 className="mb-2 px-1 text-xs font-semibold text-[var(--text-tertiary)]">Today</h2>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(({ href, icon: Icon, tone, text, cta }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex min-h-[48px] items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2 transition-ui hover:bg-[var(--bg-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)]"
            >
              <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]', tones[tone])} aria-hidden="true">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--text-primary)] tabular">{text}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                {cta} <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
