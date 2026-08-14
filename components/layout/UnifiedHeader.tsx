'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Lock, Home, Armchair, Wind } from 'lucide-react';

export default function UnifiedHeader() {
  const pathname = usePathname();

  return (
    <>
      <header className="flex items-center justify-between gap-4 py-4 px-6 md:px-10 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          {/* The library's own mark. This was a rotated square standing in
              for a logo; the real one exists. Served through next/image so
              the 1.5MB source is delivered as a resized WebP/AVIF — the file
              on disk stops mattering for payload. */}
          <Image
            src="/logo-mark.png"
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
            priority
            className="h-10 w-10 shrink-0 object-contain"
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

        {/* Staff sign-in lives on its own page rather than a dialog over the
            public site — see app/admin/login. */}
        <Link
          href="/admin/login"
          className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 text-[13px] font-semibold text-[var(--text-secondary)] shadow-[var(--shadow-xs)] transition-colors hover:border-[var(--saffron-600)] hover:text-[var(--saffron-700)]"
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          Staff login
        </Link>
      </header>
    </>
  );
}
