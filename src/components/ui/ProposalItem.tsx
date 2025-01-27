import { useState } from 'react';

export type ProposalData = {
  bountyId: number;
  proposalId: number;
  proposerAddress: string;
  proposalText?: string;
  fileName?: string;
  status?: string;
};

export type BountyData = {
  id: number;
  title: string;
  reward: string;
  deadline: string;
  creatorAddress: string;
};

type ProposalItemProps = {
  proposal: ProposalData;
  bounty?: BountyData; // Optional bounty data for context
  onAccept?: (bounty: BountyData, proposal: ProposalData) => void; // Accept callback
  onDeny?: (bounty: BountyData, proposal: ProposalData) => void; // Deny callback
  showActions?: boolean; // Controls whether Accept/Deny buttons should show
};

export function getStatusBadge(status?: string) {
  const current = status || 'pending';
  switch (current) {
    case 'accepted':
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Accepted</span>;
    case 'denied':
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Denied</span>;
    case 'pending':
    default:
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Pending</span>;
  }
}

export default function ProposalItem({
  proposal,
  bounty,
  onAccept,
  onDeny,
  showActions = false, // Default to false
}: ProposalItemProps) {
  const [expanded, setExpanded] = useState(false);
  const maxChars = 300;

  const shouldTruncate = proposal.proposalText
    ? proposal.proposalText.length > maxChars
    : false;

  const displayedText = proposal.proposalText
    ? (!shouldTruncate || expanded)
      ? proposal.proposalText
      : proposal.proposalText.slice(0, maxChars) + '...'
    : '';

  return (
    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
      {/* Proposal details */}
      <p className="text-sm text-black dark:text-black">
        <strong>Proposer:</strong> {proposal.proposerAddress}
      </p>
      <p className="text-sm text-black dark:text-black mt-1">
        {displayedText}
      </p>
      {shouldTruncate && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-blue-500 text-xs mt-1"
        >
          Expand
        </button>
      )}
      {expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="text-blue-500 text-xs mt-1"
        >
          Collapse
        </button>
      )}
      {proposal.fileName && (
        <p className="text-xs text-black dark:text-gray-400 mt-1">
          File: {proposal.fileName}
        </p>
      )}

      {/* Status badge */}
      <div className="mt-2">{getStatusBadge(proposal.status)}</div>

      {/* Accept/Deny buttons (only if handlers and bounty are provided, and if showActions is true) */}
      {showActions && onAccept && onDeny && bounty && (
        <div className="mt-2 flex items-center space-x-2">
          <button
            onClick={() => onAccept(bounty, proposal)}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md shadow hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={proposal.status === 'accepted' || proposal.status === 'denied'}
          >
            Accept
          </button>
          <button
            onClick={() => onDeny(bounty, proposal)}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-md shadow hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={proposal.status === 'accepted' || proposal.status === 'denied'}
          >
            Deny
          </button>
        </div>
      )}
    </div>
  );
}
