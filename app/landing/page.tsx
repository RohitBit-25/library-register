'use client';

/* Hallmark · pre-emit critique: P5 H5 E5 S5 R4 V5
 * Hallmark · macrostructure: Crest (bespoke) — editorial split hero · asymmetric bento · live room map · bezel passes
 * genre: luxury-heritage · tone: royal, warm · theme: custom — owner's emblem (navy #0B2141 · gold #E3B455/#A86F1C ·
 *   cream #FFFAF3) · Instrument Serif + Geist (+ Cinzel lockup) · imagery: risograph prints made for the page
 * nav: island pill (IslandNav) · footer: LandingFooter · design.md § Landing: Royal crest */

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Check } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { formatINR, monthlyValue, planPrice, PLAN_MONTHS } from '@/lib/pricing';
import { ADDRESS_PARTS, SITE_INFO, fmtPhone } from '@/lib/siteInfo';
import { SEAT_COUNT } from '@/lib/layoutConfig';
import { cn } from '@/lib/utils';
import FindSeatBar from '@/components/pixel/FindSeatBar';
import StepShots from '@/components/landing/StepShots';
import IslandNav from '@/components/landing/IslandNav';
import CrestHero from '@/components/landing/CrestHero';
import HallBento from '@/components/landing/HallBento';
import LiveHall from '@/components/landing/LiveHall';
import RealHall from '@/components/landing/RealHall';
import LandingFooter from '@/components/landing/LandingFooter';
import PillLink from '@/components/landing/PillLink';
import Reveal from '@/components/landing/Reveal';
import { useLang } from '@/hooks/useLang';

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

const FAQ = [
  { q: 'Do I need an account?', a: 'No. Request a seat with your name and phone number, then check it any time under My requests.' },
  { q: 'Timings?', a: 'Open from 6:00 AM to 10:00 PM, every day.' },
  { q: 'Only mornings or evenings?', a: 'Yes. Choose morning, evening or full day when you request your seat.' },
  { q: 'How do I pay?', a: 'At the desk, by UPI or cash. Nothing is charged on this website.' },
];

// True of every pass: the same desk promise and the hall's own facilities.
const INCLUDED = ['A reserved desk', 'Your choice of shift', 'AC hall', 'High-speed Wi-Fi', 'RO water', 'CCTV'];

// What Google shows for the library in local search. Real details only, from lib/siteInfo.ts.
const LISTING = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Library',
  name: 'Shree Gangaur Library',
  description: `${SEAT_COUNT} reserved study desks in one AC, quiet hall. Pay at the desk by UPI or cash.`,
  image: '/opengraph-image.png',
  address: {
    '@type': 'PostalAddress',
    streetAddress: ADDRESS_PARTS.street,
    addressLocality: ADDRESS_PARTS.town,
    addressRegion: ADDRESS_PARTS.state,
    addressCountry: 'IN',
  },
  telephone: SITE_INFO.phones?.map((p) => `+91 ${fmtPhone(p)}`),
  email: SITE_INFO.email,
  hasMap: SITE_INFO.mapsUrl,
  ...(SITE_INFO.geo && { geo: { '@type': 'GeoCoordinates', latitude: SITE_INFO.geo.lat, longitude: SITE_INFO.geo.lng } }),
  sameAs: [SITE_INFO.instagram, SITE_INFO.mapsUrl].filter(Boolean),
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '06:00',
    closes: '22:00',
  },
  priceRange: `${formatINR(planPrice('1M'))}–${formatINR(planPrice('1Y'))}`,
  currenciesAccepted: 'INR',
  paymentAccepted: 'Cash, UPI',
});

const display = 'font-editorial text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.02em] [overflow-wrap:anywhere]';
const stagger = (i: number) => ({ '--i': i }) as React.CSSProperties;

