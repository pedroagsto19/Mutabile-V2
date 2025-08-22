import React, { createContext, useContext } from 'react';
import { ToastContainer } from '../components/UI/Toast';
import { ConfirmDialog } from '../components/UI/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';

interface NotificationContextType {
  toast: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
  };
  confirm: (options: {
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
  }) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast, success, error, warning, info } = useToast();
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirm();

  return (
    <NotificationContext.Provider value={{
      toast: { success, error, warning, info },
      confirm
    }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        type={options.type}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
      />
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};