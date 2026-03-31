'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';
import {
  BookOpen,
  Shield,
  Eye,
  Grid3X3,
  CalendarCheck,
  BarChart3,
  Users,
  Lock,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const router = useRouter();
  const { loginAsAdmin, loginAsUser, isAuthenticated, isAdmin } = useAuth();
  const { isDark, toggle } = useDarkMode();

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinShake, setPinShake] = useState(false);

  // If already authenticated, redirect
  if (isAuthenticated) {
    if (isAdmin) {
      router.replace('/');
    } else {
      router.replace('/browse');
    }
    return null;
  }

  const handleAdminLogin = () => {
    if (loginAsAdmin(pin)) {
      router.push('/');
    } else {
      setPinError(true);
      setPinShake(true);
      setTimeout(() => setPinShake(false), 500);
      setTimeout(() => setPinError(false), 3000);
    }
  };

  const handleUserEnter = () => {
    loginAsUser();
    router.push('/browse');
  };

  const features = [
    {
      icon: <Grid3X3 className="w-6 h-6" />,
      title: 'Visual Seat Grid',
      desc: '95 seats with real-time status tracking',
      gradient: 'from-[#2563EB] to-[#60A5FA]',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Member Management',
      desc: 'Registration, renewals & fee tracking',
      gradient: 'from-[#639922] to-[#A3E635]',
    },
    {
      icon: <CalendarCheck className="w-6 h-6" />,
      title: 'Attendance Tracking',
      desc: 'Daily attendance with analytics',
      gradient: 'from-[#EF9F27] to-[#FBBF24]',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics Dashboard',
      desc: 'Occupancy trends & expiry reports',
      gradient: 'from-[#7C3AED] to-[#A78BFA]',
    },
  ];

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#7C3AED]/5 blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-[#639922]/5 blur-[80px] pointer-events-none" />

      {/* Dark mode toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggle}
          className="cursor-pointer rounded-xl p-2.5 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-sm border border-card-border dark:border-card-border-dark text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-all group shadow-sm"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="block transition-transform duration-300 group-hover:rotate-45">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-lg mx-auto px-5 py-10 min-h-screen flex flex-col">
        {/* ── Hero ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Logo */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl gradient-blue flex items-center justify-center shadow-xl shadow-blue-accent/30 animate-float">
              <BookOpen className="w-9 h-9 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-active-fill dark:bg-active-fill-dark border-2 border-bg dark:border-bg-dark flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-active-border" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary dark:text-text-primary-dark tracking-tight leading-tight mb-2">
            Gangaur Library
          </h1>
          <p className="text-base text-text-secondary dark:text-text-secondary-dark font-medium mb-1">
            Seat Management System
          </p>
          <p className="text-sm text-text-tertiary dark:text-text-tertiary-dark max-w-xs">
            Manage 95 seats with registration, attendance, analytics & more
          </p>

          {/* ── CTA Cards ────────────────────────────────────── */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
            {/* Admin Login */}
            <button
              onClick={() => setShowAdminModal(true)}
              className="cursor-pointer group card-premium accent-blue rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-5 text-left hover:shadow-xl transition-all active:scale-[0.98]"
            >
              <div className="w-11 h-11 rounded-xl gradient-blue flex items-center justify-center mb-3 shadow-md shadow-blue-accent/20 group-hover:shadow-lg group-hover:shadow-blue-accent/30 transition-shadow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-bold text-text-primary dark:text-text-primary-dark mb-1">
                Admin Login
              </h3>
              <p className="text-xs text-text-tertiary dark:text-text-tertiary-dark mb-3">
                Full access to manage seats, members, attendance & analytics
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-accent group-hover:gap-2.5 transition-all">
                Enter PIN <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* User Browse */}
            <button
              onClick={handleUserEnter}
              className="cursor-pointer group card-premium accent-green rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark p-5 text-left hover:shadow-xl transition-all active:scale-[0.98]"
            >
              <div className="w-11 h-11 rounded-xl gradient-green flex items-center justify-center mb-3 shadow-md shadow-green-accent/20 group-hover:shadow-lg group-hover:shadow-green-accent/30 transition-shadow">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-bold text-text-primary dark:text-text-primary-dark mb-1">
                Browse Seats
              </h3>
              <p className="text-xs text-text-tertiary dark:text-text-tertiary-dark mb-3">
                View seat availability & request a vacant seat for yourself
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-active-border group-hover:gap-2.5 transition-all">
                Enter as User <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>

          {/* ── Features ─────────────────────────────────────── */}
          <div className="w-full mt-8">
            <h2 className="text-xs font-bold text-text-tertiary dark:text-text-tertiary-dark uppercase tracking-wider mb-3 text-left">
              Features
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {features.map(f => (
                <div
                  key={f.title}
                  className="rounded-xl border border-card-border dark:border-card-border-dark bg-surface/60 dark:bg-surface-dark/60 p-3.5 backdrop-blur-sm"
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white mb-2 shadow-sm',
                      f.gradient
                    )}
                  >
                    {f.icon}
                  </div>
                  <h4 className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-0.5">
                    {f.title}
                  </h4>
                  <p className="text-[10px] text-text-tertiary dark:text-text-tertiary-dark leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div className="text-center py-6">
          <p className="text-xs text-text-tertiary dark:text-text-tertiary-dark">
            © {new Date().getFullYear()} Gangaur Library · Built with ❤️
          </p>
        </div>
      </div>

      {/* ── Admin PIN Modal ───────────────────────────────────── */}
      {showAdminModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setShowAdminModal(false);
              setPin('');
              setPinError(false);
            }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <div
              className={cn(
                'w-full max-w-sm rounded-2xl bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark shadow-2xl p-6 animate-slide-up',
                pinShake && 'animate-[shake_0.4s_ease-in-out]'
              )}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center shadow-md">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary dark:text-text-primary-dark">
                      Admin Login
                    </h3>
                    <p className="text-xs text-text-tertiary dark:text-text-tertiary-dark">
                      Enter your PIN to continue
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAdminModal(false);
                    setPin('');
                    setPinError(false);
                  }}
                  className="cursor-pointer rounded-lg p-1.5 text-text-tertiary dark:text-text-tertiary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* PIN Input */}
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={e => {
                      setPin(e.target.value.replace(/\D/g, ''));
                      setPinError(false);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAdminLogin();
                    }}
                    placeholder="Enter 4-digit PIN"
                    autoFocus
                    className={cn(
                      'w-full px-4 py-3 rounded-xl text-center text-2xl font-mono font-bold tracking-[0.5em] bg-bg dark:bg-bg-dark border-2 text-text-primary dark:text-text-primary-dark placeholder:text-text-tertiary/40 placeholder:text-base placeholder:tracking-normal placeholder:font-sans focus:outline-none transition-colors',
                      pinError
                        ? 'border-expired-border focus:border-expired-border'
                        : 'border-card-border dark:border-card-border-dark focus:border-blue-accent'
                    )}
                  />
                </div>

                {pinError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-expired-fill dark:bg-expired-fill-dark text-expired-text dark:text-expired-text-dark text-xs font-medium animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Incorrect PIN. Please try again.
                  </div>
                )}

                <button
                  onClick={handleAdminLogin}
                  disabled={pin.length < 4}
                  className={cn(
                    'cursor-pointer w-full py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md',
                    pin.length >= 4
                      ? 'gradient-blue hover:shadow-lg hover:shadow-blue-accent/25 active:scale-[0.98]'
                      : 'bg-text-tertiary/30 cursor-not-allowed shadow-none'
                  )}
                >
                  Login as Admin
                </button>

                <p className="text-center text-[11px] text-text-tertiary dark:text-text-tertiary-dark">
                  Default PIN: 1234
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
