import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { springQuick } from '@/lib/motion';

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'brand' | 'secondary' | 'danger' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    
    const baseClasses = "inline-flex items-center justify-center relative overflow-hidden cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

    // Ink is the primary action (design.md): one strong, neutral button per
    // view, so the saffron brand colour stays free for state — the selected
    // seat, the live indicator, the best-value plan. `brand` exists for the
    // rare place the action *is* the brand moment.
    const variants = {
      primary: `
        bg-[var(--ink)] text-[var(--text-inverse)] font-medium
        rounded-[var(--radius-sm)] shadow-[var(--shadow-xs)]
        hover:bg-[var(--ink-hover)]
        disabled:opacity-100 disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-disabled)] disabled:shadow-none
        transition-ui
      `,
      brand: `
        bg-[var(--saffron-600)] text-[var(--text-inverse)] font-medium
        rounded-[var(--radius-sm)] shadow-[var(--shadow-xs)]
        hover:bg-[var(--saffron-700)]
        disabled:opacity-100 disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-disabled)] disabled:shadow-none
        transition-ui
      `,
      secondary: `
        bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium
        border border-[var(--border-default)] rounded-[var(--radius-sm)] shadow-[var(--shadow-xs)]
        hover:bg-[var(--bg-muted)]
        transition-ui
      `,
      danger: `
        bg-[var(--bg-surface)] text-[var(--ruby-600)] font-medium
        border border-[var(--ruby-200)] rounded-[var(--radius-sm)] shadow-[var(--shadow-xs)]
        hover:bg-[var(--ruby-50)]
        transition-ui
      `,
      ghost: `
        bg-transparent text-[var(--text-secondary)] border-none rounded-[var(--radius-sm)]
        hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]
        transition-ui
      `,
      icon: `
        bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[var(--shadow-xs)]
        text-[var(--text-secondary)] rounded-[var(--radius-sm)]
        hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]
        transition-ui flex items-center justify-center
      `
    };

    const sizes = {
      sm: "gap-1.5 px-3 text-sm min-h-[34px] whitespace-nowrap",
      md: variant === 'icon' ? "size-10" : "gap-2 px-4 text-sm min-h-[40px] whitespace-nowrap",
      lg: "gap-2 px-5 text-base min-h-[48px] whitespace-nowrap",
    };

    // The icon variant doesn't use standard padding/size unless overridden
    const appliedSize = variant === 'icon' ? sizes.md : sizes[size];
    
    return (
      <motion.button
        ref={ref}
        className={cn(baseClasses, variants[variant], appliedSize, className)}
        whileTap={{ transform: 'scale(0.97)' }}
        transition={springQuick}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
