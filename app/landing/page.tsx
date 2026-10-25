'use client';

/* Hallmark · genre: playful · macrostructure: custom (bespoke) — the owner's pixel-art kit as the page's world
 * theme: custom pixel (cream, wood, ink; Geist throughout — the pixel font was dropped for legibility) · enrichment: owner's own pixel art
 * nav: custom pixel bar · footer: Ft2 inline */

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMembers } from '@/hooks/useMembers';
import { formatINR, monthlyValue, planPrice, PLAN_MONTHS } from '@/lib/pricing';
import { PHOTOS } from '@/lib/photos';
import { SITE_INFO } from '@/lib/siteInfo';
import { SEAT_COUNT } from '@/lib/layoutConfig';
import { cn } from '@/lib/utils';
import PixelButton from '@/components/pixel/PixelButton';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import PublicFooter from '@/components/layout/PublicFooter';

/** Every figure comes from lib/pricing.ts — no rupee amount is written here. */
const PLANS = [
  { duration: '1M', label: '1 Month' },
  { duration: '3M', label: '3 Months' },
  { duration: '6M', label: '6 Months' },
  { duration: '1Y', label: '1 Year' },
] as const;

const BEST_VALUE = (Object.keys(PLAN_MONTHS) as (keyof typeof PLAN_MONTHS)[])
  .reduce((best, d) => (monthlyValue(d) < monthlyValue(best) ? d : best));

const perDay = (d: string) => Math.round(monthlyValue(d) / 30);

// The library's own claims.
const FACILITIES = ['AC hall', 'High-speed Wi-Fi', 'CCTV', 'RO water', 'Silent zone'];

const STEPS = [
  'Pick a green desk on the live seat plan.',
  'Send your name and phone number. No account needed.',
  'Pay at the desk by UPI or cash. The seat is yours.',
];

const FAQ = [
  { q: 'Do I need an account?', a: 'No. Request a seat with your name and phone number, then check it any time under My requests.' },
  { q: 'Timings?', a: 'Open from 6:00 AM to 10:00 PM, every day.' },
  { q: 'Only mornings or evenings?', a: 'Yes. Choose morning, evening or full day when you request your seat.' },
  { q: 'How do I pay?', a: 'At the desk, by UPI or cash. Nothing is charged on this website.' },
];

