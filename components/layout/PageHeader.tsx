import type { ReactNode } from 'react';

/**
 * The one page header.
 *
 * Every admin page had written its own. Across eleven pages that produced five
 * different recipes — `font-display text-2xl font-semibold`, `text-xl
 * sm:text-2xl font-extrabold`, `text-md sm:text-[1.5rem] font-bold`,
 * and two more — so the title changed size and weight as you moved between
 * them, and the gap below it changed with it. Nothing was broken; it just
 * never felt like one product.
 *
 * Icons are optional and decorative: the heading already names the page, so
 * they are `aria-hidden` and tinted like the other tertiary marks rather than
 * carrying a status colour of their own.
 *
 * Sizes use the named utilities — `text-lg`, `text-xl` — which `@theme` has
 * already remapped onto this project's scale (`text-xl` is 1.95rem here, not
 * the stock 1.25rem).
 *
 * NOT `text-[var(--text-xl)]`. Tailwind's `text-` prefix covers both colour
 * and size, and an arbitrary `var()` is ambiguous, so it compiles to a colour
 * and the font-size is silently dropped. Titles written that way rendered at
 * the inherited 16px — which is most of why page titles looked inconsistent
 * in the first place, and why every Button and Badge label was 16px instead
 * of its intended size.
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
        <h1 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[var(--tracking-tight)] text-[var(--text-primary)] sm:text-xl">
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
