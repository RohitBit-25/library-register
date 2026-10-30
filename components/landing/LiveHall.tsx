'use client';

import Link from 'next/link';
import { createTimeline, stagger, utils } from 'animejs';
import PillLink from '@/components/landing/PillLink';
import { useRevealOnce } from '@/hooks/useRevealOnce';
import { useLang } from '@/hooks/useLang';
import { AC_CENTERS, DESK_H, DESK_W, DOOR, ROOM, SEAT_NUMBERS, getSeatPositionConfig } from '@/lib/layoutConfig';

const SEATS = SEAT_NUMBERS.map((n) => ({ n, ...getSeatPositionConfig(n) }));
const sx = (s: { x: number }) => s.x + DESK_W / 2;
const sy = (s: { y: number }) => s.y + DESK_H / 2;
// Desks light up from the entrance inward, the way you'd walk in.
const fromDoor = [...SEATS].sort((a, b) =>
  Math.hypot(sx(a) - DOOR.cx, sy(a) - ROOM.HEIGHT) - Math.hypot(sx(b) - DOOR.cx, sy(b) - ROOM.HEIGHT));

/**
 * The real room, drawn from the seat plan's own coordinates: every desk in
 * place, gold where it is free right now. One link to the full plan.
 */
export default function LiveHall({ freeSeats, live }: { freeSeats: Set<number>; live: boolean }) {
  const { t } = useLang();
  const free = freeSeats.size;
  const ref = useRevealOnce<HTMLElement>((root) => {
    const desks = fromDoor.map((s) => root.querySelector<SVGRectElement>(`[data-desk="${s.n}"]`)).filter(Boolean) as SVGRectElement[];
    utils.set(desks, { opacity: 0, scale: 0.6 });
    const tl = createTimeline({ defaults: { ease: 'out(3)' } })
      .add(desks, { opacity: 1, scale: 1, duration: 500, delay: stagger(12) }, 350)
      .add(root.querySelectorAll('[data-free="true"]'), { opacity: [1, 0.35, 1], duration: 900, ease: 'inOut(2)' });
    return () => { tl.pause(); utils.set(desks, { opacity: 1, scale: 1 }); };
  });

  return (
    <section ref={ref} data-reveal className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6 lg:pb-36">
      <div className="grid items-center gap-12 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5">
          <p className="reveal eyebrow eyebrow--dark" style={{ '--i': 0 } as React.CSSProperties}>
            <span className="live-dot size-2 rounded-full bg-[var(--emerald-600)]" aria-hidden="true" />{t('Live')}
          </p>
          <h2 className="reveal mt-6 font-editorial text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.95] tracking-[-0.02em] text-[var(--brand-navy)]" style={{ '--i': 1 } as React.CSSProperties}>
            {t("Today's hall, as it is.")}
          </h2>
          <p className="reveal mt-5 max-w-[42ch] text-md leading-relaxed text-[var(--warm-ink-2)]" style={{ '--i': 2 } as React.CSSProperties}>
            {t('Every desk in its real place. Gold ones are free right now — pick one on the full plan.')}
          </p>
          <dl className="reveal mt-8 flex gap-10" style={{ '--i': 3 } as React.CSSProperties}>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-gold-deep)]">{t('Free')}</dt>
              <dd className="mt-1 font-editorial text-[3.4rem] leading-none tabular text-[var(--brand-navy)]">{live ? free : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--warm-ink-3)]">{t('Taken')}</dt>
              <dd className="mt-1 font-editorial text-[3.4rem] leading-none tabular text-[var(--warm-ink-3)]">{live ? SEATS.length - free : '—'}</dd>
            </div>
          </dl>
          <PillLink href="/browse" tone="navy" className="reveal mt-9" >{t('Open the seat plan')}</PillLink>
        </div>

        <div className="reveal bezel min-w-0 lg:col-span-7" data-spotlight style={{ '--i': 2 } as React.CSSProperties}>
          <Link
            href="/browse"
            aria-label={live ? t('Open the live seat plan — {n} desks free', { n: free }) : t('Open the live seat plan')}
            className="bezel-core block bg-[var(--brand-navy)] p-4 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-gold)] sm:p-6"
          >
            <svg viewBox={`0 0 ${ROOM.WIDTH} ${ROOM.HEIGHT}`} className="h-auto w-full" aria-hidden="true">
              {/* walls, with the entrance gap at the bottom */}
              <path
                d={`M ${DOOR.cx - DOOR.w / 2} ${ROOM.HEIGHT - 10} H 10 V 10 H ${ROOM.WIDTH - 10} V ${ROOM.HEIGHT - 10} H ${DOOR.cx + DOOR.w / 2}`}
                fill="none" stroke="var(--crest-on-navy)" strokeOpacity={0.22} strokeWidth={6}
              />
              {AC_CENTERS.map((cx) => (
                <rect key={cx} x={cx - 90} y={22} width={180} height={18} rx={9} fill="var(--crest-on-navy)" opacity={0.18} />
              ))}
              <text x={DOOR.cx} y={ROOM.HEIGHT - 26} textAnchor="middle" fontSize={30} fill="var(--crest-on-navy-2)" opacity={0.7}>{t('Entrance')}</text>
              {SEATS.map((s) => {
                const isFree = live && freeSeats.has(s.n);
                return (
                  <rect
                    key={s.n}
                    data-desk={s.n}
                    data-free={isFree}
                    x={s.x + 4} y={s.y + 4} width={DESK_W - 8} height={DESK_H - 8} rx={12}
                    fill={isFree ? 'var(--brand-gold-light)' : 'var(--crest-on-navy)'}
                    fillOpacity={isFree ? 1 : 0.1}
                    stroke={isFree ? 'none' : 'var(--crest-on-navy)'} strokeOpacity={0.18} strokeWidth={2}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  >
                    <title>{`${t('Desk')} ${s.n} · ${isFree ? t('Free') : t('Taken')}`}</title>
                  </rect>
                );
              })}
            </svg>
            <span className="mt-4 flex items-center justify-center gap-6 text-xs font-semibold text-[var(--crest-on-navy-2)]">
              <span className="flex items-center gap-2"><span className="size-3 rounded-[3px] bg-[var(--brand-gold-light)]" aria-hidden="true" />{t('Free')}</span>
              <span className="flex items-center gap-2"><span className="size-3 rounded-[3px] bg-[var(--crest-on-navy)]/15 shadow-[inset_0_0_0_1px_rgb(246_238_223/0.2)]" aria-hidden="true" />{t('Taken')}</span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
