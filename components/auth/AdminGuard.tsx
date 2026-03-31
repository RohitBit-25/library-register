'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, isAuthenticated, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/landing');
    } else if (!isAdmin) {
      router.replace('/browse');
    }
  }, [isAuthenticated, isAdmin, router]);

  // Only render children if admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-pulse-subtle">
          <div className="w-12 h-12 rounded-2xl bg-bg dark:bg-bg-dark flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🔒</span>
          </div>
          <p className="text-sm text-text-tertiary dark:text-text-tertiary-dark font-medium">
            Redirecting…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
