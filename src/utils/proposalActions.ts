import { Transaction, WalletAdapterNetwork,} from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { BountyData, ProposalData } from '@/components/ui/ProposalItem';
import { transferPublic } from '@/aleo/rpc';

export const CREDITS_PROGRAM_ID = 'credits.aleo';
const BOUNTY_PROGRAM_ID = 'zkontractv5.aleo';
const ACCEPT_PROPOSAL_FUNCTION = 'accept_proposal';
const TRANSFER_PUBLIC_FUNCTION = 'transfer_public'
const DENY_PROPOSAL_FUNCTION = 'deny_proposal';

export async function handleAcceptSolution(
  wallet: any,
  publicKey: string | null,
  bounty: BountyData,
  proposal: ProposalData,
  setTxStatus: (status: string | null) => void,
  mutate: () => void
) {
  if (!wallet || !publicKey) {
    alert('Connect your wallet before accepting proposals.');
    return;
  }

  const rewardAmount = `${bounty.reward}0000u64`;

  try {
  
    // // Step 1: Transfer the reward to the proposer
    // for some reason the reward if formatted differently. Need to improve this.
    
    const rewardAmountforTransfer = `${bounty.reward}000000u64`;

    setTxStatus('Transferring reward to proposer...');

    const transferInput = [
      `${proposal.proposerAddress}`,
      `${rewardAmountforTransfer}`,
    ];

    const fee = 1000000;

    // Create the transaction
    const transTX = Transaction.createTransaction(
        publicKey,                                   
        WalletAdapterNetwork.TestnetBeta,                 
        CREDITS_PROGRAM_ID,                               
        TRANSFER_PUBLIC_FUNCTION,                                     
        transferInput,                                        
        fee,      
        false                                            
      );

      console.log(transTX);

    const acceptTxTrans = await (wallet.adapter as LeoWalletAdapter).requestTransaction(transTX);
    console.log('Transfer public credits transaction submitted:', acceptTxTrans);

    setTxStatus('Waiting for transfer_public transaction to finalize...');
    let transFinalized = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      const status = await (wallet.adapter as LeoWalletAdapter).transactionStatus(acceptTxTrans);
      if (status === 'Finalized') {
        transFinalized = true;
        break;
      }
      await new Promise((res) => setTimeout(res, 2000));
    }

    if (!transFinalized) {
      throw new Error('transfer_public transaction not finalized in time.');
    }
  
    // Step 2: Accept the proposal
    setTxStatus('Accepting proposal...');
    const acceptInputs = [
      publicKey, // Caller
      `${bounty.id}u64`, // Bounty ID
      `${proposal.proposalId}u64`, // Proposal ID
      publicKey, // Creator address
      rewardAmount, // Payment amount
    ];

    console.log(acceptInputs);

    const acceptFee = 1000000; // Fixed fee for accepting the proposal
    const acceptTx = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.TestnetBeta,
      BOUNTY_PROGRAM_ID,
      ACCEPT_PROPOSAL_FUNCTION,
      acceptInputs,
      acceptFee,
      false
    );

    console.log(acceptTx);

    const acceptTxId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(acceptTx);
    console.log('Accept proposal transaction submitted:', acceptTxId);

    setTxStatus('Waiting for accept_proposal transaction to finalize...');
    let acceptFinalized = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      const status = await (wallet.adapter as LeoWalletAdapter).transactionStatus(acceptTxId);
      if (status === 'Finalized') {
        acceptFinalized = true;
        break;
      }
      await new Promise((res) => setTimeout(res, 2000));
    }

    if (!acceptFinalized) {
      throw new Error('accept_proposal transaction not finalized in time.');
    }

    // Step 3: Update the proposal status in the database
    await fetch('/api/update-proposal-status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bountyId: bounty.id,
        proposalId: proposal.proposalId,
        newStatus: 'accepted',
      }),
    });

    alert('Proposal accepted successfully! The reward has been sent.');
    mutate();
  } catch (err) {
    console.error('Error accepting proposal:', err);
    alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    setTxStatus(null);
  }
}

/**
 * Handle Denying a Proposal
 * 
 * This function performs the following steps:
 * 1. Checks if the wallet and publicKey are connected.
 * 2. Denies the proposal by executing the `deny_proposal` transition.
 * 3. Updates the proposal status in the database.
 * 4. Provides user feedback throughout the process.
 * 
 * @param wallet - The wallet adapter instance.
 * @param publicKey - The public key of the user.
 * @param bounty - The bounty data associated with the proposal.
 * @param proposal - The proposal data to be denied.
 * @param setTxStatus - Function to update the transaction status in the UI.
 * @param mutate - Function to revalidate or refresh data after transaction.
 */
export async function handleDenySolution(
  wallet: any,
  publicKey: string | null,
  bounty: BountyData,
  proposal: ProposalData,
  setTxStatus: (status: string | null) => void,
  mutate: () => void
) {
  if (!wallet || !publicKey) {
    alert('Connect your wallet before denying proposals.');
    return;
  }

  try {
    // Step 1: Deny the proposal
    setTxStatus('Denying proposal...');

    // Define inputs for the `deny_proposal` transition
    const denyInputs = [
      `${publicKey}`,       // Caller address with .private suffix
      `${bounty.id}u64`,            // Bounty ID
      `${proposal.proposalId}u64`,  // Proposal ID
    ];

    console.log('Deny Inputs:', denyInputs);

    // Define the fee for denying the proposal (adjust if necessary)
    const denyFee = 10000000; // Fixed fee for denying the proposal

    // Create the transaction for the `deny_proposal` transition
    const denyTx = Transaction.createTransaction(
      publicKey, 
      WalletAdapterNetwork.TestnetBeta, 
      BOUNTY_PROGRAM_ID,
      DENY_PROPOSAL_FUNCTION, 
      denyInputs, 
      denyFee,
      false 
    );

    console.log('Deny Transaction:', denyTx);

    // Submit the transaction and obtain the transaction ID
    const denyTxId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(denyTx);
    console.log('Deny proposal transaction submitted:', denyTxId);

    setTxStatus('Waiting for deny_proposal transaction to finalize...');
    let denyFinalized = false;

    // Poll the transaction status until it's finalized or a timeout occurs
    for (let attempt = 0; attempt < 60; attempt++) { // Adjust the number of attempts and delay as needed
      const status = await (wallet.adapter as LeoWalletAdapter).transactionStatus(denyTxId);
      console.log(`Attempt ${attempt + 1}: Transaction status - ${status}`);

      if (status === 'Finalized') {
        denyFinalized = true;
        break;
      }

      // Wait for 2 seconds before the next status check
      await new Promise((res) => setTimeout(res, 2000));
    }

    // Handle the case where the transaction was not finalized within the expected time
    if (!denyFinalized) {
      throw new Error('deny_proposal transaction not finalized in time.');
    }

    // Step 2: Update the proposal status in the database
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

    // Step 3: Provide user feedback
    alert('Proposal denied successfully!');
    setTxStatus('Proposal denied successfully!');
    mutate();
  } catch (err) {
    console.error('Error denying proposal:', err);
    alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    setTxStatus(null);
  }
}
