'use client';

import { useDarkMode } from '@/hooks/useDarkMode';
import { Sun, Moon, BookOpen } from 'lucide-react';

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title = 'Library Register' }: TopBarProps) {
  const { isDark, toggle } = useDarkMode();

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 glass border-b border-card-border dark:border-card-border-dark">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg gradient-blue flex items-center justify-center shadow-sm shadow-blue-accent/20">
          <BookOpen className="w-3.5 h-3.5 text-white" />
        </div>
        <h1 className="text-sm font-extrabold text-text-primary dark:text-text-primary-dark tracking-tight">
          {title}
        </h1>
      </div>
      <button
        onClick={toggle}
        className="cursor-pointer rounded-xl p-2 text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark transition-all group"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <span className="block transition-transform duration-300 group-hover:rotate-45">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </span>
      </button>
    </header>
  );
}
