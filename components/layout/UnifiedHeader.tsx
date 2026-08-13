'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, Home, Armchair, Wind } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';

export default function UnifiedHeader() {
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="flex items-center justify-between gap-4 py-4 px-6 md:px-10 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="h-8 w-8 rotate-45 rounded-[4px] border-2 border-[var(--saffron-600)] bg-[var(--saffron-50)]"
          />
          <div className="leading-tight">
            <p className="text-[14px] font-bold tracking-tight text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-devanagari)' }}>
              श्री गणगौर
            </p>
            <p className="text-[11px] font-medium text-[var(--text-tertiary)]">
              Shree Gangaur Study Library
            </p>
          </div>
        </div>

        {/*
          Five links, all `href="#"`, four of them naming sections that were
          never built — About, Facilities, Rules, Contact. A student clicking
          any of them stayed exactly where they were.

          What is left points at things that exist. Emoji are gone with them:
          a screen reader announces "🏠" as "house", and they sat at a
          different optical weight from every other icon in the product.
        */}
        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          <Link
            href="/landing"
            aria-current={pathname === '/landing' ? 'page' : undefined}
            className="flex items-center gap-1.5 border-b-2 border-transparent pb-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] aria-[current=page]:border-[var(--saffron-600)] aria-[current=page]:font-semibold aria-[current=page]:text-[var(--saffron-700)]"
          >
            <Home className="h-4 w-4" aria-hidden="true" /> Home
          </Link>
          <Link
            href="/browse"
            aria-current={pathname === '/browse' ? 'page' : undefined}
            className="flex items-center gap-1.5 border-b-2 border-transparent pb-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] aria-[current=page]:border-[var(--saffron-600)] aria-[current=page]:font-semibold aria-[current=page]:text-[var(--saffron-700)]"
          >
            <Armchair className="h-4 w-4" aria-hidden="true" /> Seats
          </Link>
          <Link
            href="/landing#facilities"
            className="flex items-center gap-1.5 border-b-2 border-transparent pb-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <Wind className="h-4 w-4" aria-hidden="true" /> Facilities
          </Link>
        </nav>

        {/* Staff Login Button */}
        <button
          type="button"
          onClick={() => setShowStaffLogin(true)}
          className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 text-[13px] font-semibold text-[var(--text-secondary)] shadow-[var(--shadow-xs)] transition-colors hover:border-[var(--saffron-600)] hover:text-[var(--saffron-700)]"
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          Staff Login
        </button>
      </header>

      <AuthModal open={showStaffLogin} onClose={() => setShowStaffLogin(false)} />
    </>
  );
}
