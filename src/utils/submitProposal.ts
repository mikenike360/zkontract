// /utils/submitProposal.ts

import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { BOUNTY_PROGRAM_ID } from '@/types';
import { CURRENT_NETWORK } from '@/types';

// Import the fee calculator function
import { getFeeForFunction } from '@/utils/feeCalculator';

const SUBMIT_PROPOSAL_FUNCTION = 'submit_proposal';

export interface SubmitProposalParams {
  wallet: any;             // ideally type this with your wallet adapter type
  publicKey: string;
  bountyId: number;
  proposalText: string;
  uploadedFile?: File | null;
}

/**
 * Submits a proposal on-chain, then uploads associated metadata (and file if attached).
 * Returns the transaction ID and the generated proposal ID.
 */
export async function submitProposal({
  wallet,
  publicKey,
  bountyId,
  proposalText,
  uploadedFile = null,
}: SubmitProposalParams): Promise<{ txId: string; proposalId: number }> {
  if (!wallet || !publicKey) {
    throw new Error('Wallet and publicKey are required.');
  }

  // Generate a unique proposalId (the contract uses bountyId * 1_000_000 + proposalId)
  const proposalId = Math.floor(Date.now() % 1000000);

  const inputs = [
    publicKey,             // caller
    `${bountyId}u64`,      // bounty_id
    `${proposalId}u64`,    // proposal_id
    publicKey,             // proposer_address
  ];

        
    const fee = getFeeForFunction(SUBMIT_PROPOSAL_FUNCTION);
    console.log('Calculated fee (in micro credits):', fee);

  // Create the transaction (fee is hard-coded here as 1_000_000 microcredits)
  const proposalTx = Transaction.createTransaction(
    publicKey,
    CURRENT_NETWORK,
    BOUNTY_PROGRAM_ID,
    SUBMIT_PROPOSAL_FUNCTION,
    inputs,
    fee, // fee in microcredits; adjust if needed
    true
  );

  // Request transaction execution via the wallet adapter
  const txId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(proposalTx);
  console.log('Proposal transaction submitted:', txId);

  // Poll for finalization
  let finalized = false;
  const maxRetries = 300;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const status = await (wallet.adapter as LeoWalletAdapter).transactionStatus(txId);
    console.log(`Status check #${attempt + 1}: ${status}`);
    if (status === 'Finalized') {
      finalized = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!finalized) {
    throw new Error('Transaction did not finalize in time.');
  }

  // Prepare the proposal metadata
  const proposalMetadata = {
    bountyId,
    proposalId,
    caller: publicKey,
    proposerAddress: publicKey,
    proposalText,
    status: 'Pending',
    rewardSent: false,
  };

  let fileUrl: string | undefined;
  let fileName: string | undefined;

  // If a file is attached, upload it via /api/upload-file
  if (uploadedFile) {
    const formData = new FormData();
    formData.append('proposalId', proposalId.toString());
    formData.append('file', uploadedFile, uploadedFile.name);

    const fileRes = await fetch('/api/upload-file', {
      method: 'POST',
      body: formData,
    });
    const fileData = await fileRes.json();
    if (!fileRes.ok) {
      throw new Error(fileData.error || 'Failed to upload file');
    }
    fileUrl = fileData.url;
    fileName = uploadedFile.name;
  }

  // Merge file info into metadata if a file was uploaded
  const completeMetadata = {
    ...proposalMetadata,
    ...(fileUrl ? { fileUrl, fileName } : {}),
  };

  // Upload the proposal metadata via /api/upload-proposal
  const metaRes = await fetch('/api/upload-proposal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      proposalId: proposalId.toString(),
      metadata: JSON.stringify(completeMetadata),
    }),
  });
  const metaData = await metaRes.json();
  if (!metaRes.ok) {
    throw new Error(metaData.error || 'Failed to upload proposal metadata');
  }

  return { txId, proposalId };
}
