'use client';

import { cn } from '@/lib/utils';

interface StatCardProps {
  value: number;
  label: string;
  accent: 'blue' | 'green' | 'amber' | 'red' | 'gray';
  onClick?: () => void;
  icon: React.ReactNode;
}

const accentStyles = {
  blue: {
    border: 'border-blue-accent/30 dark:border-blue-accent/20',
    bg: 'bg-blue-accent/5 dark:bg-blue-accent/10',
    text: 'text-blue-accent',
    bar: 'bg-blue-accent',
  },
  green: {
    border: 'border-active-border/30 dark:border-active-border/20',
    bg: 'bg-active-fill dark:bg-active-fill-dark',
    text: 'text-active-text dark:text-active-text-dark',
    bar: 'bg-active-border',
  },
  amber: {
    border: 'border-due-border/30 dark:border-due-border/20',
    bg: 'bg-due-fill dark:bg-due-fill-dark',
    text: 'text-due-text dark:text-due-text-dark',
    bar: 'bg-due-border',
  },
  red: {
    border: 'border-expired-border/30 dark:border-expired-border/20',
    bg: 'bg-expired-fill dark:bg-expired-fill-dark',
    text: 'text-expired-text dark:text-expired-text-dark',
    bar: 'bg-expired-border',
  },
  gray: {
    border: 'border-card-border dark:border-card-border-dark',
    bg: 'bg-vacant-fill dark:bg-vacant-fill-dark',
    text: 'text-vacant-text dark:text-vacant-text-dark',
    bar: 'bg-vacant-border',
  },
};

export default function StatCard({ value, label, accent, onClick, icon }: StatCardProps) {
  const styles = accentStyles[accent];
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all duration-200 cursor-pointer',
        'hover:shadow-md hover:-translate-y-0.5',
        'active:scale-[0.98]',
        styles.border,
        'bg-surface dark:bg-surface-dark',
      )}
      aria-label={`${value} ${label}`}
    >
      {/* Top accent bar */}
      <div className={cn('absolute top-0 left-0 right-0 h-1', styles.bar)} />

      <div className="flex items-start justify-between gap-3 pt-1">
        <div>
          <p className={cn('text-3xl font-bold font-mono', styles.text)}>
            {value}
          </p>
          <p className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark mt-1">
            {label}
          </p>
        </div>
        <div className={cn('rounded-lg p-2', styles.bg)}>
          {icon}
        </div>
      </div>
    </button>
  );
}
