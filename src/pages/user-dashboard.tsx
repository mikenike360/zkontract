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
import { privateTransfer } from '@/utils/privateTransfer';
import { publicTransfer } from '@/utils/publicTransfer';
import { handleAcceptProposal } from '@/utils/acceptProposal';
import { handleDenyProposal } from '@/utils/denyProposal';

// Import your delete bounty function
import { handleDeleteBounty } from '@/utils/deleteBounty';

import { ProposalData, BountyData } from '@/types';

export default function UserDashboard() {
  const { wallet, publicKey } = useWallet();
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Payment method toggle per bounty
  const [transferMethod, setTransferMethod] = useState<Record<number, 'public' | 'private'>>({});
  // Track the stage for each proposal
  const [proposalStages, setProposalStages] = useState<Record<number, ProposalStage>>({});

  // Use the custom hook for dashboard data
  const { data, error, isLoading, mutate, fetchedBounties } = useDashboardData(publicKey);

  // Handlers
  async function onSendReward(bounty: BountyData, proposal: ProposalData) {
    if (!wallet || !publicKey) {
      alert('Connect your wallet before sending rewards.');
      return;
    }
    // Prevent duplicate processing
    if (
      proposalStages[proposal.proposalId] !== undefined &&
      proposalStages[proposal.proposalId] !== 'initial'
    ) {
      console.warn('Reward already sent or proposal accepted.');
      return;
    }

    setProposalStages((prev) => ({
      ...prev,
      [proposal.proposalId]: 'processing',
    }));

    const selectedMethod = transferMethod[bounty.id] || 'public';
    const rewardNumber = parseInt(bounty.reward, 10);

    try {
      if (selectedMethod === 'private') {
        await privateTransfer(
          wallet.adapter as any,
          publicKey,
          proposal.proposerAddress,
          rewardNumber,
          setTxStatus,
          bounty.id,
          proposal.proposalId
        );
      } else {
        await publicTransfer(
          wallet.adapter as any,
          publicKey,
          proposal.proposerAddress,
          rewardNumber,
          setTxStatus,
          bounty.id,
          proposal.proposalId
        );
      }
      setProposalStages((prev) => ({
        ...prev,
        [proposal.proposalId]: 'rewardSent',
      }));
      alert('Reward sent successfully! Now you can accept the proposal.');
    } catch (err) {
      console.error('Error sending reward:', err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setTxStatus(null);
    }
  }

  async function onAcceptProposal(bounty: BountyData, proposal: ProposalData) {
    if (!wallet || !publicKey) {
      alert('Connect your wallet before accepting proposals.');
      return;
    }
  
    setProposalStages((prev) => ({
      ...prev,
      [proposal.proposalId]: 'processing',
    }));
    const rewardAmount = `${bounty.reward}0000u64`;
    try {
      await handleAcceptProposal(
        wallet.adapter as any,
        publicKey,
        bounty,
        proposal,
        rewardAmount,
        setTxStatus,
        mutate
      );
      setProposalStages((prev) => ({
        ...prev,
        [proposal.proposalId]: 'accepted',
      }));
      mutate();
    } catch (err) {
      console.error('Error accepting proposal:', err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
      // Revert the proposal stage back to 'initial'
      setProposalStages((prev) => ({
        ...prev,
        [proposal.proposalId]: 'initial',
      }));
      setTxStatus(null);
    }
  }
  

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
      await handleDenyProposal(wallet.adapter as any, publicKey, bounty, proposal, setTxStatus, mutate);
      setProposalStages((prev) => ({
        ...prev,
        [proposal.proposalId]: 'denied',
      }));
    } catch (err) {
      console.error('Error denying proposal:', err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setTxStatus(null);
    }
  }

  // Handler for toggling transfer method
  function onToggleTransferMethod(bountyId: number, isPrivate: boolean) {
    setTransferMethod((prev) => ({
      ...prev,
      [bountyId]: isPrivate ? 'private' : 'public',
    }));
  }

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
        <h3 className="text-xl text-primary-content text-center mb-8">
          Note: Please verify you have enough public Aleo to cover transaction fees!
        </h3>

        {isLoading && <p className="text-center text-info">Loading...</p>}
        {error && <p className="text-center text-error">Error: {error.message}</p>}

        {data && (
          <>
            <DashboardProposals proposals={data.myProposals} fetchedBounties={fetchedBounties} />
            <DashboardBounties
              bounties={data.myBounties}
              proposalStages={proposalStages}
              transferMethod={transferMethod}
              onSendReward={onSendReward}
              onAcceptProposal={onAcceptProposal}
              onDenyProposal={onDenyProposal}
              onToggleTransferMethod={onToggleTransferMethod}

              // Pass handleDeleteBounty and everything else it needs:
              handleDeleteBounty={handleDeleteBounty}
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