export default function LandingPage() {
  const { members, isLoading } = useMembers();
  const free = useMemo(() => members.filter((m) => m.vacant).length, [members]);
  const total = members.length || SEAT_COUNT;
  const px = 'font-display';
  const contact = SITE_INFO.phone || SITE_INFO.whatsapp || SITE_INFO.address || SITE_INFO.mapsUrl;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--warm-bg)] text-[var(--warm-ink)]">
      <UnifiedHeader />

      <main className="flex-1">
        {/* ── Hero: the promise, and the student who keeps it ── */}
        <section className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-8 px-4 pb-10 pt-12 sm:px-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:pt-16">
          <div>
            {/* HUD readout: the one live number a visitor came for. */}
            <p
              className={cn(px, 'px-box m-1 inline-flex items-center gap-3 bg-[var(--px-hud)] px-4 py-2 text-base font-semibold text-[var(--px-hud-text)]')}
              aria-live="polite"
            >
              <span className="size-2.5 bg-[var(--px-hud-text)]" aria-hidden="true" />
              {isLoading ? 'Loading…' : `Seats free ${free} / ${total}`}
            </p>

            <h1 className={cn(px, 'mt-7 text-[3rem] font-bold tracking-tight leading-[0.95] sm:text-[4.25rem] lg:text-[5rem]')}>
              Your desk is waiting.
            </h1>
            <p className="mt-6 max-w-[44ch] text-md leading-relaxed text-[var(--warm-ink-2)]">
              {SEAT_COUNT} reserved desks in one cool, quiet hall in Rajsamand.
              Pick yours on the live seat plan and start tomorrow.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <PixelButton href="/browse">Find my seat ▶</PixelButton>
              <PixelButton href="#fees" tone="cream">See fees</PixelButton>
            </div>
          </div>

          {/* The reading student, with a speech bubble that says the hours. */}
          <div className="relative mx-auto w-full max-w-[420px]">
            <div className={cn(px, 'px-raised relative z-10 mx-auto mb-2 w-fit bg-[var(--bg-surface)] px-5 py-3 text-center')}>
              <p className="font-devanagari text-lg leading-snug">रोज़ सुबह 6 से रात 10 बजे तक</p>
              <p className="text-base font-semibold">Open 6 AM – 10 PM daily</p>
              {/* bubble tail, two pixel steps */}
              <span className="absolute -bottom-[12px] left-1/2 h-2 w-4 -translate-x-1/2 bg-[var(--warm-ink)]" aria-hidden="true" />
              <span className="absolute -bottom-[20px] left-1/2 h-2 w-2 -translate-x-1/2 bg-[var(--warm-ink)]" aria-hidden="true" />
            </div>
            <Image
              src="/landing/student.png"
              alt="A student reading on a chair"
              width={1254}
              height={1254}
              priority
              sizes="(min-width: 1024px) 420px, 80vw"
              className="mx-auto h-auto w-[78%]"
            />
            <span className="mx-auto -mt-6 block h-4 w-1/2 bg-[var(--px-shadow)]" aria-hidden="true" />
          </div>
        </section>

        {/* ── The hall: your own art, on a wooden floor ── */}
        <section className="mt-6">
          <div className="mx-auto max-w-[1160px] px-4 sm:px-6">
            <h2 className={cn(px, 'text-[2.25rem] font-bold tracking-tight leading-tight sm:text-[3rem]')}>{SEAT_COUNT} desks. One quiet hall.</h2>
          </div>
          <div className="relative mt-6">
            <div className="px-planks absolute inset-x-0 bottom-0 h-[38%]" aria-hidden="true" />
            <div className="relative mx-auto max-w-[1100px] px-4 sm:px-6">
              <Image
                src="/landing/hall.png"
                alt="Students studying at the library's wooden desks, with the Shree Gangaur Library sign"
                width={1536}
                height={1024}
                sizes="(min-width: 1100px) 1052px, 100vw"
                className="h-auto w-full"
              />
            </div>
          </div>
          <div className="border-t-4 border-[var(--warm-ink)] bg-[var(--px-wood-dark)] px-4 py-5">
            <ul className="mx-auto flex max-w-[1160px] flex-wrap justify-center gap-4" aria-label="Facilities">
              {FACILITIES.map((f) => (
                <li key={f} className={cn(px, 'px-box m-1 bg-[var(--warm-bg)] px-4 py-1.5 text-base font-semibold')}>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── One desk, all yours ── */}
        <section className="mx-auto grid max-w-[1160px] items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-24">
          <Image
            src="/landing/desk.png"
            alt="A single wooden study desk with a plant, a notebook and a blue chair"
            width={1536}
            height={1024}
            sizes="(min-width: 1024px) 560px, 100vw"
            className="mx-auto h-auto w-full max-w-[560px]"
          />
          <div>
            <h2 className={cn(px, 'text-[2.25rem] font-bold tracking-tight leading-tight sm:text-[3rem]')}>One desk. All yours.</h2>
            <ul className="mt-6 space-y-4 text-md text-[var(--warm-ink-2)]">
              {[
                'Reserved for you for your whole plan.',
                'Come for the morning, the evening, or the full day.',
                'You choose the exact desk — by the wall, near the AC, or at a shared table.',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className={cn(px, 'mt-0.5 text-lg font-bold text-[var(--px-green)]')} aria-hidden="true">■</span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <PixelButton href="/browse">See the seat plan ▶</PixelButton>
            </div>
          </div>
        </section>

        {/* ── Fees, as price tags ── */}
        <section id="fees" className="scroll-mt-6 border-y-4 border-[var(--warm-ink)] bg-[var(--warm-band)]">
          <div className="mx-auto max-w-[1160px] px-4 py-20 sm:px-6 lg:py-24">
            <h2 className={cn(px, 'text-[2.25rem] font-bold tracking-tight leading-tight sm:text-[3rem]')}>Pick your pass.</h2>
            <p className="mt-3 max-w-[52ch] text-md text-[var(--warm-ink-2)]">
              From about ₹{perDay(BEST_VALUE)} a day. One reserved desk for the whole plan — paid at the desk, by UPI or cash.
            </p>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {PLANS.map(({ duration, label }) => {
                const best = duration === BEST_VALUE;
                return (
                  <Link
                    key={duration}
                    href="/browse"
                    aria-label={`${label} pass, ${formatINR(planPrice(duration))}. Pick a seat`}
                    className={cn(
                      'px-btn px-raised relative m-1 flex flex-col bg-[var(--bg-surface)] p-6',
                      best && 'bg-[var(--warm-tint)]',
                    )}
                  >
                    {best && (
                      <span className={cn(px, 'px-box absolute -top-4 right-4 bg-[var(--px-navy)] px-3 py-0.5 text-sm font-semibold uppercase text-[var(--text-inverse)]')}>
                        ★ Best value
                      </span>
                    )}
                    <span className={cn(px, 'text-xl font-semibold')}>{label}</span>
                    <span className={cn(px, 'mt-4 text-[2.75rem] font-bold tracking-tight leading-none tabular')}>{formatINR(planPrice(duration))}</span>
                    <span className="mt-3 text-sm text-[var(--warm-ink-2)] tabular">
                      {formatINR(monthlyValue(duration))} a month · about ₹{perDay(duration)} a day
                    </span>
                    <span className={cn(px, 'mt-6 text-base font-semibold text-[var(--saffron-700)]')}>Pick a seat ▶</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── How to join: one dialogue box, the student as the portrait ── */}
        <section className="mx-auto max-w-[1000px] px-4 py-20 sm:px-6 lg:py-24">
          <h2 className={cn(px, 'text-[2.25rem] font-bold tracking-tight leading-tight sm:text-[3rem]')}>Joining takes a minute.</h2>
          <div className="px-raised m-1 mt-10 flex flex-col gap-6 bg-[var(--bg-surface)] p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="px-box mx-auto shrink-0 bg-[var(--warm-tint)] p-2 sm:mx-0">
              <Image src="/landing/student.png" alt="" width={1254} height={1254} sizes="120px" className="size-28 object-contain" />
            </div>
            <ol className="space-y-4">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-baseline gap-4 text-md">
                  <span className={cn(px, 'w-10 shrink-0 whitespace-nowrap text-xl font-bold text-[var(--saffron-700)]')}>{i + 1} ▸</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Photos: only once real ones are added in lib/photos.ts ── */}
        {PHOTOS.length > 0 && (
          <section className="mx-auto max-w-[1160px] px-4 pb-20 sm:px-6">
            <div className="grid gap-6 md:grid-cols-3">
              {PHOTOS.slice(0, 3).map((p) => (
                <figure key={p.src} className="px-box relative m-1 aspect-[4/3] overflow-hidden bg-[var(--warm-band)]">
                  <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* ── Reviews / contact: only what is filled in lib/siteInfo.ts ── */}
        {SITE_INFO.reviews.length > 0 && (
          <section className="mx-auto max-w-[1160px] px-4 pb-20 sm:px-6">
            <div className="grid gap-6 md:grid-cols-3">
              {SITE_INFO.reviews.slice(0, 3).map((r) => (
                <figure key={r.name} className="px-raised m-1 bg-[var(--bg-surface)] p-6">
                  <blockquote className="text-md leading-relaxed">“{r.quote}”</blockquote>
                  <figcaption className={cn(px, 'mt-4 text-base font-semibold')}>
                    {r.name}{r.note && <span className="text-[var(--warm-ink-3)]"> · {r.note}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
        {contact && (
          <section className="mx-auto max-w-[1160px] px-4 pb-20 sm:px-6">
            <div className="px-raised m-1 flex flex-col gap-5 bg-[var(--bg-surface)] p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className={cn(px, 'text-2xl font-bold')}>Come and see the hall</h2>
                {SITE_INFO.address && <p className="mt-1 text-[15px] text-[var(--warm-ink-2)]">{SITE_INFO.address}</p>}
              </div>
              <div className="flex flex-wrap gap-4">
                {SITE_INFO.whatsapp && <PixelButton href={`https://wa.me/${SITE_INFO.whatsapp}`}>WhatsApp</PixelButton>}
                {SITE_INFO.phone && <PixelButton href={`tel:${SITE_INFO.phone}`} tone="cream">Call</PixelButton>}
                {SITE_INFO.mapsUrl && <PixelButton href={SITE_INFO.mapsUrl} tone="cream">Map</PixelButton>}
              </div>
            </div>
          </section>
        )}

        {/* ── Good to know: plain questions, plain answers ── */}
        <section className="border-t-4 border-[var(--warm-ink)] bg-[var(--bg-surface)]">
          <div className="mx-auto max-w-[1160px] px-4 py-16 sm:px-6">
            <h2 className={cn(px, 'text-[2rem] font-bold tracking-tight leading-tight')}>Good to know</h2>
            <dl className="mt-8 grid gap-x-12 gap-y-7 sm:grid-cols-2">
              {FAQ.map(({ q, a }) => (
                <div key={q}>
                  <dt className={cn(px, 'text-lg font-semibold')}>{q}</dt>
                  <dd className="mt-1.5 text-[15px] leading-relaxed text-[var(--warm-ink-2)]">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Closing: a row of empty desks, waiting ── */}
        <section className="overflow-hidden bg-[var(--warm-band)] pt-16">
          <div className="mx-auto max-w-[1160px] px-4 text-center sm:px-6">
            <h2 className={cn(px, 'text-[2.25rem] font-bold tracking-tight leading-tight sm:text-[3rem]')}>
              {isLoading || free === 0 ? 'Your desk is waiting.' : `${free} desks are free today.`}
            </h2>
            <div className="mt-7">
              <PixelButton href="/browse">Claim your desk ▶</PixelButton>
            </div>
          </div>
          <div className="relative mt-10">
            <div className="px-planks absolute inset-x-0 bottom-0 h-[30%]" aria-hidden="true" />
            <Image
              src="/landing/desks-row.png"
              alt="A row of empty study desks with blue chairs"
              width={2112}
              height={744}
              sizes="(min-width: 1200px) 1160px, 100vw"
              className="relative mx-auto h-auto w-full max-w-[1160px] px-4"
            />
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
