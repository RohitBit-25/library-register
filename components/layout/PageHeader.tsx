import type { ReactNode } from 'react';

/**
 * The one page header.
 *
 * Every admin page had written its own. Across eleven pages that produced five
 * different recipes — `font-display text-2xl font-semibold`, `text-xl
 * sm:text-2xl font-extrabold`, `text-[1.25rem] sm:text-[1.5rem] font-bold`,
 * and two more — so the title changed size and weight as you moved between
 * them, and the gap below it changed with it. Nothing was broken; it just
 * never felt like one product.
 *
 * Icons are optional and decorative: the heading already names the page, so
 * they are `aria-hidden` and tinted like the other tertiary marks rather than
 * carrying a status colour of their own.
 *
 * Sizes come from the type scale as tokens, never Tailwind's `text-2xl` and
 * friends: `@theme` redefines those utilities, so `text-4xl` in this codebase
 * is 3.81rem rather than the stock 2.25rem. Two pages had picked their title
 * size from the Tailwind name and landed 60px tall by accident.
 */
export default function PageHeader({
  title,
  subtitle,
  icon,
  badge,
  actions,
  className = '',
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  /** Small chip beside the title — a count, or a state like "2 new". */
  badge?: ReactNode;
  /** Buttons or toggles pinned to the right on desktop, wrapped on mobile. */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${className}`}>
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 font-display text-[var(--text-lg)] font-bold tracking-[var(--tracking-tight)] text-[var(--text-primary)] sm:text-[var(--text-xl)]">
          {icon && (
            <span className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="truncate">{title}</span>
          {badge}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
