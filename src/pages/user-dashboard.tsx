// src/pages/user-dashboard.tsx
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import BackArrow from '@/components/ui/BackArrow';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { useState } from 'react';
import { useDashboardData } from '@/hooks/userDashboardData';
import DashboardProposals from '@/components/ui/DashboardProposals';
import DashboardBounties, { ProposalStage } from '@/components/ui/DashboardBounties';
import Button from '@/components/ui/button';
import AlertModal from '@/components/ui/AlertModal';
import { useAlertModal } from '@/hooks/useAlertModal';
import TransactionModal from '@/components/ui/TransactionModal';
import { useTransactionModal } from '@/hooks/useTransactionModal';
// Removed old transfer utility imports - now using escrow-based transactions
// Removed handleDenyProposal import as we now use transaction modal

// Import your delete functions
// Removed handleDeleteBounty import as we now use escrow-based cancel functionality
import { handleDeleteProposal } from '@/utils/deleteProposal';

import { Transaction } from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { CURRENT_NETWORK, BOUNTY_PROGRAM_ID } from '@/types';
import { getFeeForFunction } from '@/utils/feeCalculator';

import { ProposalData, BountyData } from '@/types';

// Helper function to wait for transaction finalization
async function waitForTransactionFinalization(
  wallet: any,
  txId: string,
  setTxStatus: (status: string | null) => void
): Promise<void> {
  setTxStatus(`Transaction submitted: ${txId}. Waiting for finalization...`);
  
  let finalized = false;
  for (let attempt = 0; attempt < 300; attempt++) { // Wait up to 5 minutes
    try {
      const status = await (wallet.adapter as LeoWalletAdapter).transactionStatus(txId);
      if (status === 'Finalized') {
        finalized = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    } catch (statusErr) {
      console.log('Checking transaction status...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  
  if (!finalized) {
    throw new Error('Transaction did not finalize in time. Please check the blockchain explorer.');
  }
}

export default function UserDashboard() {
  const { wallet, publicKey } = useWallet();
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Payment method toggle per bounty
  // Removed transferMethod state as we now use escrow for all transactions
  // Track the stage for each proposal
  const [proposalStages, setProposalStages] = useState<Record<number, ProposalStage>>({});

  // Custom hook providing dashboard data
  const { data, error, isLoading, mutate } = useDashboardData(publicKey);

  // Alert modal hook
  const { alertState, hideAlert, showSuccess, showError, showConfirm } = useAlertModal();
  
  // Transaction modal hook
  const { modalState, executeTransactionWithModal, hideTransactionModal } = useTransactionModal();

  // Handler for accepting a proposal.
  async function onAcceptProposal(bounty: BountyData, proposal: ProposalData) {
    if (!wallet || !publicKey) {
      showError('Wallet Required', 'Please connect your wallet before accepting proposals.');
      return;
    }
    if (publicKey !== bounty.creatorAddress) {
      showError('Permission Denied', 'Only the bounty creator can accept proposals.');
      return;
    }

    setProposalStages((prev) => ({
      ...prev,
      [proposal.proposalId]: 'processing',
    }));

    await executeTransactionWithModal(
      'Accept Proposal',
      // Transaction function
      async () => {
        const inputs = [
          publicKey, // caller
          `${bounty.id}u64`,
          `${proposal.proposalId}u64`,
          bounty.creatorAddress,
          `${parseFloat(bounty.reward) * 1_000_000}u64`,
          proposal.proposerAddress,
        ];
        const fee = getFeeForFunction('accept_proposal');
        const tx = Transaction.createTransaction(
          publicKey,
          CURRENT_NETWORK,
          BOUNTY_PROGRAM_ID,
          'accept_proposal',
          inputs,
          fee,
          false  // Use public fees
        );
        const txId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(tx);
        return txId;
      },
      // Finalization function
      async (txId: string) => {
        await waitForTransactionFinalization(wallet, txId, () => {});
        
        // Update proposal status in S3 database
        const response = await fetch('/api/update-proposal-status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bountyId: bounty.id,
            proposalId: proposal.proposalId,
            newStatus: 'accepted',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update proposal status in the database.');
        }
      },
      // Success callback
      () => {
        setProposalStages((prev) => ({
          ...prev,
          [proposal.proposalId]: 'accepted',
        }));
        mutate();
        showSuccess('Proposal Accepted!', 'The proposal has been accepted and funds have been released to the proposer via escrow.');
      }
    ).catch((err) => {
      console.error('Error accepting proposal:', err);
      setProposalStages((prev) => ({
        ...prev,
        [proposal.proposalId]: 'initial',
      }));
    });
  }


  // Handler for canceling a bounty and getting refund
  async function onCancelBounty(bounty: BountyData) {
    if (!wallet || !publicKey) {
      showError('Wallet Required', 'Connect your wallet before canceling bounties.');
      return;
    }
    if (publicKey !== bounty.creatorAddress) {
      showError('Permission Denied', 'Only the bounty creator can cancel their bounty.');
      return;
    }

    // Show confirmation modal
    showConfirm(
      'Cancel Bounty',
      `Are you sure you want to cancel bounty "${bounty.title}"?\n\n` +
      `This will refund the escrowed funds back to you.\n` +
      `The bounty will be removed from the platform.\n\n` +
      `This action cannot be undone.`,
      () => {
        // Confirmation callback - proceed with canceling
        cancelBountyAction(bounty);
      },
      {
        confirmText: 'Cancel Bounty',
        cancelText: 'Keep Bounty'
      }
    );
  }

  // Separate function for the actual canceling action
  async function cancelBountyAction(bounty: BountyData) {
    if (!wallet || !publicKey) {
      showError('Wallet Error', 'Wallet not connected.');
      return;
    }

    await executeTransactionWithModal(
      'Cancel Bounty',
      // Transaction function
      async () => {
        const inputs = [
          publicKey, // caller (creator)
          `${bounty.id}u64`,
          `${parseFloat(bounty.reward) * 1_000_000}u64`,
        ];
        const fee = getFeeForFunction('cancel_bounty_escrow');
        const tx = Transaction.createTransaction(
          publicKey,
          CURRENT_NETWORK,
          BOUNTY_PROGRAM_ID,
          'cancel_bounty_escrow',
          inputs,
          fee,
          false  // Use public fees
        );
        const txId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(tx);
        return txId;
      },
      // Finalization function
      async (txId: string) => {
        await waitForTransactionFinalization(wallet, txId, () => {});
        
        // Delete bounty from S3 after successful blockchain transaction
        const response = await fetch('/api/delete-bounty', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            caller: publicKey,
            bountyId: bounty.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete bounty from platform');
        }
      },
      // Success callback
      () => {
        mutate();
        showSuccess('Bounty Canceled', 'Bounty canceled, funds refunded, and removed from platform successfully!');
      }
    ).catch((err) => {
      console.error('Error canceling bounty:', err);
    });
  }

  // Handler for closing a bounty (deleting from S3).
  async function onCloseBounty(bounty: BountyData) {
    if (!publicKey) {
      showError('Wallet Error', 'Wallet not connected.');
      return;
    }

    // Show confirmation modal
    showConfirm(
      'Close Bounty',
      `Are you sure you want to close bounty "${bounty.title}"?\n\n` +
      `This will permanently delete the bounty from the platform.\n` +
      `The accepted proposal and any payments are already completed.\n\n` +
      `This action cannot be undone.`,
      () => {
        // Confirmation callback - proceed with closing
        closeBountyAction(bounty);
      },
      {
        confirmText: 'Close Bounty',
        cancelText: 'Cancel'
      }
    );
  }

  // Separate function for the actual closing action
  async function closeBountyAction(bounty: BountyData) {
    if (!publicKey) {
      showError('Wallet Error', 'Wallet not connected.');
      return;
    }

    try {
      setTxStatus('Closing bounty...');
      
      // Delete bounty from S3
      const response = await fetch('/api/delete-bounty', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caller: publicKey,
          bountyId: bounty.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete bounty');
      }

      setTxStatus(null);
      mutate();
      showSuccess('Bounty Closed', 'The bounty has been successfully closed and removed from the platform.');
    } catch (err) {
      console.error('Error closing bounty:', err);
      showError('Close Failed', `Error: ${err instanceof Error ? err.message : String(err)}`);
      setTxStatus(null);
    }
  }

  // Handler for denying a proposal.
  async function onDenyProposal(bounty: BountyData, proposal: ProposalData) {
    if (!wallet || !publicKey) {
      showError('Wallet Required', 'Connect your wallet before denying proposals.');
      return;
    }
    const currentStage = proposalStages[proposal.proposalId] || 'initial';
    if (currentStage !== 'initial') {
      showError('Invalid Action', 'Cannot deny after sending reward or accepting proposal.');
      return;
    }

    setProposalStages((prev) => ({
      ...prev,
      [proposal.proposalId]: 'processing',
    }));

    await executeTransactionWithModal(
      'Deny Proposal',
      // Transaction function
      async () => {
        const inputs = [
          publicKey,                    // Caller
          `${bounty.id}u64`,            // Bounty ID
          `${proposal.proposalId}u64`,  // Proposal ID
        ];
        const fee = getFeeForFunction('deny_proposal');
        const tx = Transaction.createTransaction(
          publicKey,
          CURRENT_NETWORK,
          BOUNTY_PROGRAM_ID,
          'deny_proposal',
          inputs,
          fee,
          false  // Use public fees
        );
        const txId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(tx);
        return txId;
      },
      // Finalization function
      async (txId: string) => {
        await waitForTransactionFinalization(wallet, txId, () => {});
        
        // Update proposal status in S3 database
        const response = await fetch('/api/update-proposal-status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bountyId: bounty.id,
            proposalId: proposal.proposalId,
            newStatus: 'denied',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update proposal status in the database.');
        }
      },
      // Success callback
      () => {
        setProposalStages((prev) => ({
          ...prev,
          [proposal.proposalId]: 'denied',
        }));
        mutate();
        showSuccess('Proposal Denied!', 'The proposal has been denied successfully.');
      }
    ).catch((err) => {
      console.error('Error denying proposal:', err);
      setProposalStages((prev) => ({
        ...prev,
        [proposal.proposalId]: 'initial',
      }));
    });
  }

  // Handler for deleting a proposal from the dashboard.
  async function onDeleteProposal(bountyId: number, proposalId: number) {
    if (!wallet || !publicKey) {
      showError('Wallet Required', 'Connect your wallet before deleting a proposal.');
      return;
    }

    // Find the proposal to get additional context
    const proposal = data?.myProposals.find(p => p.proposalId === proposalId);
    const bountyExists = data?.myBounties.some(b => b.id === bountyId);
    const isAccepted = proposal?.status?.toLowerCase() === 'accepted';
    
    let message = `Are you sure you want to delete this proposal?\n\n` +
                 `Proposal ID: ${proposalId}\n` +
                 `Bounty ID: ${bountyId}\n`;
    
    if (isAccepted && !bountyExists) {
      message += `\nThis is an accepted proposal from a closed bounty.\n` +
                 `The payment was already completed when the proposal was accepted.\n`;
    }
    
    message += `\nThis action cannot be undone.`;

    // Show confirmation modal
    showConfirm(
      'Delete Proposal',
      message,
      () => {
        // Confirmation callback - proceed with deletion
        deleteProposalAction(bountyId, proposalId);
      },
      {
        confirmText: 'Delete Proposal',
        cancelText: 'Keep Proposal'
      }
    );
  }

  // Separate function for the actual deletion action
  async function deleteProposalAction(bountyId: number, proposalId: number) {
    if (!publicKey) {
      showError('Wallet Not Connected', 'Please connect your wallet to delete proposals.');
      return;
    }
    
    try {
      await handleDeleteProposal({
        caller: publicKey,
        bountyId,
        proposalId,
        wallet,
      });
      showSuccess('Proposal Deleted', 'Proposal deleted successfully.');
      mutate();
    } catch (err) {
      console.error('Error deleting proposal:', err);
      showError('Delete Failed', `Error deleting proposal: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Handler for toggling transfer method.
  // Removed onToggleTransferMethod as we now use escrow for all transactions

  return (
    <Layout>
      <NextSeo
        title="zKontract | My Dashboard"
        description="View or manage your bounties and proposals."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mt-20 sm:mt-28">
        
        {/* Enhanced Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-primary text-2xl">📊</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-base-content">
              My Dashboard
            </h1>
          </div>
          <p className="text-base-content/70 text-lg max-w-2xl mx-auto">
            Manage your bounties and track your proposals
          </p>
          
          {/* Stats Section */}
          {data && (
            <div className="flex justify-center mt-8">
              <div className="stats stats-horizontal shadow-lg bg-base-100 border border-base-300">
                <div className="stat">
                  <div className="stat-figure text-primary">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="stat-title">Posted Bounties</div>
                  <div className="stat-value text-primary">{data.myBounties.length}</div>
                  <div className="stat-desc">Your active bounties</div>
                </div>
                
                <div className="stat">
                  <div className="stat-figure text-success">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="stat-title">Submitted Proposals</div>
                  <div className="stat-value text-success">{data.myProposals.length}</div>
                  <div className="stat-desc">Your applications</div>
                </div>
                
                <div className="stat">
                  <div className="stat-figure text-warning">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="stat-title">Accepted Proposals</div>
                  <div className="stat-value text-warning">{data.myProposals.filter(p => p.status === 'accepted').length}</div>
                  <div className="stat-desc">Successful applications</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
              <h3 className="text-lg font-semibold text-base-content mb-2">Loading Dashboard</h3>
              <p className="text-base-content/70">Fetching your bounties and proposals...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">😕</div>
              <h3 className="text-xl font-semibold text-base-content mb-2">Unable to Load Dashboard</h3>
              <p className="text-base-content/70 mb-4">
                We encountered an error while loading your dashboard data.
              </p>
              <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-4">
                <p className="text-error text-sm font-medium">{error?.message}</p>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-primary btn-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {data && (
          <>
            <DashboardProposals
              proposals={data.myProposals}
              onDeleteProposal={onDeleteProposal}
              bounties={data.myBounties}
            />
            <DashboardBounties
              bounties={data.myBounties}
              proposalStages={proposalStages}
              onAcceptProposal={onAcceptProposal}
              onDenyProposal={onDenyProposal}
              onCancelBounty={onCancelBounty}
              onCloseBounty={onCloseBounty}
              wallet={wallet}
              publicKey={publicKey}
              setTxStatus={setTxStatus}
              mutate={mutate}
            />
          </>
        )}


        <div className="mt-8 text-center">
          <BackArrow />
        </div>
      </div>

      {/* Custom Alert Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        showCancel={alertState.showCancel}
        onConfirm={alertState.onConfirm}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
      />

      {/* Transaction Progress Modal */}
      <TransactionModal
        isOpen={modalState.isOpen}
        onClose={hideTransactionModal}
        status={modalState.status}
        title={modalState.title}
        txId={modalState.txId}
        errorMessage={modalState.errorMessage}
      />
    </Layout>
  );
}
