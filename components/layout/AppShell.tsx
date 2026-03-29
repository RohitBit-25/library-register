'use client';

import { useMembers } from '@/hooks/useMembers';
import { useStats } from '@/hooks/useStats';
import { useToastProvider } from '@/hooks/useToast';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import TopBar from '@/components/layout/TopBar';
import ToastContainer from '@/components/ui/Toast';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { members } = useMembers();
  const stats = useStats(members);
  const { toasts, addToast, removeToast, ToastContext } = useToastProvider();

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      <Sidebar dueCount={stats.due} />
      <TopBar />
      <main className="lg:ml-[220px] min-h-screen pb-16 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
          {children}
        </div>
      </main>
      <BottomNav />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}
