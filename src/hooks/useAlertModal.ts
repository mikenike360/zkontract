import { useState } from 'react';
import { AlertType } from '@/components/ui/AlertModal';

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: AlertType;
  showCancel: boolean;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const useAlertModal = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    showCancel: false,
  });

  const showAlert = (
    title: string,
    message: string,
    type: AlertType = 'info',
    options?: {
      showCancel?: boolean;
      onConfirm?: () => void;
      confirmText?: string;
      cancelText?: string;
    }
  ) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
      showCancel: options?.showCancel || false,
      onConfirm: options?.onConfirm,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  // Convenience methods for different alert types
  const showSuccess = (title: string, message: string, options?: Parameters<typeof showAlert>[3]) => {
    showAlert(title, message, 'success', options);
  };

  const showError = (title: string, message: string, options?: Parameters<typeof showAlert>[3]) => {
    showAlert(title, message, 'error', options);
  };

  const showWarning = (title: string, message: string, options?: Parameters<typeof showAlert>[3]) => {
    showAlert(title, message, 'warning', options);
  };

  const showInfo = (title: string, message: string, options?: Parameters<typeof showAlert>[3]) => {
    showAlert(title, message, 'info', options);
  };

  // Confirmation dialog
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
    }
  ) => {
    showAlert(title, message, 'warning', {
      showCancel: true,
      onConfirm,
      confirmText: options?.confirmText || 'Confirm',
      cancelText: options?.cancelText || 'Cancel',
    });
  };

  return {
    alertState,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
};
