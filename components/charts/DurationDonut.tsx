'use client';

import { motion } from 'framer-motion';

interface DurationDonutProps {
  data: Record<string, number>;
}

export default function DurationDonut({ data }: DurationDonutProps) {
  const categories = [
    { key: '1M', label: '1 Month', color: '#3b82f6' }, // blue-500
    { key: '3M', label: '3 Months', color: '#10b981' }, // emerald-500
    { key: '6M', label: '6 Months', color: '#f59e0b' }, // amber-500
    { key: '1Y', label: '1 Year', color: '#6366f1' },   // indigo-500
  ];

  const total = Object.values(data).reduce((acc, val) => acc + val, 0);

  // SVG Geometry
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  return (
    <div className="flex items-center gap-8">
      <div className="relative" style={{ width: size, height: size }}>
        {total === 0 ? (
          <div className="w-full h-full rounded-full border-[24px] border-[var(--border-default)] flex items-center justify-center">
            <span className="text-xs font-semibold text-text-tertiary">Empty</span>
          </div>
        ) : (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            {categories.map((cat, i) => {
              const value = data[cat.key] || 0;
              if (value === 0) return null;
              
              const percentage = value / total;
              const strokeDasharray = `${percentage * circumference} ${circumference}`;
              const strokeDashoffset = -currentOffset;
              
              const result = (
                <motion.circle
                  key={cat.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={cat.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray }}
                  transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                  className="transition-all hover:opacity-80 cursor-pointer"
                />
              );
              
              currentOffset += percentage * circumference;
              return result;
            })}
          </svg>
        )}
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-[var(--text-primary)]">{total}</span>
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Members</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-col gap-3">
        {categories.map(cat => (
          <div key={cat.key} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color }} />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[var(--text-primary)] leading-none">{cat.label}</span>
              <span className="text-xs text-text-secondary mt-1">{data[cat.key] || 0} members</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
