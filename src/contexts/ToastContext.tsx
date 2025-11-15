"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { IoCheckmarkCircle, IoClose, IoAlertCircle, IoInformationCircle } from 'react-icons/io5';

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
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] space-y-2 pointer-events-none w-full max-w-[90vw] sm:max-w-sm px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto animate-[slideDown_0.3s_ease-out]"
        >
          <div className={`
            flex items-center gap-2 px-3 py-2 rounded-full shadow-xl backdrop-blur-md
            ${t.type === 'success' 
              ? 'bg-emerald-500/95 text-white' 
              : t.type === 'error' 
              ? 'bg-rose-500/95 text-white' 
              : 'bg-blue-500/95 text-white'
            }
          `}>
            <div className="flex-shrink-0">
              {t.type === 'success' && <IoCheckmarkCircle className="w-4 h-4" />}
              {t.type === 'info' && <IoInformationCircle className="w-4 h-4" />}
              {t.type === 'error' && <IoAlertCircle className="w-4 h-4" />}
            </div>
            <p className="flex-1 text-xs font-medium leading-tight">{t.message}</p>
            <button 
              onClick={() => remove(t.id)}
              className="flex-shrink-0 p-0.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <IoClose className="w-3.5 h-3.5" />
            </button>
          </div>
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
