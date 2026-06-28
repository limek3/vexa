'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type Toast = { id: number; text: string };
type Ctx = { push: (text: string) => void };

const ToastCtx = createContext<Ctx>({ push: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, text }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2500);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="toast-wrap">
        {items.map((t) => (
          <div key={t.id} className="toast">
            <span className="dot" />
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
