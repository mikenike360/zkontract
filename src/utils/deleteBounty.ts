// /src/utils/deleteBounty.ts
import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import type { BountyData } from '@/components/ui/ProposalItem';

import { BOUNTY_PROGRAM_ID } from '@/types';

// Import the fee calculator function
import { getFeeForFunction } from '@/utils/feeCalculator';

const DELETE_BOUNTY_FUNCTION = 'delete_bounty';

/**
 * Handles deleting a bounty by performing two actions:
 * 1. Creates a blockchain transaction that calls the `delete_bounty` function.
 *    - Inputs: caller public key, bounty id (formatted with a "u64" suffix)
 * 2. Calls the API endpoint to delete the associated S3 data for the bounty and its proposals.
 *
 * @param wallet - The connected wallet adapter instance.
 * @param publicKey - The public key of the user.
 * @param bounty - The bounty data to be deleted.
 * @param setTxStatus - Callback function to update transaction status in the UI.
 * @param mutate - Callback function to revalidate or refresh the dashboard data.
 */
export async function handleDeleteBounty(
  wallet: any,
  publicKey: string | null,
  bounty: BountyData,
  setTxStatus: (status: string | null) => void,
  mutate: () => void
): Promise<void> {
  if (!wallet || !publicKey) {
    alert('Connect your wallet before deleting a bounty.');
    return;
  }

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this bounty?"
  );
  if (!confirmDelete) return;

  try {
    setTxStatus("Deleting bounty...");

    const deleteInputs = [publicKey, `${bounty.id}u64`];
    
    const fee = getFeeForFunction(DELETE_BOUNTY_FUNCTION);
    console.log('Calculated fee (in micro credits):', fee);

    const deleteTx = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.TestnetBeta,
      BOUNTY_PROGRAM_ID, // BOUNTY_PROGRAM_ID
      DELETE_BOUNTY_FUNCTION,
      deleteInputs,
      fee,
      true
    );

    // Submit the transaction and get its transaction ID.
    const deleteTxId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(deleteTx);
    
    setTxStatus("Called delete_bounty transaction...");

    // Now call the API endpoint to remove the bounty metadata and associated proposals from S3.
    const res = await fetch("/api/delete-bounty", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caller: publicKey, bountyId: bounty.id }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to delete bounty data from S3");
    }

    setTxStatus(deleteTxId);
    mutate();
  } catch (error) {
    console.error("Error deleting bounty:", error);
    setTxStatus("Error deleting bounty");
  }
}
