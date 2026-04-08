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
  onSubmit: (seat: number, name: string, phone: string, message: string, transactionId: string) => Promise<{success: boolean, error: string | null}>;
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
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!open || !member) return null;

  // Real UPI link for the Gangaur Library
  const upiUrl = `upi://pay?pa=gangaur.972327@sbi&pn=Gangaur%20Library&cu=INR`;

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !transactionId.trim()) return;
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      const res = await onSubmit(member.seat, name.trim(), phone.trim(), message.trim(), transactionId.trim());
      
      if (res.success) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setName('');
          setPhone('');
          setMessage('');
          setTransactionId('');
          onClose();
        }, 2000);
      } else {
        setErrorMsg(res.error === 'duplicate' ? 'You already requested this seat.' : 'Failed to submit request.');
      }
    } catch (err) {
      setErrorMsg('An error occurred.');
    } finally {
      setLoading(false);
    }
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
                    : 'bg-text-tertiary/30 cursor-not-allowed shadow-none'
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
                Admin will allot your seat once payment is verified
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
