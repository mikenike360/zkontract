import React from 'react';
import Button from './button';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: AlertType;
  showCancel?: boolean;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  showCancel = false,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          buttonColor: 'btn-success',
        };
      case 'error':
        return {
          icon: '❌',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          buttonColor: 'btn-error',
        };
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          buttonColor: 'btn-warning',
        };
      case 'info':
      default:
        return {
          icon: 'ℹ️',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          buttonColor: 'btn-primary',
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 ${styles.bgColor} ${styles.borderColor} border-2`}>
        {/* Header */}
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">{styles.icon}</span>
          <h2 className={`text-lg font-bold ${styles.textColor}`}>
            {title}
          </h2>
        </div>

        {/* Message */}
        <div className={`mb-6 ${styles.textColor}`}>
          <p className="whitespace-pre-line">{message}</p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          {showCancel && (
            <Button
              onClick={handleCancel}
              className="btn btn-outline btn-sm"
            >
              {cancelText}
            </Button>
          )}
          <Button
            onClick={showCancel ? handleConfirm : onClose}
            className={`btn btn-sm ${styles.buttonColor}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
