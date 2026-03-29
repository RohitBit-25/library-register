'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        'relative overflow-hidden rounded-xl border-2 p-4 text-left transition-shadow duration-200 cursor-pointer',
        'hover:shadow-lg',
        styles.border,
        'bg-surface dark:bg-surface-dark',
      )}
      aria-label={`${value} ${label}`}
    >
      {/* Top accent bar */}
      <motion.div 
        className={cn('absolute top-0 left-0 right-0 h-1', styles.bar)} 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />
      <div className="flex items-start justify-between gap-3 pt-1">
        <div>
          <motion.p 
            className={cn('text-3xl font-bold font-mono', styles.text)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {value}
          </motion.p>
          <p className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark mt-1">
            {label}
          </p>
        </div>
        <motion.div 
          className={cn('rounded-lg p-2', styles.bg)}
          whileHover={{ rotate: 10 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {icon}
        </motion.div>
      </div>
    </motion.button>
  );
}
