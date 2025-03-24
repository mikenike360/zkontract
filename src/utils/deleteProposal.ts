// src/utils/deleteProposal.ts

export type DeleteProposalParams = {
    caller: string;
    bountyId: number;
    proposalId: number;
  };
  
  export async function handleDeleteProposal({
    caller,
    bountyId,
    proposalId,
  }: DeleteProposalParams): Promise<any> {
    const response = await fetch('/api/delete-bounty', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ caller, bountyId, proposalId }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to delete proposal');
    }
  
    return response.json();
  }
  