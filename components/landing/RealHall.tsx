'use client';

import Image from 'next/image';
import Reveal from '@/components/landing/Reveal';
import PillLink from '@/components/landing/PillLink';
import { PHOTOS } from '@/lib/photos';
import { SITE_INFO } from '@/lib/siteInfo';
import { useLang } from '@/hooks/useLang';

const stagger = (i: number) => ({ '--i': i }) as React.CSSProperties;

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * The real hall, after the illustrated one: stills from the library's own
 * Instagram reels, shown as the 9:16 frames they are, then what students wrote
 * on Google. Hidden until there are real photos.
 */
export default function RealHall() {
  const { t } = useLang();
  if (PHOTOS.length === 0) return null;
  const handle = SITE_INFO.instagram?.match(/instagram\.com\/([^/?]+)/)?.[1];

  return (
    <Reveal className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6 lg:pb-36">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="reveal eyebrow eyebrow--dark" style={stagger(0)}>
            <InstagramGlyph className="size-3.5" />{t('Real photos')}
          </p>
          <h2 className="reveal mt-6 font-editorial text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.02em] text-[var(--brand-navy)]" style={stagger(1)}>
            {t('The real hall.')}
          </h2>
          <p className="reveal mt-5 max-w-[46ch] text-md leading-relaxed text-[var(--warm-ink-2)]" style={stagger(2)}>
            {t('Straight from our Instagram. Come and see it for yourself.')}
          </p>
        </div>
        {SITE_INFO.instagram && handle && (
          <PillLink href={SITE_INFO.instagram} tone="ghost-dark" className="reveal" external>@{handle}</PillLink>
        )}
      </div>

      {/* Reels as reels: tall frames in a row, swiped sideways on a phone. */}
      <ul className="-mx-4 mt-14 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 sm:scroll-px-6 lg:items-start [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden" aria-label={t('Photos from Instagram')}>
        {PHOTOS.map((p, i) => (
          <li key={p.src} className="reveal w-[58vw] max-w-[240px] shrink-0 snap-start lg:w-auto lg:max-w-none lg:even:mt-12" style={stagger(i + 2)}>
            <a href={SITE_INFO.instagram ?? p.src} target="_blank" rel="noopener noreferrer" className="group block rounded-[1.6rem] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-gold)]">
              <figure>
                <div className="bezel rounded-[1.6rem] p-1.5">
                  <div className="relative aspect-[9/16] overflow-hidden rounded-[1.25rem] bg-[var(--brand-navy)]">
                    <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 190px, 58vw" className="object-cover transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-[1.04]" />
                  </div>
                </div>
                <figcaption className="mt-3 px-1 text-sm font-semibold text-[var(--brand-navy)]">{t(p.caption)}</figcaption>
              </figure>
            </a>
          </li>
        ))}
      </ul>

      {SITE_INFO.reviews.length > 0 && (
        <div className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h3 className="reveal font-editorial text-[clamp(2rem,4vw,3rem)] leading-none text-[var(--brand-navy)]" style={stagger(0)}>{t('What students say')}</h3>
            {SITE_INFO.mapsUrl && (
              <a href={SITE_INFO.mapsUrl} target="_blank" rel="noopener noreferrer" className="reveal inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--brand-gold-deep)] underline-offset-4 hover:underline" style={stagger(1)}>
                {t('Read all reviews on Google')} ↗
              </a>
            )}
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {SITE_INFO.reviews.slice(0, 3).map((r, i) => (
              <figure key={r.name} className="reveal bezel" style={stagger(i + 2)}>
                <div className="bezel-core flex h-full flex-col p-7">
                  <span className="font-editorial text-5xl leading-none text-[var(--brand-gold)]" aria-hidden="true">“</span>
                  <blockquote className="mt-2 flex-1 font-editorial text-[1.45rem] leading-snug text-[var(--brand-navy)]">{r.quote}</blockquote>
                  <figcaption className="mt-6 flex items-center gap-2 text-sm font-semibold text-[var(--brand-navy)]">
                    <span aria-hidden="true" className="text-[var(--brand-gold)]">★★★★★</span>
                    <span>{r.name}</span>
                    {r.note && <span className="font-normal text-[var(--warm-ink-3)]">· {t(r.note)}</span>}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      )}
    </Reveal>
  );
}
