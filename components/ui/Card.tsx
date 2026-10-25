import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<"div"> {
  variant?: 'base' | 'interactive' | 'glow';
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'base', children, ...props }, ref) => {
    
    // Static cards do not move on hover — only things you can press respond.
    const variants = {
      base: "bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[var(--shadow-xs)]",
      interactive: "bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] transition-ui cursor-pointer",
      glow: "bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[var(--shadow-xs)]"
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-lg)] overflow-hidden",
          variants[variant],
          className
        )}
        {...(variant === 'interactive' ? { whileTap: { scale: 0.99 } } : {})}
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
      className={cn("text-base font-semibold leading-tight text-[var(--text-primary)]", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-[var(--text-secondary)] font-[var(--font-body)]", className)}
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
