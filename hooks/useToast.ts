'use client';

import { useState, useCallback, createContext, useContext } from 'react';
import { type ToastAction, type ToastMessage, type ToastType } from '@/lib/types';
import { uid } from '@/lib/utils';

interface ToastContextValue {
  toasts: ToastMessage[];
  addToast: (type: ToastType, message: string, action?: ToastAction) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function useToastProvider() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string, action?: ToastAction) => {
    const id = uid();
    setToasts(prev => [...prev, { id, type, message, action }]);
    // Long enough to read and reach the button.
    const duration = action ? 8000 : type === 'error' ? 5000 : 3000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast, ToastContext };
}
