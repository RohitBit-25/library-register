import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<"div"> {
  variant?: 'base' | 'interactive' | 'glow';
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'base', children, ...props }, ref) => {
    
    const variants = {
      base: "bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]",
      interactive: "bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--saffron-500)] hover:shadow-[var(--shadow-glow-saffron)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] transition-all duration-300 cursor-pointer",
      glow: "bg-[var(--bg-elevated)] border border-[var(--border-glow)] shadow-[var(--shadow-glow-saffron)] relative before:absolute before:inset-0 before:rounded-[var(--radius-lg)] before:bg-gradient-to-br before:from-[var(--saffron-500)]/10 before:to-transparent before:pointer-events-none"
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-lg)] overflow-hidden",
          variants[variant],
          className
        )}
        {...(variant === 'interactive' ? { whileHover: { y: -2 }, whileTap: { scale: 0.98 } } : {})}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-[var(--space-6)] pb-[var(--space-4)]", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display text-lg font-semibold leading-none tracking-tight text-[var(--text-primary)]", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-[var(--text-secondary)] font-[var(--font-body)] tracking-[var(--tracking-normal)]", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-[var(--space-6)] pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center px-[var(--space-6)] py-[var(--space-4)] border-t border-[var(--border-subtle)] bg-[var(--bg-muted)]", className)} {...props} />;
}
