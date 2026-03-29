'use client';

import { useMembers } from '@/hooks/useMembers';
import { useStats } from '@/hooks/useStats';
import { motion, Variants } from 'framer-motion';
import { BarChart3, TrendingUp, RefreshCw, CalendarDays, Clock, Users } from 'lucide-react';
import DurationDonut from '@/components/charts/DurationDonut';
import OccupancySparkline from '@/components/charts/OccupancySparkline';
import { daysUntilExpiry } from '@/lib/utils';
import { useMemo } from 'react';

const containerVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, y: 0, 
    transition: { staggerChildren: 0.1 } 
  }
};

const itemVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function AnalyticsPage() {
  const { members } = useMembers();
  const stats = useStats(members);

  // Generate 30 days of mock occupancy for sparkline
  // (In reality, this would be computed from a DB of historical data)
  const mockOccupancy = useMemo(() => {
    const data = [];
    let current = stats.occupied;
    for (let i = 0; i < 30; i++) {
      data.unshift(current);
      // use deterministic pseudo-random to prevent render churn
      const pseudoRand = Math.abs(Math.sin(i * 12.345));
      current = Math.max(0, current + Math.floor(pseudoRand * 5) - 2); 
    }
    return data;
  }, [stats.occupied]);

  // Compute Upcoming Expirations
  const getUpcomingExpiries = () => {
    const next30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { date: ds, day: d.getDate(), month: d.toLocaleString('default', { month: 'short' }), count: 0 };
    });

    members.forEach(m => {
      if (m.vacant || !m.expiry) return;
      const days = daysUntilExpiry(m.expiry);
      if (days >= 0 && days < 30) {
        next30Days[days].count++;
      }
    });

    return next30Days;
  };

  const upcomingExpiries = getUpcomingExpiries();

  return (
    <motion.div 
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="max-w-5xl pb-24"
    >
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-primary-dark tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-accent" />
          Analytics
        </h1>
        <p className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark mt-1">
          Monthly insights and library trends.
        </p>
      </motion.div>

      {/* Top Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-5 rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark flex flex-col gap-2">
          <Users className="w-5 h-5 text-blue-accent" />
          <p className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mt-1">{stats.occupied}</p>
          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Total Occupied</p>
        </div>
        <div className="p-5 rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark flex flex-col gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          <p className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mt-1">{stats.due}</p>
          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Fee Pending</p>
        </div>
        <div className="p-5 rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark flex flex-col gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <p className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mt-1">67%</p>
          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Turnover Rate</p>
        </div>
        <div className="p-5 rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark flex flex-col gap-2">
          <RefreshCw className="w-5 h-5 text-indigo-500" />
          <p className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mt-1">92%</p>
          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Renewal Rate</p>
        </div>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-6 rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark shadow-sm">
          <h3 className="text-sm font-bold text-text-primary dark:text-text-primary-dark mb-6">Occupancy Trend</h3>
          <OccupancySparkline data={mockOccupancy} />
        </div>

        <div className="p-6 rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark shadow-sm">
          <h3 className="text-sm font-bold text-text-primary dark:text-text-primary-dark mb-6">Membership Duration Split</h3>
          <DurationDonut data={stats.byDuration} />
        </div>
      </motion.div>

      {/* Expiry Calendar Strip */}
      <motion.div variants={itemVariants} className="p-6 rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <CalendarDays className="w-5 h-5 text-text-tertiary dark:text-text-tertiary-dark" />
          <h3 className="text-sm font-bold text-text-primary dark:text-text-primary-dark">Upcoming Expirations (Next 30 Days)</h3>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar">
          {upcomingExpiries.map((d) => (
            <div 
              key={d.date} 
              className="snap-start shrink-0 flex flex-col items-center justify-center p-3 w-16 h-[90px] rounded-xl border border-card-border dark:border-card-border-dark bg-bg dark:bg-bg-dark relative"
            >
              <span className="text-[10px] font-bold text-text-tertiary uppercase">{d.month}</span>
              <span className="text-xl font-black text-text-primary dark:text-text-primary-dark leading-tight mt-0.5">{d.day}</span>
              
              {/* Highlight big expirations */}
              {d.count > 0 && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-sm ring-2 ring-surface border border-red-600">
                  {d.count}
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}
