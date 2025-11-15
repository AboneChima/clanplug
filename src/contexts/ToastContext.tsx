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
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`min-w-[280px] px-4 py-3 rounded-lg shadow-2xl text-sm flex items-center gap-3 animate-slide-in ${
            t.type === 'success' 
              ? 'bg-green-600 text-white border-2 border-green-400' 
              : t.type === 'error' 
              ? 'bg-red-600 text-white border-2 border-red-400' 
              : 'bg-blue-600 text-white border-2 border-blue-400'
          }`}
        >
          <span className="inline-flex items-center justify-center flex-shrink-0">
            {t.type === 'success' && <IoCheckmarkCircleOutline className="w-6 h-6" />}
            {t.type === 'info' && <IoInformationCircleOutline className="w-6 h-6" />}
            {t.type === 'error' && <IoAlertCircleOutline className="w-6 h-6" />}
          </span>
          <span className="flex-1 font-medium">{t.message}</span>
          <button 
            className="text-white hover:text-gray-200 text-2xl font-bold leading-none flex-shrink-0" 
            onClick={() => remove(t.id)}
          >
            ×
          </button>
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