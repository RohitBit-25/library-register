import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'saffron' | 'cream';

const base = 'px-btn px-raised m-1 inline-flex min-h-[52px] items-center justify-center gap-2 whitespace-nowrap px-6 font-display text-lg font-semibold';

const tones: Record<Tone, string> = {
  saffron: 'bg-[var(--saffron-600)] text-[var(--text-inverse)] hover:bg-[var(--saffron-700)]',
  cream: 'bg-[var(--bg-surface)] text-[var(--warm-ink)] hover:bg-[var(--warm-band)]',
};

const disabledCls = 'disabled:cursor-not-allowed disabled:bg-[var(--warm-band)] disabled:text-[var(--warm-ink-3)]';

/**
 * The pixel-framed button from the owner's art kit. It sinks into its shadow
 * when pressed, like a game button. A link with `href`, a button without.
 */
export default function PixelButton({
  href,
  tone = 'saffron',
  className,
  children,
  ...rest
}: { href?: string; tone?: Tone; className?: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cn(base, tones[tone], className);
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type="button" {...rest} className={cn(cls, 'cursor-pointer', disabledCls)}>{children}</button>;
}
