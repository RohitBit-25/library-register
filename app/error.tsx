'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ruby-50)] border border-[var(--ruby-200)]">
        <AlertTriangle className="h-7 w-7 text-[var(--ruby-600)]" aria-hidden="true" />
      </div>

      <h1 className="font-display text-xl font-semibold text-[var(--text-primary)]">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
        This page failed to load. Your data has not been changed — you can retry
        safely.
      </p>

      {error.digest && (
        <p className="mt-3 font-mono text-xs text-[var(--text-tertiary)]">
          Reference: {error.digest}
        </p>
      )}

      <button
        onClick={reset}
        className="mt-6 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--saffron-700)] bg-[var(--saffron-600)] px-6 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-colors hover:bg-[var(--saffron-700)]"
      >
        <RotateCw className="h-4 w-4" aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}
