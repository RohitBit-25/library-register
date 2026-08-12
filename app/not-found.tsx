import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--sapphire-50)] border border-[var(--sapphire-200)]">
        <Compass className="h-7 w-7 text-[var(--sapphire-600)]" aria-hidden="true" />
      </div>

      <h1 className="font-display text-xl font-semibold text-[var(--text-primary)]">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
        That page doesn&apos;t exist, or you may not have access to it.
      </p>

      <Link
        href="/landing"
        className="mt-6 inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border border-[var(--saffron-700)] bg-[var(--saffron-600)] px-6 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-colors hover:bg-[var(--saffron-700)]"
      >
        Back to start
      </Link>
    </div>
  );
}