export default function LandingPage() {
  const { members, isLoading, loadFailed } = useMembers();
  const freeSeats = useMemo(() => new Set(members.filter((m) => m.vacant).map((m) => m.seat)), [members]);
  const free = freeSeats.size;
  const total = members.length || SEAT_COUNT;
  const live = !isLoading && !loadFailed;
  const { t } = useLang();
  const contact = SITE_INFO.phones?.length || SITE_INFO.whatsapp || SITE_INFO.address || SITE_INFO.mapsUrl;

  // Cards marked data-spotlight light their rim where the pointer is.
  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const move = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('[data-spotlight]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    document.addEventListener('pointermove', move, { passive: true });
    return () => document.removeEventListener('pointermove', move);
  }, []);

  return (
    <div className="relative flex min-h-dvh flex-col bg-[var(--warm-bg)] text-[var(--warm-ink)]">
      <a href="#main" className="sr-only z-50 rounded-full bg-[var(--brand-gold-light)] px-5 py-3 font-semibold text-[var(--brand-navy)] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">{t('Skip to content')}</a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: LISTING }} />
      <div className="grain" aria-hidden="true" />
      <IslandNav />

      <main id="main" className="flex-1">
        <CrestHero free={free} total={total} isLoading={isLoading} loadFailed={loadFailed} fromPerDay={perDay(BEST_VALUE)} />

        <HallBento free={free} live={live} />

        <RealHall />

        <LiveHall freeSeats={freeSeats} live={live} />

        {/* ── Passes, on navy ── */}
        <Reveal id="fees" className="scroll-mt-24 bg-[var(--brand-navy)] text-[var(--crest-on-navy)]">
          <div className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6 lg:py-36">
            <p className="reveal eyebrow eyebrow--light" style={stagger(0)}>{t('Passes')}</p>
            <h2 className={cn(display, 'reveal mt-6')} style={stagger(1)}>{t('Pick your pass.')}</h2>
            <p className="reveal mt-5 max-w-[52ch] text-lg text-[var(--crest-on-navy-2)]" style={stagger(2)}>
              {t('From about ₹{d} a day. One reserved desk for the whole plan — paid at the desk, by UPI or cash.', { d: perDay(BEST_VALUE) })}
            </p>

            <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PLANS.map(({ duration, label }, i) => {
                const best = duration === BEST_VALUE;
                return (
                  <Link
                    key={duration}
                    href="/browse"
                    aria-label={`${label} pass, ${formatINR(planPrice(duration))}. Pick a seat`}
                    data-spotlight
                    className="reveal bezel bezel--dark group block rounded-[2rem] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-gold-light)]"
                    style={stagger(i + 2)}
                  >
                    <div className={cn('bezel-core flex h-full flex-col p-7 transition-transform duration-500 ease-[var(--ease-premium)] group-hover:-translate-y-1', best ? 'bezel-core--gold text-[var(--brand-navy)]' : 'bezel-core--dark')}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('text-sm font-semibold uppercase tracking-[0.16em]', best ? 'text-[var(--brand-navy)]' : 'text-[var(--brand-gold-light)]')}>{t(label)}</span>
                        {best && <span className="rounded-full bg-[var(--brand-navy)] px-3 py-1 text-xs font-bold text-[var(--crest-on-navy)]">{t('★ Best value')}</span>}
                      </div>
                      <span className="mt-10 font-editorial text-[3.6rem] leading-none tabular">{formatINR(planPrice(duration))}</span>
                      <span className={cn('mt-3 text-sm tabular mb-10', best ? 'text-[var(--brand-navy)]/75' : 'text-[var(--crest-on-navy-2)]')}>
                        {t('{m} a month · about ₹{d} a day', { m: formatINR(monthlyValue(duration)), d: perDay(duration) })}
                      </span>
                      <span className="mt-auto flex items-center justify-between border-t border-current/15 pt-5 text-base font-semibold">
                        {t('Pick a seat')}
                        <span className={cn('pill-btn__icon transition-transform duration-500 ease-[var(--ease-premium)] group-hover:translate-x-1 group-hover:-translate-y-px', best ? 'bg-[var(--brand-navy)] text-[var(--crest-on-navy)]' : 'bg-[var(--brand-gold-light)] text-[var(--brand-navy)]')} aria-hidden="true">
                          <ArrowUpRight className="size-[18px]" strokeWidth={1.5} />
                        </span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* What every pass gets — the same for all four. */}
            <div className="reveal mt-8 flex flex-col gap-4 rounded-[1.5rem] px-6 py-5 shadow-[inset_0_0_0_1px_rgb(246_238_223/0.12)] lg:flex-row lg:items-center lg:gap-8" style={stagger(6)}>
              <p className="shrink-0 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-gold-light)]">{t('Every pass includes')}</p>
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {INCLUDED.map((x) => (
                  <li key={x} className="flex items-center gap-2 text-[15px] text-[var(--crest-on-navy)]">
                    <Check className="size-4 text-[var(--brand-gold-light)]" strokeWidth={1.75} aria-hidden="true" />{t(x)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* ── How to join: three real screens from the app ── */}
        <Reveal className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6 lg:py-36">
          <p className="reveal eyebrow eyebrow--dark" style={stagger(0)}>{t('Three steps')}</p>
          <h2 className={cn(display, 'reveal mt-6 text-[var(--brand-navy)]')} style={stagger(1)}>{t('Joining takes a minute.')}</h2>
          <StepShots className="mt-16" />
        </Reveal>

        {/* ── Visit, beside the plain answers ── */}
        <Reveal className="border-t border-[var(--brand-navy)]/10 bg-[var(--bg-surface)]">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:py-32">
            {contact && (
              <div className="reveal bezel lg:col-span-5" style={stagger(0)}>
                <div className="bezel-core h-full bg-[var(--brand-navy)] text-[var(--crest-on-navy)]">
                  <figure className="relative">
                    {/* The real door, from the library's Google listing — so visitors know it when they arrive. */}
                    <Image src="/photos/entrance-night.webp" alt="The entrance of Shree Gangaur Library at night: the lit श्री गणगौर LIBRARY sign above a few steps" width={1600} height={2133} sizes="(min-width: 1024px) 480px, 100vw" className="aspect-[4/3] w-full object-cover object-[50%_54%]" />
                    <figcaption className="absolute bottom-3 left-4 rounded-full bg-[var(--brand-navy-deep)]/85 px-3 py-1 text-xs font-semibold">{t('Our door at JK Circle, Kankroli')}</figcaption>
                  </figure>
                  <div className="p-8 sm:p-10">
                    <h2 className="font-editorial text-[2.6rem] leading-none">{t('Come and see the hall')}</h2>
                    {SITE_INFO.address && <p className="mt-4 text-[15px] leading-relaxed text-[var(--crest-on-navy-2)]">{SITE_INFO.address}</p>}
                    {/* Numbers written out too: many visitors copy them into WhatsApp. */}
                    <p className="mt-4 flex flex-wrap gap-x-5 text-[15px] font-semibold">
                      {SITE_INFO.phones?.map((p) => (
                        <a key={p} href={`tel:+91${p}`} className="inline-flex min-h-[44px] items-center tabular hover:text-[var(--brand-gold-light)]">{fmtPhone(p)}</a>
                      ))}
                    </p>
                    {SITE_INFO.email && <a href={`mailto:${SITE_INFO.email}`} className="inline-flex min-h-[44px] items-center break-all text-[15px] text-[var(--crest-on-navy-2)] hover:text-[var(--brand-gold-light)]">{SITE_INFO.email}</a>}
                    <div className="mt-8 flex flex-wrap gap-3">
                      {SITE_INFO.whatsapp && <PillLink href={SITE_INFO.whatsapp}>WhatsApp</PillLink>}
                      {SITE_INFO.phones?.[0] && <PillLink href={`tel:+91${SITE_INFO.phones[0]}`} tone={SITE_INFO.whatsapp ? 'ghost-light' : 'gold'}>{t('Call')}</PillLink>}
                      {SITE_INFO.mapsUrl && <PillLink href={SITE_INFO.mapsUrl} tone="ghost-light">{t('Map')}</PillLink>}
                      {SITE_INFO.instagram && <PillLink href={SITE_INFO.instagram} tone="ghost-light">Instagram</PillLink>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={cn('min-w-0', contact ? 'lg:col-span-7 lg:pl-8' : 'lg:col-span-12')}>
              <h2 className={cn(display, 'reveal text-[var(--brand-navy)]')} style={stagger(1)}>{t('Good to know')}</h2>
              <dl className="mt-10">
                {FAQ.map(({ q, a }, i) => (
                  <div key={q} className="reveal grid gap-2 border-t border-[var(--brand-navy)]/12 py-6 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8" style={stagger(i + 2)}>
                    <dt className="text-lg font-semibold text-[var(--brand-navy)]">{t(q)}</dt>
                    <dd className="text-[15px] leading-relaxed text-[var(--warm-ink-2)]">{t(a)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Reveal>

        {/* ── Closing: the live count, once more ── */}
        <Reveal className="bg-[var(--warm-band)] py-24 lg:py-32">
          <div className="mx-auto max-w-[1240px] px-4 text-center sm:px-6">
            <h2 className={cn(display, 'reveal mx-auto max-w-[16ch] text-[var(--brand-navy)]')} style={stagger(0)}>
              {isLoading || free === 0 ? t('Your desk is waiting.') : t('{free} desks are free today.', { free })}
            </h2>
            <div className="reveal mt-10" style={stagger(1)}>
              <PillLink href="/browse" tone="navy">{t('Claim your desk')}</PillLink>
            </div>
          </div>
        </Reveal>
      </main>

      <div className="bg-[var(--brand-navy-deep)] pb-24 md:pb-0"><LandingFooter /></div>
      <FindSeatBar watchId="hero-cta" free={isLoading || loadFailed ? null : free} />
    </div>
  );
}
