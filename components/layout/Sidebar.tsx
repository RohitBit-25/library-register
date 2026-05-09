'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  BookOpen,
  Inbox,
  LogOut,
  Shield,
  HardDrive,
} from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useRouter } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarProps {
  dueCount?: number;
  pendingRequests?: number;
}

export default function Sidebar({ dueCount = 0, pendingRequests = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  const navItems: NavItem[] = [
    { href: '/', label: 'Seat Map', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/analytics', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
    {
      href: '/members',
      label: 'All Members',
      icon: <Users className="w-5 h-5" />,
      badge: dueCount > 0 ? `${dueCount} due` : undefined,
    },
    {
      href: '/requests',
      label: 'Requests',
      icon: <Inbox className="w-5 h-5" />,
      badge: pendingRequests > 0 ? `${pendingRequests}` : undefined,
    },
    {
      href: '/export',
      label: 'Export Data',
      icon: <HardDrive className="w-5 h-5" />,
    },
  ];

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const handleLogout = () => {
    logout();
    router.push('/landing');
  };

  return (
    <aside className="hidden lg:flex flex-col w-[220px] h-[calc(100vh-2rem)] fixed left-4 top-4 rounded-3xl glass noise-pattern shadow-floating z-30 overflow-hidden">
      <div className="flex items-center gap-3 px-6 h-16 shrink-0 relative z-10">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--saffron-500)]/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-[var(--saffron-500)] flex items-center justify-center shadow-md shadow-[var(--saffron-500)]/20">
            <BookOpen className="w-[18px] h-[18px] text-[#1a1a16]" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-[var(--text-primary)] leading-tight tracking-tight">
              Library Register
            </h1>
            <p className="text-[11px] text-[var(--text-tertiary)] font-medium">
              {dateStr}
            </p>
          </div>
        </div>
      </div>

      {/* Admin badge */}
      <div className="px-6 pb-4 relative z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--sapphire-500)]/10 text-[var(--sapphire-500)]">
          <Shield className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold">Admin Mode</span>
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
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer relative',
                isActive
                  ? 'bg-[var(--sapphire-500)]/10 text-[var(--sapphire-500)] font-bold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]',
              )}
            >
              <span className={cn(
                'transition-transform duration-200',
                isActive && 'scale-110',
              )}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--saffron-500)]/15 text-[var(--saffron-500)] animate-pulse-subtle">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 shrink-0 relative z-10">
        <div className="flex items-center justify-between mb-3 text-xs font-mono text-[var(--text-tertiary)]">
          {timeStr}
        </div>
        <Tooltip content="Sign out of the system" side="right">
          <button
            onClick={handleLogout}
            className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--ruby-500)] hover:bg-[var(--ruby-500)]/10 transition-colors border border-[var(--border-default)]"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
