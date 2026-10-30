'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Dialog } from 'radix-ui';
import BrandLockup from '@/components/brand/BrandLockup';
import PillLink from '@/components/landing/PillLink';
import { useLang } from '@/hooks/useLang';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/browse', label: 'Seats' },
  { href: '#fees', label: 'Fees' },
  { href: '/my-requests', label: 'My requests' },
];

/** हिंदी / English — named in the language it switches to. */
function LangToggle({ onNavy = false }: { onNavy?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
      aria-label={lang === 'hi' ? 'Switch to English' : 'हिंदी में देखें'}
      lang={lang === 'hi' ? 'en' : 'hi'}
      className={cn(
        'inline-flex min-h-[40px] items-center rounded-full px-4 text-sm font-semibold transition-colors duration-300',
        onNavy ? 'text-[var(--crest-on-navy)] shadow-[inset_0_0_0_1px_rgb(246_238_223/0.3)] hover:bg-white/10'
          : 'text-[var(--brand-navy)] shadow-[inset_0_0_0_1px_rgb(11_33_65/0.18)] hover:bg-[var(--brand-navy)]/5',
      )}
    >
      {lang === 'hi' ? 'English' : 'हिंदी'}
    </button>
  );
}

/**
 * The landing's navigation: a pill floating above the page. On phones the
 * menu button opens a full-screen sheet whose links rise in one by one.
 */
export default function IslandNav() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4 sm:pt-5">
      <nav
        aria-label="Main"
        className="pointer-events-auto flex w-full items-center justify-between gap-4 rounded-full bg-[var(--warm-bg)]/95 py-1.5 pl-4 pr-1.5 shadow-[0_12px_40px_-16px_rgb(11_33_65/0.45),inset_0_0_0_1px_rgb(11_33_65/0.08)] backdrop-blur-xl md:w-max md:gap-7"
      >
        <Link href="/landing" aria-label="Shree Gangaur Library — home" className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-gold)]">
          <BrandLockup priority className="[&_img]:h-10" />
        </Link>

        <ul className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-sm font-semibold text-[var(--brand-navy)] transition-colors duration-300 hover:text-[var(--brand-gold-deep)]">{t(l.label)}</Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <LangToggle />
          <PillLink href="/browse" className="hidden min-h-[44px] py-1 pl-5 text-sm md:inline-flex">{t('Find my seat')}</PillLink>

          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button type="button" aria-label="Open menu" className="relative flex size-11 items-center justify-center rounded-full bg-[var(--brand-navy)] md:hidden">
                <span className="absolute h-[1.5px] w-5 -translate-y-[4px] bg-[var(--crest-on-navy)]" />
                <span className="absolute h-[1.5px] w-5 translate-y-[4px] bg-[var(--crest-on-navy)]" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="island-overlay fixed inset-0 z-50 bg-[var(--brand-navy)]/90 backdrop-blur-2xl" />
              <Dialog.Content aria-describedby={undefined} className="fixed inset-0 z-50 flex flex-col px-6 pb-10 pt-6 text-[var(--crest-on-navy)]">
                <Dialog.Title className="sr-only">Menu</Dialog.Title>
                <div className="flex items-center justify-between">
                  <BrandLockup light />
                  <Dialog.Close asChild>
                    <button type="button" aria-label="Close menu" className="island-x relative flex size-11 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgb(246_238_223/0.3)]">
                      <span className="absolute h-[1.5px] w-5 rotate-45 bg-[var(--crest-on-navy)]" />
                      <span className="absolute h-[1.5px] w-5 -rotate-45 bg-[var(--crest-on-navy)]" />
                    </button>
                  </Dialog.Close>
                </div>
                <ul className="mt-16 space-y-6">
                  {LINKS.map((l, i) => (
                    <li key={l.href} className="island-link" style={{ '--i': i } as React.CSSProperties}>
                      <Link href={l.href} onClick={() => setOpen(false)} className="font-editorial text-[2.75rem] leading-none">{t(l.label)}</Link>
                    </li>
                  ))}
                </ul>
                <div className="island-link mt-auto flex flex-wrap items-center gap-3" style={{ '--i': 3 } as React.CSSProperties}>
                  <PillLink href="/browse">{t('Find my seat')}</PillLink>
                  <LangToggle onNavy />
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </nav>
    </header>
  );
}
