'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';

export default function UnifiedHeader() {
  const [showStaffLogin, setShowStaffLogin] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between gap-4 py-4 px-6 md:px-10 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="h-8 w-8 rotate-45 rounded-[4px] border-2 border-[var(--saffron-600)] bg-[var(--saffron-50)]"
          />
          <div className="leading-tight">
            <p className="text-[14px] font-bold tracking-tight text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-devanagari)' }}>
              श्री गणगौर
            </p>
            <p className="text-[11px] font-medium text-[var(--text-tertiary)]">
              Shree Gangaur Study Library
            </p>
          </div>
        </div>

        {/* Navigation Links - Hidden on small mobile */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-semibold text-[var(--saffron-700)] border-b-2 border-[var(--saffron-600)] pb-1 flex items-center gap-1.5">
            <span className="text-[14px]">🏠</span> Home
          </a>
          <a href="#" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5">
            <span className="text-[14px]">🕒</span> About
          </a>
          <a href="#" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5">
            <span className="text-[14px]">🏢</span> Facilities
          </a>
          <a href="#" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5">
            <span className="text-[14px]">📋</span> Rules
          </a>
          <a href="#" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5">
            <span className="text-[14px]">📞</span> Contact
          </a>
        </nav>

        {/* Staff Login Button */}
        <button
          type="button"
          onClick={() => setShowStaffLogin(true)}
          className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 text-[13px] font-semibold text-[var(--text-secondary)] shadow-[var(--shadow-xs)] transition-colors hover:border-[var(--saffron-600)] hover:text-[var(--saffron-700)]"
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          Staff Login
        </button>
      </header>

      <AuthModal open={showStaffLogin} onClose={() => setShowStaffLogin(false)} />
    </>
  );
}
