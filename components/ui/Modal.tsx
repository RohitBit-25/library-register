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
      className="fixed inset-0 z-50 m-auto rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-xl)] backdrop:bg-[var(--bg-void)]/60 backdrop:backdrop-blur-md p-0 max-w-md w-[calc(100%-2rem)] animate-fade-in overflow-hidden"
    >
      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            {description}
          </p>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={cn(
              'cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              confirmVariant === 'danger'
                ? 'bg-[var(--ruby-500)] text-white hover:brightness-110'
                : 'bg-[var(--sapphire-500)] text-[var(--text-inverse)] hover:brightness-110',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
