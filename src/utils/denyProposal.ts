// denyProposal.ts

import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { BountyData, ProposalData } from '@/components/ui/ProposalItem';

export const BOUNTY_PROGRAM_ID = 'zkontractv5.aleo';
export const DENY_PROPOSAL_FUNCTION = 'deny_proposal';

/**
 * Denies a proposal by calling deny_proposal on-chain,
 * then updates the proposal status in your database.
 *
 * @param wallet - The wallet adapter instance.
 * @param publicKey - The public key of the user.
 * @param bounty - The BountyData object.
 * @param proposal - The ProposalData object.
 * @param setTxStatus - Function to update the transaction status in UI.
 * @param mutate - Your callback to re-fetch or refresh data.
 */
export async function handleDenyProposal(
  wallet: LeoWalletAdapter,
  publicKey: string,
  bounty: BountyData,
  proposal: ProposalData,
  setTxStatus: (status: string | null) => void,
  mutate: () => void
) {
  try {
    setTxStatus('Denying proposal...');

    // Create inputs for the transition
    const denyInputs = [
      publicKey,                    // Caller
      `${bounty.id}u64`,            // Bounty ID
      `${proposal.proposalId}u64`,  // Proposal ID
    ];

    const denyFee = 1_000_000; // Adjust if needed
    const denyTx = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.TestnetBeta,
      BOUNTY_PROGRAM_ID,
      DENY_PROPOSAL_FUNCTION,
      denyInputs,
      denyFee,
      false
    );

    console.log('Deny proposal TX =>', denyTx);

    const denyTxId = await wallet.requestTransaction(denyTx);
    console.log('Deny proposal transaction submitted:', denyTxId);

    // Poll until finalization
    setTxStatus('Waiting for deny_proposal transaction to finalize...');
    let denyFinalized = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      const status = await wallet.transactionStatus(denyTxId);
      console.log(`Attempt ${attempt + 1}: Transaction status - ${status}`);
      if (status === 'Finalized') {
        denyFinalized = true;
        break;
      }
      await new Promise((res) => setTimeout(res, 2000));
    }

    if (!denyFinalized) {
      throw new Error('deny_proposal transaction not finalized in time.');
    }

    // Update status in your DB
    setTxStatus('Updating proposal status...');
    const updateResponse = await fetch('/api/update-proposal-status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bountyId: bounty.id,
        proposalId: proposal.proposalId,
        newStatus: 'denied',
      }),
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update proposal status in the database.');
    }

    alert('Proposal denied successfully!');
    setTxStatus('Proposal denied successfully!');
    mutate();
  } catch (err) {
    console.error('Error denying proposal:', err);
    alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    setTxStatus(null);
  }
}
