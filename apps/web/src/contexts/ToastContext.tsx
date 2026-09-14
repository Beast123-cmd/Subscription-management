import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss in 4 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => showToast('success', message, title), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast('error', message, title), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast('warning', message, title), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast('info', message, title), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-lg border bg-white p-3.5 shadow-lg shadow-slate-900/5 text-sm transition-all animate-in slide-in-from-bottom-2 duration-200 border-slate-200"
          >
            {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />}
            {toast.type === 'info' && <Info className="h-5 w-5 shrink-0 text-sky-600 mt-0.5" />}

            <div className="flex-1">
              {toast.title && <h5 className="font-medium text-slate-900 mb-0.5">{toast.title}</h5>}
              <p className="text-slate-600 leading-snug">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
