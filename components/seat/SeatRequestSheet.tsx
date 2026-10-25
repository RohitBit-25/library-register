'use client';

import { useState, useRef, useEffect } from 'react';
import { type Duration, type Member, type Shift } from '@/lib/types';
import { cn, todayISO } from '@/lib/utils';
import { seatRow } from '@/lib/layoutConfig';
import { AnimatePresence, motion } from 'framer-motion';
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
  ) => Promise<{ success: boolean; error: string | null }>;
}

type PaymentMode = 'upi' | 'cash';

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
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !member) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Please upload an image (JPG, PNG, WebP) or PDF.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('File size must be less than 2MB.');
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
    );

      if (res.success) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setName('');
          setPhone('');
          setMessage('');
          setJoinDate(todayISO());
          setDuration('3M');
          setShift('full');
          setPaymentMode('cash');
          setTransactionId('');
          setDocumentUrl('');
          setDocumentName('');
          onClose();
        }, 2200);
      } else {
        setErrorMsg(
          res.error === 'duplicate'
            ? 'You already requested this seat.'
            : 'Failed to submit request.',
        );
      }
    } catch {
      setErrorMsg('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const phoneValid = phone.replace(/\D/g, '').length === 10;
  const nameValid = name.trim().length >= 2;
  const dateValid = joinDate.length > 0;
  const paymentValid = paymentMode === 'cash' || transactionId.trim().length >= 4;
  const isValid = nameValid && phoneValid && dateValid && paymentValid;

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

  // Shared input classes
  const inputCls =
    'w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm bg-[var(--bg-surface)] border-2 border-[var(--warm-ink-3)] text-[var(--warm-ink)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--saffron-600)] transition-ui';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[var(--text-primary)]/40"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={springUI}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              ref={dialogRef}
              className="px-raised w-full max-w-[480px] max-h-[90vh] bg-[var(--bg-surface)] text-[var(--warm-ink)] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {!member.vacant ? (
                /* ── Occupied State ──────────────────── */
                <div className="p-6 text-center">
                  <div className="size-16 bg-[var(--ruby-50)] flex items-center justify-center mx-auto mb-4">
                    <Armchair className="size-8 text-[var(--ruby-600)]" />
                  </div>
                  <h3 className="font-pixel text-xl font-bold uppercase mb-1">
                    Seat #{member.seat} is Occupied
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">
                    Currently assigned to <span className="font-semibold text-[var(--text-primary)]">{member.name}</span>
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mb-6">
                    Check back later or browse other available seats.
                  </p>
                  <button
                    onClick={onClose}
                    className="cursor-pointer px-6 py-2.5 bg-[var(--bg-base)] border border-[var(--border-default)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-ui"
                  >
                    Close
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
                  <h3 className="font-pixel text-[2rem] font-bold uppercase leading-none mb-3">
                    Request sent
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    The librarian will confirm your payment and allot seat <span className="font-semibold text-[var(--text-primary)]">{member.seat}</span>. Track it under My requests.
                  </p>
                </motion.div>
              ) : (
                /* ── Form ───────────────────────────── */
                <>
                  {/* Dialog Header */}
                  <div className="shrink-0 border-b-4 border-[var(--warm-ink)] bg-[var(--warm-band)] px-6 pb-4 pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-pixel text-xl font-bold uppercase leading-none sm:text-2xl">
                          Request desk <span className="tabular">{member.seat}</span>
                        </h3>
                        <p className="mt-2 text-sm text-[var(--warm-ink-2)]">
                          {seatRow(member.seat)} · the librarian confirms and allots it.
                        </p>
                      </div>
                      <button
                        onClick={onClose}
                        aria-label="Close" className="cursor-pointer size-9 shrink-0 flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-ui"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Form Body */}
                  <div className="flex-1 overflow-y-auto px-6 pt-5 pb-6 space-y-5">

                    {/* ─── Payment Mode Toggle ─────────────── */}
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                        How will you pay?
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
                          Cash
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
                          UPI / Online
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
                          Please pay at the library counter. Admin will confirm your payment and allot the seat.
                        </p>
                      </div>
                    ) : (
                      <div className="border border-[var(--border-default)] bg-[var(--bg-base)] overflow-hidden">
                        <div className="flex flex-col items-center py-5 px-4">
                          <p className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                            <Smartphone className="size-4" />
                            Scan & Pay via UPI
                          </p>
                          <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] mb-3">
                            <QRCodeSVG
                              value="upi://pay?pa=gangaur.972327@sbi&pn=Gangaur%20Library&cu=INR"
                              size={110}
                              level="H"
                              className="block"
                            />
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] text-center leading-relaxed max-w-[220px]">
                            Scan with <span className="text-[var(--text-primary)] font-semibold">GPay, PhonePe or Paytm</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ─── Name ─────────────────────────────── */}
                    <div>
                      <label htmlFor="req-name" className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                        <User className="size-4" />
                        Full Name <span className="text-[var(--ruby-600)]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          id="req-name"
                          placeholder="Enter your full name"
                          autoFocus
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
                        Phone Number <span className="text-[var(--ruby-600)]">*</span>
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
                          placeholder="10-digit mobile number"
                          className={cn(inputCls, 'font-mono')}
                        />
                        {phoneValid && (
                          <CheckCircle2 className="size-4 text-[var(--emerald-600)] absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                    </div>

                    {/* ─── Date of Joining ──────────────────── */}
                    <div>
                      <label htmlFor="req-date" className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                        <CalendarDays className="size-4" />
                        Date of Joining <span className="text-[var(--ruby-600)]">*</span>
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
                        Membership Duration <span className="text-[var(--ruby-600)]">*</span>
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
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ─── Preferred Shift ───────────────────── */}
                    <div>
                      <label className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                        <Clock className="size-4" />
                        Preferred Shift <span className="text-[var(--ruby-600)]">*</span>
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
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ─── UPI Reference ─────────────────────── */}
                    {paymentMode === 'upi' && (
                      <div>
                        <label htmlFor="req-upi" className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                          <Smartphone className="size-4" />
                          UPI Reference <span className="text-[var(--ruby-600)]">*</span>
                        </label>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={e => setTransactionId(e.target.value)}
                          id="req-upi"
                          placeholder="Enter transaction/reference ID"
                          className={cn(inputCls, 'font-mono')}
                        />
                        {!paymentValid && (
                          <p className="mt-2 text-xs font-semibold text-[var(--ruby-600)]">
                            Add the payment reference so admin can verify it.
                          </p>
                        )}
                      </div>
                    )}

                    {/* ─── ID Document Upload ───────────────── */}
                    <div>
                      <label className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                        <FileText className="size-4" />
                        ID Document
                        <span className="font-normal normal-case text-[var(--text-tertiary)]">(Aadhaar / College ID)</span>
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
                            Tap to capture or upload ID
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
                              <CheckCircle2 className="size-4" /> Uploaded successfully
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
                        Message <span className="font-normal normal-case">(optional)</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        id="req-message"
                          placeholder="Any note for the librarian"
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
                    <button
                      onClick={handleSubmit}
                      disabled={!isValid || loading}
                      className={cn(
                        'px-btn px-raised m-1 w-[calc(100%-8px)] min-h-[52px] font-pixel text-lg font-semibold uppercase flex items-center justify-center gap-2.5',
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
                      {loading ? 'Sending…' : `Send request ▶`}
                    </button>
                    <p className="text-center text-xs text-[var(--text-tertiary)] mt-2.5">
                      The librarian allots the seat once your {paymentMode === 'upi' ? 'UPI payment' : 'fee'} is confirmed.
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
