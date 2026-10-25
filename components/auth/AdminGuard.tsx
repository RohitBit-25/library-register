'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Lock } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) router.replace('/admin/login');
  }, [isAdmin, router]);

  // Only render children if admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="size-12 rounded-2xl bg-[var(--bg-base)] flex items-center justify-center mx-auto mb-3">
            <Lock className="size-6 text-[var(--text-tertiary)]" />
          </div>
          <p className="text-sm text-[var(--text-tertiary)] font-medium">
            Redirecting…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
