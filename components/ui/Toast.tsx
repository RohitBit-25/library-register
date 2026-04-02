'use client';

import { type ToastMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, XCircle, X, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toastVariants } from '@/animations/variants';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const styles = {
  success: 'border-[var(--emerald-500)] bg-[var(--bg-elevated)] shadow-[var(--shadow-glow-emerald)] text-[var(--emerald-400)]',
  warning: 'border-[var(--amber-500)] bg-[var(--bg-elevated)] shadow-[var(--shadow-glow-amber)] text-[var(--amber-400)]',
  error: 'border-[var(--ruby-500)] bg-[var(--bg-elevated)] shadow-[var(--shadow-glow-ruby)] text-[var(--ruby-400)]',
  info: 'border-[var(--sapphire-400)] bg-[var(--bg-elevated)] shadow-[var(--shadow-glow-sapphire)] text-[var(--sapphire-400)]'
};

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-[var(--space-3)] max-w-[380px] pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => {
          // Default to info if undefined type
          const mappedType = t.type || 'info';
          const Icon = icons[mappedType as keyof typeof icons] || Info;
          const styleClass = styles[mappedType as keyof typeof styles] || styles.info;
          
          return (
            <motion.div
              layout
              key={t.id}
              variants={toastVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'flex items-start gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)]',
                'rounded-[var(--radius-lg)] border-l-[3px] border-y-[1px] border-r-[1px]',
                'border-y-[var(--border-subtle)] border-r-[var(--border-subtle)]',
                'backdrop-blur-md pointer-events-auto overflow-hidden',
                styleClass
              )}
              role="alert"
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-[var(--text-sm)] font-[var(--font-body)] text-[var(--text-primary)] flex-1 leading-[1.5]">
                {t.message}
              </p>
              <button
                onClick={() => onRemove(t.id)}
                className="shrink-0 cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1 -mr-1"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
