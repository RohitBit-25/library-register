'use client';

import { type ToastMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const styles = {
  success: 'border-l-active-border bg-surface dark:bg-surface-dark',
  warning: 'border-l-due-border bg-surface dark:bg-surface-dark',
  error: 'border-l-expired-border bg-surface dark:bg-surface-dark',
};

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(t => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border border-card-border dark:border-card-border-dark border-l-4 px-4 py-3 shadow-lg animate-toast-in',
              styles[t.type],
            )}
            role="alert"
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark flex-1">
              {t.message}
            </p>
            <button
              onClick={() => onRemove(t.id)}
              className="shrink-0 cursor-pointer text-text-tertiary dark:text-text-tertiary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
