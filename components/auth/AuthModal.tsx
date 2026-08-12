'use client';

import { useState, useEffect, useRef, useId } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { X, Lock, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

export default function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { loginAsAdmin } = useAuth();
  const { addToast } = useToast();

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const errorId = useId();

  // Escape to close + focus trap. The dialog previously had neither, plus no
  // role/aria-modal, so screen readers still saw the page behind it and Tab
  // walked straight out of the modal.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes?.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    const result = await loginAsAdmin(pin);
    setIsSubmitting(false);
    setPin('');

    if (result.ok) {
      addToast('success', 'Admin privileges unlocked.');
      onClose();
    } else {
      // Show the server's message inline — it carries the remaining-attempts
      // count and the lockout window, which a generic toast would lose.
      setError(result.error ?? 'Invalid PIN. Try again.');
      inputRef.current?.focus();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--bg-void)]/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-xl)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-base)] px-6 py-5">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[var(--saffron-600)]" aria-hidden="true" />
            <h2 id={titleId} className="text-[17px] font-semibold text-[var(--text-primary)]">
              Staff Login
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close staff login"
            className="cursor-pointer rounded-full p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            Enter your PIN to access library management tools.
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="admin-pin"
                className="mb-1.5 block text-[13px] font-medium uppercase tracking-wider text-[var(--text-secondary)]"
              >
                Passcode
              </label>
              <input
                ref={inputRef}
                id="admin-pin"
                name="pin"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(''); }}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className="h-12 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-base)] px-3 text-center font-mono text-lg tracking-[0.5em] text-[var(--text-primary)] transition-shadow focus:outline-none focus:ring-2 focus:ring-[var(--saffron-600)]"
                placeholder="••••••"
              />
              {error && (
                <p id={errorId} role="alert" className="mt-2 text-[13px] font-medium text-[var(--ruby-600)]">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !pin}
              className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--saffron-600)] font-medium text-[var(--text-inverse)] transition-colors hover:bg-[var(--saffron-700)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="sr-only">Signing in…</span></>
                : 'Unlock Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
