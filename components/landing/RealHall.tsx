'use client';

import Reveal from '@/components/landing/Reveal';
import PillLink from '@/components/landing/PillLink';
import LoopVideo from '@/components/landing/LoopVideo';
import Masonry from '@/components/reactbits/Masonry';
import { PHOTOS } from '@/lib/photos';
import { SITE_INFO } from '@/lib/siteInfo';
import { useLang } from '@/hooks/useLang';

const stagger = (i: number) => ({ '--i': i }) as React.CSSProperties;

/**
 * The real hall, after the illustrated one: a clip of a working afternoon,
 * the library's own photos in a masonry wall (React Bits — click one to see it
 * large), then what students wrote on Google. Hidden until there are photos.
 */
export default function RealHall() {
  const { t } = useLang();
  if (PHOTOS.length === 0) return null;
  const handle = SITE_INFO.instagram?.match(/instagram\.com\/([^/?]+)/)?.[1];
  const items = PHOTOS.map((p, i) => ({ id: i, img: p.src, width: p.width, height: p.height, alt: p.alt, title: t(p.caption) }));

  return (
    <Reveal className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6 lg:pb-36">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="reveal eyebrow eyebrow--dark" style={stagger(0)}>{t('Real photos')}</p>
          <h2 className="reveal mt-6 font-editorial text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.02em] text-[var(--brand-navy)]" style={stagger(1)}>
            {t('The real hall.')}
          </h2>
          <p className="reveal mt-5 max-w-[46ch] text-md leading-relaxed text-[var(--warm-ink-2)]" style={stagger(2)}>
            {t('Filmed and photographed in the hall. Tap a photo to see it large.')}
          </p>
        </div>
        {SITE_INFO.instagram && handle && (
          <PillLink href={SITE_INFO.instagram} tone="ghost-dark" className="reveal" external>@{handle}</PillLink>
        )}
      </div>

      <div className="mt-14 grid items-start gap-5 lg:grid-cols-12">
        {/* A working afternoon, as a clip: tall like the phone it was filmed on. */}
        <figure className="reveal lg:col-span-4" style={stagger(2)}>
          <div className="bezel rounded-[1.75rem] p-1.5">
            <LoopVideo
              src="/video/hall-students.mp4"
              poster="/video/hall-students.jpg"
              label={t('Students at work in the reading hall on a weekday afternoon')}
              className="aspect-[9/16] max-h-[70vh] w-full overflow-hidden rounded-[1.4rem] bg-[var(--brand-navy)] lg:max-h-none"
            />
          </div>
          <figcaption className="mt-3 px-1 text-sm font-semibold text-[var(--brand-navy)]">{t('A weekday afternoon in the hall')}</figcaption>
        </figure>

        <div className="reveal min-w-0 lg:col-span-8" style={stagger(3)}>
          <Masonry
            items={items}
            columns={2}
            gap={14}
            radius={20}
            animateFrom="bottom"
            blurToFocus
            revealOnScroll
            hoverEffect="zoom"
            captions="always"
            lightbox
            draggable={false}
          />
        </div>
      </div>

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
