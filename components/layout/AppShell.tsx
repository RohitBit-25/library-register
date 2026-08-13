'use client';

import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useToastProvider } from '@/hooks/useToast';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import TopBar from '@/components/layout/TopBar';
import ToastContainer from '@/components/ui/Toast';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

// ─── Routes that don't use AppShell chrome ──────────────────────
const STANDALONE_ROUTES = ['/landing', '/kiosk'];



// ─── Routes accessible to regular users ─────────────────────────
const USER_ROUTES = ['/browse', '/my-requests'];

function AppShellInner({ children }: { children: React.ReactNode }) {
  // Only the sidebar's "N due" badge needs numbers here. This used to call
  // useMembers() + useStats(), pulling all 95 member records — names, phones,
  // join dates — on every single page just to render one badge.
  const { stats } = useDashboardStats();
  const { toasts, addToast, removeToast, ToastContext } = useToastProvider();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const { pendingCount } = useSeatRequests();
  const pathname = usePathname();
  const router = useRouter();

  // Landing page: no shell chrome
  const isStandalone = STANDALONE_ROUTES.includes(pathname);

  // Redirect logic. `isLoading` guard matters now that admin status is resolved
  // by a server round-trip — without it every admin got bounced to /landing on
  // first paint, before the session check came back.
  useEffect(() => {
    if (isLoading || isStandalone) return;

    if (!isAuthenticated) {
      router.replace('/landing');
      return;
    }

    if (!isAdmin && !USER_ROUTES.includes(pathname)) {
      router.replace('/browse');
    }
  }, [isAuthenticated, isAdmin, isLoading, pathname, router, isStandalone]);

  if (isStandalone) {
    return (
      <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
        {children}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </ToastContext.Provider>
    );
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[var(--bg-void)]"
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Checking your session…</span>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--saffron-600)]" />
      </div>
    );
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {/* withDues, not due: the badge means "how many owe money", and `due`
          now excludes members who are also expired (expired outranks it). */}
      {isAdmin && <Sidebar dueCount={stats.withDues} pendingRequests={pendingCount} />}
      <TopBar />
      <main 
        className={cn(
          "min-h-screen transition-all flex flex-col bg-[var(--bg-void)]",
          isAdmin 
            ? "pt-14 pb-16 lg:pb-0 lg:pt-0 lg:ml-[240px]" 
            : "pt-14 pb-16 lg:pb-0 lg:pt-14" 
        )}
      >
        <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
      <BottomNav />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShellInner>{children}</AppShellInner>
    </AuthProvider>
  );
}
