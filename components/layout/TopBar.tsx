'use client';

import { useDarkMode } from '@/hooks/useDarkMode';
import { Sun, Moon, BookOpen } from 'lucide-react';

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title = 'Library Register' }: TopBarProps) {
  const { isDark, toggle } = useDarkMode();

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-card-border dark:border-card-border-dark">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-blue-accent flex items-center justify-center">
          <BookOpen className="w-3.5 h-3.5 text-white" />
        </div>
        <h1 className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
          {title}
        </h1>
      </div>
      <button
        onClick={toggle}
        className="cursor-pointer rounded-lg p-2 text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </header>
  );
}
