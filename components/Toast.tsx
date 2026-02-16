
import React, { useState, useEffect, createContext, useContext } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white flex items-center justify-between min-w-[250px] animate-slide-up ${
            toast.type === 'success' ? 'bg-green-600' :
            toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="ml-4 text-white opacity-75 hover:opacity-100">&times;</button>
        </div>
      ))}
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  // Simple implementation if context is not yet set up
  return {
    showToast: (msg: string, type: ToastType) => {
      console.log(`[Toast ${type}]: ${msg}`);
      // In a real app we'd use state dispatch here
    }
  };
};
