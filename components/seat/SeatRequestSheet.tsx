'use client';

import { useState } from 'react';
import { type Member } from '@/lib/types';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import { X, Send, User, Phone, MessageSquare, Armchair, Receipt } from 'lucide-react';

interface SeatRequestSheetProps {
  member: Member | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (seat: number, name: string, phone: string, message: string, transactionId: string) => void;
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
  const [transactionId, setTransactionId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!open || !member) return null;

  // Placeholder UPI link without fixed amount so user can pay agreed fee
  const upiUrl = `upi://pay?pa=library@upi&pn=Gangaur%20Library&cu=INR`;

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim() || !transactionId.trim()) return;
    onSubmit(member.seat, name.trim(), phone.trim(), message.trim(), transactionId.trim());
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setPhone('');
      setMessage('');
      setTransactionId('');
      onClose();
    }, 2000);
  };

  const isValid = name.trim().length >= 2 && phone.trim().length >= 10 && transactionId.trim().length >= 4;

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

        {submitted ? (
          /* ── Success State ───────────────────────────────── */
          <div className="px-5 py-10 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-active-fill dark:bg-active-fill-dark flex items-center justify-center mx-auto mb-4 animate-check-bounce">
              <Send className="w-7 h-7 text-active-border" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
              Request Sent!
            </h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              The admin will verify your payment for Seat #{member.seat}
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
                    Scan via UPI and submit proof
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
              
              {/* Payment Section */}
              <div className="p-4 rounded-xl bg-[var(--saffron-500)]/5 border border-[var(--saffron-500)]/20 flex flex-col items-center">
                <p className="text-xs font-bold text-[var(--saffron-500)] mb-3 text-center uppercase tracking-wide">
                  Complete Payment
                </p>
                <div className="p-2 bg-white rounded-xl shadow-sm mb-3">
                  <QRCodeSVG
                    value={upiUrl}
                    size={130}
                    level="Q"
                    className="rounded-lg"
                  />
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] text-center leading-relaxed">
                  Scan to pay using Google Pay, PhonePe, or Paytm.<br/>
                  Enter your Transaction ID below after paying.
                </p>
              </div>

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
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-text-tertiary/50 focus:outline-none focus:ring-2 focus:ring-[var(--saffron-500)]/40 transition-all font-mono"
                />
              </div>

              {/* Transaction ID */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  Transaction / UTR ID *
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                  placeholder="e.g. 3084XXXXXXXX"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-base)] border-emerald-500/30 text-[var(--text-primary)] placeholder:text-text-tertiary/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all font-mono"
                />
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

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!isValid}
                className={cn(
                  'cursor-pointer w-full py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 mt-2',
                  isValid
                    ? 'bg-[var(--gradient-glow)] hover:shadow-[var(--shadow-glow-saffron)] active:scale-[0.98]'
                    : 'bg-text-tertiary/30 cursor-not-allowed shadow-none'
                )}
              >
                <Send className="w-4 h-4" />
                Submit Verification
              </button>

              <p className="text-center text-[10px] text-[var(--text-tertiary)]">
                Admin will allot your seat once payment is verified
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
