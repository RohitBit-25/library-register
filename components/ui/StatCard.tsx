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
  
  // A register figure: label, number, and a small tinted icon beside the
  // label. No hover lift or corner wash — it is a button, so it changes
  // border on hover like every other button.
  return (
    <motion.button
      whileTap={{ transform: 'scale(0.99)' }}
      onClick={onClick}
      className="group w-full cursor-pointer rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-left transition-ui hover:border-[var(--border-strong)] sm:p-5 shadow-[var(--shadow-xs)]"
    >
      <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <span className={cn('flex size-6 items-center justify-center rounded-[var(--radius-xs)] [&_svg]:h-3.5 [&_svg]:w-3.5', tokens.bg, tokens.text)} aria-hidden="true">
          {icon}
        </span>
        {label}
      </p>
      {/* `tabular` pins digit width so the number doesn't jitter as it counts */}
      <p className="mt-3 font-display text-2xl font-semibold leading-none text-[var(--text-primary)] tabular sm:text-3xl">
        <AnimatedCounter value={value} />
      </p>
    </motion.button>
  );
}
