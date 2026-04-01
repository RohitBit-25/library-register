'use client';

import { useMembers } from '@/hooks/useMembers';
import { useAttendance } from '@/hooks/useAttendance';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, CheckCircle2, UserCheck, CalendarDays, Loader2, Users, Percent, TrendingUp, Trophy, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useState, useSyncExternalStore } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { AttendanceLogTable } from '@/components/attendance/AttendanceLogTable';

const containerVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, y: 0, 
    transition: { staggerChildren: 0.05, delayChildren: 0.05 } 
  }
};

const itemVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export default function AttendancePage() {
  const { members } = useMembers();
  const { addToast } = useToast();
  const { 
    todayStr, totalOccupied, presentToday, attendanceRateToday,
    markPresent, markAbsent, markAllPresent, isPresent, getLast30DaysData,
    weeklySummary,
  } = useAttendance();

  const [view, setView] = useState<'today' | 'history'>('today');
  const [confirmMarkAll, setConfirmMarkAll] = useState(false);
  const isHydrated = useIsMounted();

  const occupiedMembers = members.filter(m => !m.vacant);
  const thirtyDayData = getLast30DaysData();

  const handleToggle = (seat: number, currentlyPresent: boolean) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20]);
    }
    if (currentlyPresent) {
      markAbsent(todayStr, seat);
    } else {
      markPresent(todayStr, seat);
    }
  };

  const executeMarkAll = () => {
    markAllPresent(todayStr);
    addToast('success', 'All occupied seats marked as present');
  };

  if (!isHydrated) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-accent" />
    </div>
  );

  return (
    <motion.div 
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="max-w-5xl pb-24"
    >
      <ConfirmDialog 
        isOpen={confirmMarkAll}
        onClose={() => setConfirmMarkAll(false)}
        onConfirm={executeMarkAll}
        title="Mark All Present"
        description={`You are about to check-in all ${occupiedMembers.length} occupied seats for today. Are you sure you want to proceed?`}
        confirmText="Confirm Mark All"
        variant="primary"
      />

      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary dark:text-text-primary-dark tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-accent" />
            Attendance
          </h1>
          <p className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark mt-1">
            Track daily member check-ins and history.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-surface dark:bg-surface-dark border p-1 border-card-border dark:border-card-border-dark rounded-xl shadow-sm self-start">
          <button 
            onClick={() => setView('today')}
            className={cn(
              "px-5 py-2 text-sm font-bold rounded-lg transition-all",
              view === 'today' ? "bg-blue-accent text-white shadow-sm" : "text-text-tertiary dark:text-text-tertiary-dark hover:text-text-secondary dark:hover:text-text-secondary-dark"
            )}
          >
            Today
          </button>
          <button 
            onClick={() => setView('history')}
            className={cn(
              "px-5 py-2 text-sm font-bold rounded-lg transition-all",
              view === 'history' ? "bg-blue-accent text-white shadow-sm" : "text-text-tertiary dark:text-text-tertiary-dark hover:text-text-secondary dark:hover:text-text-secondary-dark"
            )}
          >
            History
          </button>
        </div>
      </motion.div>

      {/* Weekly Summary Strip (per PRD §7.5) */}
      {weeklySummary.daysWithData > 0 && (
        <motion.div
          variants={itemVariants}
          className="mb-6 card-premium accent-blue rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-4 shadow-sm overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-accent/5 rounded-bl-[100px] pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-accent" />
            <h3 className="text-xs font-black text-text-primary dark:text-text-primary-dark uppercase tracking-wider">Weekly Summary</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-black text-blue-accent">{weeklySummary.avgRate}%</p>
              <p className="text-[10px] font-bold text-text-tertiary dark:text-text-tertiary-dark uppercase tracking-wider mt-0.5">Avg this week</p>
            </div>
            <div className="text-center border-x border-card-border dark:border-card-border-dark">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-green-500" />
                <p className="text-2xl font-black text-active-text dark:text-active-text-dark">{weeklySummary.bestRate}%</p>
              </div>
              <p className="text-[10px] font-bold text-text-tertiary dark:text-text-tertiary-dark uppercase tracking-wider mt-0.5">Best · {weeklySummary.bestDayName}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-expired-text" />
                <p className="text-2xl font-black text-expired-text dark:text-expired-text-dark">{weeklySummary.worstRate}%</p>
              </div>
              <p className="text-[10px] font-bold text-text-tertiary dark:text-text-tertiary-dark uppercase tracking-wider mt-0.5">Low · {weeklySummary.worstDayName}</p>
            </div>
          </div>
        </motion.div>
      )}

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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-premium accent-blue p-5 rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-accent/5 rounded-bl-[100px] pointer-events-none" />
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-accent" />
                  <p className="text-xs font-bold text-text-tertiary dark:text-text-tertiary-dark uppercase tracking-wider">Check-ins</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-text-primary dark:text-text-primary-dark tracking-tight">{presentToday}</span>
                  <span className="text-sm font-bold text-text-secondary dark:text-text-secondary-dark">/ {totalOccupied}</span>
                </div>
              </div>

              <div className="card-premium accent-green p-5 rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-bl-[100px] pointer-events-none" />
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4 text-green-500" />
                  <p className="text-xs font-bold text-text-tertiary dark:text-text-tertiary-dark uppercase tracking-wider">Turnout</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-blue-accent tracking-tight">{attendanceRateToday}%</span>
                </div>
              </div>
              
              <div className="col-span-2 flex items-center justify-end">
                <button 
                  onClick={() => setConfirmMarkAll(true)}
                  className="flex items-center gap-2.5 px-6 py-4 gradient-blue text-white rounded-2xl font-black hover:opacity-90 transition-all shadow-lg shadow-blue-accent/20 hover:shadow-xl hover:shadow-blue-accent/30 active:scale-95"
                >
                  <UserCheck className="w-5 h-5" />
                  Mark All Present
                </button>
              </div>
            </div>

            {/* Attendance Grid */}
            <div className="bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark py-6 px-4 sm:px-6 rounded-3xl shadow-sm">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-card-border dark:border-card-border-dark pb-4">
                <div>
                  <h3 className="text-base font-black text-text-primary dark:text-text-primary-dark mb-1">Occupied Seats List</h3>
                  <p className="text-sm font-medium text-text-tertiary dark:text-text-tertiary-dark">Tap a seat tile to toggle check-in.</p>
                </div>
              </div>
              
              {occupiedMembers.length === 0 ? (
                <div className="text-center py-16 bg-bg dark:bg-bg-dark rounded-2xl border flex flex-col items-center">
                  <div className="w-16 h-16 bg-surface dark:bg-surface-dark rounded-full mb-4 flex justify-center items-center shadow-sm border border-card-border dark:border-card-border-dark">
                    <UserCheck className="w-6 h-6 text-text-tertiary" />
                  </div>
                  <span className="text-base font-bold text-text-primary dark:text-text-primary-dark">No seats are currently occupied.</span>
                  <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">Add members to start tracking attendance.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
                  <AnimatePresence>
                    {occupiedMembers.map((member, i) => {
                      const checkedIn = isPresent(todayStr, member.seat);
                      return (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.015 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.9 }}
                          key={member.seat}
                          onClick={() => handleToggle(member.seat, checkedIn)}
                          className={cn(
                            "relative flex flex-col items-center justify-center aspect-square rounded-2xl border-2 transition-all p-2 gap-1.5 shadow-sm group cursor-pointer",
                            checkedIn 
                              ? "bg-blue-accent/10 border-blue-accent/50 text-blue-accent dark:bg-blue-accent/20 shadow-md shadow-blue-accent/10" 
                              : "bg-bg dark:bg-bg-dark border-card-border dark:border-card-border-dark hover:border-text-tertiary"
                          )}
                        >
                          <span className="text-2xl font-black tracking-tighter">{member.seat}</span>
                          <span className={cn(
                            "text-[11px] font-bold truncate w-full text-center px-1",
                            checkedIn ? "text-blue-accent/90" : "text-text-secondary dark:text-text-secondary-dark"
                          )}>
                            {member.name.split(' ')[0]}
                          </span>
                          
                          <AnimatePresence>
                            {checkedIn && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-2 -right-2 bg-blue-accent text-white rounded-full p-0.5 shadow-md border-2 border-surface dark:border-surface-dark"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      )
                    })}
                  </AnimatePresence>
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
            {/* Heatmap Section */}
            <div className="bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark p-6 sm:p-8 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center shadow-sm shadow-blue-accent/20">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-primary dark:text-text-primary-dark">30-Day Contribution Graph</h3>
                  <p className="text-xs font-semibold text-text-tertiary mt-0.5">Heatmap of member turnout</p>
                </div>
              </div>
              
              <div className="grid grid-cols-7 sm:grid-cols-10 gap-2.5">
                {thirtyDayData.map((d, i) => {
                  let colorClass = "bg-bg dark:bg-bg-dark border border-card-border dark:border-card-border-dark";
                  if (d.rate > 0) colorClass = "bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300";
                  if (d.rate >= 40) colorClass = "bg-green-300 dark:bg-green-700 border-green-400 dark:border-green-600 text-green-900 dark:text-green-100";
                  if (d.rate >= 80) colorClass = "bg-green-500 text-white shadow-sm font-bold drop-shadow-sm";

                  const isToday = i === thirtyDayData.length - 1;

                  return (
                    <Tooltip key={d.date} content={<span>{d.date}: {d.rate}% Rate &bull; {d.count} present</span>}>
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className="flex flex-col items-center justify-center cursor-crosshair"
                      >
                        <div className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-lg",
                          colorClass,
                          isToday && "ring-4 ring-blue-accent/30 ring-offset-2 dark:ring-offset-surface-dark"
                        )}>
                          <span className={cn("text-xs sm:text-sm font-black", d.rate === 0 && "text-text-tertiary")}>
                            {d.day}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-text-tertiary mt-1.5 drop-shadow-sm">
                          {d.rate}%
                        </span>
                      </motion.div>
                    </Tooltip>
                  )
                })}
              </div>
            </div>

            {/* Attendance Logs DataTable */}
            <div className="mt-8">
              <AttendanceLogTable data={thirtyDayData} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
