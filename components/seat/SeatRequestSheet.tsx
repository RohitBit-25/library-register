'use client';

import { useState, useRef } from 'react';
import { type Member } from '@/lib/types';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import {
  X, Send, User, Phone, MessageSquare, Armchair, Receipt,
  CheckCircle2, Banknote, Smartphone, FileText, Camera, Upload,
  Trash2, Image as ImageIcon,
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
  const [transactionId, setTransactionId] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open || !member) return null;

  // Real UPI link for the Gangaur Library
  const upiUrl = `upi://pay?pa=gangaur.972327@sbi&pn=Gangaur%20Library&cu=INR`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Please upload an image (JPG, PNG, WebP) or PDF.');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('File size must be less than 2MB.');
      return;
    }

    setDocumentName(file.name);
    setErrorMsg('');

    // Convert to base64 for storage
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
    if (!name.trim() || !phone.trim()) return;
    if (paymentMode === 'upi' && !transactionId.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const res = await onSubmit(
        member.seat,
        name.trim(),
        cleanPhone,
        message.trim(),
        paymentMode === 'upi' ? transactionId.trim() : '',
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
          setTransactionId('');
          setPaymentMode('upi');
          setDocumentUrl('');
          setDocumentName('');
          onClose();
        }, 2000);
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
  const txnValid = paymentMode === 'cash' || transactionId.trim().length >= 4;
  const isValid = nameValid && phoneValid && txnValid;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-[var(--bg-surface)] border-t border-[var(--border-default)] shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-text-tertiary/30" />
        </div>

        {!member.vacant ? (
          /* ── Occupied State ──────────────────────────────── */
          <div className="px-5 pb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--rose-500)]/10 flex items-center justify-center">
                  <Armchair className="w-5 h-5 text-[var(--rose-500)]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Seat #{member.seat}
                  </h3>
                  <p className="text-xs text-[var(--text-tertiary)]">Currently Occupied</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-base)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-default)] flex flex-col gap-3">
              <div className="flex justify-between items-center pb-3 border-b border-[var(--border-default)]">
                <span className="text-xs text-[var(--text-tertiary)] font-medium">Occupant</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">{member.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--text-tertiary)] font-medium">Shift</span>
                <span className="text-sm font-bold text-[var(--text-primary)] capitalize">{member.shift}</span>
              </div>
            </div>
            <p className="text-xs text-center text-text-tertiary mt-5 leading-relaxed">
              This seat is currently assigned.<br/>Check back later or browse other available seats.
            </p>
          </div>
        ) : submitted ? (
          /* ── Success State ───────────────────────────────── */
          <div className="px-5 py-10 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[var(--emerald-500)]/15 flex items-center justify-center mx-auto mb-4 animate-check-bounce">
              <Send className="w-7 h-7 text-active-border" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
              Request Sent!
            </h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              The admin will verify your {paymentMode === 'upi' ? 'payment' : 'details'} for Seat #{member.seat}
            </p>
          </div>
        ) : (
          /* ── Form ────────────────────────────────────────── */
          <div className="px-5 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--saffron-500)]/10 flex items-center justify-center">
                  <Armchair className="w-5 h-5 text-[var(--saffron-500)]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Request Seat #{member.seat}
                  </h3>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Choose payment mode & submit proof
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-base)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form fields */}
            <div className="space-y-4">

              {/* ─── Payment Mode Toggle ─────────────────────── */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5" />
                  Payment Mode *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('upi')}
                    className={cn(
                      'cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-2',
                      paymentMode === 'upi'
                        ? 'bg-[var(--saffron-500)]/15 border-[var(--saffron-500)] text-[var(--saffron-400)] shadow-[0_0_16px_rgba(232,133,58,0.15)]'
                        : 'bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)]',
                    )}
                  >
                    <Smartphone className="w-4 h-4" />
                    UPI / Online
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('cash')}
                    className={cn(
                      'cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-2',
                      paymentMode === 'cash'
                        ? 'bg-[var(--emerald-500)]/15 border-[var(--emerald-500)] text-[var(--emerald-400)] shadow-[0_0_16px_rgba(34,195,106,0.15)]'
                        : 'bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)]',
                    )}
                  >
                    <Banknote className="w-4 h-4" />
                    Cash
                  </button>
                </div>
              </div>

              {/* ─── Payment Section (UPI) ───────────────────── */}
              {paymentMode === 'upi' && (
                <div className="p-5 rounded-xl bg-gradient-to-b from-[var(--saffron-500)]/10 to-transparent border border-[var(--saffron-500)]/20 flex flex-col items-center relative overflow-hidden mb-2 animate-fade-in">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--saffron-500)] to-transparent opacity-70"></div>
                  <p className="text-[10px] font-black text-[var(--saffron-400)] mb-4 text-center uppercase tracking-[0.2em] flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5" /> Complete Verification Payment
                  </p>
                  <div className="p-3 bg-white rounded-xl shadow-[0_0_20px_rgba(232,133,58,0.15)] mb-4 ring-4 ring-white/5">
                    <QRCodeSVG
                      value={upiUrl}
                      size={130}
                      level="H"
                      className="rounded-lg"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] text-center leading-relaxed max-w-[240px]">
                    Scan QR with <span className="text-white font-medium">GPay, PhonePe or Paytm</span>.<br/>
                    Enter transaction ID below for admin verification.
                  </p>
                </div>
              )}

              {/* ─── Payment Section (Cash) ──────────────────── */}
              {paymentMode === 'cash' && (
                <div className="p-5 rounded-xl bg-gradient-to-b from-[var(--emerald-500)]/10 to-transparent border border-[var(--emerald-500)]/20 flex flex-col items-center relative overflow-hidden mb-2 animate-fade-in">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--emerald-500)] to-transparent opacity-70"></div>
                  <div className="w-14 h-14 rounded-2xl bg-[var(--emerald-500)]/15 flex items-center justify-center mb-3">
                    <Banknote className="w-7 h-7 text-[var(--emerald-400)]" />
                  </div>
                  <p className="text-[10px] font-black text-[var(--emerald-400)] mb-2 text-center uppercase tracking-[0.2em]">
                    Pay Cash at Counter
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] text-center leading-relaxed max-w-[260px]">
                    Please pay at the library counter. Admin will confirm your payment and allot the seat.
                  </p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Your Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your full name"
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-text-tertiary/50 focus:outline-none focus:ring-2 focus:ring-[var(--saffron-500)]/40 transition-all"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Phone Number *
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
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-text-tertiary/50 focus:outline-none focus:ring-2 focus:ring-[var(--saffron-500)]/40 transition-all font-mono"
                  />
                  {phoneValid && (
                    <CheckCircle2 className="w-4 h-4 text-[var(--emerald-500)] absolute right-3 top-1/2 -translate-y-1/2 animate-in zoom-in" />
                  )}
                </div>
              </div>

              {/* Transaction ID (UPI only) */}
              {paymentMode === 'upi' && (
                <div className="animate-fade-in">
                  <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" />
                    Transaction / UTR ID *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      placeholder="e.g. 3084XXXXXXXX"
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-base)] border-emerald-500/30 text-[var(--text-primary)] placeholder:text-text-tertiary/50 focus:outline-none focus:ring-2 focus:ring-[var(--emerald-500)]/40 transition-all font-mono"
                    />
                    {transactionId.trim().length >= 4 && (
                      <CheckCircle2 className="w-4 h-4 text-[var(--emerald-500)] absolute right-3 top-1/2 -translate-y-1/2 animate-in zoom-in" />
                    )}
                  </div>
                </div>
              )}

              {/* ─── ID Document Upload ──────────────────────── */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  ID Document <span className="text-[var(--text-tertiary)] font-normal">(Aadhaar / College ID)</span>
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
                    className="cursor-pointer w-full py-4 rounded-xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--bg-base)] text-[var(--text-tertiary)] hover:border-[var(--saffron-500)]/40 hover:bg-[var(--saffron-500)]/5 transition-all duration-200 flex flex-col items-center gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--saffron-500)]/10 flex items-center justify-center">
                        <Camera className="w-4 h-4 text-[var(--saffron-500)]" />
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-[var(--indigo-500)]/10 flex items-center justify-center">
                        <Upload className="w-4 h-4 text-[var(--indigo-500)]" />
                      </div>
                    </div>
                    <span className="text-[11px] font-medium">
                      Tap to capture or upload ID
                    </span>
                    <span className="text-[9px] text-[var(--text-tertiary)]">
                      JPG, PNG, WebP or PDF · Max 2MB
                    </span>
                  </button>
                ) : (
                  <div className="rounded-xl border border-[var(--emerald-500)]/30 bg-[var(--emerald-500)]/5 p-3 flex items-center gap-3 animate-fade-in">
                    <div className="w-10 h-10 rounded-lg bg-[var(--emerald-500)]/15 flex items-center justify-center flex-shrink-0">
                      {documentUrl.startsWith('data:image') ? (
                        <ImageIcon className="w-5 h-5 text-[var(--emerald-400)]" />
                      ) : (
                        <FileText className="w-5 h-5 text-[var(--emerald-400)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {documentName}
                      </p>
                      <p className="text-[10px] text-[var(--emerald-400)] flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded successfully
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeDocument}
                      className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--rose-500)] hover:bg-[var(--rose-500)]/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Shift preference (e.g. Morning, 3 Months)"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-text-tertiary/50 focus:outline-none focus:ring-2 focus:ring-[var(--saffron-500)]/40 transition-all resize-none"
                />
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-[var(--rose-500)]/10 border border-[var(--rose-500)]/20 text-[var(--rose-500)] text-sm text-center">
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!isValid || loading}
                className={cn(
                  'cursor-pointer w-full py-3 rounded-xl text-sm font-bold text-[var(--saffron-50)] transition-all shadow-md flex items-center justify-center gap-2 mt-2',
                  isValid && !loading
                    ? 'bg-[var(--gradient-glow)] hover:shadow-[var(--shadow-glow-saffron)] active:scale-[0.98]'
                    : 'bg-text-tertiary/30 cursor-not-allowed shadow-none',
                )}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {loading ? 'Submitting...' : 'Submit Verification'}
              </button>

              <p className="text-center text-[10px] text-[var(--text-tertiary)]">
                Admin will allot your seat once {paymentMode === 'upi' ? 'payment is' : 'details are'} verified
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
