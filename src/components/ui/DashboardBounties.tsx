// src/components/DashboardBounties.tsx
import React, { useState } from 'react';
import Button from '@/components/ui/button';
import ProposalItem from '@/components/ui/ProposalItem';
import ResizableCard from '@/components/ui/ResizableCard';
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
  onCancelBounty: (bounty: BountyData) => Promise<void> | void;
  onCloseBounty: (bounty: BountyData) => Promise<void> | void;

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
  onCancelBounty,
  onCloseBounty,
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
    <div className="mb-12">
      {/* Enhanced Section Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-500 p-2 rounded-lg shadow-md">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-base-content">
            My Posted Bounties
          </h2>
          <p className="text-base-content/80 text-sm font-medium mt-1">
            Manage and review proposals for your bounties
          </p>
        </div>
      </div>

      {bounties.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-base-200 rounded-xl p-8 max-w-md mx-auto border border-base-300">
            <div className="w-16 h-16 bg-gray-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-base-content text-lg font-bold mb-2">
              No bounties posted yet
            </p>
            <p className="text-base-content/80 text-sm font-medium">
              You haven't posted any bounties yet. Create your first bounty to get started!
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-primary-content">
            {bounties.map((bounty) => {
              // Check if the bounty is completed on-chain (contract status = "1" or "1u8")
              console.log(`Bounty ${bounty.id} contract status:`, bounty.contractStatus);
              const isBountyCompleted = bounty.contractStatus === "1" || bounty.contractStatus === "1u8";
              
              // Also check if the bounty has an accepted proposal (fallback)
              const hasAcceptedProposal = bounty.proposals?.some(
                (p) => getEffectiveStatus(p, proposalStages) === 'accepted'
              );

              // Use contract status as primary source, fallback to proposal status
              const bountyIsClosed = isBountyCompleted || hasAcceptedProposal;

              // Check if any proposal returns 'pending' using our helper.
              const hasDeleteBtnPending = bounty.proposals?.some(
                (p) => getDeleteBtnEffectiveStatus(p) === 'pending'
              );

              return (
                <ResizableCard
                  key={bounty.id}
                  storageKey={`dashboard-bounty-${bounty.id}`}
                  defaultHeight={400}
                  minHeight={300}
                  maxHeight={700}
                  className="group hover:shadow-xl transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="bg-base-200 p-4 border-b border-base-300">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">#{bounty.id.toString().slice(-3)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-bold text-base-content leading-tight">
                            {bounty.title}
                          </h3>
                          <p className="text-xs font-medium text-base-content/80 mt-1">
                            ID: {bounty.id}
                          </p>
                        </div>
                      </div>
                      {bountyIsClosed && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-md">
                            ✅ CLOSED
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Bounty Details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <div className="text-lg font-bold text-emerald-600">{bounty.reward}</div>
                        <div className="text-xs text-emerald-600/70">Aleo Reward</div>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="text-sm font-semibold text-amber-600">{bounty.deadline}</div>
                        <div className="text-xs text-amber-600/70">Deadline</div>
                      </div>
                    </div>
                  </div>

                  {/* PROPOSALS */}
                  {bounty.proposals && bounty.proposals.length > 0 ? (
                    <div className="p-4">
                      {/* Escrow Info */}
                      <div className="bg-info/10 border border-info/20 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-info/20 rounded-full flex items-center justify-center">
                            <span className="text-xs">🔒</span>
                          </div>
                          <span className="text-sm text-info font-medium">
                            All rewards are securely managed via escrow
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-base-content flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {bountyIsClosed ? 'Proposals (Closed)' : 'Proposals For Review'}
                        </h4>
                        <span className="bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-xs font-medium text-primary">
                          {bounty.proposals.length} proposal{bounty.proposals.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      
                      {bountyIsClosed && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-600 text-sm">ℹ️</span>
                            <span className="text-sm text-yellow-600/80 font-medium">
                              Only one proposal can be accepted per bounty. You can still deny other proposals.
                            </span>
                          </div>
                        </div>
                      )}
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
                              <div className="bg-base-100 border border-base-300/30 rounded-lg p-4 hover:border-primary/30 transition-all duration-200 break-words">
                                <ProposalItem proposal={proposal} bounty={bounty} showActions />
                                <div className="mt-4 pt-3 border-t border-base-300/30 flex justify-center gap-2">
                                  {renderProposalButtons({
                                    status: effectiveStatus,
                                    bounty,
                                    proposal,
                                    onAcceptProposal,
                                    onDenyProposal,
                                    isLoading,
                                    setProposalLoading,
                                    mutate,
                                    publicKey,
                                    hasAcceptedProposal: bountyIsClosed,
                                  })}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="bg-base-200 rounded-xl p-6 text-center border border-base-300">
                        <div className="w-12 h-12 bg-gray-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-base-content font-bold">No proposals yet</p>
                        <p className="text-base-content/80 text-sm font-medium mt-1">Waiting for developers to submit proposals</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="p-4 border-t border-base-300 bg-base-200/50">
                    {/* Cancel Bounty button for creator (if no accepted proposals) - Show regardless of proposal count */}
                    {!bountyIsClosed && publicKey === bounty.creatorAddress && (
                      <div className="flex justify-center">
                        <Button
                          onClick={() => onCancelBounty(bounty)}
                          className="btn btn-warning btn-sm hover:btn-warning/80 transition-all duration-200 font-medium shadow-md"
                        >

                          Cancel Bounty & Refund Escrow
                        </Button>
                      </div>
                    )}

                    {/* Close Bounty button for creator (if proposal is accepted) */}
                    {bountyIsClosed && publicKey === bounty.creatorAddress && (
                      <div className="flex justify-center">
                        <Button
                          onClick={() => onCloseBounty(bounty)}
                          className="btn btn-success btn-sm hover:btn-success/80 transition-all duration-200 font-medium shadow-md"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Close Bounty
                        </Button>
                      </div>
                    )}
                  </div>
                </ResizableCard>
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
  isLoading: boolean;
  setProposalLoading: (proposalId: number, isLoading: boolean) => void;
  mutate: () => void;
  publicKey: string | null;
  hasAcceptedProposal: boolean;
};

function renderProposalButtons({
  status,
  bounty,
  proposal,
  onAcceptProposal,
  onDenyProposal,
  isLoading,
  setProposalLoading,
  mutate,
  publicKey,
  hasAcceptedProposal,
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
        <div className="mb-4 flex justify-center">
          <span className="text-success text-sm font-medium">✅ Proposal Accepted</span>
        </div>
      );
    case 'denied':
      return (
        <div className="mb-4 flex justify-center">
          <span className="text-error text-sm font-medium">❌ Proposal Denied</span>
        </div>
      );
    case 'processing':
      return (
        <div className="mb-4 flex justify-center">
          <Button className="btn btn-info btn-sm" disabled>
            Processing...
          </Button>
        </div>
      );
    case 'rewardSent':
    case 'initial':
    default:
      return isCreator ? (
        <div className="mb-4 space-y-2">
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
            disabled={hasAcceptedProposal}
            className={`btn btn-sm w-full ${
              hasAcceptedProposal 
                ? 'btn-disabled bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'btn-primary'
            }`}
          >
            {hasAcceptedProposal ? 'Bounty Closed' : 'Accept & Release Escrow'}
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
            disabled={hasAcceptedProposal}
            className={`btn btn-sm w-full ${
              hasAcceptedProposal 
                ? 'btn-disabled bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'btn-error'
            }`}
          >
            {hasAcceptedProposal ? 'Cannot Deny' : 'Deny'}
          </Button>
        </div>
      ) : (
        <div className="mb-4 flex justify-center">
          <span className="text-info text-sm font-medium">⏳ Awaiting creator response</span>
        </div>
      );
  }
}
