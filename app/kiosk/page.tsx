'use client';

import { useState, useEffect } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { useAttendance } from '@/hooks/useAttendance';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, LogOut, ArrowLeft, ArrowRight, UserCheck, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/useToast';

export default function KioskPage() {
  const { members } = useMembers();
  const { isPresent, markPresent, markAbsent, todayStr } = useAttendance();
  const { addToast } = useToast();
  
  const [seatInput, setSeatInput] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeMember, setActiveMember] = useState<typeof members[0] | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isHydrated) return null;

  const handleNumpad = (num: string) => {
    if (seatInput.length < 3) setSeatInput(prev => prev + num);
  };

  const handleDelete = () => {
    setSeatInput(prev => prev.slice(0, -1));
  };

  const handleEnter = () => {
    if (!seatInput) return;
    const seatId = parseInt(seatInput, 10);
    const member = members.find(m => m.seat === seatId && !m.vacant);
    
    if (member) {
      setActiveMember(member);
      setSeatInput('');
    } else {
      addToast('error', 'No active member found at this seat.');
      setSeatInput('');
    }
  };

  const handleCheckAction = (action: 'in' | 'out') => {
    if (!activeMember) return;
    if (action === 'in') {
      markPresent(todayStr, activeMember.seat);
      addToast('success', `${activeMember.name} checked in successfully!`);
    } else {
      markAbsent(todayStr, activeMember.seat);
      addToast('success', `${activeMember.name} checked out.`);
    }
    setActiveMember(null);
  };

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center p-4 selection:bg-blue-accent/30">
      
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-accent/5 blur-3xl mix-blend-multiply dark:mix-blend-overlay"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-accent/5 blur-3xl mix-blend-multiply dark:mix-blend-overlay"></div>
      </div>

      <div className="absolute top-6 left-6 z-50">
        <Link href="/" className="flex items-center gap-2 text-text-tertiary hover:text-text-primary dark:hover:text-text-primary-dark transition-colors bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md px-4 py-2 rounded-full border border-card-border dark:border-card-border-dark font-medium cursor-pointer shadow-sm hover:shadow-md">
          <ArrowLeft className="w-4 h-4" />
          Exit Kiosk
        </Link>
      </div>

      <AnimatePresence mode="wait">
        {!activeMember ? (
          <motion.div
            key="numpad"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(4px)' }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-sm"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-accent to-purple-600 outline outline-4 outline-surface dark:outline-surface-dark shadow-xl mb-6">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-text-primary dark:text-text-primary-dark">
                Self Check-In
              </h1>
              <p className="text-text-secondary dark:text-text-secondary-dark mt-2 font-medium">
                Enter your seat number to begin
              </p>
            </div>

            <div className="card-premium p-6 sm:p-8 rounded-[2rem] bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-xl border border-card-border dark:border-card-border-dark shadow-2xl">
              <div className="mb-8">
                <div className="h-20 w-full bg-bg dark:bg-bg-dark border-2 border-card-border dark:border-card-border-dark rounded-2xl flex flex-col items-center justify-center overflow-hidden shadow-inner">
                  <span className={cn(
                    "text-5xl font-mono font-black tracking-widest leading-none",
                    seatInput ? "text-text-primary dark:text-text-primary-dark" : "text-text-tertiary/40"
                  )}>
                    {seatInput || "---"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => handleNumpad(num.toString())}
                    className="aspect-square rounded-2xl bg-bg dark:bg-bg-dark border border-card-border/50 dark:border-card-border-dark/50 text-2xl font-black text-text-primary dark:text-text-primary-dark shadow-sm hover:shadow-md hover:bg-surface dark:hover:bg-surface-dark hover:-translate-y-1 transition-all active:scale-95 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleDelete}
                  className="aspect-square rounded-2xl bg-expired-fill/50 dark:bg-expired-fill-dark/50 border border-expired-border text-expired-text hover:bg-expired-fill dark:hover:bg-expired-fill-dark transition-all flex items-center justify-center font-bold uppercase text-[11px] tracking-wider hover:-translate-y-1 active:scale-95 shadow-sm cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleNumpad('0')}
                  className="aspect-square rounded-2xl bg-bg dark:bg-bg-dark border border-card-border/50 dark:border-card-border-dark/50 text-2xl font-black text-text-primary dark:text-text-primary-dark shadow-sm hover:shadow-md hover:bg-surface dark:hover:bg-surface-dark hover:-translate-y-1 transition-all active:scale-95 cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={handleEnter}
                  disabled={!seatInput}
                  className="aspect-square rounded-2xl gradient-blue text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-blue-accent/20 hover:-translate-y-1 transition-all flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <ArrowRight className="w-8 h-8" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="action"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(4px)' }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-sm"
          >
            <div className="glass p-8 rounded-[2rem] border border-card-border dark:border-card-border-dark shadow-2xl relative overflow-hidden text-center">
              
              <button 
                onClick={() => setActiveMember(null)}
                className="absolute top-4 left-4 p-2 bg-bg dark:bg-bg-dark rounded-full text-text-tertiary hover:text-text-primary dark:hover:text-text-primary-dark transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-blue-accent rounded-[2rem] rotate-3 mb-6 shadow-xl flex items-center justify-center border-4 border-surface dark:border-surface-dark">
                <span className="text-4xl font-black text-white -rotate-3 font-mono">
                  {String(activeMember.seat).padStart(2, '0')}
                </span>
              </div>
              
              <h2 className="text-3xl font-black tracking-tight text-text-primary dark:text-text-primary-dark mb-1">
                {activeMember.name}
              </h2>
              <p className="text-text-tertiary font-medium mb-8">
                Current Status: {isPresent(todayStr, activeMember.seat) ? (
                  <span className="text-green-600 dark:text-green-400 font-bold inline-flex items-center gap-1">Checked In <CheckCircle2 className="w-4 h-4" /></span>
                ) : (
                  <span className="text-text-secondary dark:text-text-secondary-dark font-bold inline-flex items-center gap-1">Checked Out <XCircle className="w-4 h-4" /></span>
                )}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleCheckAction('in')}
                  disabled={isPresent(todayStr, activeMember.seat)}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-active-fill/50 dark:bg-active-fill-dark/50 border-2 border-active-border text-active-text dark:text-active-text-dark hover:bg-active-fill dark:hover:bg-active-fill-dark hover:-translate-y-1 transition-all disabled:opacity-40 disabled:hover:-translate-y-0 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md disabled:shadow-none active:scale-95"
                >
                  <LogIn className="w-8 h-8 mb-2" />
                  <span className="font-extrabold uppercase tracking-widest text-[11px]">Check In</span>
                </button>
                <button
                  onClick={() => handleCheckAction('out')}
                  disabled={!isPresent(todayStr, activeMember.seat)}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-bg dark:bg-bg-dark border border-card-border dark:border-card-border-dark text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark hover:-translate-y-1 transition-all disabled:opacity-40 disabled:hover:-translate-y-0 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md disabled:shadow-none active:scale-95"
                >
                  <LogOut className="w-8 h-8 mb-2" />
                  <span className="font-extrabold uppercase tracking-widest text-[11px]">Check Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
