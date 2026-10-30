import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * The emblem with the name set beside it, the way the owner's logo stacks it:
 * SHREE / GANGAUR / LIBRARY. The logo artwork itself spells the name
 * "Ganguar", so only its emblem is used and the name is real text.
 */
export default function BrandLockup({ className, priority = false, light = false }: { className?: string; priority?: boolean; light?: boolean }) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <Image
        src="/brand/emblem.png"
        alt=""
        width={897}
        height={606}
        priority={priority}
        sizes="80px"
        className="h-12 w-auto shrink-0"
      />
      <span className="font-brand leading-none" aria-hidden="true">
        <span className={cn('block text-xs font-medium tracking-[0.3em]', light ? 'text-[var(--brand-gold-light)]' : 'text-[var(--brand-gold-deep)]')}>SHREE</span>
        <span className={cn('block text-[22px] font-bold tracking-[0.03em]', light ? 'text-[var(--crest-on-navy)]' : 'text-[var(--brand-navy)]')}>GANGAUR</span>
        <span className={cn('block text-xs font-medium tracking-[0.3em]', light ? 'text-[var(--brand-gold-light)]' : 'text-[var(--brand-gold-deep)]')}>LIBRARY</span>
      </span>
    </span>
  );
}
