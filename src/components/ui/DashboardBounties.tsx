// src/components/DashboardBounties.tsx
import React, { useState } from 'react';
import Button from '@/components/ui/button';
import ProposalItem from '@/components/ui/ProposalItem';
import { ProposalData, BountyData } from '@/types';
import { handleDeleteBounty } from '@/utils/deleteBounty';

export type ProposalStage = 'initial' | 'processing' | 'rewardSent' | 'accepted' | 'denied';
export type DeleteBtnStage = 'accepted' | 'pending';

type DashboardBountiesProps = {
  bounties: BountyData[];
  proposalStages: Record<number, ProposalStage>;
  transferMethod: Record<number, 'public' | 'private'>;

  // The existing handlers your parent gives you:
  onSendReward: (bounty: BountyData, proposal: ProposalData) => Promise<void> | void;
  onAcceptProposal: (bounty: BountyData, proposal: ProposalData) => Promise<void> | void;
  onDenyProposal: (bounty: BountyData, proposal: ProposalData) => Promise<void> | void;
  onToggleTransferMethod: (bountyId: number, isPrivate: boolean) => void;

  // The delete bounty function
  handleDeleteBounty: (
    wallet: any,
    publicKey: string,
    bounty: BountyData,
    setTxStatus: (status: string | null) => void,
    mutate: () => void
  ) => Promise<void>;

  wallet: any;
  publicKey: string | null;
  setTxStatus: (status: string | null) => void;
  mutate: () => void;
};

/**
 * Computes the effective proposal status:
 * - If the chain says "accepted", return "accepted"
 * - If chain says "rewardSent" or proposal.rewardSent is true, return "rewardSent"
 * - Then "denied" or "processing"
 * - If still "initial", fall back to local proposalStages
 */
function getEffectiveStatus(
  proposal: ProposalData,
  localStages: Record<number, ProposalStage>
): ProposalStage {
  const rawStatus = proposal.status?.toLowerCase().trim() || 'initial';

  

  if (rawStatus === 'accepted') {
    return 'accepted';
  }
  if (proposal.rewardSent) {
    return 'rewardSent';
  }
  if (rawStatus === 'denied') return 'denied';
  if (rawStatus === 'processing') return 'processing';
  if (rawStatus === 'rewardsent') return 'rewardSent';

  const local = localStages[proposal.proposalId];
  if (rawStatus === 'initial' && local) {
    return local;
  }
  return 'initial';
}

function getDeleteBtnEffectiveStatus(proposal: ProposalData): DeleteBtnStage {
  const rawStatus = proposal.status?.toLowerCase().trim();

  

  if (rawStatus === 'pending') {
    return 'pending';
  }
  return 'accepted';
}

