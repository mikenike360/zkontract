import React, { useState } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';

// Constants for your credits program and function names
const CREDITS_PROGRAM_ID = 'credits.aleo';
const TRANSFER_PRIVATE_FUNCTION = 'transfer_private';

// Example fee in microcredits (adjust as needed)
const fee = '100000';

const TransferPrivateExample: React.FC = () => {
  const { wallet, publicKey } = useWallet();
  const [txStatus, setTxStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Example function to perform a transfer_private transaction
  const handleTransferPrivate = async () => {
    try {
      console.log("Starting transfer_private transaction");
      if (!wallet || !publicKey) {
        throw new Error('Wallet not connected');
      }
      console.log("Wallet and publicKey available:", { publicKey });

      // 1. Request credits records.
      console.log("Requesting records for program:", CREDITS_PROGRAM_ID);
      const recordsResult = await (wallet.adapter as LeoWalletAdapter).requestRecords(CREDITS_PROGRAM_ID);
      console.log("Records result:", recordsResult);

      // Depending on your adapter, recordsResult might be an object with a "records" property or an array.
      const records = recordsResult.records || recordsResult;
      if (!records || records.length === 0) {
        throw new Error('No credits records found');
      }
      console.log("All fetched records:", records);

      // Log each record's spent status
      records.forEach((record: any, index: number) => {
        console.log(`Record ${index}: id=${record.id}, spent=${record.spent}`);
      });

      // 2. Filter for unspent records.
      const unspentRecords = records.filter((record: any) => record.spent === false);
      console.log("Filtered unspent records:", unspentRecords);
      if (unspentRecords.length === 0) {
        throw new Error('No unspent records available');
      }

      // 3. Choose the record you want to use (for simplicity, use the first unspent record).
      const selectedRecord = unspentRecords[0];
      console.log("Selected unspent record:", selectedRecord);

      // 4. Define the destination private address and amount (u64.private) to transfer.
      const destinationPrivateAddress = "aleo1dv6fre2y82gzw58aqga20v8mkjcjm8dj77s8fjfnnflcuhhx6y8qp9ml66";
      const transferAmount = "100000u64"; // amount as string representing microcredits
      console.log("Destination address:", destinationPrivateAddress, "Transfer amount:", transferAmount);

      // 5. Build the transaction calling transfer_private.
      const transTX = Transaction.createTransaction(
        publicKey,                                  // caller public key
        WalletAdapterNetwork.TestnetBeta,           // network
        CREDITS_PROGRAM_ID,                         // program id (credits.aleo)
        TRANSFER_PRIVATE_FUNCTION,                  // function name (transfer_private)
        [selectedRecord, destinationPrivateAddress, transferAmount],  // inputs
        fee,                                        // fee in microcredits
        true                                        // true for a private transaction
      );
      console.log("Created transaction object:", transTX);

      // 6. Submit the transaction using requestTransaction.
      const txId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(transTX);
      console.log("Transaction submitted with txId:", txId);
      setTxStatus(`Transaction submitted: ${txId}`);

      // 7. Poll for finalization (optional)
      let finalized = false;
      for (let attempt = 0; attempt < 60; attempt++) {
        const status = await (wallet.adapter as LeoWalletAdapter).transactionStatus(txId);
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
    } catch (err: any) {
      console.error('Error during transfer_private:', err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Transfer Private Test</h1>
      {error && <p className="text-red-600">{error}</p>}
      {txStatus && <p className="mb-4">{txStatus}</p>}
      <button
        onClick={handleTransferPrivate}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Execute Transfer Private
      </button>
    </div>
  );
};

export default TransferPrivateExample;
