/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message?: string;
  title?: string;
  description?: string;
  type: ToastType;
}

interface ToastOptions {
  title?: string;
  description?: string;
  message?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  type?: ToastType;
}

interface ToastContextType {
  toast: (options: string | ToastOptions, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: string | ToastOptions, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);

    if (typeof options === 'string') {
      setToasts(prev => [...prev, { id, message: options, type }]);
    } else {
      const variantToType: Record<string, ToastType> = {
        destructive: 'error',
        success: 'success',
        warning: 'warning',
        info: 'info',
        default: 'info',
      };

      const toastType = options.type || (options.variant ? variantToType[options.variant] : type);

      setToasts(prev => [
        ...prev,
        {
          id,
          message: options.message,
          title: options.title,
          description: options.description,
          type: toastType || 'info',
        },
      ]);
    }

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex flex-col p-4 rounded-md shadow-lg min-w-75 text-white ${
              t.type === 'success'
                ? 'bg-green-600'
                : t.type === 'error'
                  ? 'bg-red-600'
                  : t.type === 'warning'
                    ? 'bg-yellow-600'
                    : 'bg-blue-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                {t.title && <span className="font-bold">{t.title}</span>}
                {t.message && <span>{t.message}</span>}
                {t.description && <span className="text-sm opacity-90">{t.description}</span>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="ml-4 self-start"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
