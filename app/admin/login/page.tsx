'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Wordmark from '@/components/layout/Wordmark';

/**
 * Staff sign-in.
 *
 * This was a dialog that opened over whatever public page you happened to be
 * on, which blurred the line between the student-facing site and the tool
 * that manages it. It is a page now, for three practical reasons: an admin
 * bounced out of a protected route lands somewhere that explains itself, a
 * lockout can be stated in full rather than squeezed into a toast, and the
 * two halves of the product stop overlapping.
 *
 * All the security lives on the server and is unchanged — scrypt-hashed PINs,
 * a per-staff lockout after 5 failures, a per-caller rate limit before the
 * PIN is even checked, an httpOnly session cookie, and revocation on sign-out.
 * This page is only the door.
 */
export default function AdminLoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginAsAdmin, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  /**
   * Where to go after signing in.
   *
   * Only ever a path on this site — an open redirect here would let a link
   * that looks like a library login bounce staff to another host with the
   * sign-in still fresh in their mind.
   */
  const rawNext = searchParams.get('next') || '/';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';

  useEffect(() => {
    if (!isLoading && isAdmin) router.replace(next);
  }, [isAdmin, isLoading, next, router]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    const result = await loginAsAdmin(pin);
    setIsSubmitting(false);
    setPin('');

    if (result.ok) {
      router.replace(next);
      return;
    }
    // The server already says how many attempts remain, or how long a
    // lockout has left. Show that rather than a generic failure.
    setError(result.error || 'That PIN was not recognised.');
    inputRef.current?.focus();
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bg-void)] p-6">
      <div className="w-full max-w-[380px]">
        <Link
          href="/landing"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition-ui hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to the library
        </Link>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-7 shadow-[var(--shadow-xs)]">
          <Wordmark size="sm" caption="Staff desk" />
          <h1 className="mt-6 font-pixel text-xl font-bold leading-tight text-[var(--text-primary)]">
            Sign in
          </h1>
          <p className="mb-6 mt-1.5 text-sm text-[var(--text-secondary)]">
            Your PIN identifies you, so the activity log records who did what.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label
              htmlFor="staff-pin"
              className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
            >
              Your PIN
            </label>
            <input
              id="staff-pin"
              ref={inputRef}
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              // Each staff member has their own PIN, so the log records who
              // did what. checkStaffPin identifies the person from the PIN
              // alone — there is no username to type.
              maxLength={8}
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              className="tabular w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 text-center font-mono text-lg text-[var(--text-primary)] transition-ui focus:border-[var(--saffron-600)] focus:outline-none focus:ring-2 focus:ring-[var(--saffron-600)]/20"
              placeholder="••••"
            />

            {error && (
              <p
                id={errorId}
                role="alert"
                className="mt-3 rounded-[var(--radius-sm)] border border-[var(--ruby-200)] bg-[var(--ruby-50)] px-3 py-2 text-sm text-[var(--ruby-700)]"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!pin || isSubmitting}
              className="mt-5 flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] text-sm font-semibold text-[var(--text-inverse)] transition-ui hover:bg-[var(--ink-hover)] disabled:cursor-not-allowed disabled:border-[var(--border-default)] disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-disabled)]"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Checking…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-[var(--text-tertiary)]">
          Students do not need to sign in.{' '}
          <Link href="/browse" className="font-medium text-[var(--text-link)] underline underline-offset-4">
            Find a seat
          </Link>
        </p>
      </div>
    </main>
  );
}
