'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ADMIN_TABS } from '@/components/layout/adminNav';

/** Admin tab bar below lg. Public pages carry their own chrome. */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin"
      className="fixed bottom-0 left-0 right-0 z-30 flex min-h-16 items-stretch justify-around border-t border-[var(--border-default)] bg-[var(--bg-surface)] pb-safe-bottom lg:hidden"
    >
      {ADMIN_TABS.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex min-w-[60px] flex-1 flex-col items-center justify-center gap-1 transition-ui',
              isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            )}
          >
            <Icon className={cn('size-5', isActive && 'text-[var(--saffron-600)]')} aria-hidden="true" />
            <span className={cn('text-xs', isActive ? 'font-semibold' : 'font-medium')}>{tab.tab}</span>
          </Link>
        );
      })}
    </nav>
  );
}
