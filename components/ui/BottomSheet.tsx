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
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md animate-fade-in"
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
          'fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] glass noise-pattern shadow-floating dark:shadow-floating-dark border-t border-white/20 dark:border-white/5 animate-slide-up overflow-hidden',
          snapHeights[snapPoint],
        )}
      >
        {/* Drag handle */}
        <div className="relative z-10 flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-text-tertiary/30 dark:bg-text-tertiary-dark/30" />
        </div>

        {/* Header */}
        {title && (
          <div className="relative z-10 flex items-center justify-between px-6 pb-4">
            <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark tracking-tight">
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
        <div className="relative z-10 px-6 pb-8 overflow-y-auto max-h-full">
          {children}
        </div>
      </div>
    </>
  );
}
