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
      const timer = setTimeout(() => setDisplayValue(end), 0);
      return () => clearTimeout(timer);
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


const accentTokens: Record<string, { bg: string, text: string }> = {
  blue: { bg: 'bg-[var(--sapphire-500)]/10', text: 'text-[var(--sapphire-500)]' },
  gray: { bg: 'bg-[var(--bg-muted)]', text: 'text-[var(--text-secondary)]' },
  amber: { bg: 'bg-[var(--marigold-500)]/10', text: 'text-[var(--marigold-500)]' },
  red: { bg: 'bg-[var(--ruby-500)]/10', text: 'text-[var(--ruby-500)]' },
  green: { bg: 'bg-[var(--emerald-500)]/10', text: 'text-[var(--emerald-500)]' },
};

export default function StatCard({ value, label, accent, icon, onClick }: StatCardProps) {
  const tokens = accentTokens[accent];
  
  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'text-left w-full rounded-[var(--radius-lg)] border-[1.5px] border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-[var(--space-5)] shadow-[var(--shadow-sm)] cursor-pointer group transition-all duration-300',
        'hover:border-[var(--saffron-500)] hover:shadow-[var(--shadow-glow-saffron)]'
      )}
    >
      {/* Decorative corner overlay */}
      <div className={cn(
        'absolute top-0 right-0 w-20 h-20 rounded-bl-[60px] opacity-0 pointer-events-none transition-opacity group-hover:opacity-100',
        tokens.bg
      )} />
      
      {/* Icon container */}
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center mb-3 relative z-10 shadow-sm transition-colors',
        tokens.bg,
        tokens.text
      )}>
        {icon}
      </div>

      {/* Number with animated counter */}
      <p className="font-display text-3xl font-semibold text-[var(--text-primary)] tracking-[var(--tracking-tight)] relative z-10">
        <AnimatedCounter value={value} />
      </p>
      
      {/* Label */}
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] mt-1 relative z-10">
        {label}
      </p>
    </motion.button>
  );
}
