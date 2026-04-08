'use client';

import { useDarkMode } from '@/hooks/useDarkMode';
import { useAuth } from '@/hooks/useAuth';
import { Sun, Moon, BookOpen, Shield, Eye, LogOut } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title = 'Library Register' }: TopBarProps) {
  const { isDark, toggle } = useDarkMode();
  const { isAdmin, isAuthenticated, logout } = useAuth();
  
  // Admin shows sidebar on desktop (TopBar hidden)
  // User shows TopBar on all screens
  const headerClass = isAdmin 
    ? "lg:hidden fixed top-4 left-4 right-4 z-30 flex items-center justify-between h-14 px-4 rounded-2xl glass noise-pattern shadow-floating dark:shadow-floating-dark overflow-hidden" 
    : "fixed top-4 left-4 right-4 z-30 flex items-center justify-between h-14 px-4 rounded-2xl glass noise-pattern shadow-floating dark:shadow-floating-dark overflow-hidden";

  return (
    <header className={headerClass}>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/20 to-transparent dark:from-white/10 pointer-events-none" />
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[var(--saffron-500)] flex items-center justify-center shadow-sm shadow-[var(--saffron-500)]/20">
          <BookOpen className="w-3.5 h-3.5 text-[#1a1a16]" />
        </div>
        <h1 className="text-sm font-extrabold text-[var(--text-primary)] tracking-tight">
          {title}
        </h1>
        {isAuthenticated && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--sapphire-500)]/10 text-[var(--sapphire-500)]">
            {isAdmin ? (
              <>
                <Shield className="w-3 h-3" />
                Admin
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                User
              </>
            )}
          </span>
        )}
      </div>
      <div className="relative z-10 flex items-center gap-1">
        <Tooltip content={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          <button
            onClick={toggle}
            className="cursor-pointer rounded-xl p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-base)] transition-all group"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="block transition-transform duration-300 group-hover:rotate-45">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </span>
          </button>
        </Tooltip>
        {!isAdmin && isAuthenticated && (
           <Tooltip content="Sign out">
             <button
               onClick={logout}
               className="hidden lg:flex cursor-pointer rounded-xl p-2 text-[var(--text-secondary)] hover:bg-[var(--rose-500)] hover:text-[var(--saffron-50)] transition-all group ml-1"
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
