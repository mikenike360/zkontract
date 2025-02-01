import React, { useState } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';

// Constants for your credits program and function names
const CREDITS_PROGRAM_ID = 'credits.aleo';
const TRANSFER_PRIVATE_FUNCTION = 'transfer_private';

// Example fee in microcredits (adjust as needed)
const fee = '1000000';

const TransferPrivateExample: React.FC = () => {
  const { wallet, publicKey } = useWallet();
  const [txStatus, setTxStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Helper function to extract numeric value from a string like "18923u64.private" or "5000000u64"
  const extractValue = (valueStr: string): number => {
    const match = valueStr.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

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

      // Log each record's spent status and value
      records.forEach((record: any, index: number) => {
        const recordValue = extractValue(record.data.microcredits);
        console.log(`Record ${index}: id=${record.id}, spent=${record.spent}, value=${recordValue}`);
      });

      // 2. Filter for unspent records.
      const unspentRecords = records.filter((record: any) => record.spent === false);
      console.log("Filtered unspent records:", unspentRecords);
      if (unspentRecords.length === 0) {
        throw new Error('No unspent records available');
      }

      // 3. Calculate the total amount required (transfer + fee)
      // Remove the type suffix from transferAmount (e.g., "5000000u64" -> 5000000)
      const transferAmount = "5000000u64";
      const transferAmountValue = extractValue(transferAmount);
      const feeValue = parseInt(fee, 10);
      const totalRequired = transferAmountValue + feeValue;
      console.log(`Transfer amount: ${transferAmountValue}, Fee: ${feeValue}, Total required: ${totalRequired}`);

      // 4. From the unspent records, pick the record with enough funds and the smallest surplus
      const candidateRecords = unspentRecords.filter((record: any) => {
        const recordValue = extractValue(record.data.microcredits);
        return recordValue >= totalRequired;
      });

      if (candidateRecords.length === 0) {
        throw new Error(
          "No unspent record has enough funds for the transaction. " +
          `Please ensure you have a record with at least ${totalRequired} microcredits.`
        );
      }

      const selectedRecord = candidateRecords.reduce((prev: any, curr: any) => {
        const prevValue = extractValue(prev.data.microcredits);
        const currValue = extractValue(curr.data.microcredits);
        // Compare surpluses (record value minus the total required amount)
        return (currValue - totalRequired) < (prevValue - totalRequired) ? curr : prev;
      });
      console.log("Selected unspent record:", selectedRecord);

      // 5. Calculate change (if any)
      const selectedRecordValue = extractValue(selectedRecord.data.microcredits);
      const changeValue = selectedRecordValue - totalRequired;
      // Format change with type suffix if change exists
      const changeParam = changeValue > 0 ? `${changeValue}u64` : null;
      if (changeParam) {
        console.log(`Calculated change: ${changeValue} microcredits`);
      } else {
        console.log('No change output needed.');
      }

      // 6. Define the destination private address.
      const destinationPrivateAddress = "aleo1dv6fre2y82gzw58aqga20v8mkjcjm8dj77s8fjfnnflcuhhx6y8qp9ml66";
      console.log("Destination address:", destinationPrivateAddress, "Transfer amount:", transferAmount);

      // 7. Build the transaction.
      // Prepare inputs: if there's change, add it as an extra parameter.
      const txInputs = [selectedRecord, destinationPrivateAddress, transferAmount];


      const transTX = Transaction.createTransaction(
        publicKey,                                  // caller public key
        WalletAdapterNetwork.TestnetBeta,           // network
        CREDITS_PROGRAM_ID,                         // program id (credits.aleo)
        TRANSFER_PRIVATE_FUNCTION,                  // function name (transfer_private)
        txInputs,                                   // inputs (record, destination, transfer amount, [optional change])
        fee,                                        // fee in microcredits
        true                                        // true for a private transaction
      );
      console.log("Created transaction object:", transTX);

      // 8. Submit the transaction using requestTransaction.
      const txId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(transTX);
      console.log("Transaction submitted with txId:", txId);
      setTxStatus(`Transaction submitted: ${txId}`);

      // 9. Poll for finalization (optional)
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
