'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  onConfirm,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto rounded-xl border border-card-border dark:border-card-border-dark glass shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm p-0 max-w-md w-[calc(100%-2rem)] animate-fade-in"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="cursor-pointer text-text-tertiary dark:text-text-tertiary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {description && (
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-6">
            {description}
          </p>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-card-border dark:border-card-border-dark px-4 py-2 text-sm font-medium text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={cn(
              'cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              confirmVariant === 'danger'
                ? 'bg-expired-border text-white hover:bg-expired-border/90'
                : 'bg-blue-accent text-white hover:bg-blue-accent/90',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
