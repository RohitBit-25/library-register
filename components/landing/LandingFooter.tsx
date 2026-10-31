'use client';

import Link from 'next/link';
import { Camera, Clock3, Mail, MapPin, Phone } from 'lucide-react';
import BrandLockup from '@/components/brand/BrandLockup';
import { SITE_INFO, fmtPhone } from '@/lib/siteInfo';
import { useLang } from '@/hooks/useLang';

const LINKS = [
  { href: '/browse', label: 'Seats' },
  { href: '#fees', label: 'Fees' },
  { href: '/my-requests', label: 'My requests' },
];

/** The landing's footer, in the crest's navy: who, where, when, and the three places a student goes. */
export default function LandingFooter() {
  const { t } = useLang();
  const row = 'flex items-start gap-3 text-[15px] leading-relaxed text-[var(--crest-on-navy-2)]';
  const icon = 'mt-1 size-4 shrink-0 text-[var(--brand-gold-light)]';

  return (
    <footer className="bg-[var(--brand-navy-deep)] text-[var(--crest-on-navy)]">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-4 pb-10 pt-20 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <BrandLockup light />
          <p className="mt-6 max-w-[34ch] font-editorial text-[2rem] leading-tight">{t('A quiet desk, kept for you.')}</p>
          <p className="mt-3 font-devanagari text-lg text-[var(--brand-gold-light)]">श्री गणगौर लाइब्रेरी · कांकरोली</p>
        </div>

        <ul className="space-y-4 md:col-span-4" aria-label={t('Visit')}>
          {SITE_INFO.address && (
            <li className={row}><MapPin className={icon} strokeWidth={1.5} aria-hidden="true" />
              {SITE_INFO.mapsUrl ? <a href={SITE_INFO.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand-gold-light)]">{SITE_INFO.address}</a> : <span>{SITE_INFO.address}</span>}
            </li>
          )}
          <li className={row}><Clock3 className={icon} strokeWidth={1.5} aria-hidden="true" /><span>{t('Open 6 AM – 10 PM daily')}</span></li>
          {SITE_INFO.phones?.length ? (
            <li className={row}>
              <Phone className={icon} strokeWidth={1.5} aria-hidden="true" />
              <span className="flex flex-wrap gap-x-4">
                {SITE_INFO.phones.map((p) => <a key={p} href={`tel:+91${p}`} className="inline-flex min-h-[24px] items-center tabular hover:text-[var(--brand-gold-light)]">{fmtPhone(p)}</a>)}
              </span>
            </li>
          ) : null}
          {SITE_INFO.email && (
            <li className={row}><Mail className={icon} strokeWidth={1.5} aria-hidden="true" /><a href={`mailto:${SITE_INFO.email}`} className="inline-flex min-h-[24px] items-center break-all hover:text-[var(--brand-gold-light)]">{SITE_INFO.email}</a></li>
          )}
          {SITE_INFO.instagram && (
            <li className={row}><Camera className={icon} strokeWidth={1.5} aria-hidden="true" /><a href={SITE_INFO.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[24px] items-center hover:text-[var(--brand-gold-light)]">@shri_gangaur_library</a></li>
          )}
        </ul>

        <nav aria-label="Footer" className="md:col-span-3">
          <ul className="space-y-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-[32px] items-center font-editorial text-2xl transition-colors duration-300 hover:text-[var(--brand-gold-light)]">{t(l.label)}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 border-t border-[var(--crest-on-navy)]/10 px-4 py-6 text-sm text-[var(--crest-on-navy-2)] sm:px-6">
        <span>© {new Date().getFullYear()} Shree Gangaur Library</span>
        <span>{t('Kankroli · Rajsamand')}</span>
      </div>
    </footer>
  );
}
