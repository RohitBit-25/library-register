'use client';

import Image from 'next/image';
import { useLang } from '@/hooks/useLang';
import { cn } from '@/lib/utils';

/*
 * "Joining takes a minute", shown with the app's own screens: captured at phone
 * size from the live pages (public/landing/steps, English and Hindi), each with
 * a gold ring on the one thing to tap. Positions are percentages of the shot.
 */
const STEPS = [
  { n: 1, title: 'Pick a green desk', text: 'Pick a green desk on the live seat plan.', mark: { x: 41.3, y: 58 },
    alt: 'The live seat plan on a phone, free desks in green, desk 77 circled' },
  { n: 2, title: 'Send your details', text: 'Send your name and phone number. No account needed.', mark: { x: 50, y: 92 },
    alt: 'The request form on a phone, name and phone number filled in, the Send request button circled' },
  { n: 3, title: 'Pay at the desk', text: 'Pay at the desk by UPI or cash. The seat is yours.', mark: { x: 50, y: 74.2 },
    alt: 'The payment step on a phone: ₹1,900 filled in and a UPI QR code to scan, circled' },
];

const stagger = (i: number) => ({ '--i': i }) as React.CSSProperties;

export default function StepShots({ className }: { className?: string }) {
  const { t, lang } = useLang();
  return (
    <ol className={cn('grid gap-5 md:grid-cols-3', className)}>
      {STEPS.map((s, i) => (
        <li key={s.n} className="reveal bezel" style={stagger(i + 2)}>
          <div className="bezel-core flex h-full flex-col p-4 sm:p-5">
            <figure className="relative overflow-hidden rounded-[1.1rem] bg-[var(--warm-band)] shadow-[inset_0_0_0_1px_rgb(11_33_65/0.08)]">
              <Image
                src={`/landing/steps/step${s.n}-${lang === 'hi' ? 'hi' : 'en'}.webp`}
                alt={s.alt}
                width={780}
                height={1000}
                sizes="(min-width: 768px) 360px, 100vw"
                className="h-auto w-full"
              />
              <span className="tap-ring" style={{ left: `${s.mark.x}%`, top: `${s.mark.y}%` }} aria-hidden="true" />
            </figure>
            <div className="mt-5 flex gap-4 px-1 pb-1">
              <span className="shrink-0 font-editorial text-[2.6rem] leading-none text-[var(--brand-gold)]" aria-hidden="true">{s.n}</span>
              <div>
                <h3 className="text-lg font-semibold text-[var(--brand-navy)]">{t(s.title)}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[var(--warm-ink-2)]">{t(s.text)}</p>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
