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
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-sm bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full flex-shrink-0 ${variant === 'danger' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary dark:text-text-primary-dark">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary dark:text-text-secondary-dark leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-4 bg-bg/50 dark:bg-bg-dark/50 border-t border-card-border dark:border-card-border-dark justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-text-secondary dark:text-text-secondary-dark hover:bg-surface dark:hover:bg-surface-dark rounded-lg transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors shadow-sm ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-accent hover:bg-blue-accent/90'}`}
                >
                  {confirmText}
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors"
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
