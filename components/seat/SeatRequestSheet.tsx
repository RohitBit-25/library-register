'use client';

import { useState, useRef } from 'react';
import { type Duration, type Member, type Shift } from '@/lib/types';
import { cn, todayISO } from '@/lib/utils';
import { seatRow } from '@/lib/layoutConfig';
import { upiPayLink } from '@/lib/siteInfo';
import { formatINR, planPrice } from '@/lib/pricing';
import { useLang } from '@/hooks/useLang';
import { motion } from 'framer-motion';
import { Dialog } from 'radix-ui';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  X, Send, User, Phone, MessageSquare, Armchair,
  CheckCircle2, Banknote, Smartphone, FileText, Camera, Upload,
  Trash2, Image as ImageIcon, CalendarDays, Clock,
} from 'lucide-react';
import { springUI } from '@/lib/motion';

interface SeatRequestSheetProps {
  member: Member | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (
    seat: number,
    name: string,
    phone: string,
    message: string,
    joinDate: string,
    duration: Duration,
    shift: Shift,
    transactionId: string,
    paymentMode: 'upi' | 'cash',
    documentUrl: string,
    /** UPI only: what the student entered; undefined = the plan price. */
    amount?: number,
  ) => Promise<{ success: boolean; error: string | null }>;
}

type PaymentMode = 'upi' | 'cash';

/** A numbered section of the form; ticks when its fields are valid. */
function StepHeading({ n, title, done }: { n: number; title: string; done: boolean }) {
  return (
    <h4 className={cn('flex items-center gap-2 font-display text-base font-bold', n > 1 && 'border-t-4 border-[var(--warm-line)] pt-4')}>
      <span className={cn('flex size-6 items-center justify-center border-2 text-sm tabular', done ? 'border-[var(--emerald-600)] bg-[var(--emerald-50)] text-[var(--emerald-700)]' : 'border-[var(--warm-ink)]')}>
        {done ? '✓' : n}
      </span>
      {title}
    </h4>
  );
}

