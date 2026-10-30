'use client';

import Link from 'next/link';
import { useLang } from '@/hooks/useLang';
import { SITE_INFO, fmtPhone } from '@/lib/siteInfo';

/** The student pages' footer: name, place and hours, and where students go. */
export default function PublicFooter() {
  const { t } = useLang();
  return (
    <footer className="border-t-4 border-[var(--warm-ink)] bg-[var(--warm-ink)] text-[var(--warm-bg)]">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-4 px-4 py-7 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="font-brand text-lg font-bold tracking-[0.03em]">
          Shree Gangaur Library <span className="font-devanagari normal-case">· श्री गणगौर</span>
        </p>
        <p className="text-sm text-[var(--warm-on-saffron)]">
          {t('Kankroli, Rajsamand · 6 AM – 10 PM daily')}
          {SITE_INFO.phones?.[0] && (
            <> · <a href={`tel:+91${SITE_INFO.phones[0]}`} className="tabular hover:underline">{fmtPhone(SITE_INFO.phones[0])}</a></>
          )}
        </p>
        <nav aria-label="Footer" className="flex gap-6 text-sm">
          <Link href="/browse" className="inline-flex min-h-[24px] items-center hover:underline">{t('Seats')}</Link>
          <Link href="/my-requests" className="inline-flex min-h-[24px] items-center hover:underline">{t('My requests')}</Link>
        </nav>
      </div>
    </footer>
  );
}
