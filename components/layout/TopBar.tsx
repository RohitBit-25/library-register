'use client';

import { useAuth } from '@/hooks/useAuth';
import { BookOpen, Shield, Eye, LogOut } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title = 'Library Register' }: TopBarProps) {
  const { isAdmin, isAuthenticated, logout } = useAuth();
  
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
        <h1 className="text-sm font-extrabold text-[var(--text-primary)] tracking-tight">
          {title}
        </h1>
        {isAuthenticated && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--sapphire-50)] text-[var(--sapphire-600)]">
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
        {!isAdmin && isAuthenticated && (
           <Tooltip content="Sign out">
             <button
               onClick={logout}
               className="hidden lg:flex cursor-pointer rounded-xl p-2 text-[var(--text-secondary)] hover:bg-[var(--rose-500)] hover:text-[var(--saffron-50)] active:scale-95 transition-all group ml-1"
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
