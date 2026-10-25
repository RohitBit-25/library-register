'use client';

/* Hallmark · genre: modern-minimal · macrostructure: Split hero + live product · design-system: design.md · designed-as-app
 * nav: N5 floating pill · footer: Ft2 inline · enrichment: the live seat plan is the product shot */

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMembers } from '@/hooks/useMembers';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import Wordmark from '@/components/layout/Wordmark';
import PublicSeatMap from '@/components/seat/PublicSeatMap';
import { formatINR, monthlyValue, planPrice, PLAN_MONTHS } from '@/lib/pricing';
import { PHOTOS } from '@/lib/photos';
import { cn } from '@/lib/utils';
import {
  ArrowRight, Wind, Wifi, ShieldCheck, Droplets, VolumeX, Clock, Armchair, Check, IndianRupee,
} from 'lucide-react';

/**
 * Plans, in the order a visitor compares them. Every figure comes from
 * lib/pricing.ts (which reads NEXT_PUBLIC_PLAN_RATES) — no rupee amount is
 * written here, so a library that sets its own prices gets them on this page.
 */
const PLANS = [
  { duration: '1M', label: '1 month', note: 'Try it out' },
  { duration: '3M', label: '3 months', note: 'A full term' },
  { duration: '6M', label: '6 months', note: 'Half a year' },
  { duration: '1Y', label: '1 year', note: 'The whole year' },
] as const;

/** Derived, not declared: whichever plan has the lowest cost per month. */
const BEST_VALUE = (Object.keys(PLAN_MONTHS) as (keyof typeof PLAN_MONTHS)[])
  .reduce((best, d) => (monthlyValue(d) < monthlyValue(best) ? d : best));

// The library's own claims — nothing added that a student could walk in and
// find untrue.
const FACILITIES = [
  { name: 'Air-conditioned', desc: 'The whole reading hall is cooled.', Icon: Wind },
  { name: 'High-speed Wi-Fi', desc: 'Seamless connectivity.', Icon: Wifi },
  { name: 'CCTV security', desc: 'Full CCTV coverage.', Icon: ShieldCheck },
  { name: 'Purified water', desc: 'RO-filtered drinking water.', Icon: Droplets },
  { name: 'Silent zone', desc: 'Kept quiet for deep focus.', Icon: VolumeX },
  { name: 'Open daily', desc: '6:00 am to 10:00 pm.', Icon: Clock },
];

const STEPS = [
  { title: 'Pick a free seat', body: 'Green seats on the live plan are open. Filter by morning or evening if you only need one shift.' },
  { title: 'Send a request', body: 'Your name and phone number — no account, nothing to install.' },
  { title: 'Pay and get allotted', body: 'Pay by UPI or cash at the desk. The librarian confirms it and the seat is yours.' },
];

const NO_REQUESTS = new Set<number>();

