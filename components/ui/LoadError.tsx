'use client';

import { RotateCw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '@/hooks/useLang';

/**
 * "This did not load" — said plainly, with a way to try again.
 *
 * Failed loads used to fall through to the empty state, so a server hiccup
 * told students the library was full and staff that every seat was free.
 * `tone="warm"` matches the student pages' pixel frames; the default matches
 * the staff cards.
 */
export default function LoadError({
  what,
  onRetry,
  tone = 'staff',
  className,
}: {
  /** What failed, as the person would say it: "the seat plan". */
  what: string;
  onRetry: () => void;
  tone?: 'staff' | 'warm';
  className?: string;
}) {
  const warm = tone === 'warm';
  // Student pages follow the हिंदी toggle; staff pages stay English.
  const { t: tr } = useLang();
  const t = (en: string, v?: Record<string, string>) => (warm ? tr(en, v) : en.replace(/\{(\w+)\}/g, (_, k) => v?.[k] ?? ''));
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 p-6 text-center',
        warm
          ? 'px-box m-1 bg-[var(--bg-surface)] text-[var(--warm-ink)]'
          : 'rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]',
        className,
      )}
    >
      <WifiOff className={cn('size-6', warm ? 'text-[var(--warm-ink-3)]' : 'text-[var(--text-tertiary)]')} aria-hidden="true" />
      <p className="font-display text-lg font-semibold">{t("Couldn't load {what}", { what: warm ? tr(what) : what })}</p>
      <p className={cn('max-w-[44ch] text-sm', warm ? 'text-[var(--warm-ink-2)]' : 'text-[var(--text-secondary)]')}>
        {warm
          ? t('This is a connection problem, not the library being full. Check your internet and try again.')
          : 'The server did not answer, so nothing is shown rather than wrong numbers. Nothing was changed.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          'mt-1 inline-flex min-h-[44px] cursor-pointer items-center gap-2 px-5 text-sm font-semibold transition-ui',
          warm
            ? 'px-btn px-raised bg-[var(--saffron-600)] text-[var(--text-inverse)] hover:bg-[var(--saffron-700)]'
            : 'rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] text-[var(--text-inverse)] hover:bg-[var(--ink-hover)]',
        )}
      >
        <RotateCw className="size-4" aria-hidden="true" />
        {t('Try again')}
      </button>
    </div>
  );
}
