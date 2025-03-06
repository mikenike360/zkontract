// privateTransfer.ts

import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';

export const CREDITS_PROGRAM_ID = 'credits.aleo';
export const TRANSFER_PRIVATE_FUNCTION = 'transfer_private';

/**
 * Executes a private transfer of credits to a target address.
 *
 * @param wallet - The wallet adapter instance.
 * @param publicKey - The public key of the user performing the transfer.
 * @param proposerAddress - The address to receive the funds.
 * @param bountyReward - The reward amount (in microcredits) to be transferred.
 * @param setTxStatus - Function to update the transaction status in the UI.
 * @returns The transaction ID of the submitted private transfer.
 */
export async function privateTransfer(
  wallet: LeoWalletAdapter,
  publicKey: string,
  proposerAddress: string,
  bountyReward: number,
  setTxStatus: (status: string | null) => void
): Promise<string> {
  // Example: reward is “5000” => we do “5000000u64” or “500000000u64”, etc.
  // Adjust your multiplier as needed (based on decimal places).
  const rewardAmountforTransfer = `${bountyReward}000000u64`; 

  // 1. Fetch all records for credits program
  const allRecords = await wallet.requestRecords(CREDITS_PROGRAM_ID);
  if (!allRecords || allRecords.length === 0) {
    throw new Error('No credits records found.');
  }

  // 2. Filter private + unspent records
  const privateRecords = allRecords.filter(
    (record: any) => record.data?.microcredits && record.data.microcredits.endsWith('u64.private')
  );
  const unspentRecords = privateRecords.filter((record: any) => record.spent === false);

  if (unspentRecords.length === 0) {
    throw new Error('No unspent private records available.');
  }

  // 3. Find one record that can cover bountyReward
  const extractValue = (valueStr: string): number => {
    const match = valueStr.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };
  const neededAmount = extractValue(rewardAmountforTransfer);

  const transferCandidates = unspentRecords.filter((record: any) => {
    const recordValue = extractValue(record.data.microcredits);
    return recordValue >= neededAmount;
  });

  if (transferCandidates.length === 0) {
    throw new Error('No single record can cover the required transfer amount.');
  }

  const chosenRecord = transferCandidates[0];

  // 4. Create transaction inputs
  const txInputs = [
    chosenRecord,       // The record we’ll spend
    proposerAddress,    // The address receiving the funds
    rewardAmountforTransfer,
  ];

  // 5. Build the transaction
  const transaction = Transaction.createTransaction(
    publicKey,
    WalletAdapterNetwork.TestnetBeta,
    CREDITS_PROGRAM_ID,
    TRANSFER_PRIVATE_FUNCTION,
    txInputs,
    1_000_000,
    false
  );

  // 6. Submit the transaction
  const txId = await wallet.requestTransaction(transaction);
  setTxStatus(`Private transfer submitted: ${txId}`);

  // 7. (Optional) Poll for completion/finalization
  let finalized = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    const status = await wallet.transactionStatus(txId);
    setTxStatus(`Attempt ${attempt + 1}: ${status}`);

    if (status === 'Completed' || status === 'Finalized') {
      finalized = true;
      break;
    }
    await new Promise((res) => setTimeout(res, 2000));
  }

  if (!finalized) {
    setTxStatus('Private transfer not finalized in time.');
  } else {
    setTxStatus('Private transfer finalized.');
  }

  return txId;
}
