import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast, { Toast as ToastType } from './Toast';

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 5000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 space-y-2 pointer-events-none z-50">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
