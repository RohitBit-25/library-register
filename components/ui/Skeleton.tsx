import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--bg-muted)]',
        variant === 'text' && 'h-3 w-3/4 rounded-[var(--radius-sm)]',
        variant === 'circular' && 'rounded-[var(--radius-full)]',
        variant === 'rectangular' && 'rounded-[var(--radius-md)]',
        className
      )}
    />
  );
}

export function SeatSkeleton() {
  return (
    <div className="aspect-square rounded-[var(--radius-xl)] bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-default)] p-[var(--space-2)] flex flex-col justify-between shadow-[var(--shadow-sm)]">
      <Skeleton variant="rectangular" className="h-[20px] w-1/2" />
      <Skeleton variant="text" className="h-[12px] w-[80%]" />
    </div>
  );
}
