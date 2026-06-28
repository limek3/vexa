'use client';

import * as React from 'react';
import type { ToastActionElement, ToastProps } from '@/components/ui/toast';

type ToastItem = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type ToastContextValue = {
  toasts: ToastItem[];
  toast: (value: Omit<ToastItem, 'id'>) => void;
  dismiss: (id?: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProviderClient({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id?: string) => {
    setToasts((current) => (id ? current.filter((toast) => toast.id !== id) : []));
  }, []);

  const toast = React.useCallback((value: Omit<ToastItem, 'id'>) => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

    const duration = value.duration ?? 4000;
    setToasts((current) => [...current, { ...value, id }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toastItem) => toastItem.id !== id));
    }, duration);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      toasts,
      toast,
      dismiss,
    }),
    [dismiss, toast, toasts],
  );

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    return {
      toasts: [] as ToastItem[],
      toast: () => undefined,
      dismiss: () => undefined,
    };
  }

  return context;
}
