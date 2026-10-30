'use client';

import Image from 'next/image';
import { Moon, Sun } from 'lucide-react';
import { createTimeline, stagger as aStagger, utils } from 'animejs';
import PillLink from '@/components/landing/PillLink';
import { FACILITIES } from '@/components/landing/CrestHero';
import { useRevealOnce } from '@/hooks/useRevealOnce';
import { useLang } from '@/hooks/useLang';
import { SEAT_COUNT } from '@/lib/layoutConfig';
import { cn } from '@/lib/utils';

const YOURS = [
  'Reserved for you for your whole plan.',
  'Come for the morning, the evening, or the full day.',
  'You choose the exact desk — by the wall, near the AC, or at a shared table.',
];
// The app names the shifts but sets no hours, so they are shown as choices.
const SHIFTS = ['Morning', 'Evening', 'Full Day'];

const stagger = (i: number) => ({ '--i': i }) as React.CSSProperties;

function Card({ className, core, i, children }: { className?: string; core?: string; i: number; children: React.ReactNode }) {
  return (
    <div data-spotlight className={cn('reveal bezel', className)} style={stagger(i)}>
      <div className={cn('bezel-core h-full', core)}>{children}</div>
    </div>
  );
}

/**
 * The hall, in an asymmetric bento: the big picture, what a desk means, the
 * day from 6 AM to 10 PM, what the hall has, your desk, and today's count.
 */
export default function HallBento({ free, live }: { free: number; live: boolean }) {
  const { t } = useLang();
  const ref = useRevealOnce<HTMLElement>((root) => {
    const q = (s: string) => root.querySelectorAll<HTMLElement>(s);
    utils.set(q('[data-fill]'), { scaleX: 0 });
    utils.set(q('[data-icon]'), { opacity: 0, translateY: -16 });
    const tl = createTimeline({ defaults: { ease: 'out(3)' } })
      .add(q('[data-fill]'), { scaleX: 1, duration: 1600, ease: 'inOut(3)' }, 500)
      .add(q('[data-icon]'), { opacity: 1, translateY: 0, duration: 700, ease: 'outBounce', delay: aStagger(110) }, 700);
    return () => { tl.pause(); utils.set(q('[data-fill]'), { scaleX: 1 }); utils.set(q('[data-icon]'), { opacity: 1, translateY: 0 }); };
  });

  return (
    <section ref={ref} data-reveal className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6 lg:py-36">
      <p className="reveal eyebrow eyebrow--dark" style={stagger(0)}>{t('The hall')}</p>
      <h2 className="reveal mt-6 max-w-[14ch] font-editorial text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.02em] text-[var(--brand-navy)]" style={stagger(1)}>
        {t('{n} desks. One quiet hall.', { n: SEAT_COUNT })}
      </h2>

      <div className="mt-16 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* The big picture */}
        <Card i={1} className="lg:col-span-7 lg:row-span-2" core="bg-[var(--brand-navy)] p-3">
          <Image src="/landing/hall.png" alt="" width={1536} height={1024} sizes="(min-width: 1024px) 700px, 100vw" className="h-full w-full rounded-[1.1rem] object-cover" />
        </Card>

        {/* One desk, all yours */}
        <Card i={2} className="lg:col-span-5" core="p-8">
          <h3 className="font-editorial text-[2.2rem] leading-none text-[var(--brand-navy)]">{t('One desk. All yours.')}</h3>
          <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-[var(--warm-ink-2)]">
            {YOURS.map((l) => (
              <li key={l} className="flex gap-3"><span className="mt-[9px] size-1.5 shrink-0 rotate-45 bg-[var(--brand-gold)]" aria-hidden="true" />{t(l)}</li>
            ))}
          </ul>
          <PillLink href="/browse" tone="ghost-dark" className="mt-7">{t('See the seat plan')}</PillLink>
        </Card>

        {/* A day at Gangaur */}
        <Card i={3} className="lg:col-span-5" core="p-8">
          <h3 className="font-editorial text-[2.2rem] leading-none text-[var(--brand-navy)]">{t('A day at Gangaur')}</h3>
          <div className="mt-6" role="img" aria-label={t('Open 6 AM to 10 PM every day')}>
            <div className="flex items-center justify-between text-sm font-semibold text-[var(--brand-navy)]">
              <span className="flex items-center gap-2"><Sun className="size-5 text-[var(--brand-gold)]" strokeWidth={1.5} aria-hidden="true" />6 AM</span>
              <span className="flex items-center gap-2">10 PM<Moon className="size-5" strokeWidth={1.5} aria-hidden="true" /></span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--warm-band)] shadow-[inset_0_0_0_1px_rgb(11_33_65/0.08)]">
              <div data-fill className="day-fill h-full origin-left rounded-full" />
            </div>
          </div>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label={t('Shifts')}>
            {SHIFTS.map((s) => (
              <li key={s} className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-[var(--brand-navy)] shadow-[inset_0_0_0_1px_rgb(168_111_28/0.4)]">{t(s)}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-[var(--warm-ink-3)]">{t('Choose your shift when you request a desk.')}</p>
        </Card>

        {/* What the hall has */}
        <Card i={4} className="lg:col-span-4" core="p-7">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-gold-deep)]">{t('In the hall')}</h3>
          <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4" aria-label="Facilities">
            {FACILITIES.map((f) => (
              <li key={f.icon} className="flex items-center gap-2.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--warm-band)]">
                  <Image data-icon src={`/landing/icons/${f.icon}.png`} alt="" width={f.w} height={f.h} sizes="32px" className="max-h-8 w-auto max-w-8 object-contain" />
                </span>
                <span className="text-sm font-semibold leading-tight text-[var(--brand-navy)]">{t(f.label)}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Your desk */}
        <Card i={5} className="lg:col-span-4" core="flex flex-col bg-[var(--warm-band)] p-5">
          <Image src="/landing/desk.png" alt="A single wooden study desk with a plant, a notebook and a blue chair" width={1536} height={1024} sizes="(min-width: 1024px) 380px, 100vw" className="h-auto w-full" />
          <p className="mt-auto pt-3 text-center text-sm font-semibold text-[var(--brand-navy)]">{t('Your own desk, for the whole plan')}</p>
        </Card>

        {/* Today */}
        <Card i={6} className="lg:col-span-4" core="flex flex-col justify-between bg-[var(--brand-navy)] p-8 text-[var(--crest-on-navy)]">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-gold-light)]">{t('Today')}</h3>
          <p className="mt-6 font-editorial text-[5rem] leading-none tabular text-[var(--brand-gold-light)]">{live ? free : '—'}</p>
          <p className="mt-2 text-[15px] text-[var(--crest-on-navy-2)]">{t('desks free right now · of {total}', { total: SEAT_COUNT })}</p>
          <PillLink href="/browse" className="mt-6 self-start">{t('Claim your desk')}</PillLink>
        </Card>
      </div>
    </section>
  );
}
