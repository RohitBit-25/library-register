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
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4 selection:bg-[var(--saffron-500)]/30">
      
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[var(--sapphire-500)]/5 blur-3xl mix-blend-multiply dark:mix-blend-overlay"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-accent/5 blur-3xl mix-blend-multiply dark:mix-blend-overlay"></div>
      </div>

      <div className="absolute top-6 left-6 z-50">
        <Link href="/" className="flex items-center gap-2 text-text-tertiary hover:text-[var(--text-primary)] transition-colors bg-surface/80/80 backdrop-blur-md px-4 py-2 rounded-full border border-[var(--border-default)] font-medium cursor-pointer shadow-sm hover:shadow-md">
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--sapphire-500)] to-purple-600 outline outline-4 outline-surface dark:outline-surface-dark shadow-xl mb-6">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">
                Self Check-In
              </h1>
              <p className="text-[var(--text-secondary)] mt-2 font-medium">
                Enter your seat number to begin
              </p>
            </div>

            <div className="card-base p-6 sm:p-8 rounded-[2rem] bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-default)] shadow-2xl">
              <div className="mb-8">
                <div className="h-20 w-full bg-[var(--bg-base)] border-2 border-[var(--border-default)] rounded-2xl flex flex-col items-center justify-center overflow-hidden shadow-inner">
                  <span className={cn(
                    "text-5xl font-mono font-black tracking-widest leading-none",
                    seatInput ? "text-[var(--text-primary)]" : "text-text-tertiary/40"
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
                    className="aspect-square rounded-2xl bg-[var(--bg-base)] border border-[var(--border-subtle)] text-2xl font-black text-[var(--text-primary)] shadow-sm hover:shadow-md hover:bg-[var(--bg-surface)] hover:-translate-y-1 transition-all active:scale-95 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleDelete}
                  className="aspect-square rounded-2xl bg-expired-fill/50/50 border border-[var(--ruby-500)]/30 text-[var(--ruby-400)] hover:bg-expired-fill transition-all flex items-center justify-center font-bold uppercase text-[11px] tracking-wider hover:-translate-y-1 active:scale-95 shadow-sm cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleNumpad('0')}
                  className="aspect-square rounded-2xl bg-[var(--bg-base)] border border-[var(--border-subtle)] text-2xl font-black text-[var(--text-primary)] shadow-sm hover:shadow-md hover:bg-[var(--bg-surface)] hover:-translate-y-1 transition-all active:scale-95 cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={handleEnter}
                  disabled={!seatInput}
                  className="aspect-square rounded-2xl bg-[var(--saffron-500)] text-[#1a1a16] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-[var(--saffron-500)]/20 hover:-translate-y-1 transition-all flex items-center justify-center cursor-pointer active:scale-95"
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
            <div className="glass p-8 rounded-[2rem] border border-[var(--border-default)] shadow-2xl relative overflow-hidden text-center">
              
              <button 
                onClick={() => setActiveMember(null)}
                className="absolute top-4 left-4 p-2 bg-[var(--bg-base)] rounded-full text-text-tertiary hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-[var(--sapphire-500)] rounded-[2rem] rotate-3 mb-6 shadow-xl flex items-center justify-center border-4 border-surface dark:border-surface-dark">
                <span className="text-4xl font-black text-white -rotate-3 font-mono">
                  {String(activeMember.seat).padStart(2, '0')}
                </span>
              </div>
              
              <h2 className="text-3xl font-black tracking-tight text-[var(--text-primary)] mb-1">
                {activeMember.name}
              </h2>
              <p className="text-text-tertiary font-medium mb-8">
                Current Status: {isPresent(todayStr, activeMember.seat) ? (
                  <span className="text-green-600 dark:text-green-400 font-bold inline-flex items-center gap-1">Checked In <CheckCircle2 className="w-4 h-4" /></span>
                ) : (
                  <span className="text-[var(--text-secondary)] font-bold inline-flex items-center gap-1">Checked Out <XCircle className="w-4 h-4" /></span>
                )}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleCheckAction('in')}
                  disabled={isPresent(todayStr, activeMember.seat)}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-active-fill/50/50 border-2 border-[var(--emerald-500)]/30 text-[var(--emerald-400)] hover:bg-active-fill hover:-translate-y-1 transition-all disabled:opacity-40 disabled:hover:-translate-y-0 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md disabled:shadow-none active:scale-95"
                >
                  <LogIn className="w-8 h-8 mb-2" />
                  <span className="font-extrabold uppercase tracking-widest text-[11px]">Check In</span>
                </button>
                <button
                  onClick={() => handleCheckAction('out')}
                  disabled={!isPresent(todayStr, activeMember.seat)}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:-translate-y-1 transition-all disabled:opacity-40 disabled:hover:-translate-y-0 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md disabled:shadow-none active:scale-95"
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
