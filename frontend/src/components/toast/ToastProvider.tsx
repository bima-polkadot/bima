import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const next: Toast = { id, variant: 'default', durationMs: 4000, ...t };
    setToasts((prev) => [...prev, next]);
    if (next.durationMs && next.durationMs > 0) {
      setTimeout(() => remove(id), next.durationMs);
    }
  }, [remove]);

  const value = useMemo(() => ({ toasts, push, remove }), [toasts, push, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border px-4 py-3 shadow-xl bg-card/95 backdrop-blur border-border/60 ${
              t.variant === 'success' ? 'border-green-500/50' : t.variant === 'error' ? 'border-red-500/50' : t.variant === 'warning' ? 'border-yellow-500/50' : 'border-border/60'
            }`}
          >
            {t.title && <div className="text-sm font-semibold mb-1">{t.title}</div>}
            {t.description && <div className="text-xs text-muted-foreground break-words">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
