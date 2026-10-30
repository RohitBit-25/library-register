'use client';

import Image from 'next/image';
import { Clock3 } from 'lucide-react';
import { animate, createTimeline } from 'animejs';
import PillLink from '@/components/landing/PillLink';
import { useRevealOnce } from '@/hooks/useRevealOnce';
import { useLang } from '@/hooks/useLang';
import { SEAT_COUNT } from '@/lib/layoutConfig';

// The library's own claims, each with its pixel icon (made in Canva, public/landing/icons).
export const FACILITIES = [
  { label: 'AC hall', icon: 'ac', w: 156, h: 124 },
  { label: 'High-speed Wi-Fi', icon: 'wifi', w: 140, h: 135 },
  { label: 'CCTV', icon: 'cctv', w: 120, h: 117 },
  { label: 'RO water', icon: 'water', w: 112, h: 176 },
  { label: 'Silent zone', icon: 'quiet', w: 157, h: 138 },
];

const stagger = (i: number) => ({ '--i': i }) as React.CSSProperties;

/**
 * Editorial split on navy: the promise in a large serif, the live count, and
 * on the right the hall and the emblem as two framed cards laid one over the
 * other. The emblem rises like its own sun; the count runs up to today's number.
 */
export default function CrestHero({ free, total, isLoading, loadFailed }: { free: number; total: number; isLoading: boolean; loadFailed: boolean }) {
  const { t } = useLang();
  const live = !isLoading && !loadFailed;

  const ref = useRevealOnce<HTMLElement>((root) => {
    const emblem = root.querySelector<HTMLElement>('[data-emblem]');
    const count = root.querySelector<HTMLElement>('[data-count]');
    const sunrise = { p: 100 };
    if (emblem) emblem.style.clipPath = 'inset(100% 0 0 0)';
    const tl = createTimeline({ defaults: { ease: 'inOut(2)' } })
      .add(sunrise, {
        p: 0, duration: 1500,
        onUpdate: () => { if (emblem) emblem.style.clipPath = `inset(${sunrise.p}% 0 0 0)`; },
        onComplete: () => { if (emblem) emblem.style.clipPath = ''; },
      }, 650)
      .add(root.querySelectorAll('[data-glint]'), { opacity: [0, 1, 0], scale: [0, 1.3, 0.5], rotate: [0, 90], duration: 800 }, 1900);
    let counter: ReturnType<typeof animate> | undefined;
    if (count && live && free > 0) {
      const n = { v: 0 };
      counter = animate(n, { v: free, duration: 1400, delay: 700, ease: 'out(4)', modifier: Math.round, onUpdate: () => { count.textContent = String(n.v); } });
    }
    return () => { tl.pause(); counter?.pause(); if (emblem) emblem.style.clipPath = ''; if (count) count.textContent = live ? String(free) : '—'; };
  });

  return (
    <section
      ref={ref}
      data-reveal
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        e.currentTarget.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      }}
      className="relative isolate overflow-hidden bg-[var(--brand-navy)] text-[var(--crest-on-navy)]"
    >
      <span className="hero-aura-gold pointer-events-none absolute -right-40 -top-40 -z-10 size-[720px] rounded-full" aria-hidden="true" />
      <span className="hero-aura-deep pointer-events-none absolute -bottom-60 -left-40 -z-10 size-[640px] rounded-full" aria-hidden="true" />

      <div className="mx-auto grid min-h-[100dvh] max-w-[1240px] items-center gap-16 px-4 pb-12 pt-32 sm:px-6 md:pt-40 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-7">
          <p className="reveal eyebrow eyebrow--light" style={stagger(0)}>{t('Kankroli · Rajsamand')}</p>
          <h1 className="reveal mt-7 font-editorial text-[clamp(3.4rem,9.5vw,7.4rem)] leading-[0.9] tracking-[-0.02em] [overflow-wrap:anywhere]" style={stagger(1)}>
            {t('Your desk')}<br /><span className="text-[var(--brand-gold-light)]">{t('is waiting.')}</span>
          </h1>
          <p className="reveal mt-8 max-w-[44ch] text-lg leading-relaxed text-[var(--crest-on-navy-2)]" style={stagger(2)}>
            {t('{n} reserved desks in one cool, quiet hall in Rajsamand. Pick yours on the live seat plan and start tomorrow.', { n: SEAT_COUNT })}
          </p>
          <div id="hero-cta" className="reveal mt-10 flex flex-wrap items-center gap-3" style={stagger(3)}>
            <PillLink href="/browse">{t('Find my seat')}</PillLink>
            <PillLink href="#fees" tone="ghost-light">{t('See fees')}</PillLink>
          </div>

          {/* The live number, in its own small tray. */}
          <div className="reveal bezel bezel--dark mt-10 inline-flex rounded-full p-1.5" style={stagger(4)} aria-live="polite">
            <span className="flex items-center gap-3 rounded-full bg-[var(--brand-navy-deep)] py-2.5 pl-4 pr-5 text-sm shadow-[inset_0_1px_1px_rgb(246_238_223/0.12)]">
              {live ? (
                <>
                  <span className="live-dot size-2.5 shrink-0 rounded-full bg-[var(--px-hud-text)]" aria-hidden="true" />
                  <span data-count className="font-editorial text-2xl leading-none tabular text-[var(--brand-gold-light)]">{free}</span>
                  <span className="text-[var(--crest-on-navy)]">{t('desks free right now · of {total}', { total })}</span>
                </>
              ) : (
                <span className="text-[var(--crest-on-navy-2)]">{isLoading ? t('Loading…') : t('{n} desks · live count unavailable', { n: SEAT_COUNT })}</span>
              )}
            </span>
          </div>
        </div>

        {/* Two framed cards, one laid over the other. Flat and stacked on phones. */}
        <div className="relative -mt-8 min-w-0 md:mt-0 md:h-[540px] lg:col-span-5">
          <figure className="reveal parallax parallax-1 bezel bezel--dark hidden md:absolute md:right-0 md:top-0 md:block md:w-[86%] md:rotate-[3deg]" style={stagger(2)}>
            <div className="bezel-core bezel-core--dark p-2">
              <Image src="/landing/hall.png" alt="Students studying at the library's wooden desks, with the Shree Gangaur Library sign" width={1536} height={1024} priority sizes="(min-width: 1024px) 460px, 100vw" className="h-auto w-full rounded-[1.1rem]" />
            </div>
          </figure>

          <div className="reveal parallax parallax-2 bezel absolute bottom-0 left-0 hidden w-[62%] -rotate-[2deg] md:block" style={stagger(4)}>
            <div className="bezel-core relative flex flex-col items-center bg-[var(--warm-bg)] px-6 pb-6 pt-8">
              <Image data-emblem src="/brand/emblem.png" alt="The Shree Gangaur Library emblem" width={897} height={606} sizes="260px" className="h-auto w-[82%]" />
              <span data-glint className="brand-glint pointer-events-none absolute left-1/2 top-[7%] size-7 -translate-x-1/2 opacity-0" aria-hidden="true" />
              <p className="mt-5 font-brand text-sm font-bold tracking-[0.28em] text-[var(--brand-navy)]">SHREE GANGAUR</p>
              <p className="mt-1 font-devanagari text-base text-[var(--brand-gold-deep)]">श्री गणगौर लाइब्रेरी</p>
            </div>
          </div>

          <p className="reveal parallax parallax-3 bezel bezel--dark mt-4 inline-flex rounded-full p-1 md:absolute md:bottom-16 md:right-2 md:mt-0 md:rotate-[4deg]" style={stagger(6)}>
            <span className="flex items-center gap-2 rounded-full bg-[var(--brand-navy-deep)] px-4 py-2 text-sm font-semibold">
              <Clock3 className="size-4 text-[var(--brand-gold-light)]" strokeWidth={1.5} aria-hidden="true" />
              {t('Open 6 AM – 10 PM daily')}
            </span>
          </p>
        </div>
      </div>

      {/* Facilities drift past along the bottom edge. */}
      <div className="border-t border-[var(--crest-on-navy)]/10 py-5" aria-label="Facilities">
        <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <ul className="marquee gap-4">
            {[...FACILITIES, ...FACILITIES].map((f, i) => (
              <li key={i} aria-hidden={i >= FACILITIES.length} className="flex items-center gap-3 rounded-full bg-[var(--crest-on-navy)]/[0.06] py-1.5 pl-1.5 pr-5 shadow-[inset_0_0_0_1px_rgb(246_238_223/0.1)]">
                <span className="flex size-10 items-center justify-center rounded-full bg-[var(--warm-bg)]">
                  <Image src={`/landing/icons/${f.icon}.png`} alt="" width={f.w} height={f.h} sizes="32px" className="max-h-7 w-auto max-w-7 object-contain" />
                </span>
                <span className="whitespace-nowrap text-sm font-semibold">{t(f.label)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
