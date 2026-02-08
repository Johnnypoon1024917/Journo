import { useState, useCallback } from 'react';
import { ToastNotification } from '../components/kawaii/NotificationToast';

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback(
    (
      type: ToastNotification['type'],
      title: string,
      message: string,
      options?: {
        duration?: number;
        action?: ToastNotification['action'];
      }
    ) => {
      const id = `toast-${toastId++}`;
      const newToast: ToastNotification = {
        id,
        type,
        title,
        message,
        duration: options?.duration,
        action: options?.action,
      };

      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback(
    (title: string, message: string, options?: { duration?: number; action?: ToastNotification['action'] }) => {
      showToast('success', title, message, options);
    },
    [showToast]
  );

  const showError = useCallback(
    (title: string, message: string, options?: { duration?: number; action?: ToastNotification['action'] }) => {
      showToast('error', title, message, options);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message: string, options?: { duration?: number; action?: ToastNotification['action'] }) => {
      showToast('info', title, message, options);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, message: string, options?: { duration?: number; action?: ToastNotification['action'] }) => {
      showToast('warning', title, message, options);
    },
    [showToast]
  );

  return {
    toasts,
    showToast,
    dismissToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};
