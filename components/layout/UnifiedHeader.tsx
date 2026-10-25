'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Wordmark from '@/components/layout/Wordmark';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/browse', label: 'Seats' },
  { href: '/landing#fees', label: 'Fees' },
  { href: '/landing#facilities', label: 'Facilities' },
  { href: '/my-requests', label: 'My requests' },
];

/**
 * Public header: a floating bar detached from the page edges. Destinations
 * that exist, the staff door as quiet text, and one primary action.
 */
export default function UnifiedHeader() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <header className="mx-auto flex max-w-[1160px] items-center justify-between gap-3 rounded-full border border-[var(--border-default)] bg-[var(--bg-glass)] py-2 pl-3 pr-2 shadow-[var(--shadow-sm)] backdrop-blur-md">
        <Link href="/landing" className="min-w-0 rounded-full" aria-label="Shree Gangaur Library — home">
          <Wordmark size="sm" short />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const current = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-ui',
                  current
                    ? 'bg-[var(--bg-muted)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]',
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/my-requests"
            className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden"
          >
            Requests
          </Link>
          <Link
            href="/admin/login"
            className="hidden whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] lg:inline-flex"
          >
            Staff
          </Link>
          {pathname !== '/browse' && (
            <Link
              href="/browse"
              className="inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--saffron-600)] px-4 text-sm font-semibold text-[var(--text-inverse)] shadow-[var(--shadow-xs)] transition-ui hover:bg-[var(--saffron-700)]"
            >
              Find a seat
              <ArrowRight className="hidden size-3.5 sm:block" aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>
    </div>
  );
}
