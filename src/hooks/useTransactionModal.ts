import { useState } from 'react';
import { TransactionStatus } from '@/components/ui/TransactionModal';

interface TransactionModalState {
  isOpen: boolean;
  status: TransactionStatus;
  title: string;
  txId?: string;
  errorMessage?: string;
}

export const useTransactionModal = () => {
  const [modalState, setModalState] = useState<TransactionModalState>({
    isOpen: false,
    status: 'submitting',
    title: '',
    txId: undefined,
    errorMessage: undefined,
  });

  const showTransactionModal = (title: string) => {
    setModalState({
      isOpen: true,
      status: 'submitting',
      title,
      txId: undefined,
      errorMessage: undefined,
    });
  };

  const updateTransactionStatus = (
    status: TransactionStatus,
    data?: {
      txId?: string;
      errorMessage?: string;
    }
  ) => {
    setModalState(prev => ({
      ...prev,
      status,
      txId: data?.txId || prev.txId,
      errorMessage: data?.errorMessage,
    }));
  };

  const hideTransactionModal = () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false,
    }));
  };

  // Helper function to handle the complete transaction flow
  const executeTransactionWithModal = async (
    title: string,
    transactionFunction: () => Promise<string>, // Should return txId
    finalizationFunction: (txId: string) => Promise<void>,
    successCallback?: () => void
  ) => {
    try {
      // Show modal in submitting state
      showTransactionModal(title);

      // Execute the transaction
      const txId = await transactionFunction();
      
      // Update to submitted state
      updateTransactionStatus('submitted', { txId });

      // Wait a moment for user to see the submitted state
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update to finalizing state
      updateTransactionStatus('finalizing');

      // Wait for finalization
      await finalizationFunction(txId);

      // Update to finalized state
      updateTransactionStatus('finalized');

      // Execute success callback if provided
      if (successCallback) {
        successCallback();
      }

    } catch (error) {
      console.error('Transaction error:', error);
      updateTransactionStatus('error', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  return {
    modalState,
    showTransactionModal,
    updateTransactionStatus,
    hideTransactionModal,
    executeTransactionWithModal,
  };
};
