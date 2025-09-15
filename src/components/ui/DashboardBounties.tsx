// src/components/DashboardBounties.tsx
import React, { useState } from 'react';
import Button from '@/components/ui/button';
import ProposalItem from '@/components/ui/ProposalItem';
import { ProposalData, BountyData } from '@/types';
// Removed handleDeleteBounty import as we now use escrow-based cancel functionality

export type ProposalStage = 'initial' | 'processing' | 'rewardSent' | 'accepted' | 'denied';
export type DeleteBtnStage = 'accepted' | 'pending';

type DashboardBountiesProps = {
  bounties: BountyData[];
  proposalStages: Record<number, ProposalStage>;

  // The existing handlers your parent gives you:
  onAcceptProposal: (bounty: BountyData, proposal: ProposalData) => Promise<void> | void;
  onDenyProposal: (bounty: BountyData, proposal: ProposalData) => Promise<void> | void;
  
  // New escrow-based handlers:
  onClaimPayment: (bounty: BountyData, proposal: ProposalData) => Promise<void> | void;
  onCancelBounty: (bounty: BountyData) => Promise<void> | void;

  wallet: any;
  publicKey: string | null;
  setTxStatus: (status: string | null) => void;
  mutate: () => void;
};

/**
 * Computes the effective proposal status.
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
  onAcceptProposal,
  onDenyProposal,
  onClaimPayment,
  onCancelBounty,
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

  // Local state tracking if transaction fees should be private for each bounty (if needed)
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
                  className="card rounded-lg shadow p-4 bg-base-100 border text-primary-content resize overflow-auto"
                >
                  <h3 className="text-lg font-medium text-base-content mb-1">
                    {bounty.title} (ID: {bounty.id})
                  </h3>
                  <p className="text-sm text-base-content mb-1">Reward: {bounty.reward} Aleo</p>
                  <p className="text-xs text-base-content">Deadline: {bounty.deadline}</p>

                  {/* PROPOSALS */}
                  {bounty.proposals && bounty.proposals.length > 0 ? (
                    <div className="mt-4">
                      {/* Escrow Info */}
                      <div className="mb-2">
                        <span className="text-sm text-info">
                          💡 All rewards are securely managed via escrow
                        </span>
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
                                    onAcceptProposal,
                                    onDenyProposal,
                                    onClaimPayment,
                                    isLoading,
                                    setProposalLoading,
                                    mutate,
                                    publicKey,
                                  })}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      {/* Cancel Bounty button for creator (if no accepted proposals) */}
                      {!hasAcceptedProposal && publicKey === bounty.creatorAddress && (
                        <div className="flex justify-center mt-2">
                          <Button
                            onClick={() => onCancelBounty(bounty)}
                            className="btn btn-warning btn-sm mt-4"
                          >
                            Cancel Bounty & Refund Escrow
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-base-content">No pending proposals for this bounty!</p>
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
  onAcceptProposal: (b: BountyData, p: ProposalData) => Promise<void> | void;
  onDenyProposal: (b: BountyData, p: ProposalData) => Promise<void> | void;
  onClaimPayment: (b: BountyData, p: ProposalData) => Promise<void> | void;
  isLoading: boolean;
  setProposalLoading: (proposalId: number, isLoading: boolean) => void;
  mutate: () => void;
  publicKey: string | null;
};

function renderProposalButtons({
  status,
  bounty,
  proposal,
  onAcceptProposal,
  onDenyProposal,
  onClaimPayment,
  isLoading,
  setProposalLoading,
  mutate,
  publicKey,
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

  const isCreator = publicKey === bounty.creatorAddress;
  const isProposer = publicKey === proposal.proposerAddress;

  switch (status) {
    case 'accepted':
      return (
        <div className="mb-4 flex space-x-2">
          <span className="text-success text-sm">✅ Proposal Accepted</span>
          {isProposer && (
            <Button
              onClick={async () => {
                setProposalLoading(proposal.proposalId, true);
                try {
                  await onClaimPayment(bounty, proposal);
                  mutate();
                } catch (err) {
                  console.error('Error claiming payment:', err);
                } finally {
                  setProposalLoading(proposal.proposalId, false);
                }
              }}
              className="btn btn-success btn-sm"
            >
              Claim Payment
            </Button>
          )}
        </div>
      );
    case 'denied':
      return (
        <div className="mb-4">
          <span className="text-error text-sm">❌ Proposal Denied</span>
        </div>
      );
    case 'processing':
      return (
        <div className="mb-4">
          <Button className="btn btn-info btn-sm" disabled>
            Processing...
          </Button>
        </div>
      );
    case 'rewardSent':
    case 'initial':
    default:
      return isCreator ? (
        <div className="mb-4 flex space-x-2">
          <Button
            onClick={async () => {
              setProposalLoading(proposal.proposalId, true);
              try {
                await onAcceptProposal(bounty, proposal);
                mutate();
              } catch (err) {
                console.error('Error accepting proposal:', err);
              } finally {
                setProposalLoading(proposal.proposalId, false);
              }
            }}
            className="btn btn-primary btn-sm"
          >
            Accept & Release Escrow
          </Button>
          <Button
            onClick={async () => {
              setProposalLoading(proposal.proposalId, true);
              try {
                await onDenyProposal(bounty, proposal);
                mutate();
              } catch (err) {
                console.error('Error denying proposal:', err);
              } finally {
                setProposalLoading(proposal.proposalId, false);
              }
            }}
            className="btn btn-error btn-sm"
          >
            Deny
          </Button>
        </div>
      ) : (
        <div className="mb-4">
          <span className="text-info text-sm">⏳ Awaiting creator response</span>
        </div>
      );
  }
}
