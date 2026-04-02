'use client';

import { useMemo, useCallback } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/hooks/useToast';
import { daysUntilExpiry, fmtDate, firstName, cn } from '@/lib/utils';
import { type Member } from '@/lib/types';
import {
  CalendarSearch,
  AlertTriangle,
  Clock,
  CalendarDays,
  RefreshCw,
  Flame,
  MessageCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Tooltip } from '@/components/ui/Tooltip';

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
    <div className="card-premium rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-3 flex items-center gap-3 shadow-[var(--shadow-ambient)] min-w-0">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-lg font-extrabold text-text-primary dark:text-text-primary-dark leading-none truncate">
          {count}
        </div>
        <div className="text-[11px] font-medium text-text-tertiary dark:text-text-tertiary-dark mt-0.5 truncate">
          {label}
        </div>
      </div>
      {count > 0 && (
        <div className={cn('ml-auto w-1.5 h-8 rounded-full bg-gradient-to-b animate-pulse-subtle shrink-0', gradient)} />
      )}
    </div>
  );
}

type ExpiryMember = Member & { daysLeft: number };

export default function ExpiryPage() {
  const { members } = useMembers();
  const { addToast } = useToast();
  const router = useRouter();

  const occupiedMembers = useMemo(() => {
    return members
      .filter((m) => !m.vacant && m.expiry)
      .map((m) => ({ ...m, daysLeft: daysUntilExpiry(m.expiry) }))
      .sort((a, b) => a.daysLeft - b.daysLeft); // Urgent first
  }, [members]);

  const totalExpired = occupiedMembers.filter(m => m.daysLeft < 0).length;
  const totalToday = occupiedMembers.filter(m => m.daysLeft === 0).length;
  const totalWeek = occupiedMembers.filter(m => m.daysLeft > 0 && m.daysLeft <= 7).length;
  const totalMonth = occupiedMembers.filter(m => m.daysLeft > 7 && m.daysLeft <= 30).length;

  const handleRenew = useCallback((seat: number) => {
    router.push(`/seat-grid?seat=${seat}`);
  }, [router]);

  const handleWhatsApp = useCallback((m: ExpiryMember) => {
    if (!m.phone) {
      addToast('error', 'No phone number available');
      return;
    }
    const dLeft = m.daysLeft;
    const expiryText =
      dLeft < 0
        ? `expired on ${fmtDate(m.expiry)}`
        : dLeft === 0
        ? `expires today`
        : `expires in ${dLeft} day${dLeft === 1 ? '' : 's'} (${fmtDate(m.expiry)})`;
    const message = encodeURIComponent(
      `Hello ${firstName(m.name)}, your library membership (Seat #${m.seat}) ${expiryText}. Please visit us to renew. Thank you! — Gangaur Library`
    );
    window.open(`https://wa.me/91${m.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  }, [addToast]);

  const columns = useMemo<ColumnDef<ExpiryMember>[]>(() => [
    {
      accessorKey: 'seat',
      header: 'Seat',
      cell: ({ row }) => {
        const dLeft = row.original.daysLeft;
        const isExpired = dLeft < 0;
        return (
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 shadow-sm border',
              isExpired
                ? 'bg-expired-fill dark:bg-expired-fill-dark text-expired-text dark:text-expired-text-dark border-expired-border/50'
                : dLeft <= 7
                ? 'bg-expiring-fill dark:bg-expiring-fill-dark text-expiring-text dark:text-expiring-text-dark border-expiring-border/50'
                : 'bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark border-divider dark:border-divider-dark'
            )}
          >
            {row.getValue('seat')}
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Member',
      cell: ({ row }) => (
        <div>
          <div className="font-bold text-text-primary dark:text-text-primary-dark text-sm tracking-tight">{row.original.name}</div>
          {row.original.phone && (
            <div className="text-[11px] font-mono text-text-tertiary dark:text-text-tertiary-dark font-medium mt-0.5">
              {row.original.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'daysLeft',
      header: 'Urgency / Status',
      cell: ({ row }) => {
        const dLeft = row.original.daysLeft;
        const isExpired = dLeft < 0;
        const absDays = Math.abs(dLeft);
        const maxDays = 365;
        const fillPct = isExpired ? 100 : Math.max(2, 100 - (dLeft / maxDays) * 100);

        const daysText = isExpired
          ? `${absDays}d overdue`
          : dLeft === 0
          ? 'Today!'
          : `${dLeft}d left`;

        let barColor = 'bg-gradient-to-r from-[#639922] to-[#A3E635]'; // Safe
        if (isExpired) barColor = 'bg-gradient-to-r from-[#E24B4A] to-[#F87171]';
        else if (dLeft === 0) barColor = 'bg-gradient-to-r from-[#DC2626] to-[#EF4444]';
        else if (dLeft <= 7) barColor = 'bg-gradient-to-r from-[#EF9F27] to-[#FBBF24]';
        else if (dLeft <= 30) barColor = 'bg-gradient-to-r from-[#2563EB] to-[#60A5FA]';

        return (
          <div className="w-full max-w-[140px]">
            <span
              className={cn(
                'text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md whitespace-nowrap inline-block mb-1.5 tracking-wider',
                isExpired
                  ? 'bg-expired-fill dark:bg-expired-fill-dark text-expired-text dark:text-expired-text-dark'
                  : dLeft === 0
                  ? 'bg-[#DC2626]/10 text-[#DC2626]'
                  : dLeft <= 7
                  ? 'bg-expiring-fill dark:bg-expiring-fill-dark text-expiring-text dark:text-expiring-text-dark'
                  : dLeft <= 30
                  ? 'bg-blue-accent/10 text-blue-accent'
                  : 'bg-active-fill dark:bg-active-fill-dark text-active-text dark:text-active-text-dark'
              )}
            >
              {daysText}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-bg dark:bg-bg-dark overflow-hidden border border-divider/50 dark:border-divider-dark/50 shadow-inner">
              <div
                className={cn('h-full rounded-full transition-all duration-1000 ease-out shadow-sm', barColor)}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'expiry',
      header: 'Expiry Date',
      cell: ({ row }) => (
        <span className="text-xs font-mono font-medium text-text-secondary dark:text-text-secondary-dark whitespace-nowrap">
          {fmtDate(row.getValue('expiry'))}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
          <Tooltip content="Send WhatsApp Reminder">
            <button
              onClick={() => handleWhatsApp(row.original)}
              className="cursor-pointer w-8 h-8 rounded-xl flex items-center justify-center bg-active-fill/50 dark:bg-active-fill-dark/50 text-active-text dark:text-active-text-dark hover:bg-active-fill dark:hover:bg-active-fill-dark shadow-sm hover:scale-105 transition-all active:scale-95 border border-active-border/20 dark:border-active-border-dark/20"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Renew Membership">
            <button
              onClick={() => handleRenew(row.original.seat)}
              className="cursor-pointer w-8 h-8 rounded-xl flex items-center justify-center bg-blue-accent/10 text-blue-accent hover:bg-blue-accent/20 shadow-sm hover:scale-105 transition-all active:scale-95 border border-blue-accent/20"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ], [handleRenew, handleWhatsApp]);

  return (
    <div className="animate-fade-in max-w-6xl pb-24">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary dark:text-text-primary-dark tracking-tight flex items-center gap-2">
            <CalendarSearch className="w-6 h-6 text-expired-border" />
            Expiry Tracker
          </h1>
          <p className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark mt-1">
            Monitor memberships nearing expiration via an advanced data grid.
          </p>
        </div>
      </div>

      {/* ── Urgency Summary Bar ──────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        <UrgencyStat
          count={totalExpired}
          label="Expired"
          gradient="from-[#E24B4A] to-[#F87171]"
          iconBg="bg-expired-fill dark:bg-expired-fill-dark text-expired-border"
          icon={<Flame className="w-4 h-4" />}
        />
        <UrgencyStat
          count={totalToday}
          label="Today"
          gradient="from-[#DC2626] to-[#EF4444]"
          iconBg="bg-expired-fill dark:bg-expired-fill-dark text-[#DC2626]"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <UrgencyStat
          count={totalWeek}
          label="This Week"
          gradient="from-[#EF9F27] to-[#FBBF24]"
          iconBg="bg-expiring-fill dark:bg-expiring-fill-dark text-expiring-border"
          icon={<Clock className="w-4 h-4" />}
        />
        <UrgencyStat
          count={totalMonth}
          label="This Month"
          gradient="from-[#2563EB] to-[#60A5FA]"
          iconBg="bg-blue-accent/10 text-blue-accent"
          icon={<CalendarDays className="w-4 h-4" />}
        />
      </div>

      {/* ── Data Grid ───────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={occupiedMembers}
        searchPlaceholder="Search seat, name..."
      />
    </div>
  );
}
