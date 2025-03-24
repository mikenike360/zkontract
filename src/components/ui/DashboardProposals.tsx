// src/components/DashboardProposals.tsx
import ProposalItem from '@/components/ui/ProposalItem';
import { ProposalData } from '@/components/ui/ProposalItem';
import { useState } from 'react';
import { handleDeleteProposal } from '@/utils/deleteProposal';

type DashboardProposalsProps = {
  proposals: ProposalData[];
  fetchedBounties: Record<number, any>;
};

function groupProposalsByBounty(proposals: ProposalData[]) {
  return proposals.reduce<Record<number, ProposalData[]>>((acc, proposal) => {
    const { bountyId } = proposal;
    if (!acc[bountyId]) acc[bountyId] = [];
    acc[bountyId].push(proposal);
    return acc;
  }, {});
}

export default function DashboardProposals({ proposals }: DashboardProposalsProps) {
  // Use state to update UI after deletion
  const [proposalList, setProposalList] = useState<ProposalData[]>(proposals);
  const proposalsByBounty = groupProposalsByBounty(proposalList);

  // Deletion handler: Deletes the specific proposal using the imported function.
  async function deleteProposal(proposalId: number, bountyId: number) {
    try {
      // Replace 'your-caller-identifier' with the actual caller/user id if available.
      await handleDeleteProposal({
        caller: 'your-caller-identifier',
        bountyId,
        proposalId,
      });
      // Remove the deleted proposal from state so the UI updates.
      setProposalList(prev =>
        prev.filter(prop => prop.proposalId !== proposalId)
      );
      console.log('Proposal deleted successfully:', proposalId);
    } catch (error) {
      console.error('Error deleting proposal:', error);
      // Optionally display an error notification.
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-primary-content mb-4">
        My Submitted Proposals
      </h2>
      {proposalList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-base-content">
          {Object.entries(proposalsByBounty).map(([bountyId, proposals]) => (
            <div key={bountyId} className="card rounded-lg shadow p-4 bg-base-100 border">
              <p className="font-semibold mb-2">Bounty ID: {bountyId}</p>
              <ul className="space-y-2">
                {proposals.map(prop => (
                  <li key={`${prop.bountyId}-${prop.proposalId}`}>
                    <div className="card p-4 bg-base-200 border">
                      <ProposalItem proposal={prop} showActions={false} />
                      <div className="mt-2">
                        <button
                          className={`btn ${prop.status === 'Pending' ? 'btn-disabled' : 'btn-error'}`}
                          disabled={prop.status === 'Pending'}
                          onClick={() => deleteProposal(prop.proposalId, prop.bountyId)}
                        >
                          Delete Proposal
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-primary-content">
          You haven’t submitted any proposals yet.
        </p>
      )}
    </div>
  );
}
