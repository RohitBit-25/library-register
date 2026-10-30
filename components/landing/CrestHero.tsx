'use client';

import Image from 'next/image';
import { Clock3 } from 'lucide-react';
import { animate } from 'animejs';
import PillLink from '@/components/landing/PillLink';
import { useRevealOnce } from '@/hooks/useRevealOnce';
import { useLang } from '@/hooks/useLang';
import { SEAT_COUNT } from '@/lib/layoutConfig';
import { cn } from '@/lib/utils';

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
 * Editorial split on navy: the promise in a large serif and the live count;
 * on the right one framed print of the hall at sunrise, captioned like a
 * plate. One image, set straight — no stacked or tilted cards.
 */
export default function CrestHero({ free, total, isLoading, loadFailed }: { free: number; total: number; isLoading: boolean; loadFailed: boolean }) {
  const { t, lang } = useLang();
  const live = !isLoading && !loadFailed;

  // The live count runs up once, the first time it is seen.
  const ref = useRevealOnce<HTMLElement>((root) => {
    const count = root.querySelector<HTMLElement>('[data-count]');
    if (!count || !live || free === 0) return;
    const n = { v: 0 };
    const a = animate(n, { v: free, duration: 1400, delay: 600, ease: 'out(4)', modifier: Math.round, onUpdate: () => { count.textContent = String(n.v); } });
    return () => { a.pause(); count.textContent = String(free); };
  });

  return (
    <section ref={ref} data-reveal className="relative isolate overflow-hidden bg-[var(--brand-navy)] text-[var(--crest-on-navy)]">
      <span className="hero-aura-gold pointer-events-none absolute -right-40 -top-40 -z-10 size-[720px] rounded-full" aria-hidden="true" />
      <span className="hero-aura-deep pointer-events-none absolute -bottom-60 -left-40 -z-10 size-[640px] rounded-full" aria-hidden="true" />

      <div className="mx-auto grid min-h-[100dvh] max-w-[1240px] items-center gap-12 px-4 pb-12 pt-32 sm:px-6 md:pt-40 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 lg:col-span-6">
          <p className="reveal eyebrow eyebrow--light" style={stagger(0)}>{t('Kankroli · Rajsamand')}</p>
          {/* Hindi runs about twice as long, and its vowel marks need room above and below. */}
          <h1 className={cn('reveal mt-7 font-editorial tracking-[-0.02em] [overflow-wrap:anywhere]', lang === 'hi' ? 'text-[clamp(2.4rem,5vw,3.8rem)] leading-[1.15]' : 'text-[clamp(3.4rem,8.5vw,7rem)] leading-[0.9]')} style={stagger(1)}>
            {t('Your desk')}<br /><span className={cn('text-[var(--brand-gold-light)]', lang === 'hi' && 'inline-block [text-wrap:balance]')}>{t('is waiting.')}</span>
          </h1>
          <p className="reveal mt-8 max-w-[44ch] text-lg leading-relaxed text-[var(--crest-on-navy-2)]" style={stagger(2)}>
            {t('{n} reserved desks in one cool, quiet hall in Rajsamand. Pick yours on the live seat plan and start tomorrow.', { n: SEAT_COUNT })}
          </p>
          <div id="hero-cta" className="reveal mt-10 flex flex-wrap items-center gap-3" style={stagger(3)}>
            <PillLink href="/browse">{t('Find my seat')}</PillLink>
            <PillLink href="#fees" tone="ghost-light">{t('See fees')}</PillLink>
          </div>

          {/* The live number, set as a line of type under a gold rule. */}
          <p className="reveal mt-10 flex max-w-[30rem] items-baseline gap-3 border-t border-[var(--brand-gold-light)]/40 pt-5" style={stagger(4)} aria-live="polite">
            {live ? (
              <>
                <span className="live-dot size-2.5 shrink-0 translate-y-[-3px] rounded-full bg-[var(--px-hud-text)]" aria-hidden="true" />
                <span data-count className="font-editorial text-[2.6rem] leading-none tabular text-[var(--brand-gold-light)]">{free}</span>
                <span className="text-[15px] text-[var(--crest-on-navy)]">{t('desks free right now · of {total}', { total })}</span>
              </>
            ) : (
              <span className="text-[15px] text-[var(--crest-on-navy-2)]">{isLoading ? t('Loading…') : t('{n} desks · live count unavailable', { n: SEAT_COUNT })}</span>
            )}
          </p>
        </div>

        {/* One framed print of the hall at sunrise. */}
        <figure className="reveal min-w-0 lg:col-span-6" style={stagger(2)}>
          <div className="bezel bezel--dark">
            <div className="bezel-core bezel-core--dark p-2">
              <Image
                src="/landing/print/hall-morning.webp"
                alt="An illustration of a quiet reading hall at sunrise: students at wooden desks with lamps, light falling through tall arched windows"
                width={1913}
                height={992}
                priority
                sizes="(min-width: 1024px) 590px, 100vw"
                className="aspect-[4/3] w-full rounded-[1.1rem] object-cover object-[64%_50%]"
              />
            </div>
          </div>
          <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2 text-sm text-[var(--crest-on-navy-2)]">
            <span>{t('6:00 AM — the hall opens.')}</span>
            <span className="flex items-center gap-2 font-semibold text-[var(--crest-on-navy)]">
              <Clock3 className="size-4 text-[var(--brand-gold-light)]" strokeWidth={1.5} aria-hidden="true" />
              {t('Open 6 AM – 10 PM daily')}
            </span>
          </figcaption>
        </figure>
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
