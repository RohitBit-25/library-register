'use client';

import { useMembers } from '@/hooks/useMembers';
import { useStats } from '@/hooks/useStats';
import { useToastProvider } from '@/hooks/useToast';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import TopBar from '@/components/layout/TopBar';
import ToastContainer from '@/components/ui/Toast';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

// ─── Routes that don't use AppShell chrome ──────────────────────
const STANDALONE_ROUTES = ['/landing', '/kiosk'];

// ─── Routes that only admins can access ─────────────────────────
const ADMIN_ROUTES = ['/', '/seat-grid', '/members', '/add', '/attendance', '/analytics', '/expiry', '/setup', '/requests'];

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { members } = useMembers();
  const stats = useStats(members);
  const { toasts, addToast, removeToast, ToastContext } = useToastProvider();
  const { isAuthenticated, isAdmin } = useAuth();
  const { pendingCount } = useSeatRequests();
  const pathname = usePathname();
  const router = useRouter();

  // Landing page: no shell chrome
  const isStandalone = STANDALONE_ROUTES.includes(pathname);

  // Redirect logic
  useEffect(() => {
    // Not authenticated & not on landing → go to landing
    if (!isAuthenticated && !isStandalone) {
      router.replace('/landing');
      return;
    }

    // User trying to access admin routes → redirect to browse
    if (isAuthenticated && !isAdmin && ADMIN_ROUTES.includes(pathname)) {
      router.replace('/browse');
      return;
    }
  }, [isAuthenticated, isAdmin, pathname, router, isStandalone]);

  if (isStandalone) {
    return (
      <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
        {children}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </ToastContext.Provider>
    );
  }

  // Not authenticated yet - show nothing while redirect happens
  if (!isAuthenticated) {
    return null;
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {isAdmin && <Sidebar dueCount={stats.due} pendingRequests={pendingCount} />}
      <TopBar />
      <main className={isAdmin ? 'lg:ml-[252px] min-h-screen pb-28 pt-20 lg:pt-4 lg:pb-4' : 'min-h-screen pb-28 pt-20 lg:pt-4 lg:pb-4'}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
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
