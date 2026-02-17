import { useState, useCallback } from 'react';
import { ToastNotification } from '../components/kawaii/NotificationToast';
import { useAriaAnnouncer } from '../providers/AriaAnnouncerProvider';

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  
  // Get ARIA announcer - wrapped in try-catch for backward compatibility
  let ariaAnnouncer: ReturnType<typeof useAriaAnnouncer> | null = null;
  try {
    ariaAnnouncer = useAriaAnnouncer();
  } catch (e) {
    // AriaAnnouncerProvider not available - continue without it
  }

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
      
      // Also announce via ARIA live region
      if (ariaAnnouncer) {
        const announcement = `${title}: ${message}`;
        if (type === 'error') {
          ariaAnnouncer.announceError(announcement);
        } else if (type === 'success') {
          ariaAnnouncer.announceSuccess(announcement);
        } else {
          ariaAnnouncer.announceInfo(announcement);
        }
      }
    },
    [ariaAnnouncer]
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