export default function LandingPage() {
  const router = useRouter();
  const { members, isLoading } = useMembers();

  const free = useMemo(() => members.filter((m) => m.vacant).length, [members]);
  const total = members.length || 95;

  const freeLine = isLoading
    ? 'Checking the hall…'
    : free > 0 ? `${free} of ${total} seats free right now` : `All ${total} seats taken — join the waitlist`;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg-void)] text-[var(--text-primary)]">
      <UnifiedHeader />

      <main className="flex-1">
        {/* ── Hero: the promise on the left, the actual hall on the right ── */}
        <section className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:pb-24 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] py-1 pl-2 pr-3 text-sm font-medium text-[var(--text-secondary)] shadow-[var(--shadow-xs)]" aria-live="polite">
              <span className="size-2 rounded-full bg-[var(--emerald-500)]" aria-hidden="true" />
              {freeLine}
            </span>

            <h1 className="mt-6 text-[2.75rem] font-semibold leading-[1.02] text-balance sm:text-[3.5rem] lg:text-[4rem]">
              Your own seat to study in peace.
            </h1>
            <p className="mt-6 max-w-[46ch] text-md leading-relaxed text-[var(--text-secondary)]">
              95 reserved desks in one air-conditioned hall in Rajsamand, open
              6 am to 10 pm every day. Choose a free seat online, pay at the desk.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/browse"
                className="inline-flex min-h-[48px] items-center gap-2 whitespace-nowrap rounded-full bg-[var(--ink)] px-6 text-base font-medium text-[var(--text-inverse)] shadow-[var(--shadow-sm)] transition-ui hover:bg-[var(--ink-hover)]"
              >
                Find a free seat
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="#fees"
                className="inline-flex min-h-[48px] items-center whitespace-nowrap rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-6 text-base font-medium text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-ui hover:bg-[var(--bg-muted)]"
              >
                See fees
              </Link>
            </div>

            <ul className="mt-9 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--text-secondary)]">
              {['Air-conditioned', 'High-speed Wi-Fi', 'CCTV security'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-[var(--emerald-600)]" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* The product, live. Read-only here — a tap opens /browse with the
              seat chosen. Hidden on a phone, where it shrinks past legibility. */}
          <figure className="relative hidden md:block">
            <div className="overflow-hidden rounded-[var(--radius-3xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-xl)]">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold">Reading hall</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Live seat availability</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] border border-[var(--emerald-500)]/70 bg-[#DDF3E4]" />Free</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] border border-[#CFCAC3] bg-[#E6E3DF]" />Taken</span>
                </div>
              </div>
              <div className="p-3">
                {isLoading ? (
                  <div className="aspect-[1360/1184] w-full rounded-[var(--radius-lg)] bg-[var(--bg-muted)]" />
                ) : (
                  <PublicSeatMap
                    frameless
                    minScale={0.2}
                    members={members}
                    selectedSeat={null}
                    requestedSeats={NO_REQUESTS}
                    onSelect={(seat) => router.push(`/browse?seat=${seat}`)}
                  />
                )}
              </div>
            </div>
            <figcaption className="sr-only">The reading hall, live. Free seats can be tapped to request them.</figcaption>
          </figure>
        </section>

        {/* ── Key figures ── */}
        <section className="mx-auto max-w-[1160px] px-4 sm:px-6">
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { k: 'Reserved desks', v: '95', Icon: Armchair },
              { k: 'Free right now', v: isLoading ? '—' : String(free), Icon: Check, live: true },
              { k: 'Open every day', v: '16 hrs', Icon: Clock },
              { k: 'Per month, from', v: formatINR(monthlyValue(BEST_VALUE)), Icon: IndianRupee },
            ].map(({ k, v, Icon, live }) => (
              <div key={k} className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-xs)]">
                <dt className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Icon className={cn('size-4', live ? 'text-[var(--emerald-600)]' : 'text-[var(--text-tertiary)]')} aria-hidden="true" />
                  {k}
                </dt>
                <dd className="mt-3 text-[1.75rem] font-semibold leading-none tabular">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── How it works ── */}
        <section className="mx-auto max-w-[1160px] px-4 py-20 sm:px-6 lg:py-28">
          <div className="max-w-[640px]">
            <h2 className="text-2xl font-semibold leading-tight text-balance">Booked in three steps.</h2>
            <p className="mt-3 text-md text-[var(--text-secondary)]">No account, no app to install.</p>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-xs)]">
                <span className="flex size-8 items-center justify-center rounded-full bg-[var(--saffron-50)] font-mono text-sm font-medium text-[var(--saffron-700)]">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-secondary)]">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Fees ── */}
        <section id="fees" className="scroll-mt-24 border-y border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="mx-auto max-w-[1160px] px-4 py-20 sm:px-6 lg:py-28">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="max-w-[640px]">
                <h2 className="text-2xl font-semibold leading-tight text-balance">Simple fees. Longer plans cost less.</h2>
                <p className="mt-3 text-md text-[var(--text-secondary)]">One reserved seat for the whole plan. Paid at the desk by UPI or cash.</p>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PLANS.map(({ duration, label, note }) => {
                const best = duration === BEST_VALUE;
                return (
                  <div
                    key={duration}
                    className={cn(
                      'relative flex flex-col rounded-[var(--radius-2xl)] border p-6 transition-ui',
                      best
                        ? 'border-[var(--ink)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] ring-1 ring-[var(--ink)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-base)]',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-semibold">{label}</p>
                      {best && (
                        <span className="rounded-full bg-[var(--saffron-50)] px-2.5 py-1 text-xs font-medium text-[var(--saffron-700)]">
                          Best value
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-tertiary)]">{note}</p>
                    <p className="mt-6 text-[2.25rem] font-semibold leading-none tabular">
                      {formatINR(planPrice(duration))}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)] tabular">
                      {formatINR(monthlyValue(duration))} a month
                    </p>
                    <Link
                      href="/browse"
                      className={cn(
                        'mt-8 inline-flex min-h-[42px] items-center justify-center rounded-full text-sm font-medium transition-ui',
                        best
                          ? 'bg-[var(--ink)] text-[var(--text-inverse)] hover:bg-[var(--ink-hover)]'
                          : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]',
                      )}
                      aria-label={`Pick a seat on the ${label} plan`}
                    >
                      Pick a seat
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Facilities: one spec sheet, not a wall of icon tiles ── */}
        <section id="facilities" className="mx-auto max-w-[1160px] scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
          <div className="max-w-[640px]">
            <h2 className="text-2xl font-semibold leading-tight text-balance">Everything a long study day needs.</h2>
          </div>
          <ul className="mt-10 grid overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--border-default)] shadow-[var(--shadow-xs)] sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 1 }}>
            {FACILITIES.map(({ name, desc, Icon }) => (
              <li key={name} className="flex items-start gap-4 bg-[var(--bg-surface)] p-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-base)]">
                  <Icon className="size-5 text-[var(--text-primary)]" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-base font-semibold">{name}</span>
                  <span className="mt-1 block text-[15px] text-[var(--text-secondary)]">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Photos: shown only once real ones are added in lib/photos.ts ── */}
        {PHOTOS.length > 0 && (
          <section className="mx-auto max-w-[1160px] px-4 pb-20 sm:px-6 lg:pb-28">
            <div className="grid gap-4 md:grid-cols-3">
              {PHOTOS.slice(0, 3).map((p, i) => (
                <figure
                  key={p.src}
                  className={cn(
                    'relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--bg-muted)] shadow-[var(--shadow-xs)]',
                    i === 0 ? 'aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto' : 'aspect-[4/3]',
                  )}
                >
                  <Image src={p.src} alt={p.alt} fill sizes={i === 0 ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 100vw'} className="object-cover" />
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* ── Closing call to action ── */}
        <section className="mx-auto max-w-[1160px] px-4 pb-20 sm:px-6">
          <div className="flex flex-col items-start gap-6 rounded-[var(--radius-3xl)] bg-[var(--ink)] px-8 py-12 text-[var(--text-inverse)] shadow-[var(--shadow-lg)] md:flex-row md:items-center md:justify-between md:px-12">
            <div>
              <h2 className="text-2xl font-semibold leading-tight text-balance">
                {isLoading || free === 0 ? 'Your seat is waiting.' : `${free} seats are free today.`}
              </h2>
              <p className="mt-2 text-md text-[var(--text-disabled)]">Pick one now — it takes under a minute.</p>
            </div>
            <Link
              href="/browse"
              className="inline-flex min-h-[48px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-[var(--bg-surface)] px-6 text-base font-medium text-[var(--text-primary)] transition-ui hover:bg-[var(--bg-muted)]"
            >
              Find a free seat
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex max-w-[1160px] flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <Wordmark size="sm" caption="Rajsamand, Rajasthan · open 6 am – 10 pm daily" />
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/browse" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Seats</Link>
            <Link href="/my-requests" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">My requests</Link>
            <Link href="/admin/login" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Staff sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
