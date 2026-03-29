'use client';

import { type SeatStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BadgeProps {
  status: SeatStatus;
  size?: 'sm' | 'md';
}

const config: Record<SeatStatus, { label: string; dot: string; bg: string; text: string }> = {
  active: {
    label: 'Active',
    dot: 'bg-active-border',
    bg: 'bg-active-fill dark:bg-active-fill-dark',
    text: 'text-active-text dark:text-active-text-dark',
  },
  expiring: {
    label: 'Expiring',
    dot: 'bg-expiring-border',
    bg: 'bg-expiring-fill dark:bg-expiring-fill-dark',
    text: 'text-expiring-text dark:text-expiring-text-dark',
  },
  expired: {
    label: 'Expired',
    dot: 'bg-expired-border',
    bg: 'bg-expired-fill dark:bg-expired-fill-dark',
    text: 'text-expired-text dark:text-expired-text-dark',
  },
  due: {
    label: 'Fee Due',
    dot: 'bg-due-border',
    bg: 'bg-due-fill dark:bg-due-fill-dark',
    text: 'text-due-text dark:text-due-text-dark',
  },
  vacant: {
    label: 'Vacant',
    dot: 'bg-vacant-border dark:bg-vacant-border-dark',
    bg: 'bg-vacant-fill dark:bg-vacant-fill-dark',
    text: 'text-vacant-text dark:text-vacant-text-dark',
  },
};

export default function Badge({ status, size = 'md' }: BadgeProps) {
  const c = config[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        c.bg,
        c.text,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
      )}
    >
      <span className={cn('rounded-full', c.dot, size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
      {c.label}
    </span>
  );
}
