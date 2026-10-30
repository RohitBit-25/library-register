'use client';

import Link from 'next/link';
import BrandLockup from '@/components/brand/BrandLockup';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLang } from '@/hooks/useLang';

const LINKS = [
  { href: '/browse', label: 'Seats', show: 'hidden md:inline-flex' },
  { href: '/landing#fees', label: 'Fees', show: 'hidden md:inline-flex' },
  { href: '/my-requests', label: 'My requests', show: 'inline-flex' },
];

/**
 * The student pages' name plate: the logo, the name in the pixel face, and
 * the few places a student goes. Shared by /landing, /browse and /my-requests
 * so moving between them feels like one place. No staff link: visitors never
 * see the staff door; staff use /admin/login directly (bookmark it). `wide` lines up with the
 * 1400px seat-plan page instead of the 1160px reading pages.
 */
export default function UnifiedHeader({ wide = false }: { wide?: boolean }) {
  const pathname = usePathname();
  const { lang, setLang, t } = useLang();

  return (
    <header className="border-b-4 border-[var(--warm-ink)] bg-[var(--warm-bg)] text-[var(--warm-ink)]">
      <div className={cn('mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-6', wide ? 'max-w-[1400px]' : 'max-w-[1160px]')}>
        <Link href="/landing" className="flex min-w-0 items-center gap-3" aria-label="Shree Gangaur Library — home">
          <BrandLockup priority />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          {LINKS.map((l) => {
            const current = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  l.show,
                  'min-h-[40px] items-center whitespace-nowrap border-b-4 px-2 pt-1 text-sm font-medium transition-ui',
                  current
                    ? 'border-[var(--saffron-600)] text-[var(--warm-ink)]'
                    : 'border-transparent text-[var(--warm-ink-2)] hover:text-[var(--warm-ink)]',
                )}
              >
                {t(l.label)}
              </Link>
            );
          })}
          {/* Many students here read Hindi first. The button names the
              language it switches to, in that language. */}
          <button
            type="button"
            onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
            aria-label={lang === 'hi' ? 'Switch to English' : 'हिंदी में देखें'}
            lang={lang === 'hi' ? 'en' : 'hi'}
            className="px-box m-1 ml-1 min-h-[36px] cursor-pointer px-2.5 text-sm font-semibold text-[var(--warm-ink)] hover:bg-[var(--warm-band)]"
          >
            {lang === 'hi' ? 'English' : 'हिंदी'}
          </button>
        </nav>
      </div>
    </header>
  );
}
