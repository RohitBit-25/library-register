'use client';

/* Hallmark · pre-emit critique: P5 H5 E4 S5 R4 V5
 * Hallmark · macrostructure: Crest (bespoke) — editorial split hero · asymmetric bento · bezel cards
 * genre: luxury-heritage · tone: royal, warm · vibe: editorial luxury (high-end-visual-design)
 * theme: custom — owner's emblem (navy #0B2141 · gold #E3B455/#A86F1C · cream #FFFAF3) · Instrument Serif + Geist (+ Cinzel lockup)
 * nav: island pill (IslandNav) · footer: PublicFooter (shared) · design.md § Landing: Royal crest */

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Check } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { formatINR, monthlyValue, planPrice, PLAN_MONTHS } from '@/lib/pricing';
import { PHOTOS } from '@/lib/photos';
import { SITE_INFO, fmtPhone } from '@/lib/siteInfo';
import { SEAT_COUNT } from '@/lib/layoutConfig';
import { cn } from '@/lib/utils';
import FindSeatBar from '@/components/pixel/FindSeatBar';
import StepScenes from '@/components/pixel/StepScenes';
import IslandNav from '@/components/landing/IslandNav';
import CrestHero from '@/components/landing/CrestHero';
import HallBento from '@/components/landing/HallBento';
import PillLink from '@/components/landing/PillLink';
import Reveal from '@/components/landing/Reveal';
import LiveHall from '@/components/landing/LiveHall';
import LandingFooter from '@/components/landing/LandingFooter';
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
      <div className="grain" aria-hidden="true" />
      <IslandNav />

      <main id="main" className="flex-1">
        <CrestHero free={free} total={total} isLoading={isLoading} loadFailed={loadFailed} />

        <HallBento free={free} live={live} />

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
                      <span className={cn('mt-3 text-sm tabular', best ? 'text-[var(--brand-navy)]/75' : 'text-[var(--crest-on-navy-2)]')}>
                        {t('{m} a month · about ₹{d} a day', { m: formatINR(monthlyValue(duration)), d: perDay(duration) })}
                      </span>
                      <span className="mt-10 flex items-center justify-between border-t border-current/15 pt-5 text-base font-semibold">
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

        {/* ── How to join: three pixel scenes ── */}
        <Reveal className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6 lg:py-36">
          <p className="reveal eyebrow eyebrow--dark" style={stagger(0)}>{t('Three steps')}</p>
          <h2 className={cn(display, 'reveal mt-6 text-[var(--brand-navy)]')} style={stagger(1)}>{t('Joining takes a minute.')}</h2>
          <StepScenes className="mt-16" />
        </Reveal>

        {/* ── Photos and reviews: only once real ones are filled in ── */}
        {PHOTOS.length > 0 && (
          <section className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6">
            <div className="grid gap-5 md:grid-cols-3">
              {PHOTOS.slice(0, 3).map((p) => (
                <figure key={p.src} className="bezel"><div className="bezel-core relative aspect-[4/3]"><Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" /></div></figure>
              ))}
            </div>
          </section>
        )}
        {SITE_INFO.reviews.length > 0 && (
          <section className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6">
            <div className="grid gap-5 md:grid-cols-3">
              {SITE_INFO.reviews.slice(0, 3).map((r) => (
                <figure key={r.name} className="bezel">
                  <div className="bezel-core p-7">
                    <blockquote className="font-editorial text-2xl leading-snug text-[var(--brand-navy)]">“{r.quote}”</blockquote>
                    <figcaption className="mt-4 text-sm font-semibold">{r.name}{r.note && <span className="text-[var(--warm-ink-3)]"> · {r.note}</span>}</figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* ── Visit, beside the plain answers ── */}
        <Reveal className="border-t border-[var(--brand-navy)]/10 bg-[var(--bg-surface)]">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:py-32">
            {contact && (
              <div className="reveal bezel lg:col-span-5" style={stagger(0)}>
                <div className="bezel-core h-full bg-[var(--brand-navy)] p-8 text-[var(--crest-on-navy)] sm:p-10">
                  <span className="flex size-20 items-center justify-center rounded-full bg-[var(--warm-bg)] shadow-[0_0_0_2px_var(--brand-gold),0_0_0_6px_var(--brand-navy),0_0_0_7px_var(--brand-gold-light)]">
                    <Image src="/brand/emblem.png" alt="" width={897} height={606} sizes="60px" className="mt-1 h-auto w-[72%]" />
                  </span>
                  <h2 className="mt-8 font-editorial text-[2.6rem] leading-none">{t('Come and see the hall')}</h2>
                  {SITE_INFO.address && <p className="mt-4 text-[15px] leading-relaxed text-[var(--crest-on-navy-2)]">{SITE_INFO.address}</p>}
                  {/* Numbers written out too: many visitors copy them into WhatsApp. */}
                  <p className="mt-4 flex flex-wrap gap-x-5 text-[15px] font-semibold">
                    {SITE_INFO.phones?.map((p) => (
                      <a key={p} href={`tel:+91${p}`} className="inline-flex min-h-[44px] items-center tabular hover:text-[var(--brand-gold-light)]">{fmtPhone(p)}</a>
                    ))}
                  </p>
                  {SITE_INFO.email && <a href={`mailto:${SITE_INFO.email}`} className="inline-flex min-h-[44px] items-center break-all text-[15px] text-[var(--crest-on-navy-2)] hover:text-[var(--brand-gold-light)]">{SITE_INFO.email}</a>}
                  <div className="mt-8 flex flex-wrap gap-3">
                    {SITE_INFO.whatsapp && <PillLink href={`https://wa.me/${SITE_INFO.whatsapp}`}>WhatsApp</PillLink>}
                    {SITE_INFO.phones?.[0] && <PillLink href={`tel:+91${SITE_INFO.phones[0]}`} tone={SITE_INFO.whatsapp ? 'ghost-light' : 'gold'}>{t('Call')}</PillLink>}
                    {SITE_INFO.mapsUrl && <PillLink href={SITE_INFO.mapsUrl} tone="ghost-light">{t('Map')}</PillLink>}
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

        {/* ── Closing: a row of empty desks, waiting ── */}
        <Reveal className="overflow-hidden bg-[var(--warm-band)] pt-24 lg:pt-32">
          <div className="mx-auto max-w-[1240px] px-4 text-center sm:px-6">
            <h2 className={cn(display, 'reveal mx-auto max-w-[16ch] text-[var(--brand-navy)]')} style={stagger(0)}>
              {isLoading || free === 0 ? t('Your desk is waiting.') : t('{free} desks are free today.', { free })}
            </h2>
            <div className="reveal mt-10" style={stagger(1)}>
              <PillLink href="/browse" tone="navy">{t('Claim your desk')}</PillLink>
            </div>
          </div>
          <Image
            src="/landing/desks-row.png"
            alt="A row of empty study desks with blue chairs"
            width={2112}
            height={744}
            sizes="(min-width: 1240px) 1160px, 100vw"
            className="reveal relative mx-auto mt-16 h-auto w-full max-w-[1160px] px-4"
            style={stagger(2)}
          />
        </Reveal>
      </main>

      {/* Room for the phone action bar, so it never covers the footer. */}
      <div className="bg-[var(--brand-navy-deep)] pb-24 md:pb-0"><LandingFooter /></div>
      <FindSeatBar watchId="hero-cta" free={isLoading || loadFailed ? null : free} />
    </div>
  );
}
