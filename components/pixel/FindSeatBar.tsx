'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { SITE_INFO } from '@/lib/siteInfo';
import { cn } from '@/lib/utils';
import { useLang } from '@/hooks/useLang';

/**
 * The landing page's one action, kept under the thumb on phones.
 *
 * The phone header has room for "My requests" only, so once the hero button
 * scrolls away there was no way to the seat plan short of scrolling back up.
 * The bar appears when the element with `watchId` leaves the screen. A
 * WhatsApp button joins it — and floats on desktop — only once a real number
 * is set in lib/siteInfo.ts.
 */
export default function FindSeatBar({ watchId, free }: { watchId: string; free: number | null }) {
  const [show, setShow] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    const el = document.getElementById(watchId);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [watchId]);

  const wa = SITE_INFO.whatsapp ? `https://wa.me/${SITE_INFO.whatsapp}` : null;

  return (
    <>
      <div
        className={cn(
          'fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 rounded-full bg-[var(--brand-navy)]/90 p-1.5 shadow-[0_20px_50px_-20px_rgb(11_33_65/0.7)] backdrop-blur-xl transition-transform duration-500 ease-[var(--ease-premium)] md:hidden',
          show ? 'translate-y-0' : 'translate-y-[calc(100%+2rem)]',
        )}
        aria-hidden={!show}
        inert={!show}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/browse"
            className="pill-btn pill-btn--gold group flex-1 justify-between"
          >
            <span>{t('Find my seat')}{free !== null && free > 0 ? ` · ${t('{n} free', { n: free })}` : ''}</span>
            <span className="pill-btn__icon" aria-hidden="true"><ArrowUpRight className="size-[18px]" strokeWidth={1.5} /></span>
          </Link>
          {wa && (
            <a
              href={wa}
              aria-label="Message the library on WhatsApp"
              className="pill-btn pill-btn--ghost-light size-[52px] shrink-0 justify-center p-0"
            >
              <MessageCircle className="size-6" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      {wa && (
        <a
          href={wa}
          className="pill-btn pill-btn--navy fixed bottom-6 right-6 z-40 hidden pr-6 md:inline-flex"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          {t('WhatsApp us')}
        </a>
      )}
    </>
  );
}
