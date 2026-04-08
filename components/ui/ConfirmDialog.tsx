'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import Portal from './Portal';
import { useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmDialogProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-[var(--bg-void)]/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full flex-shrink-0 ${variant === 'danger' ? 'bg-[var(--ruby-500)]/20 text-[var(--ruby-400)]' : 'bg-[var(--sapphire-500)]/10 text-[var(--sapphire-500)]'}`}>
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-4 bg-[var(--bg-base)]/50 border-t border-[var(--border-subtle)] justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors cursor-pointer"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`cursor-pointer px-4 py-2 text-sm font-bold rounded-lg transition-colors shadow-sm ${variant === 'danger' ? 'text-[var(--saffron-50)] bg-[var(--ruby-500)] hover:brightness-110' : 'text-[var(--text-inverse)] bg-[var(--sapphire-500)] hover:brightness-110'}`}
                >
                  {confirmText}
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
