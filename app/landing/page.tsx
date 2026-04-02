'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();
  const { loginAsAdmin, loginAsUser, isAuthenticated, isAdmin } = useAuth();

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

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
      setTimeout(() => setPinError(false), 3000);
    }
  };

  const handleUserEnter = () => {
    loginAsUser();
    router.push('/browse');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-void)] relative overflow-hidden flex flex-col">
      {/* Background gradient orbs (Atmospheric glow) */}
      <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-[var(--saffron-500)]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-[var(--sapphire-500)]/5 blur-[120px] pointer-events-none" />

      {/* Jaali Decorative Border - Top */}
      <div className="absolute top-0 left-0 right-0 h-[8px] bg-[var(--gradient-jaali)] opacity-40 pointer-events-none border-b border-[var(--border-subtle)]" />

      {/* Content */}
      <div className="relative z-10 max-w-lg mx-auto px-[var(--space-5)] py-[var(--space-10)] min-h-[100dvh] flex flex-col justify-center items-center">
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center w-full"
        >
          {/* Logo Mark */}
          <div className="relative mb-[var(--space-8)]">
            <div className="w-[88px] h-[88px] rounded-[var(--radius-2xl)] bg-[var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-glow-saffron)] relative before:absolute before:inset-0 before:bg-[var(--gradient-glass)] before:rounded-[var(--radius-2xl)]">
              <BookOpen className="w-10 h-10 text-[var(--text-inverse)] relative z-10" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[var(--bg-elevated)] border-2 border-[var(--border-subtle)] flex items-center justify-center shadow-[var(--shadow-sm)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--saffron-400)]" />
            </div>
          </div>

          {/* Title Area */}
          <div className="mb-[var(--space-12)] space-y-[var(--space-3)]">
            <h1 className="font-[var(--font-devanagari)] text-[var(--text-4xl)] leading-[var(--leading-tight)] bg-clip-text text-transparent bg-[var(--gradient-primary)] drop-shadow-md">
              श्री गणगौर Library
            </h1>
            <p className="font-[var(--font-display)] text-[var(--text-lg)] text-[var(--text-secondary)] italic font-[var(--weight-medium)] tracking-[var(--tracking-wide)]">
              ✦ Udaipur's Premier Study Space ✦
            </p>
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col gap-[var(--space-5)]">
            <Button
              variant="primary"
              size="lg"
              className="w-full text-lg shadow-[var(--shadow-lg)] justify-between px-[var(--space-6)]"
              onClick={handleUserEnter}
            >
              <span>Browse Available Seats</span>
              <ArrowRight className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-[var(--space-4)] w-full py-[var(--space-2)]">
              <div className="h-[1px] flex-1 bg-[var(--border-subtle)]" />
              <div className="w-2 h-2 rotate-45 border-[1px] border-[var(--saffron-500)]/40" />
              <div className="h-[1px] flex-1 bg-[var(--border-subtle)]" />
            </div>

            {/* Admin Access Form Wrapper */}
            <motion.div
              animate={pinError ? { x: [-5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <Card variant="base" className={cn("p-[var(--space-5)] relative transition-colors duration-500", pinError && "border-[var(--ruby-400)] shadow-[var(--shadow-glow-ruby)]")}>
                <h3 className="font-[var(--font-body)] text-[var(--text-base)] text-[var(--text-primary)] font-[var(--weight-semibold)] mb-[var(--space-4)] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--text-tertiary)]" />
                  Admin Access
                </h3>
                
                <div className="space-y-[var(--space-4)]">
                  <Input
                    label="Admin PIN"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, ''));
                      setPinError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdminLogin();
                    }}
                    error={pinError ? "Incorrect PIN" : undefined}
                    className="font-[var(--font-mono)] tracking-[0.2em]"
                  />
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={handleAdminLogin}
                    disabled={pin.length < 4}
                  >
                    <span>Enter Admin Area</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Jaali Decorative Border - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[8px] bg-[var(--gradient-jaali)] opacity-40 pointer-events-none border-t border-[var(--border-subtle)]" />
    </div>
  );
}
