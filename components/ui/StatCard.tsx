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
    prevValueRef.current = value;

    // Counting up is decoration. Someone who asked for reduced motion wants
    // the number, not the performance.
    const reduced = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let frame = 0;

    if (start === end || reduced) {
      // Deferred via rAF rather than set synchronously: a setState in the
      // effect body triggers a cascading render (React Compiler flags it).
      frame = requestAnimationFrame(() => setDisplayValue(end));
      return () => cancelAnimationFrame(frame);
    }

    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(Math.round(start + (end - start) * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    // Without this the loop kept running after unmount, and a second value
    // change started a competing loop that fought the first.
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{displayValue}</>;
}


// Solid -50 tints rather than /10 alpha: the alpha form measured ~2.4:1 against
// its own text. -50 bg + -600 text clears 4.5:1.
const accentTokens: Record<string, { bg: string, text: string }> = {
  blue: { bg: 'bg-[var(--sapphire-50)]', text: 'text-[var(--sapphire-600)]' },
  gray: { bg: 'bg-[var(--bg-muted)]', text: 'text-[var(--text-secondary)]' },
  amber: { bg: 'bg-[var(--marigold-50)]', text: 'text-[var(--marigold-700)]' },
  red: { bg: 'bg-[var(--ruby-50)]', text: 'text-[var(--ruby-600)]' },
  green: { bg: 'bg-[var(--emerald-50)]', text: 'text-[var(--emerald-600)]' },
};

export default function StatCard({ value, label, accent, icon, onClick }: StatCardProps) {
  const tokens = accentTokens[accent];
  
  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ transform: 'scale(0.98)' }}
      onClick={onClick}
      className={cn(
        // `relative` + `overflow-hidden`: the corner overlay below is absolute
        // and had no positioned ancestor, so it escaped the card entirely.
        'relative overflow-hidden text-left w-full rounded-[var(--radius-lg)] border-[1.5px] border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-[var(--space-5)] shadow-[var(--shadow-sm)] cursor-pointer group transition-ui duration-300',
        // --shadow-glow-saffron is `none` in this palette, so the old hover
        // shadow did nothing.
        'hover:border-[var(--saffron-500)] hover:shadow-[var(--shadow-lg)]'
      )}
    >
      {/* Hairline top highlight — reads as a lit edge on a light surface. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"
      />

      {/* Decorative corner wash, revealed on hover */}
      <div className={cn(
        'absolute top-0 right-0 w-20 h-20 rounded-bl-[60px] opacity-0 pointer-events-none transition-opacity duration-300 group-hover:opacity-100',
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
      {/* `tabular` pins digit width so the number doesn't jitter as it counts */}
      <p className="tabular font-display text-3xl font-semibold text-[var(--text-primary)] tracking-[var(--tracking-tight)] relative z-10">
        <AnimatedCounter value={value} />
      </p>
      
      {/* Label */}
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] mt-1 relative z-10">
        {label}
      </p>
    </motion.button>
  );
}
