// src/components/DashboardBounties.tsx
import Button from '@/components/ui/button';
import ProposalItem from '@/components/ui/ProposalItem';
import { ProposalData, BountyData } from '@/types';
import { handleDeleteBounty } from '@/utils/deleteBounty';

export type ProposalStage = 'initial' | 'processing' | 'rewardSent' | 'accepted' | 'denied';

type DashboardBountiesProps = {
  bounties: BountyData[];
  proposalStages: Record<number, ProposalStage>;
  transferMethod: Record<number, 'public' | 'private'>;
  onSendReward: (bounty: BountyData, proposal: ProposalData) => void;
  onAcceptProposal: (bounty: BountyData, proposal: ProposalData) => void;
  onDenyProposal: (bounty: BountyData, proposal: ProposalData) => void;
  onToggleTransferMethod: (bountyId: number, isPrivate: boolean) => void;
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
  return (
    <div>
      <h2 className="text-xl font-semibold text-primary-content mb-4">My Posted Bounties</h2>

      {bounties.length === 0 ? (
        <p className="text-base-content">You haven’t posted any bounties yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-primary-content">
            {bounties.map((bounty) => {
              // Check if the bounty has an accepted proposal
              const hasAcceptedProposal = bounty.proposals?.some((p) => {
                const statusLower = p.status?.toLowerCase();
                return statusLower === 'accepted' || proposalStages[p.proposalId] === 'accepted';
              });

              return (
                <div
                  key={bounty.id}
                  className="card rounded-lg shadow p-4 bg-base-100 border text-primary-content"
                >
                  <h3 className="text-lg font-medium text-base-content mb-1">
                    {bounty.title} (ID: {bounty.id})
                  </h3>
                  <p className="text-sm text-base-content mb-1">Reward: {bounty.reward} Aleo</p>
                  <p className="text-xs text-base-content">Deadline: {bounty.deadline}</p>

                  {/* PROPOSALS */}
                  {bounty.proposals && bounty.proposals.length > 0 ? (
                    <div className="mt-4">
                      {/* Transfer Toggle */}
                      <div className="mb-2">
                        <label className="inline-flex items-center cursor-pointer">
                          <span className="mr-2 text-sm text-primary">
                            Use Private ALEO for reward?
                          </span>
                          <input
                            type="checkbox"
                            className="toggle toggle-primary focus:outline-none"
                            checked={transferMethod[bounty.id] === 'private'}
                            onChange={(e) => onToggleTransferMethod(bounty.id, e.target.checked)}
                          />
                        </label>
                      </div>

                      <h4 className="text-sm font-semibold text-base-content mb-2">
                        Proposals For Review:
                      </h4>
                      <ul className="space-y-3">
                        {bounty.proposals.map((proposal) => {
                          // Normalize status from metadata
                          const rawStatus = proposal.status?.toLowerCase() || 'initial';

                          // If the returned status doesn't match our union, convert it to 'initial'
                          const metadataStatus: ProposalStage = (['initial', 'processing', 'rewardsent', 'accepted', 'denied'].includes(
                            rawStatus
                          )
                            ? rawStatus
                            : 'initial') as ProposalStage;

                          // Decide if we override with rewardSent => 'rewardSent'
                          let effectiveStatus = metadataStatus;
                          if (proposal.rewardSent && effectiveStatus === 'initial') {
                            effectiveStatus = 'rewardSent';
                          }

                          // If local state has something besides 'initial', you could merge that here:
                          const local = proposalStages[proposal.proposalId];
                          if (local && local !== 'initial') {
                            effectiveStatus = local;
                          }

                          return (
                            <li key={proposal.proposalId}>
                              <div className="card border">
                                <ProposalItem proposal={proposal} bounty={bounty} showActions />
                                <div className="mt-2 justify-center flex gap-2">
                                  {renderProposalButtons(
                                    effectiveStatus,
                                    bounty,
                                    proposal,
                                    onSendReward,
                                    onAcceptProposal,
                                    onDenyProposal
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      {/* DELETE Button if an accepted proposal exists */}
                      {hasAcceptedProposal && (
                        <div className="flex justify-center mt-2">
                          <Button
                            onClick={() =>
                              handleDeleteBounty(wallet, publicKey!, bounty, setTxStatus, mutate)
                            }
                            className="btn btn-error btn-sm"
                          >
                            Delete Data
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
            <p className="text-sm text-primary">
              <strong>Tip:</strong> If your dashboard is loading slow, delete old bounties.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// Helper: Which buttons to display for a given proposal status
function renderProposalButtons(
  status: ProposalStage,
  bounty: BountyData,
  proposal: ProposalData,
  onSendReward: (b: BountyData, p: ProposalData) => void,
  onAcceptProposal: (b: BountyData, p: ProposalData) => void,
  onDenyProposal: (b: BountyData, p: ProposalData) => void
) {
  switch (status) {
    case 'accepted':
      return (
        <Button className="btn btn-success btn-sm" disabled>
          Accept Proposal
        </Button>
      );
    case 'denied':
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
    case 'processing':
      return (
        <Button className="btn btn-info btn-sm" disabled>
          Submitting...
        </Button>
      );
    case 'rewardSent':
      return (
        <Button className="btn btn-success btn-sm" onClick={() => onAcceptProposal(bounty, proposal)}>
          Accept Proposal
        </Button>
      );
    case 'initial':
    default:
      return (
        <>
          <Button className="btn btn-primary btn-sm" onClick={() => onSendReward(bounty, proposal)}>
            Send Reward
          </Button>
          <Button className="btn btn-error btn-sm" onClick={() => onDenyProposal(bounty, proposal)}>
            Deny
          </Button>
        </>
      );
  }
}
