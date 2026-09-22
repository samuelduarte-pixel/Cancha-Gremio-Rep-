import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// =============================================
// Toast / Notification Context
// =============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// Inline Toast UI
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  const colors: Record<ToastType, string> = {
    success: '#4ade80',
    error: '#f87171',
    warning: '#fb923c',
    info: '#38bdf8',
  };
  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => onRemove(t.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#0d1410', border: `1px solid ${colors[t.type]}40`,
            borderLeft: `3px solid ${colors[t.type]}`,
            color: '#e8f5ec', padding: '12px 16px',
            borderRadius: 8, cursor: 'pointer', minWidth: 260,
            boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
            animation: 'fadeUp 0.3s ease',
          }}
        >
          <span style={{ color: colors[t.type], fontWeight: 700, fontSize: '1rem' }}>
            {icons[t.type]}
          </span>
          <span style={{ fontSize: '0.875rem', flex: 1 }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
