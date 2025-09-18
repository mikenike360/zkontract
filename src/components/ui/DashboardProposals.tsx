// src/components/DashboardProposals.tsx
import ProposalItem from '@/components/ui/ProposalItem';
import { ProposalData } from '@/components/ui/ProposalItem';
import { BountyData } from '@/types';
import { useState, useEffect } from 'react';
// Removed handleDeleteProposal import as deletion is now handled by parent component

type DashboardProposalsProps = {
  proposals: ProposalData[];
  onDeleteProposal: (bountyId: number, proposalId: number) => void;
  bounties: BountyData[]; // User's owned bounties
};

function groupProposalsByBounty(proposals: ProposalData[]) {
  return proposals.reduce<Record<number, ProposalData[]>>((acc, proposal) => {
    const { bountyId } = proposal;
    if (!acc[bountyId]) acc[bountyId] = [];
    acc[bountyId].push(proposal);
    return acc;
  }, {});
}

export default function DashboardProposals({ proposals, onDeleteProposal, bounties }: DashboardProposalsProps) {
  // Group proposals by bounty for display
  const proposalsByBounty = groupProposalsByBounty(proposals);
  
  // State to track which bounties actually exist on the platform
  const [platformBountyStatus, setPlatformBountyStatus] = useState<Record<number, boolean>>({});
  
  // Get unique bounty IDs from proposals
  const uniqueBountyIds = [...new Set(proposals.map(p => p.bountyId))];
  
  // Check platform existence for each bounty (only once per bounty ID)
  useEffect(() => {
    const checkBountyExistence = async () => {
      const statusMap: Record<number, boolean> = {};
      
      for (const bountyId of uniqueBountyIds) {
        // Skip if we already checked this bounty
        if (platformBountyStatus[bountyId] !== undefined) {
          continue;
        }
        
        try {
          const response = await fetch(`/api/get-bounty?id=${bountyId}`);
          statusMap[bountyId] = response.ok; // Bounty exists if API returns success
        } catch (error) {
          console.log(`Bounty ${bountyId} not found on platform (expected for deleted bounties)`);
          statusMap[bountyId] = false; // Bounty doesn't exist if API fails
        }
      }
      
      // Only update if we have new data
      if (Object.keys(statusMap).length > 0) {
        setPlatformBountyStatus(prev => ({ ...prev, ...statusMap }));
      }
    };
    
    if (uniqueBountyIds.length > 0) {
      checkBountyExistence();
    }
  }, [uniqueBountyIds.join(',')]); // Use string comparison to prevent unnecessary re-runs

  // Check if a bounty exists on the platform (not just user-owned)
  const bountyExistsOnPlatform = (bountyId: number): boolean => {
    const status = platformBountyStatus[bountyId];
    // If we haven't checked yet, assume it exists to prevent premature "Bounty Closed" badges
    return status === undefined ? true : status === true;
  };

  // Check if user owns this bounty
  const userOwnsBounty = (bountyId: number): boolean => {
    return bounties.some(bounty => Number(bounty.id) === Number(bountyId));
  };

  // Check if a proposal can be deleted
  const canDeleteProposal = (proposal: ProposalData): boolean => {
    const isAccepted = proposal.status?.toLowerCase() === 'accepted';
    const existsOnPlatform = bountyExistsOnPlatform(proposal.bountyId);
    
    // If bounty is completely deleted from platform, allow deletion of any proposal
    if (!existsOnPlatform) {
      return true;
    }
    
    // If bounty still exists on platform, can delete if:
    // 1. Proposal is not pending (was denied/rejected)
    // 2. OR proposal is accepted AND user owns the bounty (for cleanup after completion)
    if (proposal.status !== 'Pending') {
      return true;
    }
    
    return false;
  };

  // Get deletion button text and styling
  const getDeleteButtonInfo = (proposal: ProposalData) => {
    const isAccepted = proposal.status?.toLowerCase() === 'accepted';
    const existsOnPlatform = bountyExistsOnPlatform(proposal.bountyId);
    
    // If bounty is completely deleted from platform, allow deletion of any proposal
    if (!existsOnPlatform) {
      return {
        disabled: false,
        className: 'btn btn-error',
        text: 'Delete Proposal'
      };
    }
    
    // If bounty still exists on platform
    if (proposal.status === 'Pending') {
      return {
        disabled: true,
        className: 'btn btn-disabled',
        text: 'Cannot Delete (Pending)'
      };
    }
    
    // Can delete non-pending proposals
    return {
      disabled: false,
      className: 'btn btn-error',
      text: 'Delete Proposal'
    };
  };

  // Handler to call the parent's delete function
  const handleDeleteClick = (proposalId: number, bountyId: number) => {
    // Call the parent's delete handler (which will show confirmation modal)
    onDeleteProposal(bountyId, proposalId);
  };

  return (
    <div className="mb-12">
      {/* Enhanced Section Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-green-500 p-2 rounded-lg shadow-md">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-base-content">
            My Submitted Proposals
          </h2>
          <p className="text-base-content/80 text-sm font-medium mt-1">
            Track and manage your proposal submissions
          </p>
        </div>
      </div>

      {proposals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-base-content">
          {Object.entries(proposalsByBounty).map(([bountyId, proposals]) => (
            <div key={bountyId} className="group bg-base-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300 overflow-hidden">
              {/* Card Header */}
              <div className="bg-base-200 p-4 border-b border-base-300">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">#{bountyId.slice(-3)}</span>
                    </div>
                    <div>
                      <p className="font-bold text-base-content">Bounty ID: {bountyId}</p>
                      <p className="text-xs font-medium text-base-content/80">{proposals.length} proposal{proposals.length === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                  {!bountyExistsOnPlatform(Number(bountyId)) && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-md">
                        🔒 Bounty Closed
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Proposals List */}
              <div className="p-4">
                <div className="space-y-3">
                  {proposals.map(prop => (
                    <div key={`${prop.bountyId}-${prop.proposalId}`} className="bg-base-100 rounded-lg border border-base-300/30 p-4 hover:border-primary/30 transition-colors duration-200">
                      <ProposalItem proposal={prop} showActions={false} />
                      <div className="mt-3 pt-3 border-t border-base-300/30">
                        {(() => {
                          const buttonInfo = getDeleteButtonInfo(prop);
                          return (
                            <button
                              className={`${buttonInfo.className} w-full transition-all duration-200 font-medium`}
                              disabled={buttonInfo.disabled}
                              onClick={() => handleDeleteClick(prop.proposalId, prop.bountyId)}
                            >
                              {buttonInfo.text}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-base-200 rounded-xl p-8 max-w-md mx-auto border border-base-300">
            <div className="w-16 h-16 bg-gray-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-base-content text-lg font-bold mb-2">
              No proposals yet
            </p>
            <p className="text-base-content/80 text-sm font-medium">
              You haven't submitted any proposals yet. Browse bounties to get started!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
