'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { X, Lock, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginAsAdmin } = useAuth();
  const { addToast } = useToast();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;

    setIsSubmitting(true);
    const success = await loginAsAdmin(pin);
    setIsSubmitting(false);

    if (success) {
      addToast('success', 'Admin privileges unlocked.');
      onClose();
      setPin('');
    } else {
      addToast('error', 'Invalid PIN. Try again.');
      setPin('');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[var(--bg-void)]/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal */}
      <div className="bg-[var(--bg-surface)] rounded-2xl shadow-[var(--shadow-xl)] w-full max-w-sm border border-[var(--border-default)] overflow-hidden transform transition-all z-10">
        <div className="px-6 py-5 border-b border-[var(--border-default)] flex justify-between items-center bg-[var(--bg-base)]/50">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[var(--saffron-500)]" />
            <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">
              Admin Login
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-base)] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Enter your secure PIN to access library management tools.
          </p>

          <div className="space-y-4">
            <div>
              <label 
                htmlFor="pin" 
                className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider"
              >
                Passcode
              </label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--saffron-500)]/30 text-[var(--text-primary)] transition-shadow text-center tracking-[0.5em] text-lg font-mono"
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !pin}
              className="w-full h-11 bg-[var(--saffron-500)] hover:bg-[var(--saffron-600)] text-[var(--text-inverse)] font-medium rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Unlock Dashboard'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
