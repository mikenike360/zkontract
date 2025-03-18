import { useState, useEffect } from 'react';
import { fetchMappingValueRaw } from '@/components/aleo/rpc'; 

export type ProposalData = {
  bountyId: number;
  proposalId: number;
  proposerAddress: string;
  proposalText?: string;
  fileName?: string;
  fileUrl?: string; 
  status?: string;
  rewardSent?: boolean;
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

export function getStatusBadge(status?: string) {
  const current = status || 'pending';
  switch (current) {
    case 'accepted':
      return <span className="badge badge-success text-xs">Accepted</span>;
    case 'denied':
      return <span className="badge badge-error text-xs">Denied</span>;
    case 'pending':
    default:
      return <span className="badge badge-warning text-xs">Pending</span>;
  }
}

type ProposalItemProps = {
  proposal: ProposalData;
  bounty?: BountyData; // Optional bounty data for context
  onAccept?: (bounty: BountyData, proposal: ProposalData) => void; // Accept callback
  onDeny?: (bounty: BountyData, proposal: ProposalData) => void; // Deny callback
  showActions?: boolean; // Controls whether Accept/Deny buttons should show
};

// Helper function to extract the S3 object key from a full URL
function extractS3Key(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // Remove the leading '/' from the pathname
    return parsedUrl.pathname.startsWith('/') ? parsedUrl.pathname.slice(1) : parsedUrl.pathname;
  } catch (error) {
    console.error('Invalid URL provided:', url);
    return url;
  }
}

export default function ProposalItem({
  proposal,
  bounty,
  onAccept,
  onDeny,
  showActions = false,
}: ProposalItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState<string | undefined>(undefined);
  // New state for the temporary (presigned) URL
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const maxChars = 300;

  useEffect(() => {
    async function fetchStatus() {
      try {
        // Composite ID for the proposal
        const compositeProposalId = (
          BigInt(proposal.bountyId) * BigInt(1_000_000) + BigInt(proposal.proposalId)
        ).toString();

        // Fetch raw status from the blockchain
        const rawStatus = await fetchMappingValueRaw('proposal_status', compositeProposalId);
        const numericStatus = parseInt(rawStatus, 10);
        const statusLabel = PROPOSAL_STATUS_MAP[numericStatus] || 'pending';
        setBlockchainStatus(statusLabel);
      } catch (error) {
        console.error('Failed to fetch status from blockchain:', error);
        setBlockchainStatus('pending');
      }
    }
    fetchStatus();
  }, [proposal.bountyId, proposal.proposalId]);

  const shouldTruncate = proposal.proposalText ? proposal.proposalText.length > maxChars : false;
  const displayedText = proposal.proposalText
    ? (!shouldTruncate || expanded)
      ? proposal.proposalText
      : proposal.proposalText.slice(0, maxChars) + '...'
    : '';

    const fetchSignedUrl = async () => {
      if (!proposal.fileUrl) return;
      const fileKey = extractS3Key(proposal.fileUrl);
    
      try {
        const response = await fetch(`/api/get-presigned-url?key=${encodeURIComponent(fileKey)}`);
        const data = await response.json();
        setSignedUrl(data.url);
      } catch (error) {
        console.error('Error fetching signed URL:', error);
      }
    };
    

  return (
    <div className="card bg-primary shadow p-3 resize overflow-auto">
      <p className="text-sm text-primary-content mt-1">
        {displayedText}
      </p>
      {shouldTruncate && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="btn btn-link btn-xs text-primary-content mt-1"
        >
          Expand
        </button>
      )}
      {expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="btn btn-link btn-xs text-primary-content mt-1"
        >
          Collapse
        </button>
      )}
      
      {proposal.fileName && (
        <p className="text-xs text-base-content mt-1">
          File: {proposal.fileName}
        </p>
      )}

      {proposal.fileUrl && (
        <div className="mt-1">
          {signedUrl ? (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary-content text-xs underline"
            >
              View / Download Attachment
            </a>
          ) : (
            <button
              onClick={fetchSignedUrl}
              className="btn btn-link btn-xs text-primary-content mt-1"
            >
              Generate Link
            </button>
          )}
        </div>
      )}

      <div className="mt-2">{getStatusBadge(blockchainStatus)}</div>

      {showActions && onAccept && onDeny && bounty && (
        <div className="mt-2 flex items-center space-x-2">
          <button
            onClick={() => onAccept(bounty, proposal)}
            className="btn btn-success btn-sm"
            disabled={blockchainStatus === 'accepted' || blockchainStatus === 'denied'}
          >
            Accept
          </button>
          <button
            onClick={() => onDeny(bounty, proposal)}
            className="btn btn-error btn-sm"
            disabled={blockchainStatus === 'accepted' || blockchainStatus === 'denied'}
          >
            Deny
          </button>
        </div>
      )}
    </div>
  );
}
