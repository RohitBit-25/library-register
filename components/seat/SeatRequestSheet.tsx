'use client';

import { useState, useRef, useEffect } from 'react';
import { type Member } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Send, User, Phone, MessageSquare, Armchair,
  CheckCircle2, Banknote, Smartphone, FileText, Camera, Upload,
  Trash2, Image as ImageIcon, CalendarDays, Sparkles,
} from 'lucide-react';

interface SeatRequestSheetProps {
  member: Member | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (
    seat: number,
    name: string,
    phone: string,
    message: string,
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
  const [joinDate, setJoinDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0]; // default to today
  });
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
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
      const messageWithDate = `${message.trim()}${message.trim() ? ' | ' : ''}Joining: ${joinDate}`;
      const res = await onSubmit(
        member.seat,
        name.trim(),
        cleanPhone,
        messageWithDate,
        '', // no transaction ID
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
          setJoinDate(new Date().toISOString().split('T')[0]);
          setPaymentMode('cash');
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
  const isValid = nameValid && phoneValid && dateValid;

  // Shared input classes
  const inputCls =
    'w-full px-4 py-3 rounded-xl text-sm bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--saffron-500)]/40 focus:border-[var(--saffron-500)]/50 transition-all duration-200';

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
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div
              ref={dialogRef}
              className="w-full max-w-[480px] max-h-[90vh] rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {!member.vacant ? (
                /* ── Occupied State ──────────────────── */
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--ruby-500)]/10 flex items-center justify-center mx-auto mb-4">
                    <Armchair className="w-8 h-8 text-[var(--ruby-400)]" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
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
                    className="cursor-pointer px-6 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-default)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
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
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-[var(--emerald-500)]/15 flex items-center justify-center mx-auto mb-5"
                  >
                    <CheckCircle2 className="w-10 h-10 text-[var(--emerald-500)]" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                    Request Submitted!
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Admin will verify and allot <span className="font-bold text-[var(--saffron-500)]">Seat #{member.seat}</span> to you shortly.
                  </p>
                </motion.div>
              ) : (
                /* ── Form ───────────────────────────── */
                <>
                  {/* Dialog Header */}
                  <div className="relative px-6 pt-6 pb-4 shrink-0">
                    {/* Decorative gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--saffron-500)]/5 via-transparent to-transparent pointer-events-none rounded-t-3xl" />
                    
                    <div className="relative flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--saffron-500)] to-[var(--saffron-600,var(--saffron-500))] flex items-center justify-center shadow-lg shadow-[var(--saffron-500)]/20">
                          <span className="text-lg font-black text-[#1a1a16] font-mono">
                            {String(member.seat).padStart(2, '0')}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                            Request Seat #{member.seat}
                            <Sparkles className="w-4 h-4 text-[var(--saffron-500)]" />
                          </h3>
                          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                            Fill details below to reserve this seat
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={onClose}
                        className="cursor-pointer w-8 h-8 rounded-xl bg-[var(--bg-base)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Form Body */}
                  <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">

                    {/* ─── Payment Mode Toggle ─────────────── */}
                    <div>
                      <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2 block">
                        Payment Mode
                      </label>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--bg-base)] rounded-2xl border border-[var(--border-default)]">
                        <button
                          type="button"
                          onClick={() => setPaymentMode('cash')}
                          className={cn(
                            'cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300',
                            paymentMode === 'cash'
                              ? 'bg-[var(--emerald-500)] text-[#1a1a16] shadow-lg shadow-[var(--emerald-500)]/25'
                              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
                          )}
                        >
                          <Banknote className="w-4 h-4" />
                          Cash
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMode('upi')}
                          className={cn(
                            'cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300',
                            paymentMode === 'upi'
                              ? 'bg-[var(--sapphire-500)] text-white shadow-lg shadow-[var(--sapphire-500)]/25'
                              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
                          )}
                        >
                          <Smartphone className="w-4 h-4" />
                          UPI / Online
                        </button>
                      </div>
                    </div>

                    {/* ─── Info Banner ──────────────────────── */}
                    <div className={cn(
                      "p-4 rounded-xl border flex items-start gap-3 transition-all duration-300",
                      paymentMode === 'cash'
                        ? "bg-[var(--emerald-500)]/5 border-[var(--emerald-500)]/20"
                        : "bg-[var(--sapphire-500)]/5 border-[var(--sapphire-500)]/20"
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        paymentMode === 'cash'
                          ? "bg-[var(--emerald-500)]/15"
                          : "bg-[var(--sapphire-500)]/15"
                      )}>
                        {paymentMode === 'cash'
                          ? <Banknote className="w-4 h-4 text-[var(--emerald-400)]" />
                          : <Smartphone className="w-4 h-4 text-[var(--sapphire-400)]" />
                        }
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {paymentMode === 'cash'
                          ? 'Please pay at the library counter. Admin will confirm your payment and allot the seat.'
                          : 'Complete UPI payment at the counter or via scanning. Admin will verify and allot your seat.'
                        }
                      </p>
                    </div>

                    {/* ─── Name ─────────────────────────────── */}
                    <div>
                      <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        Full Name <span className="text-[var(--ruby-400)]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Enter your full name"
                          autoFocus
                          className={inputCls}
                        />
                        {nameValid && (
                          <CheckCircle2 className="w-4 h-4 text-[var(--emerald-500)] absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                    </div>

                    {/* ─── Phone ────────────────────────────── */}
                    <div>
                      <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        Phone Number <span className="text-[var(--ruby-400)]">*</span>
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
                          placeholder="10-digit mobile number"
                          className={cn(inputCls, 'font-mono')}
                        />
                        {phoneValid && (
                          <CheckCircle2 className="w-4 h-4 text-[var(--emerald-500)] absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                    </div>

                    {/* ─── Date of Joining ──────────────────── */}
                    <div>
                      <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Date of Joining <span className="text-[var(--ruby-400)]">*</span>
                      </label>
                      <input
                        type="date"
                        value={joinDate}
                        onChange={e => setJoinDate(e.target.value)}
                        className={cn(inputCls, 'font-mono appearance-none')}
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>

                    {/* ─── ID Document Upload ───────────────── */}
                    <div>
                      <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        ID Document
                        <span className="font-normal normal-case tracking-normal text-[var(--text-tertiary)]">(Aadhaar / College ID)</span>
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
                          className="cursor-pointer w-full py-5 rounded-xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--bg-base)] text-[var(--text-tertiary)] hover:border-[var(--saffron-500)]/40 hover:bg-[var(--saffron-500)]/5 transition-all duration-200 flex flex-col items-center gap-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[var(--saffron-500)]/10 flex items-center justify-center">
                              <Camera className="w-4 h-4 text-[var(--saffron-500)]" />
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-[var(--sapphire-500)]/10 flex items-center justify-center">
                              <Upload className="w-4 h-4 text-[var(--sapphire-500)]" />
                            </div>
                          </div>
                          <span className="text-xs font-medium">
                            Tap to capture or upload ID
                          </span>
                          <span className="text-[9px] text-[var(--text-tertiary)]">
                            JPG, PNG, WebP or PDF · Max 2MB
                          </span>
                        </button>
                      ) : (
                        <div className="rounded-xl border border-[var(--emerald-500)]/30 bg-[var(--emerald-500)]/5 p-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--emerald-500)]/15 flex items-center justify-center shrink-0">
                            {documentUrl.startsWith('data:image') ? (
                              <ImageIcon className="w-5 h-5 text-[var(--emerald-400)]" />
                            ) : (
                              <FileText className="w-5 h-5 text-[var(--emerald-400)]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[var(--text-primary)] truncate">{documentName}</p>
                            <p className="text-[10px] text-[var(--emerald-400)] flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Uploaded successfully
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={removeDocument}
                            className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--ruby-500)] hover:bg-[var(--ruby-500)]/10 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ─── Message ──────────────────────────── */}
                    <div>
                      <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message <span className="font-normal normal-case tracking-normal">(optional)</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Shift preference, duration (e.g. Morning, 3 Months)"
                        rows={2}
                        className={cn(inputCls, 'resize-none')}
                      />
                    </div>

                    {/* Error */}
                    {errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl bg-[var(--ruby-500)]/10 border border-[var(--ruby-500)]/20 text-[var(--ruby-400)] text-sm text-center font-medium"
                      >
                        {errorMsg}
                      </motion.div>
                    )}
                  </div>

                  {/* ── Footer / Submit ──────────────── */}
                  <div className="shrink-0 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
                    <button
                      onClick={handleSubmit}
                      disabled={!isValid || loading}
                      className={cn(
                        'cursor-pointer w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg',
                        isValid && !loading
                          ? 'bg-gradient-to-r from-[var(--saffron-500)] to-[var(--saffron-600,var(--saffron-500))] text-[#1a1a16] hover:shadow-[var(--saffron-500)]/30 hover:shadow-xl active:scale-[0.98]'
                          : 'bg-[var(--bg-muted)] text-[var(--text-tertiary)] cursor-not-allowed shadow-none',
                      )}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                    <p className="text-center text-[10px] text-[var(--text-tertiary)] mt-2.5">
                      Admin will verify and allot your seat after {paymentMode === 'upi' ? 'payment' : 'fee'} confirmation
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
