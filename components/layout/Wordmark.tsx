import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * The library's name, set the same way everywhere (design.md § What pages
 * MUST share): the mark, the name in the UI face, and a one-line caption.
 * `hindi` adds श्री गणगौर above the name for the places with room for it.
 */
export default function Wordmark({
  size = 'md',
  caption,
  mark = true,
  hindi = false,
  short = false,
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  caption?: string;
  mark?: boolean;
  hindi?: boolean;
  /** Use the short name below `sm`, where the full one truncates. */
  short?: boolean;
  className?: string;
}) {
  const markPx = { sm: 30, md: 36, lg: 48 }[size];
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      {mark && (
        <span
          className="flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]"
          style={{ width: markPx, height: markPx }}
        >
          <Image
            src="/logo-mark.png"
            alt=""
            aria-hidden="true"
            width={markPx}
            height={markPx}
            priority
            className="object-contain p-0.5"
            style={{ width: markPx, height: markPx }}
          />
        </span>
      )}
      <span className="min-w-0 leading-none">
        {hindi && (
          <span className="mb-1 block font-devanagari text-sm text-[var(--text-secondary)]">श्री गणगौर</span>
        )}
        <span
          className={cn(
            'block truncate font-semibold text-[var(--text-primary)]',
            size === 'sm' && 'text-sm',
            size === 'md' && 'text-[15px]',
            size === 'lg' && 'text-md',
          )}
        >
          {short ? (
            <><span className="sm:hidden">Gangaur</span><span className="hidden sm:inline">Shree Gangaur Library</span></>
          ) : 'Shree Gangaur Library'}
        </span>
        {caption && (
          <span className="mt-1 block truncate text-xs text-[var(--text-tertiary)]">{caption}</span>
        )}
      </span>
    </span>
  );
}
