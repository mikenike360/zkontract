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
// Removed old transfer utility imports - now using escrow-based transactions
import { handleDenyProposal } from '@/utils/denyProposal';

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

  // Handler for accepting a proposal.
  async function onAcceptProposal(bounty: BountyData, proposal: ProposalData) {
    if (!wallet || !publicKey) {
      alert('Connect your wallet before accepting proposals.');
      return;
    }
    if (publicKey !== bounty.creatorAddress) {
      alert('Only the bounty creator can accept proposals.');
      return;
    }
    setProposalStages((prev) => ({
      ...prev,
      [proposal.proposalId]: 'processing',
    }));
    try {
      // Prepare inputs for zkontract_v2.aleo/accept_proposal
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
      await waitForTransactionFinalization(wallet, txId, setTxStatus);
      setTxStatus(`Proposal accepted! Transaction finalized: ${txId}`);
      setProposalStages((prev) => ({
        ...prev,
        [proposal.proposalId]: 'accepted',
      }));
      mutate();
      alert('Proposal accepted and finalized! Funds released to proposer via escrow.');
    } catch (err) {
      console.error('Error accepting proposal:', err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setProposalStages((prev) => ({
        ...prev,
        [proposal.proposalId]: 'initial',
      }));
      setTxStatus(null);
    }
  }

  // Handler for claiming payment (for proposers)
  async function onClaimPayment(bounty: BountyData, proposal: ProposalData) {
    if (!wallet || !publicKey) {
      alert('Connect your wallet before claiming payment.');
      return;
    }
    if (publicKey !== proposal.proposerAddress) {
      alert('Only the proposer can claim their reward.');
      return;
    }
    setProposalStages((prev) => ({
      ...prev,
      [proposal.proposalId]: 'processing',
    }));
    try {
      const inputs = [
        publicKey, // caller (proposer)
        `${bounty.id}u64`,
        `${proposal.proposalId}u64`,
        `${parseFloat(bounty.reward) * 1_000_000}u64`,
      ];
      const fee = getFeeForFunction('claim_payment');
      const tx = Transaction.createTransaction(
        publicKey,
        CURRENT_NETWORK,
        BOUNTY_PROGRAM_ID,
        'claim_payment',
        inputs,
        fee,
        false  // Use public fees
      );
      const txId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(tx);
      await waitForTransactionFinalization(wallet, txId, setTxStatus);
      setTxStatus(`Payment claimed! Transaction finalized: ${txId}`);
      setProposalStages((prev) => ({
        ...prev,
        [proposal.proposalId]: 'accepted',
      }));
      mutate();
      alert('Payment claimed and finalized successfully!');
    } catch (err) {
      console.error('Error claiming payment:', err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setProposalStages((prev) => ({
        ...prev,
        [proposal.proposalId]: 'accepted',
      }));
      setTxStatus(null);
    }
  }

  // Handler for canceling a bounty and getting refund
  async function onCancelBounty(bounty: BountyData) {
    if (!wallet || !publicKey) {
      alert('Connect your wallet before canceling bounties.');
      return;
    }
    if (publicKey !== bounty.creatorAddress) {
      alert('Only the bounty creator can cancel their bounty.');
      return;
    }
    if (window.confirm(`Are you sure you want to cancel bounty "${bounty.title}"? This will refund the escrowed funds to you.`)) {
      try {
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
        await waitForTransactionFinalization(wallet, txId, setTxStatus);
        setTxStatus(`Bounty canceled! Transaction finalized: ${txId}`);
        mutate();
        alert('Bounty canceled and funds refunded successfully!');
      } catch (err) {
        console.error('Error canceling bounty:', err);
        alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
        setTxStatus(null);
      }
    }
  }

  // Handler for denying a proposal.
  async function onDenyProposal(bounty: BountyData, proposal: ProposalData) {
    if (!wallet || !publicKey) {
      alert('Connect your wallet before denying proposals.');
      return;
    }
    const currentStage = proposalStages[proposal.proposalId] || 'initial';
    if (currentStage !== 'initial') {
      alert('Cannot deny after sending reward or accepting proposal.');
      return;
    }
    try {
      await handleDenyProposal(wallet.adapter as any, publicKey, bounty, proposal, setTxStatus);
      setProposalStages((prev) => ({
        ...prev,
        [proposal.proposalId]: 'denied',
      }));
      mutate();
    } catch (err) {
      console.error('Error denying proposal:', err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setTxStatus(null);
    }
  }

  // Handler for deleting a proposal from the dashboard.
  async function onDeleteProposal(bountyId: number, proposalId: number) {
    if (!wallet || !publicKey) {
      alert('Connect your wallet before deleting a proposal.');
      return;
    }
    try {
      await handleDeleteProposal({
        caller: publicKey,
        bountyId,
        proposalId,
      });
      alert('Proposal deleted successfully.');
      mutate();
    } catch (err) {
      console.error('Error deleting proposal:', err);
      alert(`Error deleting proposal: ${err instanceof Error ? err.message : String(err)}`);
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
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 mt-24 sm:mt-16">
        <h1 className="text-2xl font-bold text-primary-content text-center mb-8">
          My Dashboard
        </h1>
        {/* <h3 className="text-xl text-primary-content text-center mb-8">
          Note: Please verify you have enough PRIVATE Aleo to cover transaction fees!
        </h3> */}

        {isLoading && <p className="text-center text-info">Loading...</p>}
        {error && <p className="text-center text-error">Error: {error?.message}</p>}

        {data && (
          <>
            <DashboardProposals
              proposals={data.myProposals}
              // handleDeleteProposal removed
            />
            <DashboardBounties
              bounties={data.myBounties}
              proposalStages={proposalStages}
              onAcceptProposal={onAcceptProposal}
              onDenyProposal={onDenyProposal}
              onClaimPayment={onClaimPayment}
              onCancelBounty={onCancelBounty}
              wallet={wallet}
              publicKey={publicKey}
              setTxStatus={setTxStatus}
              mutate={mutate}
            />
          </>
        )}

        {txStatus && (
          <div className="text-center text-sm text-primary mt-4">
            Transaction Status: {txStatus}
          </div>
        )}

        <div className="mt-8 text-center">
          <BackArrow />
        </div>
      </div>
    </Layout>
  );
}
