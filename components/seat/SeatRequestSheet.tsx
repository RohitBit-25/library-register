'use client';

import { useState } from 'react';
import { type Member } from '@/lib/types';
import { cn } from '@/lib/utils';
import { X, Send, User, Phone, MessageSquare, Armchair } from 'lucide-react';

interface SeatRequestSheetProps {
  member: Member | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (seat: number, name: string, phone: string, message: string) => void;
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
  const [submitted, setSubmitted] = useState(false);

  if (!open || !member) return null;

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) return;
    onSubmit(member.seat, name.trim(), phone.trim(), message.trim());
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setPhone('');
      setMessage('');
      onClose();
    }, 2000);
  };

  const isValid = name.trim().length >= 2 && phone.trim().length >= 10;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-surface dark:bg-surface-dark border-t border-card-border dark:border-card-border-dark shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
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
            <h3 className="text-lg font-bold text-text-primary dark:text-text-primary-dark mb-1">
              Request Sent!
            </h3>
            <p className="text-sm text-text-tertiary dark:text-text-tertiary-dark">
              The admin will review your request for Seat #{member.seat}
            </p>
          </div>
        ) : (
          /* ── Form ────────────────────────────────────────── */
          <div className="px-5 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-accent/10 flex items-center justify-center">
                  <Armchair className="w-5 h-5 text-blue-accent" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary dark:text-text-primary-dark">
                    Request Seat #{member.seat}
                  </h3>
                  <p className="text-xs text-text-tertiary dark:text-text-tertiary-dark">
                    Fill in your details to request this seat
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-lg p-1.5 text-text-tertiary dark:text-text-tertiary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form fields */}
            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-text-secondary dark:text-text-secondary-dark mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Your Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your full name"
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-bg dark:bg-bg-dark border border-card-border dark:border-card-border-dark text-text-primary dark:text-text-primary-dark placeholder:text-text-tertiary/50 focus:outline-none focus:ring-2 focus:ring-blue-accent/40 transition-all"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-bold text-text-secondary dark:text-text-secondary-dark mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-bg dark:bg-bg-dark border border-card-border dark:border-card-border-dark text-text-primary dark:text-text-primary-dark placeholder:text-text-tertiary/50 focus:outline-none focus:ring-2 focus:ring-blue-accent/40 transition-all font-mono"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-bold text-text-secondary dark:text-text-secondary-dark mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Any specific shift preference or request…"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-bg dark:bg-bg-dark border border-card-border dark:border-card-border-dark text-text-primary dark:text-text-primary-dark placeholder:text-text-tertiary/50 focus:outline-none focus:ring-2 focus:ring-blue-accent/40 transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!isValid}
                className={cn(
                  'cursor-pointer w-full py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md flex items-center justify-center gap-2',
                  isValid
                    ? 'gradient-blue hover:shadow-lg hover:shadow-blue-accent/25 active:scale-[0.98]'
                    : 'bg-text-tertiary/30 cursor-not-allowed shadow-none'
                )}
              >
                <Send className="w-4 h-4" />
                Send Request
              </button>

              <p className="text-center text-[10px] text-text-tertiary dark:text-text-tertiary-dark">
                The library admin will contact you after reviewing your request
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