export default function DashboardBounties({
  bounties,
  proposalStages,
  transferMethod,
  onSendReward,
  onAcceptProposal,
  onDenyProposal,
  onToggleTransferMethod,
  handleDeleteBounty,
  wallet,
  publicKey,
  setTxStatus,
  mutate,
}: DashboardBountiesProps) {
  // Local UI state: Are we currently submitting for a specific proposal?
  const [buttonLoading, setButtonLoading] = useState<Record<number, boolean>>({});

  // Helper to toggle the local loading state for a given proposal
  function setProposalLoading(proposalId: number, isLoading: boolean) {
    setButtonLoading((prev) => ({
      ...prev,
      [proposalId]: isLoading,
    }));
  }

  // NEW: local state tracking if transaction fees should be private for each bounty
  const [feeTransferMethod, setFeeTransferMethod] = useState<Record<number, boolean>>({});

  // Toggles pay-fee-privately on/off for a specific bounty
  function onToggleFeeMethod(bountyId: number, payFeesPrivately: boolean) {
    setFeeTransferMethod((prev) => ({
      ...prev,
      [bountyId]: payFeesPrivately,
    }));
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-primary-content mb-8 mt-8">My Posted Bounties</h2>

      {bounties.length === 0 ? (
        <p className="text-primary-content">You haven’t posted any bounties yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-primary-content">
            {bounties.map((bounty) => {
              // Check if the bounty has an accepted proposal
              const hasAcceptedProposal = bounty.proposals?.some(
                (p) => getEffectiveStatus(p, proposalStages) === 'accepted'
              );

              // Check if any proposal returns 'pending' using our helper.
              const hasDeleteBtnPending = bounty.proposals?.some(
                (p) => getDeleteBtnEffectiveStatus(p) === 'pending'
              );

              return (
                <div
                  key={bounty.id}
                  className="card rounded-lg shadow p-4 bg-base-100 border text-primary-content resize overflow-auto "
                >
                  <h3 className="text-lg font-medium text-base-content mb-1">
                    {bounty.title} (ID: {bounty.id})
                  </h3>
                  <p className="text-sm text-base-content mb-1">Reward: {bounty.reward} Aleo</p>
                  <p className="text-xs text-base-content">Deadline: {bounty.deadline}</p>

                  {/* PROPOSALS */}
                  {bounty.proposals && bounty.proposals.length > 0 ? (
                    <div className="mt-4">
                      {/* Transfer Toggles */}
                      <div className="mb-2 flex flex-col space-y-2">
                        {/* Existing reward toggle */}
                        <label className="inline-flex items-center cursor-pointer">
                          <span className="mr-2 text-sm text-primary">
                            Use Private ALEO for reward?
                          </span>
                          <input
                            type="checkbox"
                            className="toggle toggle-primary focus:outline-none"
                            checked={transferMethod[bounty.id] === 'private'}
                            onChange={(e) =>
                              onToggleTransferMethod(bounty.id, e.target.checked)
                            }
                          />
                        </label>

                        {/* NEW: fee toggle */}
                        <label className="inline-flex items-center cursor-pointer">
                          {/* Optionally, you could add a fee toggle here */}
                        </label>
                      </div>

                      <h4 className="text-sm font-semibold text-base-content mb-2">
                        Proposals For Review:
                      </h4>
                      <ul className="space-y-3">
                        {bounty.proposals.map((proposal) => {
                          if (proposal.status === undefined) {
                            return (
                              <li key={proposal.proposalId}>
                                <div className="card border p-4">
                                  <ProposalItem proposal={proposal} bounty={bounty} showActions />
                                  <div className="mt-2 flex justify-center">
                                    <span className="text-info text-sm">Loading status...</span>
                                  </div>
                                </div>
                              </li>
                            );
                          }

                          const effectiveStatus = getEffectiveStatus(proposal, proposalStages);
                          const isLoading = !!buttonLoading[proposal.proposalId];

                          return (
                            <li key={proposal.proposalId}>
                              <div className="card border break-words resize overflow-auto">
                                <ProposalItem proposal={proposal} bounty={bounty} showActions />
                                <div className="mt-2 justify-center flex gap-2">
                                  {renderProposalButtons({
                                    status: effectiveStatus,
                                    bounty,
                                    proposal,
                                    onSendReward,
                                    onAcceptProposal,
                                    onDenyProposal,
                                    isLoading,
                                    setProposalLoading,
                                    mutate, // Passing mutate to the button renderer
                                  })}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      {/* DELETE Button if an accepted proposal exists */}
                      {hasAcceptedProposal && !hasDeleteBtnPending && (
                        <div className="flex justify-center mt-2">
                          <Button
                            onClick={() =>
                              handleDeleteBounty(wallet, publicKey!, bounty, setTxStatus, mutate)
                            }
                            className="btn btn-error btn-sm mt-4"
                          >
                            Close Bounty and Delete Data
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-base-content">No proposals for this bounty yet.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-primary-content">
              <strong>Tip:</strong> If your dashboard is loading slow, delete old bounties.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// --------------------------------------------------
// Button rendering for proposals with mutate integration
// --------------------------------------------------

type RenderButtonsProps = {
  status: ProposalStage;
  bounty: BountyData;
  proposal: ProposalData;
  onSendReward: (b: BountyData, p: ProposalData) => Promise<void> | void;
  onAcceptProposal: (b: BountyData, p: ProposalData) => Promise<void> | void;
  onDenyProposal: (b: BountyData, p: ProposalData) => Promise<void> | void;
  isLoading: boolean;
  setProposalLoading: (proposalId: number, isLoading: boolean) => void;
  mutate: () => void;
};

function renderProposalButtons({
  status,
  bounty,
  proposal,
  onSendReward,
  onAcceptProposal,
  onDenyProposal,
  isLoading,
  setProposalLoading,
  mutate,
}: RenderButtonsProps) {
  if (isLoading) {
    return (
      <div className="mb-4">
        <Button className="btn btn-info btn-sm" disabled>
          Submitting...
        </Button>
      </div>
    );
  }

  switch (status) {
    case 'accepted':
      return (
        <div className="mb-4 flex space-x-2">
          <Button className="btn btn-gray-100 btn-sm" disabled>
            Send Reward
          </Button>
          <Button className="btn btn-error btn-sm" disabled>
            Deny
          </Button>
        </div>
      );
    case 'denied':
      return (
        <div className="mb-4 flex space-x-2">
          <Button className="btn btn-primary btn-sm" disabled>
            Send Reward
          </Button>
          <Button className="btn btn-error btn-sm" disabled>
            Deny
          </Button>
        </div>
      );
    case 'processing':
      return (
        <div className="mb-4">
          <Button className="btn btn-info btn-sm" disabled>
            Submitting...
          </Button>
        </div>
      );
    case 'rewardSent':
      return (
        <div className="mb-4">
          <Button
            className="btn btn-success btn-sm"
            onClick={async () => {
              setProposalLoading(proposal.proposalId, true);
              try {
                await onAcceptProposal(bounty, proposal);
                mutate(); // Refresh data after accepting proposal
              } finally {
                setProposalLoading(proposal.proposalId, false);
              }
            }}
          >
            Accept Proposal
          </Button>
        </div>
      );
    case 'initial':
    default:
      return (
        <div className="mb-4 space-x-2">
          <Button
            className="btn btn-primary btn-sm"
            onClick={async () => {
              setProposalLoading(proposal.proposalId, true);
              try {
                await onSendReward(bounty, proposal);
                mutate(); // Refresh data after sending reward
              } finally {
                setProposalLoading(proposal.proposalId, false);
              }
            }}
          >
            Send Reward
          </Button>
          <Button
            className="btn btn-error btn-sm"
            onClick={async () => {
              setProposalLoading(proposal.proposalId, true);
              try {
                await onDenyProposal(bounty, proposal);
                mutate(); // Refresh data after denying proposal
              } finally {
                setProposalLoading(proposal.proposalId, false);
              }
            }}
          >
            Deny
          </Button>
        </div>
      );
  }
}
