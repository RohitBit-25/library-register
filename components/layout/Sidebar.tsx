'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useDarkMode } from '@/hooks/useDarkMode';
import {
  LayoutDashboard,
  Grid3X3,
  Users,
  UserPlus,
  CalendarCheck,
  BarChart3,
  Settings,
  Sun,
  Moon,
  BookOpen,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  isNew?: boolean;
}

interface SidebarProps {
  dueCount?: number;
}

export default function Sidebar({ dueCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { isDark, toggle } = useDarkMode();

  const navItems: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/seat-grid', label: 'Seat Grid', icon: <Grid3X3 className="w-5 h-5" /> },
    {
      href: '/members',
      label: 'All Members',
      icon: <Users className="w-5 h-5" />,
      badge: dueCount > 0 ? `${dueCount} due` : undefined,
    },
    { href: '/add', label: 'Add Member', icon: <UserPlus className="w-5 h-5" /> },
    { href: '/attendance', label: 'Attendance', icon: <CalendarCheck className="w-5 h-5" />, isNew: true },
    { href: '/analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, isNew: true },
    { href: '/setup', label: 'Google Setup', icon: <Settings className="w-5 h-5" /> },
  ];

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <aside className="hidden lg:flex flex-col w-[220px] h-screen fixed left-0 top-0 border-r border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark z-30">
      {/* Logo area */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-accent flex items-center justify-center">
            <BookOpen className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-text-primary dark:text-text-primary-dark leading-tight">
              Library Register
            </h1>
            <p className="text-[11px] text-text-tertiary dark:text-text-tertiary-dark">
              {dateStr}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-blue-accent/10 text-blue-accent border-l-2 border-blue-accent -ml-px'
                  : 'text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark hover:text-text-primary dark:hover:text-text-primary-dark',
              )}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-due-fill dark:bg-due-fill-dark text-due-text dark:text-due-text-dark">
                  {item.badge}
                </span>
              )}
              {item.isNew && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-accent/10 text-blue-accent">
                  NEW
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-card-border dark:border-card-border-dark">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-text-tertiary dark:text-text-tertiary-dark">
            {timeStr}
          </span>
          <button
            onClick={toggle}
            className="cursor-pointer flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
