'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
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
 * Name + PIN. The name says who; the PIN proves it, so a wrong guess only
 * counts against that one account. The security lives on the server —
 * scrypt-hashed PINs, a per-account lockout after 5 failures, a per-caller
 * rate limit, an httpOnly session cookie, revocation on sign-out. The page is
 * linked from nowhere a student goes; staff bookmark it.
 */

/** The last name that signed in on this device, so staff only type a PIN. */
const NAME_KEY = 'gangaur-staff-name';
const readName = () => { try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; } };
const noSubscribe = () => () => {};
export default function AdminLoginPage() {
  // Read after hydration ('' on the server), then overridable by typing.
  const rememberedName = useSyncExternalStore(noSubscribe, readName, () => '');
  const [typedName, setTypedName] = useState<string | null>(null);
  const name = typedName ?? rememberedName;
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginAsAdmin, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
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
    (rememberedName ? inputRef : nameRef).current?.focus();
  }, [rememberedName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pin || isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    const result = await loginAsAdmin(name.trim(), pin);
    setIsSubmitting(false);
    setPin('');

    if (result.ok) {
      try { localStorage.setItem(NAME_KEY, name.trim()); } catch { /* private mode */ }
      router.replace(next);
      return;
    }
    // The server already says how many attempts remain, or how long a
    // lockout has left. Show that rather than a generic failure.
    setError(result.error || 'That name and PIN do not match.');
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
            Your name and PIN, so the activity log records who did what.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="staff-name" className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
              Your name
            </label>
            <input
              id="staff-name"
              ref={nameRef}
              type="text"
              autoComplete="username"
              autoCapitalize="words"
              spellCheck={false}
              maxLength={40}
              value={name}
              onChange={(e) => { setTypedName(e.target.value); setError(''); }}
              aria-invalid={!!error}
              className="mb-4 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 text-base text-[var(--text-primary)] transition-ui focus:border-[var(--saffron-600)] focus:outline-none focus:ring-2 focus:ring-[var(--saffron-600)]/20"
              placeholder="As the owner added you"
            />
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
              disabled={!name.trim() || !pin || isSubmitting}
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
