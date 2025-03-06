// acceptProposal.ts

import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { BountyData, ProposalData } from '@/components/ui/ProposalItem';

export const BOUNTY_PROGRAM_ID = 'zkontractv5.aleo';
export const ACCEPT_PROPOSAL_FUNCTION = 'accept_proposal';



/**
 * Accepts a proposal by calling accept_proposal on-chain,
 * then updates the proposal status in your database.
 *
 * @param wallet - The wallet adapter instance.
 * @param publicKey - The public key of the user.
 * @param bounty - The BountyData object.
 * @param proposal - The ProposalData object.
 * @param rewardAmount - A string like “5000000u64”.
 * @param setTxStatus - Function to update the transaction status in UI.
 * @param mutate - Your callback to re-fetch or refresh data.
 */
export async function handleAcceptProposal(
  wallet: LeoWalletAdapter,
  publicKey: string,
  bounty: BountyData,
  proposal: ProposalData,
  rewardAmount: string,
  setTxStatus: (status: string | null) => void,
  mutate: () => void
) {
  try {
    setTxStatus('Accepting proposal...');

    const rewardAmountforTransfer = `${bounty.reward}000000u64`;

    const acceptInputs = [
      publicKey,                 // Caller
      `${bounty.id}u64`,         // Bounty ID
      `${proposal.proposalId}u64`, 
      publicKey,                 // Creator address
      rewardAmountforTransfer,              // Payment amount (e.g. "5000000u64")
    ];

    const acceptFee = 1_000_000;
    const acceptTx = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.TestnetBeta,
      BOUNTY_PROGRAM_ID,
      ACCEPT_PROPOSAL_FUNCTION,
      acceptInputs,
      acceptFee,
      false
    );

    console.log('Accept Proposal Transaction =>', acceptTx);

    const acceptTxId = await wallet.requestTransaction(acceptTx);
    console.log('Accept proposal transaction submitted:', acceptTxId);

    // Poll the transaction
    setTxStatus('Waiting for accept_proposal to finalize...');
    let acceptFinalized = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      const status = await wallet.transactionStatus(acceptTxId);
      console.log(`Attempt ${attempt + 1}: ${status}`);
      if (status === 'Finalized'){
        acceptFinalized = true;
        break;
      }
      await new Promise((res) => setTimeout(res, 2000));
    }

    if (!acceptFinalized) {
      throw new Error('accept_proposal transaction not finalized in time.');
    }

    // Update DB
    const response = await fetch('/api/update-proposal-status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bountyId: bounty.id,
        proposalId: proposal.proposalId,
        newStatus: 'accepted',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update proposal status in the database.');
    }

    alert('Proposal accepted successfully!');
    setTxStatus('Proposal accepted successfully!');
    mutate();
  } catch (err) {
    console.error('Error accepting proposal:', err);
    alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    setTxStatus(null);
  }
}
