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
import { MotionConfig } from 'framer-motion';

// ─── Public routes ──────────────────────────────────────────────
//
// No account, no session, no barrier. A student arrives from a QR code at the
// front desk, looks at the floor plan, picks a free seat and submits a
// request; the request carries their phone number and the admin approves it.
// Asking them to register first would put a wall in front of the one thing
// the public side exists to do.
//
// These pages also carry their own chrome (UnifiedHeader / StudentSidebar),
// so the admin Sidebar, TopBar and BottomNav must not be layered on top.
//
// This list previously required authentication, and the "user" role that
// would have satisfied it was never granted by anything in the app — so
// /browse and /my-requests redirected every real visitor straight back to
// /landing, and the landing page's own "Choose Your Seat" button led nowhere.
const PUBLIC_ROUTES = ['/landing', '/kiosk', '/browse', '/my-requests', '/admin/login'];

function AppShellInner({ children }: { children: React.ReactNode }) {
  // Only the sidebar's "N due" badge needs numbers here. This used to call
  // useMembers() + useStats(), pulling all 95 member records — names, phones,
  // join dates — on every single page just to render one badge.
  const { stats } = useDashboardStats();
  const { toasts, addToast, removeToast, ToastContext } = useToastProvider();
  const { isAdmin, isLoading } = useAuth();
  const { pendingCount } = useSeatRequests();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  // Everything that is not public is the admin tool. `isLoading` matters now
  // that admin status is resolved by a server round-trip — without it every
  // admin got bounced on first paint, before the session check came back.
  useEffect(() => {
    if (isLoading || isPublic) return;
    if (!isAdmin) {
      // Carry where they were going, the same way proxy.ts does — otherwise
      // whichever redirect wins the race decides whether sign-in returns you
      // to the page you asked for or dumps you on the seat map.
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAdmin, isLoading, pathname, router, isPublic]);

  if (isPublic) {
    return (
      <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
        {children}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </ToastContext.Provider>
    );
  }

  if (isLoading || !isAdmin) {
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
          "min-h-screen transition-ui flex flex-col bg-[var(--bg-void)]",
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
    /*
      `reducedMotion="user"` makes every framer-motion component honour the
      OS setting.
     
      globals.css already has a `prefers-reduced-motion` block, but it only
      zeroes CSS `animation-duration` and `transition-duration`. Framer-motion
      animates by writing inline styles from JavaScript, so none of the app's
      springs, slides or scales were covered by it — a user who had asked the
      system for less motion still got all of them.
     
      This is the "gentler, not zero" behaviour: transform and layout
      animations are dropped, opacity changes are kept, so state changes stay
      legible without anything flying across the screen.
    */
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <AppShellInner>{children}</AppShellInner>
      </AuthProvider>
    </MotionConfig>
  );
}
