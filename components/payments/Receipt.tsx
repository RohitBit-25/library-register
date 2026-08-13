'use client';

import { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, MessageCircle } from 'lucide-react';
import { fmtDate, durationLabel } from '@/lib/utils';
import { formatINR } from '@/lib/pricing';
import type { PaymentRow } from '@/hooks/usePayments';
import type { Duration } from '@/lib/types';

/**
 * A payment receipt.
 *
 * The ledger recorded every collection but gave the member nothing to keep,
 * so a disputed payment came down to one person's memory. The receipt number
 * is derived from the payment's own id, which means the same payment always
 * produces the same number — reprinting is safe.
 */
function receiptNumber(p: PaymentRow): string {
  // Last 6 of the Mongo id: stable, unique in practice, short enough to read
  // over the phone.
  return `GL-${p.date.replace(/-/g, '').slice(2)}-${p.id.slice(-6).toUpperCase()}`;
}

function whatsappHref(p: PaymentRow): string | null {
  const digits = (p.memberPhone || '').replace(/\D/g, '');
  if (digits.length !== 10) return null;
  const text = encodeURIComponent(
    `Receipt ${receiptNumber(p)} — Gangaur Library\n`
    + `${p.memberName}, Seat #${String(p.seat).padStart(2, '0')}\n`
    + `${durationLabel((p.duration || '') as Duration)} · ${formatINR(p.amount)}\n`
    + `Paid on ${fmtDate(p.date)}${p.paymentMode ? ` by ${p.paymentMode.toUpperCase()}` : ''}\n`
    + `Thank you!`
  );
  return `https://wa.me/91${digits}?text=${text}`;
}

export default function Receipt({
  payment,
  onClose,
}: {
  payment: PaymentRow | null;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!payment) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [payment, onClose]);

  if (!payment) return null;

  const no = receiptNumber(payment);
  const wa = whatsappHref(payment);

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--bg-void)]/70 backdrop-blur-sm print:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-xl)] print:max-w-none print:border-0 print:shadow-none"
      >
        {/* ── The receipt itself — this is what prints ── */}
        <div id="receipt-print-area" className="p-6">
          <div className="flex items-start justify-between gap-3 border-b border-dashed border-[var(--border-default)] pb-4">
            <div>
              <h2 id={titleId} className="text-base font-bold text-[var(--text-primary)]">
                Gangaur Library
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
                JK Circle, Kankroli · Rajsamand
              </p>
            </div>
            <span className="rounded-md border border-[var(--emerald-200)] bg-[var(--emerald-50)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--emerald-600)]">
              Paid
            </span>
          </div>

          <p className="mt-4 font-mono text-[11px] text-[var(--text-tertiary)]">
            Receipt {no}
          </p>

          <dl className="mt-3 space-y-2.5 text-sm">
            <Row label="Member" value={payment.memberName || '—'} />
            <Row label="Seat" value={`#${String(payment.seat).padStart(2, '0')}`} mono />
            {payment.memberPhone && <Row label="Phone" value={payment.memberPhone} mono />}
            <Row label="Plan" value={durationLabel((payment.duration || '') as Duration)} />
            <Row
              label="Method"
              value={payment.paymentMode ? payment.paymentMode.toUpperCase() : 'Not recorded'}
            />
            <Row label="Date" value={fmtDate(payment.date)} />
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-[var(--border-default)] pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Amount paid
            </span>
            <span className="tabular font-display text-2xl font-semibold text-[var(--text-primary)]">
              {formatINR(payment.amount)}
            </span>
          </div>

          <p className="mt-4 text-center text-[10px] leading-relaxed text-[var(--text-tertiary)]">
            Computer-generated receipt. No signature required.
          </p>
        </div>

        {/* ── Actions — deliberately outside the print area ── */}
        <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-3 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex min-h-[40px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--saffron-700)] bg-[var(--saffron-600)] text-sm font-semibold text-[var(--text-inverse)] transition-ui hover:bg-[var(--saffron-700)]"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print
          </button>

          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[40px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--emerald-200)] bg-[var(--emerald-50)] text-sm font-semibold text-[var(--emerald-600)] transition-ui hover:bg-[var(--emerald-100)]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          ) : (
            <span className="flex min-h-[40px] flex-1 items-center justify-center rounded-lg border border-[var(--border-default)] text-xs text-[var(--text-tertiary)]">
              No phone on file
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-ui hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-[var(--text-tertiary)]">{label}</dt>
      <dd className={`text-right font-medium text-[var(--text-primary)] ${mono ? 'font-mono' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
