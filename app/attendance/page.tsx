'use client';

import { useMembers } from '@/hooks/useMembers';
import { useAttendance } from '@/hooks/useAttendance';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, CheckCircle2, UserCheck, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useState } from 'react';

const containerVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, y: 0, 
    transition: { staggerChildren: 0.05, delayChildren: 0.1 } 
  }
};

const itemVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function AttendancePage() {
  const { members } = useMembers();
  const { addToast } = useToast();
  const { 
    todayStr, totalOccupied, presentToday, attendanceRateToday,
    markPresent, markAbsent, markAllPresent, isPresent, getLast30DaysData
  } = useAttendance();

  const [view, setView] = useState<'today' | 'history'>('today');

  const occupiedMembers = members.filter(m => !m.vacant);
  const thirtyDayData = getLast30DaysData();

  const handleToggle = (seat: number, currentlyPresent: boolean) => {
    if (currentlyPresent) {
      markAbsent(todayStr, seat);
    } else {
      markPresent(todayStr, seat);
    }
  };

  const handleMarkAll = () => {
    markAllPresent(todayStr);
    addToast('success', 'All non-vacant seats marked as present');
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="max-w-5xl pb-24"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-primary-dark tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-accent" />
            Attendance
          </h1>
          <p className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark mt-1">
            Track daily member check-ins and history.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-surface dark:bg-surface-dark border p-1 border-card-border dark:border-card-border-dark rounded-lg self-start">
          <button 
            onClick={() => setView('today')}
            className={cn(
              "px-4 py-1.5 text-sm font-semibold rounded-md transition-colors",
              view === 'today' ? "bg-bg dark:bg-bg-dark text-text-primary dark:text-text-primary-dark shadow-sm" : "text-text-tertiary dark:text-text-tertiary-dark hover:text-text-secondary dark:hover:text-text-secondary-dark"
            )}
          >
            Today
          </button>
          <button 
            onClick={() => setView('history')}
            className={cn(
              "px-4 py-1.5 text-sm font-semibold rounded-md transition-colors",
              view === 'history' ? "bg-bg dark:bg-bg-dark text-text-primary dark:text-text-primary-dark shadow-sm" : "text-text-tertiary dark:text-text-tertiary-dark hover:text-text-secondary dark:hover:text-text-secondary-dark"
            )}
          >
            History
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {view === 'today' ? (
          <motion.div 
            key="todayView"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark">
                <p className="text-xs font-semibold text-text-tertiary dark:text-text-tertiary-dark uppercase tracking-wider mb-1">Present Today</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">{presentToday}</span>
                  <span className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">/ {totalOccupied}</span>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark">
                <p className="text-xs font-semibold text-text-tertiary dark:text-text-tertiary-dark uppercase tracking-wider mb-1">Attendance Rate</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-accent">{attendanceRateToday}%</span>
                </div>
              </div>
              
              <div className="col-span-2 flex items-center justify-end">
                <button 
                  onClick={handleMarkAll}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-accent text-white rounded-xl font-bold hover:bg-blue-accent/90 transition-colors shadow-sm"
                >
                  <UserCheck className="w-5 h-5" />
                  Mark All Present
                </button>
              </div>
            </div>

            {/* Attendance Grid */}
            <div className="bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark py-6 px-4 sm:px-6 rounded-2xl shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-text-primary dark:text-text-primary-dark mb-1">Occupied Seats</h3>
                <p className="text-xs text-text-tertiary dark:text-text-tertiary-dark">Tap a seat to toggle check-in status.</p>
              </div>
              
              {occupiedMembers.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-sm font-medium text-text-secondary">No seats are currently occupied.</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
                  {occupiedMembers.map(member => {
                    const checkedIn = isPresent(todayStr, member.seat);
                    return (
                      <button
                        key={member.seat}
                        onClick={() => handleToggle(member.seat, checkedIn)}
                        className={cn(
                          "relative flex flex-col items-center justify-center aspect-square rounded-xl border-2 transition-all p-2 gap-1 group",
                          checkedIn 
                            ? "bg-blue-accent/10 border-blue-accent text-blue-accent dark:bg-blue-accent/20" 
                            : "bg-bg dark:bg-bg-dark border-card-border dark:border-card-border-dark hover:border-text-tertiary"
                        )}
                      >
                        <span className="text-lg font-black">{member.seat}</span>
                        <span className={cn(
                          "text-[10px] font-bold truncate w-full text-center px-1",
                          checkedIn ? "text-blue-accent/80 dark:text-blue-accent" : "text-text-secondary dark:text-text-secondary-dark"
                        )}>
                          {member.name.split(' ')[0]}
                        </span>
                        
                        {checkedIn && (
                          <div className="absolute -top-2 -right-2 bg-blue-accent text-white rounded-full p-0.5 shadow-sm">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>

        ) : (
          <motion.div 
            key="historyView"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <CalendarDays className="w-5 h-5 text-text-tertiary dark:text-text-tertiary-dark" />
                <h3 className="text-sm font-bold text-text-primary dark:text-text-primary-dark">30-Day Heatmap</h3>
              </div>
              
              <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
                {thirtyDayData.map((d, i) => {
                  let colorClass = "bg-card-border dark:bg-card-border-dark"; // 0
                  if (d.rate > 0) colorClass = "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300";
                  if (d.rate >= 40) colorClass = "bg-green-300 dark:bg-green-700/60 text-green-900";
                  if (d.rate >= 80) colorClass = "bg-green-500 text-white shadow-sm ring-1 ring-green-600";

                  const isToday = i === thirtyDayData.length - 1;

                  return (
                    <div 
                      key={d.date}
                      title={`${d.date}: ${d.rate}% (${d.count} present)`}
                      className="flex flex-col items-center justify-center p-2"
                    >
                      <div className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all",
                        colorClass,
                        isToday && "ring-2 ring-blue-accent ring-offset-2 dark:ring-offset-bg-dark"
                      )}>
                        <span className={cn("text-[10px] sm:text-xs font-black", d.rate === 0 && "text-text-tertiary")}>
                          {d.day}
                        </span>
                      </div>
                      <span className="text-[9px] font-medium text-text-tertiary mt-1">
                        {d.rate}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
