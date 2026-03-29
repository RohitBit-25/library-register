'use client';

import { motion } from 'framer-motion';

interface OccupancySparklineProps {
  data: number[]; // 30 day history
}

export default function OccupancySparkline({ data }: OccupancySparklineProps) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data, 1); // prevent division by 0
  const w = 400; // svg width
  const h = 100; // svg height
  const p = 10;  // padding

  // Create path
  const points = data.map((val, i) => {
    const x = p + (i / (data.length - 1)) * (w - 2 * p);
    const y = h - p - (val / maxVal) * (h - 2 * p);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  return (
    <div className="w-full relative h-[120px] bg-gradient-to-tr from-surface to-bg dark:from-surface-dark dark:to-bg-dark rounded-xl border border-card-border dark:border-card-border-dark overflow-hidden p-2 flex flex-col justify-end">
      
      {/* Background Area fill */}
      <svg className="absolute bottom-0 left-0 w-full h-[100px]" preserveAspectRatio="none" viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <linearGradient id="blueGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${pathD} L ${w},${h} L 0,${h} Z`} fill="url(#blueGlow)" />
        
        {/* Animated Line */}
        <motion.path 
          d={pathD}
          fill="none"
          stroke="#3b82f6" // blue-500
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* Last Node Dot */}
        {points.length > 0 && (
          <motion.circle 
            cx={points[points.length - 1].split(',')[0]} 
            cy={points[points.length - 1].split(',')[1]} 
            r="4" 
            fill="#ffffff" 
            stroke="#3b82f6"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5, type: "spring" }}
          />
        )}
      </svg>
      
      <div className="absolute top-3 left-4">
        <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">30-Day Trend</span>
        <div className="text-2xl font-black text-text-primary dark:text-text-primary-dark leading-tight mt-1 truncate">
          {data[data.length - 1]} occupied
        </div>
      </div>
    </div>
  );
}
