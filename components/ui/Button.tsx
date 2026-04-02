import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    
    const baseClasses = "inline-flex items-center justify-center relative overflow-hidden focus-visible:ring-2 focus-visible:ring-saffron-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: `
        bg-[var(--gradient-glow)] text-[var(--text-inverse)] 
        font-[var(--font-body)] font-[var(--weight-semibold)] tracking-[var(--tracking-wide)]
        rounded-[var(--radius-sm)] border-none shadow-[var(--shadow-glow-saffron)]
        hover:scale-[1.03] hover:shadow-[var(--shadow-md)] active:scale-[0.97]
        transition-all duration-200
        before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent
        before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-500
      `,
      secondary: `
        bg-transparent text-[var(--saffron-400)] 
        border-[1.5px] border-[var(--border-strong)] rounded-[var(--radius-sm)]
        font-[var(--font-body)] font-[var(--weight-medium)]
        hover:bg-[rgba(232,133,58,0.08)] hover:border-[var(--border-glow)]
        transition-all duration-200
      `,
      danger: `
        bg-[rgba(232,66,66,0.12)] text-[var(--ruby-400)]
        border-[1.5px] border-[rgba(232,66,66,0.25)] rounded-[var(--radius-sm)]
        hover:bg-[rgba(232,66,66,0.22)] hover:shadow-[var(--shadow-glow-ruby)]
        transition-all duration-200
      `,
      ghost: `
        bg-transparent text-[var(--text-secondary)] border-none rounded-[var(--radius-sm)]
        hover:bg-[rgba(245,200,66,0.06)] hover:text-[var(--text-primary)]
        transition-colors duration-200
      `,
      icon: `
        bg-[var(--bg-elevated)] border border-[var(--border-subtle)] 
        text-[var(--text-secondary)] rounded-full
        hover:bg-[var(--bg-overlay)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)]
        transition-all duration-[180ms] flex items-center justify-center
      `
    };

    const sizes = {
      sm: "px-3 py-1.5 text-[var(--text-sm)] min-h-[32px]",
      md: variant === 'icon' ? "w-10 h-10 min-w-[44px] min-h-[44px]" : "px-6 py-[12px] text-[var(--text-sm)] min-h-[44px]",
      lg: "px-8 py-4 text-[var(--text-base)] min-h-[52px]",
    };

    // The icon variant doesn't use standard padding/size unless overridden
    const appliedSize = variant === 'icon' ? sizes.md : sizes[size];
    
    // Remove the hover effect in the class for primary since framer-motion handles it natively or pseudo-elements might be tricky,
    // actually class-based hover works fine with standard motion.button if we don't override scale.

    return (
      <motion.button
        ref={ref}
        className={cn(baseClasses, variants[variant], appliedSize, className)}
        {...(variant === 'primary' 
            ? { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } } 
            : { whileTap: { scale: 0.95 } })}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
