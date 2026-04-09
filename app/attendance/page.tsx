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
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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
      <Loader2 className="w-8 h-8 animate-spin text-[var(--sapphire-500)]" />
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
      <motion.div variants={itemVariants} className="mb-[var(--space-6)] flex flex-col md:flex-row md:items-end justify-between gap-[var(--space-4)]">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)] tracking-[var(--tracking-tight)] flex items-center gap-[var(--space-2)]">
            <CalendarCheck className="w-6 h-6 text-[var(--sapphire-500)]" />
            Attendance
          </h1>
          <p className="text-sm font-[var(--font-body)] text-[var(--text-secondary)] mt-[var(--space-1)]">
            Track daily member check-ins and history.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-[var(--bg-elevated)] border p-1 border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] self-start">
          <button 
            onClick={() => setView('today')}
            className={cn(
              "px-[var(--space-5)] py-[var(--space-2)] text-sm font-semibold rounded-[var(--radius-md)] transition-all",
              view === 'today' ? "bg-[var(--sapphire-500)] text-[var(--saffron-50)] shadow-[var(--shadow-sm)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            Today
          </button>
          <button 
            onClick={() => setView('history')}
            className={cn(
              "px-[var(--space-5)] py-[var(--space-2)] text-sm font-semibold rounded-[var(--radius-md)] transition-all",
              view === 'history' ? "bg-[var(--sapphire-500)] text-[var(--saffron-50)] shadow-[var(--shadow-sm)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            History
          </button>
        </div>
      </motion.div>

      {/* Weekly Summary Strip (per PRD §7.5) */}
      {weeklySummary.daysWithData > 0 && (
        <motion.div variants={itemVariants} className="mb-[var(--space-6)]">
          <Card variant="base" className="p-[var(--space-4)] relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--sapphire-500)]/10 rounded-bl-[100px] pointer-events-none" />
            <div className="flex items-center gap-[var(--space-2)] mb-[var(--space-3)]">
              <TrendingUp className="w-4 h-4 text-[var(--sapphire-500)]" />
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Weekly Summary</h3>
            </div>
            <div className="grid grid-cols-3 gap-[var(--space-4)]">
              <div className="text-center">
                <p className="font-display text-2xl font-semibold text-[var(--sapphire-500)]">{weeklySummary.avgRate}%</p>
                <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">Avg this week</p>
              </div>
              <div className="text-center border-x border-[var(--border-subtle)]">
                <div className="flex items-center justify-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-[var(--emerald-500)]" />
                  <p className="font-display text-2xl font-semibold text-[var(--emerald-500)]">{weeklySummary.bestRate}%</p>
                </div>
                <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">Best · {weeklySummary.bestDayName}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-[var(--ruby-500)]" />
                  <p className="font-display text-2xl font-semibold text-[var(--ruby-500)]">{weeklySummary.worstRate}%</p>
                </div>
                <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">Low · {weeklySummary.worstDayName}</p>
              </div>
            </div>
          </Card>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--space-4)]">
              <Card variant="base" className="p-[var(--space-5)] relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--sapphire-500)]/10 rounded-bl-[100px] pointer-events-none" />
                <div className="flex items-center gap-[var(--space-2)] mb-[var(--space-2)]">
                  <Users className="w-4 h-4 text-[var(--sapphire-500)]" />
                  <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Check-ins</p>
                </div>
                <div className="flex items-baseline gap-[var(--space-2)]">
                  <span className="font-display text-4xl font-semibold text-[var(--text-primary)] tracking-[var(--tracking-tight)]">{presentToday}</span>
                  <span className="text-sm font-medium text-[var(--text-secondary)]">/ {totalOccupied}</span>
                </div>
              </Card>

              <Card variant="base" className="p-[var(--space-5)] relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--emerald-500)]/10 rounded-bl-[100px] pointer-events-none" />
                <div className="flex items-center gap-[var(--space-2)] mb-[var(--space-2)]">
                  <Percent className="w-4 h-4 text-[var(--emerald-500)]" />
                  <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Turnout</p>
                </div>
                <div className="flex items-baseline gap-[var(--space-2)]">
                  <span className="font-display text-4xl font-semibold text-[var(--emerald-500)] tracking-[var(--tracking-tight)]">{attendanceRateToday}%</span>
                </div>
              </Card>
              
              <div className="col-span-2 flex items-center justify-end">
                <Button 
                  size="lg"
                  variant="primary"
                  onClick={() => setConfirmMarkAll(true)}
                  className="px-[var(--space-6)] py-[var(--space-4)] bg-[var(--sapphire-500)] text-[var(--saffron-50)] hover:bg-[var(--sapphire-600)]"
                >
                  <UserCheck className="w-5 h-5 mr-2" />
                  Mark All Present
                </Button>
              </div>
            </div>

            {/* Attendance Grid */}
            <Card variant="base" className="py-[var(--space-6)] px-[var(--space-4)] sm:px-[var(--space-6)]">
              <div className="mb-[var(--space-6)] flex flex-col sm:flex-row sm:items-end justify-between gap-[var(--space-3)] border-b border-[var(--border-subtle)] pb-[var(--space-4)]">
                <div>
                  <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-[var(--space-1)]">Occupied Seats List</h3>
                  <p className="text-sm font-medium text-[var(--text-tertiary)]">Tap a seat tile to toggle check-in.</p>
                </div>
              </div>
              
              {occupiedMembers.length === 0 ? (
                <div className="text-center py-[var(--space-10)] px-[var(--space-4)] bg-[var(--bg-muted)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] flex flex-col items-center">
                  <div className="w-14 h-14 bg-[var(--bg-overlay)] rounded-[var(--radius-2xl)] mb-[var(--space-3)] flex justify-center items-center shadow-[var(--shadow-sm)] border border-[var(--border-subtle)]">
                    <UserCheck className="w-7 h-7 text-[var(--text-tertiary)]" />
                  </div>
                  <span className="text-[var(--text-md)] font-[var(--weight-semibold)] text-[var(--text-primary)]">No seats are currently occupied.</span>
                  <p className="text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--text-secondary)] mt-[var(--space-1)]">Add members to start tracking attendance.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-[var(--space-3)]">
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
                            "relative flex flex-col items-center justify-center aspect-square rounded-[var(--radius-md)] border-[1.5px] transition-all p-[var(--space-2)] gap-[var(--space-1)] cursor-pointer group",
                            checkedIn 
                              ? "bg-[var(--emerald-500)]/10 border-[var(--emerald-500)] text-[var(--emerald-500)] shadow-[var(--shadow-glow-emerald)]" 
                              : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--saffron-500)] hover:shadow-[var(--shadow-glow-saffron)] text-[var(--text-primary)]"
                          )}
                        >
                          <span className="font-display text-2xl font-semibold tracking-[var(--tracking-tight)]">{member.seat}</span>
                          <span className={cn(
                            "text-[11px] font-medium truncate w-full text-center px-1",
                            checkedIn ? "text-[var(--emerald-500)]" : "text-[var(--text-secondary)]"
                          )}>
                            {member.name.split(' ')[0]}
                          </span>
                          
                          <AnimatePresence>
                            {checkedIn && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-2 -right-2 bg-[var(--emerald-500)] text-[var(--saffron-50)] rounded-full p-0.5 shadow-[var(--shadow-sm)] border-2 border-[var(--bg-elevated)]"
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
            </Card>
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
            <Card variant="base" className="p-[var(--space-6)] sm:p-[var(--space-8)]">
              <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-6)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--sapphire-500)]/10 flex items-center justify-center border border-[var(--sapphire-500)]/20 shadow-[var(--shadow-sm)]">
                  <CalendarDays className="w-5 h-5 text-[var(--sapphire-500)]" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">30-Day Contribution Graph</h3>
                  <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5">Heatmap of member turnout</p>
                </div>
              </div>
              
              <div className="grid grid-cols-7 sm:grid-cols-10 gap-2.5">
                {thirtyDayData.map((d, i) => {
                  let colorClass = "bg-[var(--bg-muted)] border-[1.5px] border-[var(--border-subtle)] text-[var(--text-tertiary)]";
                  if (d.rate > 0) colorClass = "bg-[var(--emerald-500)]/10 border-[var(--emerald-500)]/30 text-[var(--text-primary)]";
                  if (d.rate >= 40) colorClass = "bg-[var(--emerald-500)]/30 border-[var(--emerald-500)]/50 text-[var(--text-primary)]";
                  if (d.rate >= 80) colorClass = "bg-[var(--emerald-500)] border-[var(--emerald-500)] text-[var(--saffron-50)] shadow-[var(--shadow-sm)] drop-shadow-sm font-semibold";

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
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--radius-md)] flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-lg",
                          colorClass,
                          isToday && "ring-4 ring-[var(--saffron-500)]/30 ring-offset-2 ring-offset-[var(--bg-elevated)]"
                        )}>
                          <span className="text-xs sm:text-sm font-display font-semibold tracking-[var(--tracking-tight)]">
                            {d.day}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] mt-1.5 drop-shadow-sm">
                          {d.rate}%
                        </span>
                      </motion.div>
                    </Tooltip>
                  )
                })}
              </div>
            </Card>

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
