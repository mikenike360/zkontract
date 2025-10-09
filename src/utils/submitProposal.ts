// /utils/submitProposal.ts

import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
// Removed: import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { BOUNTY_PROGRAM_ID } from '@/types';
import { CURRENT_NETWORK } from '@/types';

// Import the fee calculator function
import { getFeeForFunction } from '@/utils/feeCalculator';
import { signRequest } from '@/utils/signing';

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

  // Validate inputs
  console.log('[submitProposal] Validating publicKey:', publicKey);
  console.log('[submitProposal] publicKey length:', publicKey?.length);
  console.log('[submitProposal] Regex test result:', /^aleo1[a-zA-Z0-9]{58}$/.test(publicKey));
  
  if (!/^aleo1[a-zA-Z0-9]{58}$/.test(publicKey)) {
    console.error('[submitProposal] Public key validation FAILED for:', publicKey);
    throw new Error('Invalid public key format');
  }
  
  console.log('[submitProposal] Public key validation PASSED');
  
  const inputs = [
    publicKey,                    // caller (address)
    `${bountyId}u64`,            // bounty_id (u64)
    `${proposalId}u64`,          // proposal_id (u64)  
    publicKey,                   // proposer_address (address)
  ];
  
  console.log('Formatted inputs:', inputs);

  const fee = getFeeForFunction(SUBMIT_PROPOSAL_FUNCTION);
  console.log('Calculated fee (in micro credits):', fee);

  console.log('Transaction inputs:', {
    address: publicKey,
    network: CURRENT_NETWORK,
    programId: BOUNTY_PROGRAM_ID,
    functionName: SUBMIT_PROPOSAL_FUNCTION,
    inputs: inputs,
    fee: fee
  });

  // Create the transaction using the official Transaction class
  const proposalTx = Transaction.createTransaction(
    publicKey,
    CURRENT_NETWORK,
    BOUNTY_PROGRAM_ID,
    SUBMIT_PROPOSAL_FUNCTION,
    inputs,
    fee,
    false
  );

  console.log('Created transaction object:', proposalTx);
  console.log('Transaction details:', JSON.stringify(proposalTx, null, 2));

  // Request transaction execution via the wallet adapter
  let txId: string;
  try {
    // Check which wallet adapter is being used
    const walletName = wallet.adapter.name || 'unknown';
    console.log('Using wallet adapter:', walletName);
    
    // Check wallet connection and balance
    console.log('Wallet publicKey:', wallet.publicKey);
    console.log('Wallet connected:', wallet.connected);
    
    if (walletName.toLowerCase().includes('puzzle')) {
      // Puzzle Wallet might not be fully compatible with direct program transactions yet
      console.log('Detected Puzzle Wallet');
      
      // Try the standard Leo transaction format first
      try {
        console.log('Trying standard transaction format with Puzzle Wallet');
        txId = await wallet.adapter.requestTransaction(proposalTx);
      } catch (puzzleError) {
        console.error('Standard format failed with Puzzle Wallet:', puzzleError);
        console.error('Puzzle error details:', JSON.stringify(puzzleError, null, 2));
        
        // If that fails, provide a helpful error message
        throw new Error(
          'Puzzle Wallet is not yet fully supported for this transaction type. ' +
          'Please use Leo Wallet, Fox Wallet, or Soter Wallet for submitting proposals. ' +
          'Puzzle Wallet support is coming soon!'
        );
      }
    } else {
      // Leo Wallet and other wallets use the standard format
      console.log('Using standard transaction format for', walletName);
      console.log('About to call requestTransaction...');
      try {
        txId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(proposalTx);
      } catch (txError) {
        console.error('requestTransaction error:', txError);
        console.error('Error type:', typeof txError);
        console.error('Error constructor:', txError?.constructor?.name);
        console.error('Error message:', txError instanceof Error ? txError.message : String(txError));
        console.error('Error stack:', txError instanceof Error ? txError.stack : 'No stack');
        
        // Check if it's a balance or specific wallet error
        const errorMsg = txError instanceof Error ? txError.message : String(txError);
        if (errorMsg.includes('insufficient')) {
          throw new Error('Insufficient balance to pay transaction fee. Please ensure your wallet has enough ALEO credits.');
        }
        throw txError;
      }
    }
    
    if (!txId) {
      throw new Error('Transaction failed - no transaction ID returned');
    }
    console.log('Transaction ID received:', txId);
  } catch (error) {
    console.error('Transaction request failed:', error);
    console.error('Wallet adapter name:', wallet.adapter.name);
    console.error('Full error object:', error);
    throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
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

  // Sign the request for authentication
  const auth = await signRequest(wallet.adapter, 'upload_proposal', { proposalId });

  // Upload the proposal metadata via /api/upload-proposal
  const metaRes = await fetch('/api/upload-proposal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      caller: publicKey,
      proposalId: proposalId,
      metadata: JSON.stringify(completeMetadata),
      signature: auth.signature,
      message: auth.message,
      timestamp: auth.timestamp,
      nonce: auth.nonce,
    }),
  });
  const metaData = await metaRes.json();
  if (!metaRes.ok) {
    throw new Error(metaData.error || 'Failed to upload proposal metadata');
  }

  return { txId, proposalId };
}
