'use client';

import { useState, useCallback, useEffect } from 'react';
import Toast, { ToastType } from '@/components/ui/Toast';

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
}

type ToastItem = ToastConfig & { id: number };

// Global State allowing toasts to persist across Next.js page transitions
let globalToasts: ToastItem[] = [];
const listeners: Set<(toasts: ToastItem[]) => void> = new Set();

const saveToSession = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('astraNaviToasts', JSON.stringify(globalToasts));
  }
};

const addGlobalToast = (config: ToastConfig) => {
  const id = Date.now() + Math.random();
  globalToasts = [...globalToasts, { ...config, id }];
  listeners.forEach(listener => listener(globalToasts));
  saveToSession();
};

const removeGlobalToast = (id: number) => {
  globalToasts = globalToasts.filter(toast => toast.id !== id);
  listeners.forEach(listener => listener(globalToasts));
  saveToSession();
};

export const Toaster = () => {
  const [toasts, setToasts] = useState<ToastItem[]>(globalToasts);

  useEffect(() => {
    // Restore toasts from previous hard session (e.g. after logout refresh)
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('astraNaviToasts');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.length > 0) {
            // Keep toasts that haven't timed out drastically (in case of stale data)
            const valid = parsed.filter((t: any) => Date.now() - t.id < 10000);
            if (valid.length > 0) {
              globalToasts = valid;
              setToasts(valid);
            }
          }
        } catch (e) {}
        sessionStorage.removeItem('astraNaviToasts');
      }
    }

    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeGlobalToast(toast.id)}
        />
      ))}
    </>
  );
};

export const useToast = () => {
  const success = useCallback((message: string, duration?: number) => {
    addGlobalToast({ message, type: 'success', duration });
  }, []);

  const error = useCallback((message: string, duration?: number) => {
    addGlobalToast({ message, type: 'error', duration });
  }, []);

  const info = useCallback((message: string, duration?: number) => {
    addGlobalToast({ message, type: 'info', duration });
  }, []);

  const warning = useCallback((message: string, duration?: number) => {
    addGlobalToast({ message, type: 'warning', duration });
  }, []);

  // Return empty fragment so components that still extract ToastContainer don't break/duplicate
  const ToastContainer = <></>;

  return {
    showToast: addGlobalToast,
    ToastContainer,
    success,
    error,
    info,
    warning,
  };
};
