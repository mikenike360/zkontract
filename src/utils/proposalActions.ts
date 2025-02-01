import { Transaction, WalletAdapterNetwork,} from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { BountyData, ProposalData } from '@/components/ui/ProposalItem';
import { transferPublic } from '@/aleo/rpc';

export const CREDITS_PROGRAM_ID = 'credits.aleo';
const BOUNTY_PROGRAM_ID = 'zkontractv5.aleo';
const ACCEPT_PROPOSAL_FUNCTION = 'accept_proposal';
const TRANSFER_PRIVATE_FUNCTION = 'transfer_private'
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

  const rewardAmount = `${bounty.reward}00000u64`;

  try {
  
    // ---------- STEP 1: Transfer reward privately using transfer_private -----------
    setTxStatus('Transferring reward privately to proposer...');

    // Request credits records for the credits program.
    console.log("Requesting records for program:", CREDITS_PROGRAM_ID);
    const recordsResult = await (wallet.adapter as LeoWalletAdapter).requestRecords(CREDITS_PROGRAM_ID);
    console.log("Records result:", recordsResult);

    // Depending on your adapter, records may be in recordsResult.records or directly in recordsResult.
    const records = recordsResult.records || recordsResult;
    if (!records || records.length === 0) {
      throw new Error('No credits records found');
    }
    console.log("All fetched records:", records);

    // Log each record's spent status.
    records.forEach((record: any, index: number) => {
      console.log(`Record ${index}: id=${record.id}, spent=${record.spent}`);
    });

    // Filter for unspent records.
    const unspentRecords = records.filter((record: any) => record.spent === false);
    console.log("Filtered unspent records:", unspentRecords);
    if (unspentRecords.length === 0) {
      throw new Error('No unspent records available');
    }

    // Choose the first unspent record.
    const selectedRecord = unspentRecords[0];
    console.log("Selected unspent record:", selectedRecord);

    // Define the destination private address and the transfer amount (formatted as a u64.private value).
    const destinationPrivateAddress = proposal.proposerAddress;
    const transferAmount = rewardAmount;
    console.log("Destination address:", destinationPrivateAddress, "Transfer amount:", transferAmount);

    // Build the inputs for transfer_private:
    //   r0: credits.record (the selected unspent record)
    //   r1: address.private (destination private address)
    //   r2: u64.private (reward amount, with .private suffix)
    const transferInputs = [
      selectedRecord,
      destinationPrivateAddress,
      transferAmount,
    ];
    console.log("Transfer inputs for transfer_private:", transferInputs);

    // Define the fee as a string.
    const fee = '1000000';

    // Create the transaction using transfer_private.
    const transTX = Transaction.createTransaction(
      publicKey,                                  // caller public key
      WalletAdapterNetwork.TestnetBeta,           // network
      CREDITS_PROGRAM_ID,                         // program id (credits.aleo)
      TRANSFER_PRIVATE_FUNCTION,                  // function name (transfer_private)
      transferInputs,                             // inputs array
      fee,                                        // fee in microcredits
      true                                        // true indicates a private transaction
    );
    console.log("Created transfer_private transaction object:", transTX);

    // Submit the transaction.
    const transferTxId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(transTX);
    console.log("Transfer private transaction submitted with txId:", transferTxId);
    setTxStatus(`Transfer private transaction submitted: ${transferTxId}`);

    // (Optional) Poll for finalization...
    let finalized = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      const status = await (wallet.adapter as LeoWalletAdapter).transactionStatus(transferTxId);
      console.log(`Attempt ${attempt + 1} status:`, status);
      setTxStatus(`Attempt ${attempt + 1}: ${status}`);
      if (status === 'Finalized') {
        finalized = true;
        break;
      }
      await new Promise((res) => setTimeout(res, 2000));
    }
    console.log("Finalization result:", finalized);
    setTxStatus(finalized ? 'Transaction finalized' : 'Transaction not finalized after polling');

  
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

    const acceptFee = 100000; // Fixed fee for accepting the proposal
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
    const denyFee = 100000; // Fixed fee for denying the proposal

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
