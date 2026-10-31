'use client';

import BlurText from '@/components/reactbits/BlurText';
import LoopVideo from '@/components/landing/LoopVideo';
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
 * The front door, literally: the real entrance at night fills the right side
 * edge to edge (on top, on a phone), the promise and the live count sit on
 * navy beside it. No frames, glows or badges — the photograph carries it.
 */
export default function CrestHero({ free, total, isLoading, loadFailed, fromPerDay }: {
  free: number; total: number; isLoading: boolean; loadFailed: boolean; fromPerDay: number;
}) {
  const { t, lang } = useLang();
  const live = !isLoading && !loadFailed;

  // The live count runs up once, the first time it is seen.
  const ref = useRevealOnce<HTMLElement>((root) => {
    const count = root.querySelector<HTMLElement>('[data-count]');
    if (!count || !live || free === 0) return;
    const n = { v: 0 };
    const a = animate(n, { v: free, duration: 1400, delay: 500, ease: 'out(4)', modifier: Math.round, onUpdate: () => { count.textContent = String(n.v); } });
    return () => { a.pause(); count.textContent = String(free); };
  });

  const fact = 'text-xs font-semibold uppercase tracking-[0.16em] text-[var(--crest-on-navy-2)]';
  const figure = 'mt-2 font-editorial text-[clamp(2.2rem,3.6vw,3rem)] leading-none tabular';

  return (
    <section ref={ref} data-reveal className="relative bg-[var(--brand-navy)] text-[var(--crest-on-navy)]">
      <div className="grid lg:min-h-[100dvh] lg:grid-cols-12">
        {/* A walk down the real aisle, filmed in the hall (demo/Library file). */}
        <figure className="relative h-[52svh] min-h-[320px] lg:order-last lg:col-span-5 lg:h-auto">
          <LoopVideo
            src="/video/hall-aisle.mp4"
            poster="/video/hall-aisle.jpg"
            label={t('A walk down the aisle of the reading hall, between rows of lit study cabins')}
            className="absolute inset-0"
          />
          <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--brand-navy-deep)]/85 to-transparent px-5 pb-4 pt-16 text-xs font-semibold text-[var(--crest-on-navy)] sm:px-6">
            {t('The reading hall at JK Circle, Kankroli')}
          </figcaption>
        </figure>

        <div className="flex flex-col justify-center px-4 pb-16 pt-12 sm:px-6 lg:col-span-7 lg:pb-20 lg:pl-[max(1.5rem,calc((100vw-1240px)/2+1.5rem))] lg:pr-16 lg:pt-36">
          <p className="reveal flex flex-wrap items-baseline gap-x-4 gap-y-1" style={stagger(0)}>
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-gold-light)]">{t('Kankroli · Rajsamand')}</span>
            <span className="font-devanagari text-lg text-[var(--crest-on-navy-2)]">श्री गणगौर लाइब्रेरी</span>
          </p>

          {/* Hindi runs about twice as long, and its vowel marks need room above and below. */}
          {/* The headline settles in word by word (React Bits BlurText). */}
          <h1 className={cn('mt-6 font-editorial tracking-[-0.025em] [overflow-wrap:anywhere]', lang === 'hi' ? 'text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.15]' : 'text-[clamp(3.4rem,8vw,7.4rem)] leading-[0.88]')}>
            <BlurText as="span" text={t('Your desk')} trigger="load" srCopy={false} delay={110} startDelay={0.15} blur={12} distance={28} className="block" />
            <BlurText as="span" text={t('is waiting.')} trigger="load" srCopy={false} delay={110} startDelay={0.4} blur={12} distance={28} className="block text-[var(--brand-gold-light)]" />
          </h1>

          <p className="reveal mt-8 max-w-[42ch] text-lg leading-relaxed text-[var(--crest-on-navy-2)]" style={stagger(2)}>
            {t('{n} reserved desks in one cool, quiet hall in Rajsamand. Pick yours on the live seat plan and start tomorrow.', { n: SEAT_COUNT })}
          </p>

          <div id="hero-cta" className="reveal mt-10 flex flex-wrap items-center gap-x-7 gap-y-4" style={stagger(3)}>
            <PillLink href="/browse">{t('Find my seat')}</PillLink>
            <a href="#fees" className="inline-flex min-h-[44px] items-center text-base font-semibold text-[var(--crest-on-navy)] underline decoration-[var(--brand-gold-light)]/60 decoration-2 underline-offset-[6px] transition-colors hover:text-[var(--brand-gold-light)]">
              {t('See fees')}
            </a>
          </div>

          {/* Three plain facts under one rule: the live count, the hours, the lowest daily price. */}
          <dl className="reveal mt-14 grid max-w-[34rem] grid-cols-3 gap-4 border-t sm:gap-6 border-[var(--crest-on-navy)]/15 pt-6" style={stagger(4)} aria-live="polite">
            <div>
              <dt className={cn(fact, 'flex items-center gap-2')}>
                {live && <span className="live-dot size-2 rounded-full bg-[var(--px-hud-text)]" aria-hidden="true" />}{t('Free now')}
              </dt>
              <dd className={cn(figure, 'text-[var(--brand-gold-light)]')}>
                {live ? <span data-count>{free}</span> : '—'}
              </dd>
              <dd className="mt-1 text-sm text-[var(--crest-on-navy-2)]">{isLoading ? t('Loading…') : live ? t('of {total} desks', { total }) : t('live count unavailable')}</dd>
            </div>
            <div>
              <dt className={fact}>{t('Open')}</dt>
              <dd className={figure}>6–10</dd>
              <dd className="mt-1 text-sm text-[var(--crest-on-navy-2)]">{t('AM to PM, daily')}</dd>
            </div>
            <div>
              <dt className={fact}>{t('From')}</dt>
              <dd className={figure}>₹{fromPerDay}</dd>
              <dd className="mt-1 text-sm text-[var(--crest-on-navy-2)]">{t('a day')}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
