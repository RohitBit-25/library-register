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
  CalendarSearch,
  BarChart3,
  Settings,
  Sun,
  Moon,
  X,
  Inbox,
  Eye,
  LogOut,
  MonitorSmartphone,
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
  { href: '/my-requests', label: 'Requests', icon: Inbox },
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
          <div className="fixed bottom-[104px] left-4 right-4 z-50 rounded-[var(--radius-3xl)] bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-default)] shadow-[var(--shadow-floating)] animate-slide-up lg:hidden overflow-hidden">
            <div className="flex justify-center pt-[var(--space-3)] pb-[var(--space-1)] relative z-10">
              <div className="w-10 h-1 rounded-[var(--radius-full)] bg-[var(--text-tertiary)]/30" />
            </div>
            <nav className="px-4 pb-4 space-y-1 relative z-10">
              {isAdmin ? (
                /* Admin More Options */
                <>
                  <Link
                    href="/requests"
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-lg)] text-[var(--text-sm)] font-[var(--weight-medium)] transition-colors cursor-pointer',
                      pathname === '/requests'
                        ? 'bg-[var(--indigo-500)]/10 text-[var(--indigo-500)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]',
                    )}
                  >
                    <Inbox className="w-5 h-5" />
                    Seat Requests
                  </Link>
                  <Link
                    href="/attendance"
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-lg)] text-[var(--text-sm)] font-[var(--weight-medium)] transition-colors cursor-pointer',
                      pathname === '/attendance'
                        ? 'bg-[var(--indigo-500)]/10 text-[var(--indigo-500)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]',
                    )}
                  >
                    <CalendarCheck className="w-5 h-5" />
                    Attendance
                  </Link>
                  <Link
                    href="/expiry"
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-lg)] text-[var(--text-sm)] font-[var(--weight-medium)] transition-colors cursor-pointer',
                      pathname === '/expiry'
                        ? 'bg-[var(--indigo-500)]/10 text-[var(--indigo-500)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]',
                    )}
                  >
                    <CalendarSearch className="w-5 h-5" />
                    Expiry Tracker
                  </Link>
                  <Link
                    href="/kiosk"
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-lg)] text-[var(--text-sm)] font-[var(--weight-medium)] transition-colors cursor-pointer',
                      pathname === '/kiosk'
                        ? 'bg-[var(--indigo-500)]/10 text-[var(--indigo-500)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]',
                    )}
                  >
                    <MonitorSmartphone className="w-5 h-5" />
                    Launch Kiosk
                  </Link>
                  {/* Analytics moved to main nav */}
                  <Link
                    href="/setup"
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-lg)] text-[var(--text-sm)] font-[var(--weight-medium)] transition-colors cursor-pointer',
                      pathname === '/setup'
                        ? 'bg-[var(--indigo-500)]/10 text-[var(--indigo-500)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]',
                    )}
                  >
                    <Settings className="w-5 h-5" />
                    Google Setup
                  </Link>
                </>
              ) : (
                /* User More Options — no extra items needed */
                <></>
              )}

              {/* Common: Dark mode + Logout */}
              <button
                onClick={toggle}
                className="w-full flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-lg)] text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
                <div className={cn(
                  'ml-auto w-9 h-5 rounded-[var(--radius-full)] transition-colors relative',
                  isDark ? 'bg-[var(--indigo-500)]' : 'bg-[var(--text-tertiary)]/30',
                )}>
                  <div className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-[var(--radius-full)] bg-white shadow-[var(--shadow-sm)] transition-transform',
                    isDark ? 'translate-x-4' : 'translate-x-0.5',
                  )} />
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-lg)] text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--text-secondary)] hover:text-[var(--ruby-500)] hover:bg-[var(--ruby-500)]/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>

              <button
                onClick={() => setMoreOpen(false)}
                className="w-full flex items-center justify-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2\.5)] rounded-[var(--radius-lg)] text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Tab bar */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-30 h-16 rounded-[var(--radius-3xl)] flex items-center justify-around bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-default)] shadow-[var(--shadow-floating)]">
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--bg-overlay)] to-transparent rounded-[var(--radius-3xl)] pointer-events-none" />
        {tabs.map(tab => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'relative z-10 flex flex-col items-center justify-center gap-[var(--space-1)] min-w-[64px] py-[var(--space-1)] cursor-pointer transition-all',
                isActive
                  ? 'text-[var(--indigo-500)]'
                  : 'text-[var(--text-tertiary)]',
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-[var(--weight-medium)]">{tab.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(prev => !prev)}
          className={cn(
            'relative z-10 flex flex-col items-center justify-center gap-[var(--space-1)] min-w-[64px] py-[var(--space-1)] cursor-pointer transition-all',
            isMoreActive
              ? 'text-[var(--indigo-500)]'
              : 'text-[var(--text-tertiary)]',
          )}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-[var(--weight-medium)]">More</span>
        </button>
      </nav>
    </>
  );
}
