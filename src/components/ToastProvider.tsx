import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; text: string; icon: typeof CheckCircle }> = {
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: CheckCircle },
  error: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', icon: AlertCircle },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, variant: ToastVariant) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => remove(id), variant === 'error' ? 6000 : 4000);
  }, [remove]);

  const toast = {
    success: (msg: string) => push(msg, 'success'),
    error: (msg: string) => push(msg, 'error'),
    info: (msg: string) => push(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-96 pointer-events-none">
        {toasts.map((t) => {
          const styles = VARIANT_STYLES[t.variant];
          const Icon = styles.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto ${styles.bg} ${styles.border} border rounded-2xl shadow-lg p-3 flex items-start gap-2.5 animate-in slide-in-from-right-2 fade-in`}
              role="alert"
            >
              <Icon className={`w-5 h-5 ${styles.text} flex-shrink-0 mt-0.5`} />
              <p className={`flex-1 text-sm ${styles.text}`}>{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className={`${styles.text} opacity-60 hover:opacity-100 transition-opacity`}
                aria-label="Mbyll"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}
