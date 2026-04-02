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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal */}
      <div className="bg-bg-primary dark:bg-bg-primary-dark rounded-2xl shadow-2xl w-full max-w-sm border border-border-primary dark:border-border-primary-dark overflow-hidden transform transition-all z-10">
        <div className="px-6 py-5 border-b border-border-primary dark:border-border-primary-dark flex justify-between items-center bg-bg-secondary dark:bg-bg-secondary-dark/50">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-accent-primary" />
            <h2 className="text-[17px] font-semibold text-text-primary dark:text-text-primary-dark">
              Admin Login
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary dark:text-text-secondary-dark hover:bg-bg-primary dark:hover:bg-bg-primary-dark rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-4">
            Enter your secure PIN to access library management tools.
          </p>

          <div className="space-y-4">
            <div>
              <label 
                htmlFor="pin" 
                className="block text-[13px] font-medium text-text-secondary dark:text-text-secondary-dark mb-1.5 uppercase tracking-wider"
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
                className="w-full h-11 px-3 bg-bg-secondary dark:bg-bg-secondary-dark border border-border-primary dark:border-border-primary-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/50 text-text-primary dark:text-text-primary-dark transition-shadow text-center tracking-[0.5em] text-lg font-mono"
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !pin}
              className="w-full h-11 bg-accent-primary hover:bg-accent-secondary text-white font-medium rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
