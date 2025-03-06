import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import BackArrow from '@/components/ui/BackArrow';
import useSWR from 'swr';
import ProposalItem, { ProposalData } from '@/components/ui/ProposalItem';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { useEffect, useState } from 'react';

// --- Import your new utilities ---
import { privateTransfer } from '../utils/privateTransfer';
import { publicTransfer } from '../utils/publicTransfer';
import { handleAcceptProposal } from '../utils/acceptProposal';
import { handleDenyProposal } from '../utils/denyProposal';
import { handleDeleteBounty } from '@/utils/deleteBounty';

import Button from '@/components/ui/button';

// ---------- Types ----------
type BountyData = {
  id: number;
  title: string;
  reward: string; // e.g. "5000"
  deadline: string;
  creatorAddress: string;
  proposals?: ProposalData[];
};

type DashboardData = {
  myBounties: BountyData[];
  myProposals: ProposalData[];
};

// ---------- Types ----------
// Extend the ProposalStage union to include "processing".
type ProposalStage = 'initial' | 'processing' | 'rewardSent' | 'accepted' | 'denied';

export default function UserDashboard() {
  const { wallet, publicKey } = useWallet();
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // 1) Payment method toggle: "public" or "private", keyed by bountyId
  const [transferMethod, setTransferMethod] = useState<Record<number, 'public' | 'private'>>({});

  // 2) Track the stage for each proposal. Keyed by proposalId -> stage
  const [proposalStages, setProposalStages] = useState<Record<number, ProposalStage>>({});

  // Fetcher for SWR
  const fetchDashboard = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to load dashboard');
    }
    return (await res.json()) as DashboardData;
  };

  // 3) Load data with SWR
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    publicKey ? `/api/my-dashboard?publicKey=${publicKey}` : null,
    fetchDashboard
  );

  // 4) Also store bounties you retrieve individually
  const [fetchedBounties, setFetchedBounties] = useState<Record<number, BountyData>>({});

  useEffect(() => {
    if (data?.myProposals) {
      const uniqueBountyIds = Array.from(new Set(data.myProposals.map((p) => p.bountyId)));
      uniqueBountyIds.forEach(async (bountyId) => {
        if (!fetchedBounties[bountyId]) {
          try {
            const res = await fetch(`/api/get-bounty?id=${bountyId}`);
            if (res.ok) {
              const bounty = (await res.json()) as BountyData;
              setFetchedBounties((prev) => ({ ...prev, [bountyId]: bounty }));
            } else {
              console.error(`Error fetching bounty ${bountyId}:`, await res.text());
            }
          } catch (err) {
            console.error(`Error fetching bounty ${bountyId}:`, err);
          }
        }
      });
    }
  }, [data?.myProposals, fetchedBounties]);

  // Helper: group proposals by bountyId
  function groupProposalsByBounty(proposals: ProposalData[]) {
    return proposals.reduce<Record<number, ProposalData[]>>((acc, proposal) => {
      const { bountyId } = proposal;
      if (!acc[bountyId]) acc[bountyId] = [];
      acc[bountyId].push(proposal);
      return acc;
    }, {});
  }

  // ---------- Step 1: Transfer Reward Only ----------
  async function onSendReward(bounty: BountyData, proposal: ProposalData) {
    if (!wallet || !publicKey) {
      alert('Connect your wallet before sending rewards.');
      return;
    }
    try {
      // Do not allow if already processed.
      if (proposalStages[proposal.proposalId] !== undefined &&
          proposalStages[proposal.proposalId] !== 'initial') {
        console.warn('Reward already sent or proposal accepted.');
        return;
      }
      
      // Immediately set stage to "processing" to update UI
      setProposalStages((prev) => ({
        ...prev,
        [proposal.proposalId]: 'processing',
      }));

      const selectedMethod = transferMethod[bounty.id] || 'public';
      const rewardNumber = parseInt(bounty.reward, 10);

      if (selectedMethod === 'private') {
        await privateTransfer(
          wallet.adapter as any,
          publicKey,
          proposal.proposerAddress,
          rewardNumber,
          setTxStatus
        );
      } else {
        await publicTransfer(
          wallet.adapter as any,
          publicKey,
          proposal.proposerAddress,
          rewardNumber,
          setTxStatus
        );
      }

      // Update state to "rewardSent" after polling completes
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

// ---------- Step 2: Accept Proposal (after reward is sent) ----------
async function onAcceptProposal(bounty: BountyData, proposal: ProposalData) {
  if (!wallet || !publicKey) {
    alert('Connect your wallet before accepting proposals.');
    return;
  }
  try {
    if (proposalStages[proposal.proposalId] !== 'rewardSent') {
      alert('You must send the reward before accepting the proposal.');
      return;
    }
    
    // Set stage to "processing" for the accept proposal polling.
    setProposalStages((prev) => ({
      ...prev,
      [proposal.proposalId]: 'processing',
    }));

    const rewardAmount = `${bounty.reward}0000u64`;

    await handleAcceptProposal(
      wallet.adapter as any,
      publicKey,
      bounty,
      proposal,
      rewardAmount,
      setTxStatus,
      mutate
    );

    // Once finalized, update to "accepted"
    setProposalStages((prev) => ({
      ...prev,
      [proposal.proposalId]: 'accepted',
    }));

    // Call mutate() here to refresh the dashboard data.
    mutate(undefined, true);
  } catch (err) {
    console.error('Error accepting proposal:', err);
    alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    setTxStatus(null);
  }
}


  // ---------- Deny Proposal (Optional) ----------
  async function onDenyProposal(bounty: BountyData, proposal: ProposalData) {
    if (!wallet || !publicKey) {
      alert('Connect your wallet before denying proposals.');
      return;
    }
    try {
      const currentStage = proposalStages[proposal.proposalId] || 'initial';
      if (currentStage !== 'initial') {
        alert('Cannot deny after sending reward or accepting proposal.');
        return;
      }

      await handleDenyProposal(
        wallet.adapter as any,
        publicKey,
        bounty,
        proposal,
        setTxStatus,
        mutate
      );
      // Mark the proposal as denied in local state.
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

        {/* (A) My Submitted Proposals – no action buttons here */}
        {data && (
          <div className="space-y-12">
            <div>
              <h2 className="text-xl font-semibold text-primary-content mb-4">
                My Submitted Proposals
              </h2>
              {data.myProposals.length > 0 ? (
                (() => {
                  const proposalsByBounty = groupProposalsByBounty(data.myProposals);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-base-content">
                      {Object.entries(proposalsByBounty).map(([bountyId, proposals]) => {
                        const bounty = fetchedBounties[+bountyId];
                        return (
                          <div
                            key={bountyId}
                            className="card rounded-lg shadow p-4 bg-base-100 border"
                          >
                            <p className="font-semibold mb-2">Bounty ID: {bountyId}</p>
                            {bounty ? (
                              <p className="mb-2">Bounty Title: {bounty.title}</p>
                            ) : (
                              <p className="mb-2 italic">Loading bounty info...</p>
                            )}
                            <ul className="space-y-2">
                              {proposals.map((prop) => (
                                <li key={`${prop.bountyId}-${prop.proposalId}`}>
                                  <div className="card p-4 bg-base-200 border">
                                    <ProposalItem
                                      proposal={prop}
                                      bounty={bounty}
                                      showActions={true}
                                    />
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <p className="text-primary-content">
                  You haven’t submitted any proposals yet.
                </p>
              )}
            </div>

            {/* (B) My Posted Bounties – action buttons appear here */}
            <div>
              <h2 className="text-xl font-semibold text-primary-content mb-4">
                My Posted Bounties
              </h2>
              {data.myBounties.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-primary-content">
                    {data.myBounties.map((bounty) => {
                      const hasAcceptedProposal = bounty.proposals?.some(
                        (p) =>
                          proposalStages[p.proposalId] === 'accepted' ||
                          p.status === 'accepted'
                      );
                      return (
                        <div
                          key={bounty.id}
                          className="card rounded-lg shadow p-4 bg-base-100 border text-primary-content"
                        >
                          <h3 className="text-lg font-medium text-base-content mb-1">
                            {bounty.title} (ID: {bounty.id})
                          </h3>
                          <p className="text-sm text-base-content mb-1">
                            Reward: {bounty.reward} Aleo
                          </p>
                          <p className="text-xs text-base-content">
                            Deadline: {bounty.deadline}
                          </p>

                          {bounty.proposals && bounty.proposals.length > 0 && (
                            <div className="mt-4">
                              <div className="mb-2">
                                <label className="inline-flex items-center cursor-pointer">
                                  <span className="mr-2 text-sm text-primary">
                                    Use Private ALEO for reward?
                                  </span>
                                  <input
                                    type="checkbox"
                                    className="toggle toggle-primary focus:outline-none"
                                    onClick={(e) => e.currentTarget.blur()}
                                    checked={transferMethod[bounty.id] === 'private'}
                                    onChange={(e) =>
                                      setTransferMethod((prev) => ({
                                        ...prev,
                                        [bounty.id]: e.target.checked ? 'private' : 'public',
                                      }))
                                    }
                                  />
                                </label>
                              </div>
                              <h4 className="text-sm font-semibold text-base-content mb-2">
                                Proposals For Review:
                              </h4>
                              <ul className="space-y-3">
                                {bounty.proposals.map((p) => (
                                  <li key={p.proposalId}>
                                    <div className="card border ">
                                      <ProposalItem
                                        proposal={p}
                                        bounty={bounty}
                                        showActions={true}
                                        
                                      />
                                      <div className="mt-2 justify-center flex gap-2">
                                        {(() => {
                                          const effectiveStatus: ProposalStage =
                                            proposalStages[p.proposalId] !== undefined
                                              ? proposalStages[p.proposalId]
                                              : (p.status && p.status !== 'initial'
                                                  ? (p.status as ProposalStage)
                                                  : 'initial');

                                          if (effectiveStatus === 'accepted') {
                                            return (
                                              <>
                                                <Button className="btn btn-primary btn-sm" disabled>
                                                  Send Reward
                                                </Button>
                                                <Button className="btn btn-error btn-sm" disabled>
                                                  Deny
                                                </Button>

                                              </>
                                            );
                                          } else if (effectiveStatus === 'denied') {
                                            return (
                                              <>
                                                <Button className="btn btn-primary btn-sm" disabled>
                                                  Send Reward
                                                </Button>
                                                <Button className="btn btn-error btn-sm" disabled>
                                                  Deny
                                                </Button>

                                              </>
                                            );
                                          } else if (effectiveStatus === 'processing') {
                                            return (
                                              <Button className="btn btn-info btn-sm" disabled>
                                                Submitting...
                                              </Button>
                                            );
                                          } else if (effectiveStatus === 'rewardSent') {
                                            return (
                                              <Button
                                                className="btn btn-success btn-sm"
                                                onClick={() => onAcceptProposal(bounty, p)}
                                              >
                                                Accept Proposal
                                              </Button>
                                            );
                                          } else {
                                            return (
                                              <>
                                                <Button
                                                  className="btn btn-primary btn-sm"
                                                  onClick={() => onSendReward(bounty, p)}
                                                >
                                                  Send Reward
                                                </Button>
                                                <Button
                                                  className="btn btn-error btn-sm"
                                                  onClick={() => onDenyProposal(bounty, p)}
                                                >
                                                  Deny
                                                </Button>
                                              </>
                                            );
                                          }
                                        })()}
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>

                              {hasAcceptedProposal && (
                                <div className="flex justify-center mt-2">
                                  <Button
                                    onClick={() =>
                                      handleDeleteBounty(
                                        wallet,
                                        publicKey,
                                        bounty,
                                        setTxStatus,
                                        mutate
                                      )
                                    }
                                    className="btn btn-error btn-sm"
                                  >
                                    Delete Data
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {(!bounty.proposals || bounty.proposals.length === 0) && (
                            <div className="mt-4">
                              <p className="text-base-content">
                                No proposals for this bounty yet.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-sm text-primary">
                      <strong>Tip:</strong> If your dashboard is loading slow, delete old bounties.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-base-content">
                  You haven’t posted any bounties yet.
                </p>
              )}
            </div>
          </div>
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
