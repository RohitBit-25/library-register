'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

interface StatCardProps {
  value: number;
  label: string;
  accent: 'blue' | 'gray' | 'amber' | 'red' | 'green';
  icon: React.ReactNode;
  onClick?: () => void;
}

function AnimatedCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  
  useEffect(() => {
    const start = prevValueRef.current;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    prevValueRef.current = value;
  }, [value, duration]);

  return <>{displayValue}</>;
}


const accentBgOverlays: Record<string, string> = {
  blue: 'bg-blue-accent/5 dark:bg-blue-accent/10',
  gray: 'bg-gray-accent/5 dark:bg-gray-accent/10',
  amber: 'bg-amber-accent/5 dark:bg-amber-accent/10',
  red: 'bg-red-accent/5 dark:bg-red-accent/10',
  green: 'bg-green-accent/5 dark:bg-green-accent/10',
};

export default function StatCard({ value, label, accent, icon, onClick }: StatCardProps) {
  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'card-premium text-left w-full rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-5 shadow-sm cursor-pointer group',
        `accent-${accent}`,
      )}
    >
      {/* Decorative corner overlay */}
      <div className={cn(
        'absolute top-0 right-0 w-20 h-20 rounded-bl-[60px] opacity-60 pointer-events-none transition-opacity group-hover:opacity-100',
        accentBgOverlays[accent],
      )} />
      
      {/* Icon container */}
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center mb-3 relative z-10 shadow-sm',
        accentBgOverlays[accent],
      )}>
        {icon}
      </div>

      {/* Number with animated counter */}
      <p className="text-3xl font-extrabold text-text-primary dark:text-text-primary-dark tracking-tight relative z-10 animate-count-up">
        <AnimatedCounter value={value} />
      </p>
      
      {/* Label */}
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary dark:text-text-tertiary-dark mt-1 relative z-10">
        {label}
      </p>
    </motion.button>
  );
}
