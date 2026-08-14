'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Lock, ArrowLeft, Loader2 } from 'lucide-react';

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-void)] p-6">
      <div className="w-full max-w-[380px]">
        <Link
          href="/landing"
          className="mb-8 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] transition-ui hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to the library
        </Link>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-7 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--saffron-700)] text-[var(--text-inverse)]">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Staff sign in
              </h1>
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Gangaur Library management
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label
              htmlFor="staff-pin"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]"
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
              className="tabular w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-base)] px-4 py-3 text-center text-lg font-bold tracking-[0.4em] text-[var(--text-primary)] transition-ui focus:border-[var(--saffron-500)] focus:outline-none focus:ring-2 focus:ring-[var(--saffron-500)]"
              placeholder="••••"
            />

            {error && (
              <p
                id={errorId}
                role="alert"
                className="mt-3 rounded-lg border border-[var(--ruby-200)] bg-[var(--ruby-50)] px-3 py-2 text-xs font-semibold text-[var(--ruby-600)]"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!pin || isSubmitting}
              className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--saffron-700)] py-3 text-sm font-bold text-[var(--text-inverse)] transition-ui hover:bg-[var(--saffron-800)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-disabled)]"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Checking…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-[var(--text-tertiary)]">
          Students do not need to sign in.{' '}
          <Link href="/browse" className="font-semibold text-[var(--text-link)] underline">
            Browse seats
          </Link>
        </p>
      </div>
    </main>
  );
}
