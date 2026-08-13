import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    
    const baseClasses = "inline-flex items-center justify-center relative overflow-hidden focus-visible:ring-2 focus-visible:ring-[var(--saffron-600)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    // -600 fills, not -500: white on saffron-500 measured 2.68:1; saffron-600 gives 5.43:1.
    const variants = {
      primary: `
        sheen
        bg-[var(--saffron-600)] text-[var(--text-inverse)]
        font-[var(--font-body)] font-[var(--weight-semibold)] tracking-[var(--tracking-wide)]
        rounded-[var(--radius-sm)] border border-[var(--saffron-700)] shadow-[var(--shadow-sm)]
        hover:bg-[var(--saffron-700)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5
        transition-ui duration-200
      `,
      secondary: `
        bg-transparent text-[var(--saffron-700)]
        border border-[var(--border-strong)] rounded-[var(--radius-sm)]
        font-[var(--font-body)] font-[var(--weight-medium)]
        hover:bg-[var(--saffron-50)] hover:border-[var(--saffron-600)]
        transition-ui duration-200
      `,
      danger: `
        bg-[var(--ruby-50)] text-[var(--ruby-600)]
        border border-[var(--ruby-200)] rounded-[var(--radius-sm)]
        hover:bg-[var(--ruby-100)] hover:border-[var(--ruby-500)]
        transition-ui duration-200
      `,
      ghost: `
        bg-transparent text-[var(--text-secondary)] border-none rounded-[var(--radius-sm)]
        hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]
        transition-colors duration-200
      `,
      icon: `
        bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]
        text-[var(--text-secondary)] rounded-full
        hover:bg-[var(--bg-surface)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5
        transition-ui duration-200 flex items-center justify-center
      `
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm min-h-[32px]",
      md: variant === 'icon' ? "w-10 h-10 min-w-[44px] min-h-[44px]" : "px-6 py-[12px] text-sm min-h-[44px]",
      lg: "px-8 py-4 text-base min-h-[52px]",
    };

    // The icon variant doesn't use standard padding/size unless overridden
    const appliedSize = variant === 'icon' ? sizes.md : sizes[size];
    
    // Remove the hover effect in the class for primary since framer-motion handles it natively or pseudo-elements might be tricky,
    // actually class-based hover works fine with standard motion.button if we don't override scale.

    return (
      <motion.button
        ref={ref}
        className={cn(baseClasses, variants[variant], appliedSize, className)}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 15, mass: 0.8 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
