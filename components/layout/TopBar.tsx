'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Wordmark from '@/components/layout/Wordmark';

/** Phone/tablet header for the admin tool. The sidebar replaces it at lg. */
export default function TopBar() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 lg:hidden">
      <Wordmark size="sm" mark={false} caption="Staff desk" />
      {/* The sidebar carries sign-out on desktop, but it is hidden below
          lg — without this an admin on a phone had no way to sign out. */}
      <button
        type="button"
        onClick={() => { logout(); router.push('/landing'); }}
        className="flex size-10 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] transition-ui hover:bg-[var(--ruby-50)] hover:text-[var(--ruby-600)]"
        aria-label="Sign out"
      >
        <LogOut className="size-5" aria-hidden="true" />
      </button>
    </header>
  );
}
