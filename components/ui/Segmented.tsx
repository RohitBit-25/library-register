'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A row of mutually exclusive options on a recessed track.
 *
 * Pages each built their own, filling the chosen segment with saffron — so a
 * toolbar with three groups carried three blocks of the brand colour and the
 * one primary button on the page stopped standing out. The selected segment
 * is now a raised paper chip; saffron is left for actions.
 */
export default function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = 'md',
  pixel = false,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: ReactNode; count?: number }[];
  /** Accessible name for the group. */
  label: string;
  className?: string;
  size?: 'sm' | 'md';
  /** The student pages' look: a hard-edged box, the chosen option in saffron. */
  pixel?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center',
        pixel ? 'px-box m-1 bg-[var(--bg-surface)]' : 'gap-0.5 rounded-[var(--radius-md)] bg-[var(--bg-muted)] p-0.5',
        className,
      )}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={on}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] font-medium transition-ui',
              size === 'sm' ? 'min-h-[30px] px-2.5 text-xs' : 'min-h-[36px] px-3 text-sm',
              pixel
                ? cn('rounded-none font-display', on
                  ? 'bg-[var(--saffron-600)] text-[var(--text-inverse)]'
                  : 'text-[var(--warm-ink-2)] hover:bg-[var(--warm-band)] hover:text-[var(--warm-ink)]')
                : on
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--border-default)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {o.icon && <span className={cn('shrink-0', on ? 'text-[var(--saffron-600)]' : 'text-[var(--text-tertiary)]')} aria-hidden="true">{o.icon}</span>}
            {o.label}
            {o.count !== undefined && (
              <span className="font-mono text-xs tabular text-[var(--text-tertiary)]">{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
