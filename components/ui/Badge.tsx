import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Sun, Moon, SunMoon, type LucideIcon } from 'lucide-react';

export type BadgeVariant = 'active' | 'expired' | 'expiring' | 'vacant' | 'pending' | 'due' | 'morning' | 'evening' | 'full';

export interface BadgeProps extends HTMLMotionProps<"span"> {
  variant: BadgeVariant;
  className?: string;
  children?: React.ReactNode;
}

// Ramp contract (see globals.css): -50 tint bg, -200 tint border, -600/-700 text.
// Every pair below clears 4.5:1 — verified by scripts/check-contrast.py.
//
// COLOUR IS RESERVED FOR STATUS. Three pairs used to be shared between a
// status and a shift — "Fee Due" and "Full Day" were both saffron, "Expiring"
// and "Morning" both marigold, "Pending" and "Evening" both indigo — so on the
// members table a payment problem and a time of day were the same chip. Shift
// is now neutral and reads through its icon, which leaves each colour meaning
// exactly one thing.
const badgeConfig: Record<BadgeVariant, { bg: string; border: string; text: string; defaultLabel: string }> = {
  active:   { bg: 'bg-[var(--emerald-50)]',  border: 'border-[var(--emerald-200)]',  text: 'text-[var(--emerald-600)]',  defaultLabel: 'Active' },
  expired:  { bg: 'bg-[var(--ruby-50)]',     border: 'border-[var(--ruby-200)]',     text: 'text-[var(--ruby-600)]',     defaultLabel: 'Expired' },
  expiring: { bg: 'bg-[var(--marigold-50)]', border: 'border-[var(--marigold-200)]', text: 'text-[var(--marigold-700)]', defaultLabel: 'Expiring Soon' },
  due:      { bg: 'bg-[var(--saffron-50)]',  border: 'border-[var(--saffron-200)]',  text: 'text-[var(--saffron-700)]',  defaultLabel: 'Fee Due' },
  vacant:   { bg: 'bg-[var(--bg-muted)]',    border: 'border-[var(--border-default)]', text: 'text-[var(--text-tertiary)]', defaultLabel: 'Vacant' },
  pending:  { bg: 'bg-[var(--sapphire-50)]', border: 'border-[var(--sapphire-200)]', text: 'text-[var(--sapphire-600)]', defaultLabel: 'Pending' },
  // Shifts: neutral chip, meaning carried by the icon.
  morning:  { bg: 'bg-[var(--bg-muted)]',    border: 'border-[var(--border-default)]', text: 'text-[var(--text-secondary)]', defaultLabel: 'Morning' },
  evening:  { bg: 'bg-[var(--bg-muted)]',    border: 'border-[var(--border-default)]', text: 'text-[var(--text-secondary)]', defaultLabel: 'Evening' },
  full:     { bg: 'bg-[var(--bg-muted)]',    border: 'border-[var(--border-default)]', text: 'text-[var(--text-secondary)]', defaultLabel: 'Full Day' },
};

// Shift variants carry an SVG icon rather than an emoji — screen readers
// announce "🌅" as "sunrise over mountains", and it mismatched SeatTile.
const shiftIcons: Partial<Record<BadgeVariant, LucideIcon>> = {
  morning: Sun,
  evening: Moon,
  full: SunMoon,
};

export function Badge({ variant, className, children, ...props }: BadgeProps) {
  const c = badgeConfig[variant];
  const Icon = shiftIcons[variant];
  return (
    <motion.span
      className={cn(
        "inline-flex items-center gap-[var(--space-1)] px-[10px] py-[4px]",
        "rounded-[var(--radius-full)] border-[1.5px]",
        "font-[var(--font-body)] text-[var(--text-xs)] font-[var(--weight-semibold)]",
        "tracking-[var(--tracking-widest)] uppercase",
        c.bg, c.border, c.text,
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />}
      {children || c.defaultLabel}
    </motion.span>
  );
}

export default Badge;
