// src/utils/deleteProposal.ts

import { signRequest } from '@/utils/signing';

export type DeleteProposalParams = {
    caller: string;
    bountyId: number;
    proposalId: number;
    wallet: any; // Wallet adapter instance
  };
  
  export async function handleDeleteProposal({
    caller,
    bountyId,
    proposalId,
    wallet,
  }: DeleteProposalParams): Promise<any> {
  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  // Sign the request for authentication
  const auth = await signRequest(wallet.adapter, 'delete_bounty', { bountyId, proposalId });

    const response = await fetch('/api/delete-bounty', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        caller, 
        bountyId, 
        proposalId,
        signature: auth.signature,
        message: auth.message,
        timestamp: auth.timestamp,
        nonce: auth.nonce,
      }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to delete proposal');
    }
  
    return response.json();
  }
  