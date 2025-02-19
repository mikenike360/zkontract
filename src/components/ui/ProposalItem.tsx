import { useState, useEffect } from 'react';
import { fetchMappingValueRaw } from '../../aleo/rpc'; 

export type ProposalData = {
  bountyId: number;
  proposalId: number;
  proposerAddress: string;
  proposalText?: string;
  fileName?: string;
  fileUrl?: string; // NEW: URL of the uploaded file
  status?: string;
};

export type BountyData = {
  id: number;
  title: string;
  reward: string;
  deadline: string;
  creatorAddress: string;
};

// Define a mapping from numeric status to string labels
const PROPOSAL_STATUS_MAP: { [key: number]: string } = {
  0: 'pending',
  1: 'accepted',
  2: 'denied',
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
  const [blockchainStatus, setBlockchainStatus] = useState<string | null>(null);
  const maxChars = 300;

  useEffect(() => {
    async function fetchStatus() {
      try {
        // Construct the compositeProposalId as before
        const compositeProposalId = (BigInt(proposal.bountyId) * BigInt(1_000_000) + BigInt(proposal.proposalId)).toString();
        
        // Fetch the raw status from the blockchain
        const rawStatus = await fetchMappingValueRaw('proposal_status', compositeProposalId);
        
        // Parse the raw status to a number
        const numericStatus = parseInt(rawStatus, 10);
        
        // Map the numeric status to a string label
        const statusLabel = PROPOSAL_STATUS_MAP[numericStatus] || 'pending';
        
        // Update the state with the mapped status label
        setBlockchainStatus(statusLabel);
      } catch (error) {
        console.error('Failed to fetch status from blockchain:', error);
        setBlockchainStatus('pending'); // Fallback to 'pending' on error
      }
    }
    fetchStatus();
  }, [proposal.bountyId, proposal.proposalId]);
  

  const shouldTruncate = proposal.proposalText
    ? proposal.proposalText.length > maxChars
    : false;

  const displayedText = proposal.proposalText
    ? (!shouldTruncate || expanded)
      ? proposal.proposalText
      : proposal.proposalText.slice(0, maxChars) + '...'
    : '';

  return (
    <div className="p-3 bg-white rounded-md">

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
      
      {/* If fileName is available, display it */}
      {proposal.fileName && (
        <p className="text-xs text-black mt-1">
          File: {proposal.fileName}
        </p>
      )}

      {/* NEW: If a fileUrl exists, render a link to view or download the file */}
      {proposal.fileUrl && (
        <div className="mt-1">
          <a
            href={proposal.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800 text-xs"
          >
            View / Download Attachment
          </a>
        </div>
      )}

      {/* Status badge */}
      <div className="mt-2">{getStatusBadge(blockchainStatus)}</div>

      {/* Accept/Deny buttons (only if handlers and bounty are provided, and if showActions is true) */}
      {showActions && onAccept && onDeny && bounty && (
        <div className="mt-2 flex items-center space-x-2">
          <button
            onClick={() => onAccept(bounty, proposal)}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md shadow hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={blockchainStatus === 'accepted' || blockchainStatus === 'denied'}
          >
            Accept
          </button>
          <button
            onClick={() => onDeny(bounty, proposal)}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-md shadow hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={blockchainStatus === 'accepted' || blockchainStatus === 'denied'}
          >
            Deny
          </button>
        </div>
      )}
    </div>
  );
}
