import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-800',
        variant === 'text' && 'h-3 w-3/4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
    />
  );
}

export function SeatSkeleton() {
  return (
    <div className="aspect-square rounded-2xl border border-gray-100 dark:border-gray-800 p-2 flex flex-col justify-between">
      <Skeleton variant="rectangular" className="h-4 w-1/2" />
      <Skeleton variant="text" className="h-3 w-full" />
    </div>
  );
}
