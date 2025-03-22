// src/components/DashboardProposals.tsx
import ProposalItem from '@/components/ui/ProposalItem';
import { ProposalData } from '@/components/ui/ProposalItem';

type DashboardProposalsProps = {
  proposals: ProposalData[];
  fetchedBounties: Record<number, any>; // Replace `any` with your BountyData type if available
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
  const proposalsByBounty = groupProposalsByBounty(proposals);

  return (
    <div>
      <h2 className="text-xl font-semibold text-primary-content mb-4">
        My Submitted Proposals
      </h2>
      {proposals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-base-content">
          {Object.entries(proposalsByBounty).map(([bountyId, proposals]) => {
            
            return (
              <div key={bountyId} className="card rounded-lg shadow p-4 bg-base-100 border">
                <p className="font-semibold mb-2">Bounty ID: {bountyId}</p>

                <ul className="space-y-2">
                  {proposals.map((prop) => (
                    <li key={`${prop.bountyId}-${prop.proposalId}`}>
                      <div className="card p-4 bg-base-200 border">
                        <ProposalItem proposal={prop}  showActions={false} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-primary-content">
          You haven’t submitted any proposals yet.a
        </p>
      )}
    </div>
  );
}
