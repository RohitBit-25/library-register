'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Inbox,
  Eye,
  HardDrive,
} from 'lucide-react';


/* ─── Admin Tabs ──────────────────────────────────────────────── */

const adminTabs = [
  { href: '/', label: 'Map', icon: LayoutDashboard },
  { href: '/analytics', label: 'Dashboard', icon: BarChart3 },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/requests', label: 'Requests', icon: Inbox },
  { href: '/export', label: 'Export', icon: HardDrive },
];

/* ─── User Tabs ───────────────────────────────────────────────── */

const userTabs = [
  { href: '/browse', label: 'Browse', icon: Eye },
  { href: '/my-requests', label: 'Requests', icon: Inbox },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const tabs = isAdmin ? adminTabs : userTabs;

  return (
    <>
      {/* Tab bar */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-[var(--z-sticky)] h-16 rounded-[var(--radius-3xl)] flex items-center justify-around bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-default)] shadow-[var(--shadow-floating)] pb-safe-bottom">
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
                  ? 'text-[var(--saffron-500)] scale-110 drop-shadow-[0_0_8px_rgba(232,133,58,0.4)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-[var(--weight-medium)]">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
