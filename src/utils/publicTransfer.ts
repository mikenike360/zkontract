// publicTransfer.ts

import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';

export const CREDITS_PROGRAM_ID = 'credits.aleo';
export const TRANSFER_PUBLIC_FUNCTION = 'transfer_public';

/**
 * Executes a public transfer of credits to a target address.
 *
 * @param wallet - The wallet adapter instance.
 * @param publicKey - The public key of the user performing the transfer.
 * @param proposerAddress - The address to receive the public transfer.
 * @param bountyReward - The reward amount (in microcredits) to be transferred.
 * @param setTxStatus - Function to update the transaction status in the UI.
 * @returns The transaction ID of the submitted public transfer.
 */
export async function publicTransfer(
  wallet: LeoWalletAdapter,
  publicKey: string,
  proposerAddress: string,
  bountyReward: number,
  setTxStatus: (status: string | null) => void
): Promise<string> {
  // E.g. if bountyReward= “5000”, you might do “5000000u64”
  const rewardAmountforTransfer = `${bountyReward}000000u64`; 

  setTxStatus('Transferring reward to proposer (public transfer)...');

  // 1. Create the transaction input
  const transferInput = [proposerAddress, rewardAmountforTransfer];
  const fee = 1_000_000;

  // 2. Build the transaction
  const transTx = Transaction.createTransaction(
    publicKey,
    WalletAdapterNetwork.TestnetBeta,
    CREDITS_PROGRAM_ID,
    TRANSFER_PUBLIC_FUNCTION,
    transferInput,
    fee,
    false
  );

  // 3. Send the transaction
  const txId = await wallet.requestTransaction(transTx);
  setTxStatus(`Public transfer submitted: ${txId}`);

  // 4. Poll for finalization
  let finalized = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    const status = await wallet.transactionStatus(txId);
    if (status === 'Finalized') {
      finalized = true;
      break;
    }
    await new Promise((res) => setTimeout(res, 2000));
  }

  if (!finalized) {
    throw new Error('Public transfer not finalized in time.');
  }

  setTxStatus('Public transfer finalized.');
  return txId;
}
