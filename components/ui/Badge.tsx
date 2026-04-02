import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export type BadgeVariant = 'active' | 'expired' | 'expiring' | 'vacant' | 'pending' | 'due' | 'morning' | 'evening' | 'full';

export interface BadgeProps extends HTMLMotionProps<"span"> {
  variant: BadgeVariant;
  className?: string;
  children?: React.ReactNode;
}

const badgeConfig: Record<BadgeVariant, { bg: string; border: string; text: string; defaultLabel: string }> = {
  active:   { bg: 'bg-[rgba(34,195,106,0.20)]',        border: 'border-[rgba(34,195,106,0.3)]',       text: 'text-[var(--emerald-400)]',  defaultLabel: 'Active' },
  expired:  { bg: 'bg-[rgba(232,66,66,0.20)]',         border: 'border-[rgba(232,66,66,0.3)]',        text: 'text-[var(--ruby-400)]',     defaultLabel: 'Expired' },
  expiring: { bg: 'bg-[rgba(232,162,10,0.20)]',        border: 'border-[rgba(232,162,10,0.3)]',       text: 'text-[var(--amber-400)]',    defaultLabel: 'Expiring Soon' },
  due:      { bg: 'bg-[rgba(232,133,58,0.20)]',        border: 'border-[rgba(232,133,58,0.3)]',       text: 'text-[var(--saffron-400)]',  defaultLabel: 'Fee Due' },
  vacant:   { bg: 'bg-[rgba(61,158,255,0.20)]',        border: 'border-[rgba(61,158,255,0.3)]',       text: 'text-[var(--sapphire-400)]', defaultLabel: 'Vacant' },
  pending:  { bg: 'bg-[rgba(123,95,245,0.20)]',        border: 'border-[rgba(123,95,245,0.3)]',       text: 'text-[var(--indigo-400)]',   defaultLabel: 'Pending' },
  morning:  { bg: 'bg-[rgba(232,162,10,0.15)]',        border: 'border-[rgba(232,162,10,0.25)]',      text: 'text-[var(--amber-400)]',    defaultLabel: '🌅 Morning' },
  evening:  { bg: 'bg-[rgba(123,95,245,0.15)]',        border: 'border-[rgba(123,95,245,0.25)]',      text: 'text-[var(--indigo-400)]',   defaultLabel: '🌙 Evening' },
  full:     { bg: 'bg-[rgba(232,133,58,0.15)]',        border: 'border-[rgba(232,133,58,0.25)]',      text: 'text-[var(--saffron-400)]',  defaultLabel: '☀️ Full Day' },
};

export function Badge({ variant, className, children, ...props }: BadgeProps) {
  const c = badgeConfig[variant];
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
      {children || c.defaultLabel}
    </motion.span>
  );
}

export default Badge;
