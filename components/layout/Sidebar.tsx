'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import Wordmark from '@/components/layout/Wordmark';
import { ADMIN_NAV } from '@/components/layout/adminNav';

interface SidebarProps {
  dueCount?: number;
  pendingRequests?: number;
}

export default function Sidebar({ dueCount = 0, pendingRequests = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { logout, staffName } = useAuth();
  const router = useRouter();

  // Counts belong to the page they send you to. Plain numbers, no pulse:
  // a badge that breathes forever stops meaning anything by the second day.
  const counts: Record<string, number> = {
    '/requests': pendingRequests,
    '/members': dueCount,
  };

  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  const handleLogout = () => {
    logout();
    router.push('/landing');
  };

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-dvh w-[240px] flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)] lg:flex">
      <div className="flex h-16 items-center border-b border-[var(--border-default)] px-4">
        <Wordmark size="sm" caption="Staff desk" />
      </div>

      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
        {ADMIN_NAV.map((group) => (
          <div key={group.group} className="mt-5 first:mt-0">
            <p className="px-3 pb-1.5 text-xs font-medium text-[var(--text-tertiary)]">
              {group.group}
            </p>
            <ul className="space-y-px">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const count = counts[item.href] ?? 0;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex min-h-[36px] items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 text-sm font-medium transition-ui',
                        isActive
                          ? 'bg-[var(--bg-muted)] text-[var(--text-primary)] shadow-[inset_4px_0_0_var(--saffron-600)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]',
                      )}
                    >
                      <Icon
                        className={cn('size-[18px] shrink-0', isActive ? 'text-[var(--saffron-600)]' : 'text-[var(--text-tertiary)]')}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {count > 0 && (
                        <span className="min-w-5 rounded-full bg-[var(--saffron-50)] px-1.5 py-0.5 text-center font-mono text-xs font-medium tabular text-[var(--saffron-700)]">
                          {count}
                          <span className="sr-only">{item.href === '/members' ? ' with fees due' : ' pending'}</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="m-3 flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-base)] p-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-xs font-semibold text-[var(--text-inverse)]" aria-hidden="true">
          {(staffName ?? 'S').trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{staffName ?? 'Staff'}</p>
          <p className="text-xs text-[var(--text-tertiary)]">{dateStr}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sign out"
          title="Sign out"
          className="flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] transition-ui hover:bg-[var(--ruby-50)] hover:text-[var(--ruby-600)]"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
