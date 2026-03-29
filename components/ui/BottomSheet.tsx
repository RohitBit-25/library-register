'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoint?: '40%' | '60%' | '90%';
}

const snapHeights = {
  '40%': 'max-h-[40vh]',
  '60%': 'max-h-[60vh]',
  '90%': 'max-h-[90vh]',
};

export default function BottomSheet({
  open,
  onClose,
  children,
  title,
  snapPoint = '60%',
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Trap focus & ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Detail panel'}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-surface dark:bg-surface-dark border-t border-card-border dark:border-card-border-dark shadow-2xl animate-slide-up overflow-y-auto',
          snapHeights[snapPoint],
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-text-tertiary/30 dark:bg-text-tertiary-dark/30" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pb-3">
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg p-1.5 text-text-tertiary dark:text-text-tertiary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-5 pb-6">
          {children}
        </div>
      </div>
    </>
  );
}
