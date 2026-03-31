'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  MoreHorizontal,
  CalendarCheck,
  CalendarClock,
  BarChart3,
  Settings,
  Sun,
  Moon,
  X,
  Inbox,
  Eye,
  LogOut,
} from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';

/* ─── Admin Tabs ──────────────────────────────────────────────── */

const adminTabs = [
  { href: '/', label: 'Map', icon: LayoutDashboard },
  { href: '/analytics', label: 'Insights', icon: BarChart3 },
  { href: '/members', label: 'List', icon: Users },
];

/* ─── User Tabs ───────────────────────────────────────────────── */

const userTabs = [
  { href: '/browse', label: 'Browse', icon: Eye },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggle } = useDarkMode();
  const { isAdmin, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = isAdmin ? adminTabs : userTabs;

  const adminMorePaths = ['/attendance', '/expiry', '/setup', '/requests'];
  const isMoreActive = isAdmin && adminMorePaths.includes(pathname);

  const handleLogout = () => {
    setMoreOpen(false);
    logout();
    router.push('/landing');
  };

  return (
    <>
      {/* More sheet */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in lg:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-[56px] left-0 right-0 z-50 rounded-t-2xl glass border-t border-card-border dark:border-card-border-dark shadow-2xl animate-slide-up lg:hidden">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-text-tertiary/30" />
            </div>
            <nav className="px-4 pb-4 space-y-1">
              {isAdmin ? (
                /* Admin More Options */
                <>
                  <Link
                    href="/requests"
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                      pathname === '/requests'
                        ? 'bg-blue-accent/10 text-blue-accent'
                        : 'text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark',
                    )}
                  >
                    <Inbox className="w-5 h-5" />
                    Seat Requests
                  </Link>
                  <Link
                    href="/attendance"
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                      pathname === '/attendance'
                        ? 'bg-blue-accent/10 text-blue-accent'
                        : 'text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark',
                    )}
                  >
                    <CalendarCheck className="w-5 h-5" />
                    Attendance
                  </Link>
                  <Link
                    href="/expiry"
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                      pathname === '/expiry'
                        ? 'bg-blue-accent/10 text-blue-accent'
                        : 'text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark',
                    )}
                  >
                    <CalendarClock className="w-5 h-5" />
                    Expiry Tracker
                  </Link>
                  {/* Analytics moved to main nav */}
                  <Link
                    href="/setup"
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                      pathname === '/setup'
                        ? 'bg-blue-accent/10 text-blue-accent'
                        : 'text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark',
                    )}
                  >
                    <Settings className="w-5 h-5" />
                    Google Setup
                  </Link>
                </>
              ) : (
                /* User More Options — minimal */
                <></>
              )}

              {/* Common: Dark mode + Logout */}
              <button
                onClick={toggle}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors cursor-pointer"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
                <div className={cn(
                  'ml-auto w-9 h-5 rounded-full transition-colors relative',
                  isDark ? 'bg-blue-accent' : 'bg-text-tertiary/30',
                )}>
                  <div className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                    isDark ? 'translate-x-4' : 'translate-x-0.5',
                  )} />
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-text-secondary dark:text-text-secondary-dark hover:text-expired-border hover:bg-expired-fill/30 dark:hover:bg-expired-fill-dark/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>

              <button
                onClick={() => setMoreOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-text-tertiary dark:text-text-tertiary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-14 flex items-center justify-around glass border-t border-card-border dark:border-card-border-dark">
        {tabs.map(tab => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 cursor-pointer transition-colors',
                isActive
                  ? 'text-blue-accent'
                  : 'text-text-tertiary dark:text-text-tertiary-dark',
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(prev => !prev)}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 cursor-pointer transition-colors',
            isMoreActive
              ? 'text-blue-accent'
              : 'text-text-tertiary dark:text-text-tertiary-dark',
          )}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </>
  );
}
