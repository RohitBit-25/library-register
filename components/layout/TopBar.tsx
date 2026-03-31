'use client';

import { useDarkMode } from '@/hooks/useDarkMode';
import { useAuth } from '@/hooks/useAuth';
import { Sun, Moon, BookOpen, Shield, Eye, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title = 'Library Register' }: TopBarProps) {
  const { isDark, toggle } = useDarkMode();
  const { isAdmin, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/landing');
  };

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 glass border-b border-card-border dark:border-card-border-dark">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg gradient-blue flex items-center justify-center shadow-sm shadow-blue-accent/20">
          <BookOpen className="w-3.5 h-3.5 text-white" />
        </div>
        <h1 className="text-sm font-extrabold text-text-primary dark:text-text-primary-dark tracking-tight">
          {title}
        </h1>
        {isAuthenticated && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-accent/10 text-blue-accent">
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
      <div className="flex items-center gap-1">
        <button
          onClick={toggle}
          className="cursor-pointer rounded-xl p-2 text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark transition-all group"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="block transition-transform duration-300 group-hover:rotate-45">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </span>
        </button>
      </div>
    </header>
  );
}
