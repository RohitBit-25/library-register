'use client';

import { useMemo, useState } from 'react';
import { usePayments, type PaymentRow } from '@/hooks/usePayments';
import Receipt from '@/components/payments/Receipt';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { fmtDate, durationLabel, todayISO } from '@/lib/utils';
import { addDaysISO } from '@/lib/seat-status';
import { formatINR } from '@/lib/pricing';
import { toCsv } from '@/lib/csv';
import { type Duration } from '@/lib/types';
import { IndianRupee, Receipt as ReceiptIcon, Download, Wallet, Smartphone, Banknote } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

type RangeKey = '7d' | '30d' | '90d' | 'month';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'month', label: 'This month' },
  { key: '90d', label: 'Last 90 days' },
];

function rangeFor(key: RangeKey): { from: string; to: string } {
  const to = todayISO();
  if (key === 'month') return { from: to.slice(0, 8) + '01', to };
  const days = key === '7d' ? 6 : key === '30d' ? 29 : 89;
  return { from: addDaysISO(to, -days), to };
}

export default function PaymentsPage() {
  const [rangeKey, setRangeKey] = useState<RangeKey>('30d');
  const [receipt, setReceipt] = useState<PaymentRow | null>(null);

  const range = useMemo(() => rangeFor(rangeKey), [rangeKey]);
  const { data, isLoading } = usePayments(range);

  // Split by method — the question at the end of a shift is "how much cash is
  // in the drawer", which a single total cannot answer.
  const byMode = useMemo(() => {
    let cash = 0, upi = 0, unknown = 0;
    for (const p of data.payments) {
      if (p.paymentMode === 'cash') cash += p.amount;
      else if (p.paymentMode === 'upi') upi += p.amount;
      else unknown += p.amount;
    }
    return { cash, upi, unknown };
  }, [data.payments]);

  const exportCsv = () => {
    const csv = toCsv(
      ['Date', 'Seat', 'Member', 'Phone', 'Plan', 'Method', 'Amount'],
      data.payments.map(p => [
        p.date, p.seat, p.memberName, p.memberPhone,
        durationLabel((p.duration || '') as Duration),
        p.paymentMode || '', p.amount,
      ])
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gangaur-collections-${range.from}-to-${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in max-w-5xl pb-24">
      <PageHeader
        title="Collections"
        icon={<IndianRupee className="h-5 w-5" />}
        subtitle="Every fee recorded, with a receipt for each."
      />

      {/* Range + export */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 shadow-sm">
          {RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setRangeKey(r.key)}
              aria-pressed={rangeKey === r.key}
              className={`min-h-[36px] cursor-pointer rounded-lg px-3.5 text-xs font-bold transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-600)] ${
                rangeKey === r.key
                  ? 'bg-[var(--saffron-600)] text-[var(--text-inverse)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <button
          onClick={exportCsv}
          disabled={data.payments.length === 0}
          className="flex min-h-[36px] cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 text-xs font-bold text-[var(--text-secondary)] shadow-sm transition-ui hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </button>
      </div>

      {/* Totals */}
      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--border-subtle)] lg:grid-cols-4">
        <Total label="Collected" value={formatINR(data.total)} icon={<Wallet className="h-4 w-4" />} strong />
        <Total label="Cash" value={formatINR(byMode.cash)} icon={<Banknote className="h-4 w-4" />} />
        <Total label="UPI" value={formatINR(byMode.upi)} icon={<Smartphone className="h-4 w-4" />} />
        <Total label="Payments" value={String(data.count)} icon={<ReceiptIcon className="h-4 w-4" />} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : data.payments.length === 0 ? (
        <Card variant="base" className="p-10 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-muted)]">
            <ReceiptIcon className="h-7 w-7 text-[var(--text-tertiary)]" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            No payments in this period
          </p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Collections are recorded automatically when a fee is marked paid.
          </p>
        </Card>
      ) : (
        <Card variant="base" className="overflow-hidden">
          <ul className="divide-y divide-[var(--border-subtle)]">
            {data.payments.map(p => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] font-mono text-xs font-bold text-[var(--text-primary)]">
                  {String(p.seat).padStart(2, '0')}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                    {p.memberName || 'Unnamed member'}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                    {fmtDate(p.date)} · {durationLabel((p.duration || '') as Duration)}
                    {p.paymentMode && ` · ${p.paymentMode.toUpperCase()}`}
                  </p>
                </div>

                <span className="tabular shrink-0 text-sm font-bold text-[var(--emerald-600)]">
                  {formatINR(p.amount)}
                </span>

                <button
                  onClick={() => setReceipt(p)}
                  aria-label={`Receipt for ${p.memberName}, seat ${p.seat}`}
                  className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 text-xs font-bold text-[var(--text-secondary)] transition-ui hover:border-[var(--saffron-600)] hover:text-[var(--saffron-700)]"
                >
                  <ReceiptIcon className="h-4 w-4" aria-hidden="true" />
                  Receipt
                </button>
              </li>
            ))}
          </ul>

          {data.truncated && (
            // Never let a capped list read as the complete picture.
            <p className="border-t border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-2.5 text-center text-xs text-[var(--text-tertiary)]">
              Showing {data.payments.length} of {data.count} — narrow the date range to see the rest.
            </p>
          )}
        </Card>
      )}

      <Receipt payment={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}

function Total({
  label, value, icon, strong,
}: { label: string; value: string; icon: React.ReactNode; strong?: boolean }) {
  return (
    <div className="bg-[var(--bg-surface)] p-4">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
        <span className={strong ? 'text-[var(--emerald-600)]' : ''}>{icon}</span>
        {label}
      </div>
      <p
        className={`tabular mt-1 font-display text-xl font-semibold ${
          strong ? 'text-[var(--emerald-600)]' : 'text-[var(--text-primary)]'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