export default function SeatRequestSheet({
  member,
  open,
  onClose,
  onSubmit,
}: SeatRequestSheetProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  // Local date, not toISOString(): that is UTC, so before 05:30 IST it
  // defaulted the join date to yesterday.
  const [joinDate, setJoinDate] = useState(todayISO);
  const [duration, setDuration] = useState<Duration>('3M');
  const [shift, setShift] = useState<Shift>('full');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [transactionId, setTransactionId] = useState('');
  // null = not typed yet, so the box follows the plan price as the duration
  // changes; once typed, the student's amount sticks. Empty = no amount in
  // the QR, and the UPI app asks for one.
  const [amountTyped, setAmountTyped] = useState<string | null>(null);
  const amountText = amountTyped ?? String(planPrice(duration));
  const amount = Number(amountText) || 0;
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const { t } = useLang();
  // Radix returns focus to a Dialog.Trigger, and this sheet is opened from
  // state, so it remembers what had focus and gives it back on close. Before,
  // focus fell to whatever desk sat behind the sheet.
  const openerRef = useRef<HTMLElement | null>(null);

  const resetForm = () => {
    setName(''); setPhone(''); setMessage(''); setJoinDate(todayISO());
    setDuration('3M'); setShift('full'); setPaymentMode('cash'); setTransactionId('');
    setAmountTyped(null); setDocumentUrl(''); setDocumentName(''); setErrorMsg('');
  };

  /** Every way out of the sheet. A sent request clears the form behind it. */
  const handleClose = () => {
    if (submitted) { setSubmitted(false); resetForm(); }
    onClose();
  };

  if (!open || !member) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg(t('Please upload an image (JPG, PNG, WebP) or PDF.'));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg(t('File size must be less than 2MB.'));
      return;
    }

    setDocumentName(file.name);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setDocumentUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = () => {
    setDocumentUrl('');
    setDocumentName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !joinDate) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const cleanPhone = phone.replace(/\D/g, '');
    const res = await onSubmit(
      member.seat,
      name.trim(),
      cleanPhone,
      message.trim(),
      joinDate,
      duration,
      shift,
      transactionId.trim(),
      paymentMode,
      documentUrl,
      paymentMode === 'upi' && amount > 0 ? amount : undefined,
    );

      if (res.success) {
        // Stays until the student closes it: it used to vanish after 2.2 s,
        // mid-way through reading what happens next.
        setSubmitted(true);
      } else {
        setErrorMsg(
          res.error === 'duplicate'
            ? t('You already requested this desk.')
            : t("Couldn't send the request. Please try again."),
        );
      }
    } catch {
      setErrorMsg(t("Couldn't send the request. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const phoneValid = phone.replace(/\D/g, '').length === 10;
  const nameValid = name.trim().length >= 2;
  const dateValid = joinDate.length > 0;
  const paymentValid = paymentMode === 'cash' || transactionId.trim().length >= 4;
  const isValid = nameValid && phoneValid && dateValid && paymentValid;
  const youDone = nameValid && phoneValid;
  const planDone = dateValid;

  const durationOptions: { value: Duration; label: string }[] = [
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '6M', label: '6 Months' },
    { value: '1Y', label: '1 Year' },
  ];

  const shiftOptions: { value: Shift; label: string }[] = [
    { value: 'morning', label: 'Morning' },
    { value: 'evening', label: 'Evening' },
    { value: 'full', label: 'Full Day' },
  ];

  const durationLabelOf = (d: Duration) => durationOptions.find((o) => o.value === d)?.label ?? d;
  const shiftLabelOf = (v: Shift) => shiftOptions.find((o) => o.value === v)?.label ?? v;

  // Shared input classes
  const inputCls =
    'w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm bg-[var(--bg-surface)] border-2 border-[var(--warm-ink-3)] text-[var(--warm-ink)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--saffron-600)] transition-ui';

  // Radix Dialog: a real modal — focus stays inside, Escape and a backdrop
  // click close it, the page behind is inert and does not scroll, and screen
  // readers are told a dialog opened and what it is called.
  return (
    <Dialog.Root open onOpenChange={(o) => { if (!o) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[var(--text-primary)]/40"
          />
        </Dialog.Overlay>
        <Dialog.Content
          asChild
          aria-describedby={undefined}
          aria-modal="true"
          onOpenAutoFocus={(e) => {
            openerRef.current = document.activeElement as HTMLElement | null;
            e.preventDefault();
            (nameRef.current ?? (e.currentTarget as HTMLElement)).focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (openerRef.current?.isConnected) openerRef.current.focus();
          }}
        >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={springUI}
              className="px-raised fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[480px] max-h-[90vh] bg-[var(--bg-surface)] text-[var(--warm-ink)] overflow-hidden flex flex-col focus:outline-none"
            >
              {!member.vacant ? (
                /* ── Occupied State ──────────────────── */
                <div className="p-6 text-center">
                  <div className="size-16 bg-[var(--ruby-50)] flex items-center justify-center mx-auto mb-4">
                    <Armchair className="size-8 text-[var(--ruby-600)]" />
                  </div>
                  <Dialog.Title className="font-display text-xl font-bold mb-1">
                    {t('Seat {n} is taken', { n: member.seat })}
                  </Dialog.Title>
                  <p className="text-xs text-[var(--text-tertiary)] mb-6">
                    {t('Check back later or browse other available seats.')}
                  </p>
                  <button
                    onClick={handleClose}
                    className="cursor-pointer px-6 py-2.5 bg-[var(--bg-base)] border border-[var(--border-default)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-ui"
                  >
                    {t('Close')}
                  </button>
                </div>
              ) : submitted ? (
                /* ── Success State ───────────────────── */
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-10 text-center"
                >
                  <motion.div
                    initial={{ transform: 'scale(0.92)', opacity: 0 }}
                    animate={{ transform: 'scale(1)', opacity: 1 }}
                    transition={{ ...springUI, delay: 0.1 }}
                    className="px-box size-20 bg-[var(--emerald-50)] flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 className="size-10 text-[var(--emerald-600)]" />
                  </motion.div>
                  <Dialog.Title className="font-display text-[2rem] font-bold tracking-tight leading-none mb-3">
                    {t('Request sent')}
                  </Dialog.Title>
                  <p className="text-sm text-[var(--warm-ink-2)]">
                    {t('The librarian will confirm your payment and allot desk {n}.', { n: member.seat })}
                  </p>
                  {/* What they asked for, so there is something to check against. */}
                  <dl className="mx-auto mt-5 grid max-w-[300px] grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-y-4 border-[var(--warm-line)] py-3 text-left text-sm">
                    <dt className="text-[var(--warm-ink-3)]">{t('Desk')}</dt>
                    <dd className="font-semibold tabular">{member.seat} · {t(seatRow(member.seat))}</dd>
                    <dt className="text-[var(--warm-ink-3)]">{t('Plan')}</dt>
                    <dd className="font-semibold">{t(durationLabelOf(duration))} · {t(shiftLabelOf(shift))}</dd>
                    <dt className="text-[var(--warm-ink-3)]">{t('Payment')}</dt>
                    <dd className="font-semibold">{paymentMode === 'upi' ? (amount > 0 ? t('{a} by UPI', { a: formatINR(amount) }) : 'UPI') : t('Cash at the desk')}</dd>
                  </dl>
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <Link
                      href="/my-requests"
                      className="px-btn px-raised m-1 inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap bg-[var(--saffron-600)] px-6 font-display text-base font-semibold text-[var(--text-inverse)] hover:bg-[var(--saffron-700)]"
                    >
                      {t('Track my request ▶')}
                    </Link>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="cursor-pointer px-4 py-2 text-sm font-medium text-[var(--warm-ink-2)] underline-offset-4 hover:text-[var(--warm-ink)] hover:underline"
                    >
                      {t('Done')}
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* ── Form ───────────────────────────── */
                <>
                  {/* Dialog Header */}
                  <div className="shrink-0 border-b-4 border-[var(--warm-ink)] bg-[var(--warm-band)] px-6 pb-4 pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Dialog.Title className="font-display text-xl font-bold leading-none sm:text-2xl">
                          {t('Request desk {n}', { n: member.seat })}
                        </Dialog.Title>
                        <p className="mt-2 text-sm text-[var(--warm-ink-2)]">
                          {t('{group} · the librarian confirms and allots it.', { group: t(seatRow(member.seat)) })}
                        </p>
                      </div>
                      <button
                        onClick={handleClose}
                        aria-label="Close" className="cursor-pointer size-9 shrink-0 flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-ui"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Form Body */}
                  <div className="flex-1 overflow-y-auto px-6 pt-5 pb-6 space-y-5">
                    {/* You → Plan → Pay. It used to open on "How will you pay?" before
                        asking who you are. */}
                    <ol className="flex items-center gap-2 text-xs font-semibold text-[var(--warm-ink-3)]" aria-label="Steps">
                      {[['You', youDone], ['Plan', planDone], ['Pay', paymentValid]].map(([label, d], i) => (
                        <li key={label as string} className="flex items-center gap-2">
                          {i > 0 && <span className="h-0.5 w-5 bg-[var(--warm-line)]" aria-hidden="true" />}
                          <span className={cn('flex size-5 items-center justify-center border-2 tabular', d ? 'border-[var(--emerald-600)] bg-[var(--emerald-50)] text-[var(--emerald-700)]' : 'border-[var(--warm-ink-3)]')}>
                            {d ? '✓' : i + 1}
                          </span>
                          <span className={d ? 'text-[var(--emerald-700)]' : ''}>{t(label as string)}</span>
                        </li>
                      ))}
                    </ol>

                    <StepHeading n={1} title={t('You')} done={youDone} />
                    {/* ─── Name ─────────────────────────────── */}
                    <div>
                      <label htmlFor="req-name" className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                        <User className="size-4" />
                        {t('Full Name')} <span className="text-[var(--ruby-600)]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          id="req-name"
                          ref={nameRef}
                          placeholder={t('Enter your full name')}
                          className={inputCls}
                        />
                        {nameValid && (
                          <CheckCircle2 className="size-4 text-[var(--emerald-600)] absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                    </div>

                    {/* ─── Phone ────────────────────────────── */}
                    <div>
                      <label htmlFor="req-phone" className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                        <Phone className="size-4" />
                        {t('Phone Number')} <span className="text-[var(--ruby-600)]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={phone}
                          onChange={e => {
                            let val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            if (val.length > 5) {
                              val = val.slice(0, 5) + ' ' + val.slice(5);
                            }
                            setPhone(val);
                          }}
                          id="req-phone"
                          placeholder={t('10-digit mobile number')}
                          className={cn(inputCls, 'font-mono')}
                        />
                        {phoneValid && (
                          <CheckCircle2 className="size-4 text-[var(--emerald-600)] absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                    </div>

                    <StepHeading n={2} title={t('Your plan')} done={planDone} />
                    {/* ─── Date of Joining ──────────────────── */}
                    <div>
                      <label htmlFor="req-date" className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                        <CalendarDays className="size-4" />
                        {t('Date of Joining')} <span className="text-[var(--ruby-600)]">*</span>
                      </label>
                      <input
                        id="req-date"
                        type="date"
                        value={joinDate}
                        onChange={e => setJoinDate(e.target.value)}
                        className={cn(inputCls, 'font-mono appearance-none')}
                        style={{ colorScheme: 'light' }}
                      />
                    </div>

                    {/* ─── Duration ─────────────────────────── */}
                    <div>
                      <label className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                        <CalendarDays className="size-4" />
                        {t('Membership Duration')} <span className="text-[var(--ruby-600)]">*</span>
                      </label>
                      <div role="radiogroup" aria-label="Membership Duration" className="grid grid-cols-2 gap-2">
                        {durationOptions.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={duration === option.value}
                            onClick={() => setDuration(option.value)}
                            className={cn(
                              'cursor-pointer min-h-[44px] border-2 px-3 py-2.5 text-sm font-semibold transition-colors',
                              duration === option.value
                                ? 'border-[var(--warm-ink)] bg-[var(--saffron-600)] text-[var(--text-inverse)]'
                                : 'border-[var(--warm-ink-3)] bg-[var(--bg-surface)] text-[var(--warm-ink-2)] hover:bg-[var(--warm-band)]'
                            )}
                          >
                            {t(option.label)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ─── Preferred Shift ───────────────────── */}
                    <div>
                      <label className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                        <Clock className="size-4" />
                        {t('Preferred Shift')} <span className="text-[var(--ruby-600)]">*</span>
                      </label>
                      <div role="radiogroup" aria-label="Preferred Shift" className="grid grid-cols-3 gap-2">
                        {shiftOptions.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={shift === option.value}
                            onClick={() => setShift(option.value)}
                            className={cn(
                              'cursor-pointer min-h-[44px] border-2 px-2 py-2.5 text-sm font-semibold transition-colors',
                              shift === option.value
                                ? 'border-[var(--warm-ink)] bg-[var(--saffron-600)] text-[var(--text-inverse)]'
                                : 'border-[var(--warm-ink-3)] bg-[var(--bg-surface)] text-[var(--warm-ink-2)] hover:bg-[var(--warm-band)]'
                            )}
                          >
                            {t(option.label)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <StepHeading n={3} title={t('Pay')} done={paymentValid} />
                    {/* ─── Payment Mode Toggle ─────────────── */}
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                        {t('How will you pay?')}
                      </p>
                      <div role="radiogroup" aria-label="Payment Mode" className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={paymentMode === 'cash'}
                          onClick={() => setPaymentMode('cash')}
                          className={cn(
                            'cursor-pointer flex min-h-[44px] items-center justify-center gap-2 border-2 text-sm font-semibold transition-ui',
                            paymentMode === 'cash'
                              ? 'border-[var(--warm-ink)] bg-[var(--saffron-600)] text-[var(--text-inverse)]'
                              : 'border-[var(--warm-ink-3)] bg-[var(--bg-surface)] text-[var(--warm-ink-2)] hover:bg-[var(--warm-band)]',
                          )}
                        >
                          <Banknote className="size-4" />
                          {t('Cash')}
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={paymentMode === 'upi'}
                          onClick={() => setPaymentMode('upi')}
                          className={cn(
                            'cursor-pointer flex min-h-[44px] items-center justify-center gap-2 border-2 text-sm font-semibold transition-ui',
                            paymentMode === 'upi'
                              ? 'border-[var(--warm-ink)] bg-[var(--saffron-600)] text-[var(--text-inverse)]'
                              : 'border-[var(--warm-ink-3)] bg-[var(--bg-surface)] text-[var(--warm-ink-2)] hover:bg-[var(--warm-band)]',
                          )}
                        >
                          <Smartphone className="size-4" />
                          {t('UPI / Online')}
                        </button>
                      </div>
                    </div>

                    {/* ─── Info Banner ──────────────────────── */}
                    {paymentMode === 'cash' ? (
                      <div className="p-4 border bg-[var(--emerald-50)] border-[var(--emerald-200)] flex items-start gap-3">
                        <div className="size-8 bg-[var(--emerald-50)] flex items-center justify-center shrink-0 mt-0.5">
                          <Banknote className="size-4 text-[var(--emerald-600)]" />
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          {t('Please pay at the library counter. Admin will confirm your payment and allot the seat.')}
                        </p>
                      </div>
                    ) : (
                      <div className="border border-[var(--border-default)] bg-[var(--bg-base)] overflow-hidden">
                        <div className="flex flex-col items-center py-5 px-4">
                          <label htmlFor="req-amount" className="mb-1.5 self-stretch text-sm font-medium text-[var(--text-primary)]">
                            {t('Amount (₹)')}
                          </label>
                          <input
                            id="req-amount"
                            type="text"
                            inputMode="numeric"
                            value={amountText}
                            onChange={(e) => setAmountTyped(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className={cn(inputCls, 'mb-1.5 font-mono tabular')}
                          />
                          <p className="mb-4 self-stretch text-xs text-[var(--text-secondary)]">
                            {t('{d} plan is {p}. Change it if the librarian told you a different amount.', { d: t(durationLabelOf(duration)), p: formatINR(planPrice(duration)) })}
                          </p>
                          <p className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                            <Smartphone className="size-4" />
                            {amount > 0
                              ? <span className="tabular">{t('Scan to pay {a}', { a: formatINR(amount) })}</span>
                              : t('Scan, then enter the amount in your UPI app')}
                          </p>
                          <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] mb-3">
                            <QRCodeSVG
                              value={upiPayLink(amount, `Seat ${member.seat} ${duration}`)}
                              size={110}
                              level="H"
                              className="block"
                            />
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] text-center leading-relaxed max-w-[220px]">
                            {t('Scan with')} <span className="text-[var(--text-primary)] font-semibold">GPay, PhonePe or Paytm</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ─── UPI Reference ─────────────────────── */}
                    {paymentMode === 'upi' && (
                      <div>
                        <label htmlFor="req-upi" className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                          <Smartphone className="size-4" />
                          {t('UPI Reference')} <span className="text-[var(--ruby-600)]">*</span>
                        </label>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={e => setTransactionId(e.target.value)}
                          id="req-upi"
                          placeholder={t('Enter transaction/reference ID')}
                          className={cn(inputCls, 'font-mono')}
                        />
                        {!paymentValid && (
                          <p className="mt-2 text-xs font-semibold text-[var(--ruby-600)]">
                            {t('Add the payment reference so admin can verify it.')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* ─── ID Document Upload ───────────────── */}
                    <div>
                      <label className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                        <FileText className="size-4" />
                        {t('ID Document')}
                        <span className="font-normal normal-case text-[var(--text-tertiary)]">{t('(Aadhaar / College ID)')}</span>
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="document-upload"
                      />

                      {!documentUrl ? (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer w-full py-5 border-2 border-dashed border-[var(--border-strong)] bg-[var(--bg-base)] text-[var(--text-tertiary)] hover:border-[var(--saffron-200)] hover:bg-[var(--saffron-50)] transition-ui duration-200 flex flex-col items-center gap-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-9 bg-[var(--saffron-50)] flex items-center justify-center">
                              <Camera className="size-4 text-[var(--saffron-600)]" />
                            </div>
                            <div className="flex size-9 items-center justify-center bg-[var(--bg-muted)]">
                              <Upload className="size-4 text-[var(--text-secondary)]" aria-hidden="true" />
                            </div>
                          </div>
                          <span className="text-xs font-medium">
                            {t('Tap to capture or upload ID')}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)]">
                            JPG, PNG, WebP or PDF · Max 2MB
                          </span>
                        </button>
                      ) : (
                        <div className="border-2 border-[var(--emerald-200)] bg-[var(--emerald-50)] p-3 flex items-center gap-3">
                          <div className="size-10 bg-[var(--emerald-50)] flex items-center justify-center shrink-0">
                            {documentUrl.startsWith('data:image') ? (
                              <ImageIcon className="size-5 text-[var(--emerald-600)]" />
                            ) : (
                              <FileText className="size-5 text-[var(--emerald-600)]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[var(--text-primary)] truncate">{documentName}</p>
                            <p className="text-xs text-[var(--emerald-600)] flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="size-4" /> {t('Uploaded successfully')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={removeDocument}
                            aria-label="Remove uploaded document"
                            className="cursor-pointer size-8 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--ruby-600)] hover:bg-[var(--ruby-50)] transition-ui"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ─── Message ──────────────────────────── */}
                    <div>
                      <label htmlFor="req-message" className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                        <MessageSquare className="size-4" />
                        {t('Message')} <span className="font-normal normal-case">{t('(optional)')}</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        id="req-message"
                          placeholder={t('Any note for the librarian')}
                        rows={2}
                        className={cn(inputCls, 'resize-none')}
                      />
                    </div>

                    {/* Error */}
                    {errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-[var(--ruby-50)] border border-[var(--ruby-200)] text-[var(--ruby-600)] text-sm text-center font-medium"
                      >
                        {errorMsg}
                      </motion.div>
                    )}
                  </div>

                  {/* ── Footer / Submit ──────────────── */}
                  <div className="shrink-0 px-6 py-4 border-t-4 border-[var(--warm-line)] bg-[var(--bg-surface)]">
                    {/* What is being asked for, always in view while scrolling. */}
                    <p className="mb-2 flex items-baseline justify-between gap-3 text-sm" aria-live="polite">
                      <span className="text-[var(--warm-ink-2)]">
                        {t('Desk {n}', { n: member.seat })} · {t(durationLabelOf(duration))} · {t(shiftLabelOf(shift))}
                      </span>
                      <span className="font-display font-semibold tabular">
                        {formatINR(paymentMode === 'upi' && amount > 0 ? amount : planPrice(duration))}
                      </span>
                    </p>
                    <button
                      onClick={handleSubmit}
                      disabled={!isValid || loading}
                      className={cn(
                        'px-btn px-raised m-1 w-[calc(100%-8px)] min-h-[52px] font-display text-lg font-semibold flex items-center justify-center gap-2.5',
                        isValid && !loading
                          ? 'cursor-pointer bg-[var(--saffron-600)] text-[var(--text-inverse)] hover:bg-[var(--saffron-700)]'
                          : 'cursor-not-allowed bg-[var(--warm-band)] text-[var(--warm-ink-3)]',
                      )}
                    >
                      {loading ? (
                        <div className="size-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      {loading ? t('Sending…') : t('Send request ▶')}
                    </button>
                    <p className="text-center text-xs text-[var(--text-tertiary)] mt-2.5">
                      {t(paymentMode === 'upi' ? 'The librarian allots the desk once your UPI payment is confirmed.' : 'The librarian allots the desk once your fee is confirmed.')}
                    </p>
                  </div>
                </>
              )}
            </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
