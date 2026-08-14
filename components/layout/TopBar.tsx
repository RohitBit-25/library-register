'use client';

import { useAuth } from '@/hooks/useAuth';
import { BookOpen, Shield, LogOut } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title = 'Library Register' }: TopBarProps) {
  const { isAdmin, logout } = useAuth();
  
  // Admin shows sidebar on desktop (TopBar hidden)
  // User shows TopBar on all screens
  const headerClass = isAdmin 
    ? "lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-14 px-4 bg-[var(--bg-surface)] border-b border-[var(--border-default)] overflow-hidden" 
    : "fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-14 px-4 bg-[var(--bg-surface)] border-b border-[var(--border-default)] overflow-hidden";

  return (
    <header className={headerClass}>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[var(--saffron-600)] flex items-center justify-center shadow-sm shadow-[var(--saffron-600)]/20">
          <BookOpen className="w-3.5 h-3.5 text-[var(--text-inverse)]" />
        </div>
        <p className="text-sm font-extrabold text-[var(--text-primary)] tracking-tight">
          {title}
        </p>
        {isAdmin && (
          <span className="flex items-center gap-1 rounded-full bg-[var(--saffron-50)] px-2 py-0.5 text-[10px] font-bold text-[var(--saffron-700)]">
            <Shield className="h-3 w-3" aria-hidden="true" />
            Staff
          </span>
        )}
      </div>
      <div className="relative z-10 flex items-center gap-1">
        {/* The sidebar carries sign-out on desktop, but it is hidden below
            lg — without this an admin on a phone had no way to sign out. */}
        {isAdmin && (
           <Tooltip content="Sign out">
             <button
               onClick={logout}
               className="flex cursor-pointer rounded-xl p-2 text-[var(--text-secondary)] transition-ui hover:bg-[var(--ruby-50)] hover:text-[var(--ruby-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron-500)] lg:hidden"
               aria-label="Sign out"
             >
               <LogOut className="w-5 h-5" />
             </button>
           </Tooltip>
        )}
      </div>
    </header>
  );
}
