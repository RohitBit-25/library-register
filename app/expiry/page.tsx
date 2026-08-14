'use client';

import { useMemo, useCallback, useState } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/hooks/useToast';
import { daysUntilExpiry, fmtDate, firstName, cn, renewalStartDate, durationLabel, calcExpiry } from '@/lib/utils';
import { type Member } from '@/lib/types';
import {
  CalendarSearch,
  AlertTriangle,
  Clock,
  CalendarDays,
  RefreshCw,
  Flame,
  MessageCircle,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Tooltip } from '@/components/ui/Tooltip';
import PageHeader from '@/components/layout/PageHeader';

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
    <div className="card-base rounded-xl border border-[var(--border-default)] bg-[var(--bg-glass)] p-3 flex items-center gap-3 shadow-[var(--shadow-sm)] min-w-0">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-lg font-extrabold text-[var(--text-primary)] leading-none truncate">
          {count}
        </div>
        <div className="text-[11px] font-medium text-[var(--text-tertiary)] mt-0.5 truncate">
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
  const { members, vacate, renew } = useMembers();
  const { addToast } = useToast();
  const router = useRouter();
  const [confirmVacate, setConfirmVacate] = useState<ExpiryMember | null>(null);
  const [confirmRenew, setConfirmRenew] = useState<ExpiryMember | null>(null);

  /** Days ahead this page considers "ending soon" — matches the last summary card. */
  const HORIZON_DAYS = 30;

  const allOccupied = useMemo(() => {
    return members
      .filter((m) => !m.vacant && m.expiry)
      .map((m) => ({ ...m, daysLeft: daysUntilExpiry(m.expiry) }))
      .sort((a, b) => a.daysLeft - b.daysLeft); // Urgent first
  }, [members]);

  // The table listed every occupied seat — all 71 — under a heading that says
  // "memberships ending soon". Past the first page that meant members with
  // three months left, sitting in a tracker whose four summary cards only
  // count the next thirty days. `showAll` keeps the full roster one click
  // away rather than removing it.
  const [showAll, setShowAll] = useState(false);
  const occupiedMembers = useMemo(
    () => (showAll ? allOccupied : allOccupied.filter((m) => m.daysLeft <= HORIZON_DAYS)),
    [allOccupied, showAll]
  );

  const totalExpired = allOccupied.filter(m => m.daysLeft < 0).length;
  const totalToday = allOccupied.filter(m => m.daysLeft === 0).length;
  const totalWeek = allOccupied.filter(m => m.daysLeft > 0 && m.daysLeft <= 7).length;
  const totalMonth = allOccupied.filter(m => m.daysLeft > 7 && m.daysLeft <= 30).length;

  // Renewal was six steps: find member, open panel, Renew, pick date, pick
  // duration, confirm. The common case is "same plan again", and both inputs
  // are already known — the member's own duration, and the correct start date
  // from renewalStartDate (which protects days they already paid for). One
  // click plus a confirm now covers it; the seat panel remains the escape
  // hatch for changing plan or backdating.
  const handleQuickRenew = useCallback((m: ExpiryMember) => {
    setConfirmRenew(m);
  }, []);

  const doQuickRenew = useCallback(() => {
    if (!confirmRenew) return;
    const { seat, duration, expiry, name } = confirmRenew;
    const plan = (duration || '3M') as '1M' | '3M' | '6M' | '1Y';
    const start = renewalStartDate(expiry);
    renew(seat, start, plan, (msg) => addToast('error', msg));
    addToast('success', `${name} renewed for ${durationLabel(plan)}`);
    setConfirmRenew(null);
  }, [confirmRenew, renew, addToast]);

  const handleOpenSeat = useCallback((seat: number) => {
    router.push(`/?seat=${seat}`);
  }, [router]);

  const handleConfirmVacate = useCallback(() => {
    if (!confirmVacate) return;
    const { seat, name } = confirmVacate;
    vacate(seat, (msg) => addToast('error', msg)).then((waiting) => {
      if (waiting.length) {
        addToast('warning', `${waiting.length} on the waitlist — ${waiting[0].userName} is first.`);
      }
    });
    addToast('success', `Seat ${seat} freed — ${name} removed`);
    setConfirmVacate(null);
  }, [confirmVacate, vacate, addToast]);

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
                ? 'bg-[var(--ruby-50)] text-[var(--ruby-600)] border-[var(--ruby-200)]/50'
                : dLeft <= 7
                ? 'bg-[var(--saffron-50)] text-[var(--saffron-600)] border-[var(--saffron-200)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-default)]'
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
          <div className="font-bold text-[var(--text-primary)] text-sm tracking-tight">{row.original.name}</div>
          {row.original.phone && (
            <div className="text-[11px] font-mono text-[var(--text-tertiary)] font-medium mt-0.5">
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

        // The bar used to fill by `100 - daysLeft/365`, so everything inside a
        // month sat at 97–99% and every expired member was pinned at exactly
        // 100 however far past their date they were. It looked like a precise
        // measurement and carried no information in the only range this page
        // is about.
        //
        // It now measures urgency across the 30-day window either side of the
        // expiry date: longer bar means act sooner, in both directions.
        const URGENCY_WINDOW = 30;
        const fillPct = isExpired
          ? Math.min(100, 40 + (absDays / URGENCY_WINDOW) * 60)
          : Math.max(4, ((URGENCY_WINDOW - Math.min(dLeft, URGENCY_WINDOW)) / URGENCY_WINDOW) * 100);

        const daysText = isExpired
          ? `${absDays}d overdue`
          : dLeft === 0
          ? 'Today!'
          : `${dLeft}d left`;

        let barColor = 'bg-[var(--emerald-500)]';
        if (isExpired || dLeft === 0) barColor = 'bg-[var(--ruby-500)]';
        else if (dLeft <= 7) barColor = 'bg-[var(--saffron-500)]';
        else if (dLeft <= 30) barColor = 'bg-[var(--marigold-500)]';

        return (
          <div className="w-full max-w-[140px]">
            <span
              className={cn(
                'text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md whitespace-nowrap inline-block mb-1.5 tracking-wider',
                isExpired || dLeft === 0
                  ? 'bg-[var(--ruby-50)] text-[var(--ruby-600)]'
                  : dLeft <= 7
                  ? 'bg-[var(--saffron-50)] text-[var(--saffron-700)]'
                  : dLeft <= 30
                  ? 'bg-[var(--marigold-50)] text-[var(--marigold-700)]'
                  : 'bg-[var(--emerald-50)] text-[var(--emerald-600)]'
              )}
            >
              {daysText}
            </span>
            <div
              role="img"
              aria-label={`Urgency: ${daysText}`}
              className="h-1.5 flex-1 overflow-hidden rounded-full border border-[var(--border-default)]/50 bg-[var(--bg-base)]"
            >
              <div
                className={cn('meter-fill h-full w-full rounded-full', barColor)}
                style={{ ['--fill' as string]: fillPct / 100 }}
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
        <span className="text-xs font-mono font-medium text-[var(--text-secondary)] whitespace-nowrap">
          {fmtDate(row.getValue('expiry'))}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex shrink-0 items-center justify-end gap-1.5">
          <Tooltip content="Send WhatsApp Reminder">
            <button
              onClick={() => handleWhatsApp(row.original)}
              aria-label={`Send a WhatsApp reminder to ${row.original.name}`}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-[var(--emerald-200)] bg-[var(--emerald-50)] text-[var(--emerald-600)] shadow-sm transition-ui hover:bg-[var(--emerald-100)] active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content={`Renew ${durationLabel((row.original.duration || '3M') as never)} — same plan`}>
            <button
              onClick={() => handleQuickRenew(row.original)}
              aria-label={`Renew seat ${row.original.seat} for another ${durationLabel((row.original.duration || '3M') as never)}`}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--emerald-200)] bg-[var(--emerald-50)] px-2.5 text-[11px] font-bold text-[var(--emerald-600)] shadow-sm transition-ui hover:bg-[var(--emerald-100)] active:scale-95"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Renew
            </button>
          </Tooltip>
          <Tooltip content="Open seat — change plan or date">
            <button
              onClick={() => handleOpenSeat(row.original.seat)}
              aria-label={`Open seat ${row.original.seat} to change the plan`}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-secondary)] shadow-sm transition-ui hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)] active:scale-95"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </Tooltip>
          {/* Expired seats stay occupied until someone frees them (deliberate —
              no auto-vacate). Without this the admin had to leave the tracker,
              find the seat on the map, and vacate it from there. */}
          {row.original.daysLeft < 0 && (
            <Tooltip content="Free this seat">
              <button
                onClick={() => setConfirmVacate(row.original)}
                aria-label={`Vacate seat ${row.original.seat} — membership expired`}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-[var(--ruby-200)] bg-[var(--ruby-50)] text-[var(--ruby-600)] shadow-sm transition-ui hover:bg-[var(--ruby-100)] active:scale-95"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </Tooltip>
          )}
        </div>
      ),
    },
  ], [handleQuickRenew, handleOpenSeat, handleWhatsApp]);

  return (
    <div className="animate-fade-in max-w-6xl pb-24">
      {/* ── Header ─────────────────────────────────────────────── */}
      <PageHeader
        title="Expiry Tracker"
        icon={<CalendarSearch className="h-5 w-5" />}
        subtitle={
          showAll
            ? `All ${allOccupied.length} active memberships, soonest first.`
            : `${occupiedMembers.length} ending within ${HORIZON_DAYS} days, or already past.`
        }
        actions={
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)] transition-ui hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)]"
          >
            {showAll ? `Show only the next ${HORIZON_DAYS} days` : `Show all ${allOccupied.length} members`}
          </button>
        }
      />

      {/* ── Urgency Summary Bar ──────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        <UrgencyStat
          count={totalExpired}
          label="Expired"
          gradient="from-[var(--ruby-500)] to-[var(--ruby-400)]"
          iconBg="bg-[var(--ruby-50)] text-[var(--ruby-600)]"
          icon={<Flame className="w-4 h-4" />}
        />
        <UrgencyStat
          count={totalToday}
          label="Today"
          gradient="from-[var(--ruby-500)] to-[var(--ruby-400)]"
          iconBg="bg-[var(--ruby-50)] text-[var(--ruby-600)]"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <UrgencyStat
          count={totalWeek}
          label="This Week"
          gradient="from-[var(--saffron-500)] to-[var(--saffron-400)]"
          iconBg="bg-[var(--saffron-50)] text-[var(--saffron-700)]"
          icon={<Clock className="w-4 h-4" />}
        />
        <UrgencyStat
          count={totalMonth}
          label="This Month"
          gradient="from-[var(--marigold-500)] to-[var(--marigold-400)]"
          iconBg="bg-[var(--marigold-50)] text-[var(--marigold-700)]"
          icon={<CalendarDays className="w-4 h-4" />}
        />
      </div>

      {/* ── Data Grid ───────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={occupiedMembers}
        searchPlaceholder="Search seat, name..."
        renderSubComponent={(member) => (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-[var(--text-tertiary)] text-[10px] uppercase font-bold tracking-widest mb-1 shadow-sm">Fee Status</span>
              <span className={cn("font-medium", member.fee === 'due' ? 'text-[var(--ruby-600)]' : 'text-[var(--saffron-600)]')}>
                {member.fee === 'due' ? 'Pending Payment' : 'Fully Paid'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[var(--text-tertiary)] text-[10px] uppercase font-bold tracking-widest mb-1 shadow-sm">Contact Info</span>
              <span className="font-mono text-[var(--text-primary)]">{member.phone || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[var(--text-tertiary)] text-[10px] uppercase font-bold tracking-widest mb-1 shadow-sm">Joined</span>
              <span className="font-mono text-[var(--text-secondary)]">{fmtDate(member.joinDate)}</span>
            </div>
          </div>
        )}
      />

      <ConfirmDialog
        isOpen={confirmVacate !== null}
        onClose={() => setConfirmVacate(null)}
        onConfirm={handleConfirmVacate}
        title={confirmVacate ? `Free seat ${confirmVacate.seat}?` : ''}
        description={
          confirmVacate
            ? `${confirmVacate.name}'s membership expired on ${fmtDate(confirmVacate.expiry)} (${Math.abs(confirmVacate.daysLeft)} days ago). Freeing the seat clears their details and makes it available to request. This cannot be undone.`
            : ''
        }
        confirmText="Free seat"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={confirmRenew !== null}
        onClose={() => setConfirmRenew(null)}
        onConfirm={doQuickRenew}
        title={confirmRenew ? `Renew ${confirmRenew.name}?` : ''}
        description={
          confirmRenew
            ? `${durationLabel((confirmRenew.duration || '3M') as never)} starting ${fmtDate(renewalStartDate(confirmRenew.expiry))}, `
              + `new expiry ${fmtDate(calcExpiry(renewalStartDate(confirmRenew.expiry), (confirmRenew.duration || '3M') as never))}. `
              + `Fee is marked paid and the payment is recorded. Use the sliders button instead to change the plan or date.`
            : ''
        }
        confirmText="Renew and mark paid"
        variant="primary"
      />
    </div>
  );
}
