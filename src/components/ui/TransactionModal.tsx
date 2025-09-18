import React from 'react';
import Button from './button';

export type TransactionStatus = 'submitting' | 'submitted' | 'finalizing' | 'finalized' | 'error';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TransactionStatus;
  txId?: string;
  title: string;
  errorMessage?: string;
  onViewTransaction?: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  status,
  txId,
  title,
  errorMessage,
  onViewTransaction,
}) => {
  if (!isOpen) return null;

  const getStatusContent = () => {
    switch (status) {
      case 'submitting':
        return {
          icon: (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          ),
          heading: 'Submitting Transaction',
          message: 'Please sign the transaction in your wallet...',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          showClose: false,
        };
      
      case 'submitted':
        return {
          icon: (
            <div className="animate-pulse rounded-full h-8 w-8 bg-yellow-500 flex items-center justify-center">
              <span className="text-white text-sm">📤</span>
            </div>
          ),
          heading: 'Transaction Submitted',
          message: `Transaction submitted to the network.\nTX ID: ${txId || 'Loading...'}`,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          showClose: false,
        };
      
      case 'finalizing':
        return {
          icon: (
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-300">
                <div className="absolute top-0 left-0 h-8 w-8 border-2 border-transparent border-t-orange-600 rounded-full animate-spin"></div>
              </div>
            </div>
          ),
          heading: 'Finalizing Transaction',
          message: `Waiting for blockchain confirmation...\nThis may take up to 5 minutes.\n\nTX ID: ${txId || 'Loading...'}`,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          showClose: false,
        };
      
      case 'finalized':
        return {
          icon: (
            <div className="rounded-full h-8 w-8 bg-green-500 flex items-center justify-center">
              <span className="text-white text-lg">✓</span>
            </div>
          ),
          heading: 'Transaction Completed!',
          message: `Your transaction has been successfully finalized on the blockchain.\n\nTX ID: ${txId || 'N/A'}`,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          showClose: true,
        };
      
      case 'error':
        return {
          icon: (
            <div className="rounded-full h-8 w-8 bg-red-500 flex items-center justify-center">
              <span className="text-white text-lg">✕</span>
            </div>
          ),
          heading: 'Transaction Failed',
          message: errorMessage || 'An error occurred while processing your transaction.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          showClose: true,
        };
      
      default:
        return {
          icon: <div className="h-8 w-8"></div>,
          heading: '',
          message: '',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          showClose: true,
        };
    }
  };

  const statusContent = getStatusContent();

  const handleViewTransaction = () => {
    if (txId && onViewTransaction) {
      onViewTransaction();
    } else if (txId) {
      // Default behavior - open Aleo explorer
      window.open(`https://testnet.explorer.provable.com/transaction/${txId}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 ${statusContent.bgColor} ${statusContent.borderColor} border-2`}>
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="mr-4">
            {statusContent.icon}
          </div>
          <div>
            <h2 className={`text-lg font-bold ${statusContent.textColor}`}>
              {title}
            </h2>
            <p className={`text-sm ${statusContent.textColor} opacity-75`}>
              {statusContent.heading}
            </p>
          </div>
        </div>

        {/* Message */}
        <div className={`mb-6 ${statusContent.textColor}`}>
          <p className="whitespace-pre-line text-sm">{statusContent.message}</p>
        </div>

        {/* Progress indicator for finalizing */}
        {status === 'finalizing' && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">Confirming on blockchain...</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          {txId && status !== 'submitting' && (
            <Button
              onClick={handleViewTransaction}
              className="btn btn-outline btn-sm"
            >
              View on Explorer
            </Button>
          )}
          
          {statusContent.showClose && (
            <Button
              onClick={onClose}
              className="btn btn-primary btn-sm"
            >
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
