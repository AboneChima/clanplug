"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { IoCheckmarkCircleOutline, IoInformationCircleOutline, IoAlertCircleOutline } from 'react-icons/io5';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: string) => void }) {
  return (
    <div className="fixed top-3 right-3 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`min-w-[260px] px-3 py-2 rounded-md border border-border shadow-md bg-card text-sm flex items-center gap-2 ${
            t.type === 'success' ? 'text-success' : t.type === 'error' ? 'text-error' : 'text-info'
          }`}
        >
          <span className="inline-flex items-center justify-center w-6 h-6">
            {t.type === 'success' && <IoCheckmarkCircleOutline className="w-5 h-5" />}
            {t.type === 'info' && <IoInformationCircleOutline className="w-5 h-5" />}
            {t.type === 'error' && <IoAlertCircleOutline className="w-5 h-5" />}
          </span>
          <span className="flex-1">{t.message}</span>
          <button className="text-muted hover:text-foreground ml-2" onClick={() => remove(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), 3000);
  }, [remove]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} remove={remove} />
    </ToastContext.Provider>
  );
}