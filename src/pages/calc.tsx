import React, { useState } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import Button from '@/components/ui/button';

const CREDITS_PROGRAM_ID = 'credits.aleo';
const TRANSFER_PRIVATE_FUNCTION = 'transfer_private';
// Fee must be provided as a number.
const fee = 1000000;

const TransferPrivateExample: React.FC = () => {
  const { wallet, publicKey } = useWallet();
  const [txStatus, setTxStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  // Helper function to add a log message.
  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  // Helper function to extract the numeric portion from strings like "5000000u64" or "5000000u64.private".
  const extractValue = (valueStr: string): number => {
    const match = valueStr.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const handleTransferPrivate = async () => {
    try {
      addLog("Starting transfer_private transaction");
      if (!wallet || !publicKey) {
        throw new Error('Wallet not connected');
      }
      addLog(`Wallet and publicKey available: ${publicKey}`);

      // 1. Request credits records.
      addLog(`Requesting records for program: ${CREDITS_PROGRAM_ID}`);
      const recordsResult = await (wallet.adapter as LeoWalletAdapter).requestRecords(CREDITS_PROGRAM_ID);
      addLog(`Records result: ${JSON.stringify(recordsResult)}`);
      const records = recordsResult.records || recordsResult;
      if (!records || records.length === 0) {
        throw new Error('No credits records found');
      }
      addLog(`Fetched records: ${JSON.stringify(records)}`);
      records.forEach((record: any, index: number) => {
        const recordValue = extractValue(record.data.microcredits);
        addLog(`Record ${index}: id=${record.id}, spent=${record.spent}, value=${recordValue}`);
      });

      // 2. Filter for unspent records.
      const unspentRecords = records.filter((record: any) => record.spent === false);
      addLog(`Filtered unspent records: ${JSON.stringify(unspentRecords)}`);
      if (unspentRecords.length === 0) {
        throw new Error('No unspent records available');
      }

      // 3. Calculate total required (transfer amount + fee).
      // Here we set the transfer amount as a private literal since the function expects a u64.private input.
      const transferAmount = "5000000u64.private";
      const transferAmountValue = extractValue(transferAmount);
      const feeValue = fee; // Fee is already a number.
      const totalRequired = transferAmountValue + feeValue;
      addLog(`Transfer amount: ${transferAmountValue}, Fee: ${feeValue}, Total required: ${totalRequired}`);

      // 4. Choose the unspent record with enough funds and the smallest surplus.
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
        return (currValue - totalRequired) < (prevValue - totalRequired) ? curr : prev;
      });
      addLog(`Selected record: ${JSON.stringify(selectedRecord)}`);

      // 5. Calculate change (if any).
      const selectedRecordValue = extractValue(selectedRecord.data.microcredits);
      const changeValue = selectedRecordValue - totalRequired;
      const changeParam = changeValue > 0 ? `${changeValue}u64` : null;
      if (changeParam) {
        addLog(`Calculated change: ${changeValue} microcredits`);
      } else {
        addLog('No change output needed.');
      }

      // 6. Define the destination private address.
      const destinationPrivateAddress = "aleo1dv6fre2y82gzw58aqga20v8mkjcjm8dj77s8fjfnnflcuhhx6y8qp9ml66";
      addLog(`Destination: ${destinationPrivateAddress}, Transfer amount: ${transferAmount}`);

      // 7. Sanitize the selected record.
      // We remove the ".private" suffix from the microcredits value so that the adapter can correctly parse the balance.
      const sanitizedRecord = {
        ...selectedRecord,
        data: {
          microcredits: `${extractValue(selectedRecord.data.microcredits)}u64`
        }
      };
      addLog(`Sanitized record: ${JSON.stringify(sanitizedRecord)}`);
      addLog(`Sanitized record balance: ${extractValue(sanitizedRecord.data.microcredits)}`);

      // 8. Build the transaction.
      const txInputs = [sanitizedRecord, destinationPrivateAddress, transferAmount];
      const transTX = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.TestnetBeta,
        CREDITS_PROGRAM_ID,
        TRANSFER_PRIVATE_FUNCTION,
        txInputs,
        fee,
        true // private transaction
      );
      addLog(`Created transaction object: ${JSON.stringify(transTX)}`);

      // 9. Submit the transaction.
      const txId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(transTX);
      addLog(`Transaction submitted with txId: ${txId}`);
      setTxStatus(`Transaction submitted: ${txId}`);

      // 10. Poll for finalization (optional).
      let finalized = false;
      for (let attempt = 0; attempt < 60; attempt++) {
        const status = await (wallet.adapter as LeoWalletAdapter).transactionStatus(txId);
        addLog(`Attempt ${attempt + 1} status: ${status}`);
        setTxStatus(`Attempt ${attempt + 1}: ${status}`);
        if (status === 'Finalized') {
          finalized = true;
          break;
        }
        await new Promise((res) => setTimeout(res, 2000));
      }
      addLog(`Finalization result: ${finalized}`);
      setTxStatus(finalized ? 'Transaction finalized' : 'Transaction not finalized after polling');
    } catch (err: any) {
      addLog(`Error during transfer_private: ${err.message}`);
      setError(err.message);
    }
  };

  return (
    <>
      <NextSeo
        title="Transfer Private"
        description="Perform a transfer_private transaction"
      />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16 bg-black text-white">
        <h1 className="text-3xl font-bold mb-4">Transfer Private Test</h1>
        {error && <p className="text-red-500">{error}</p>}
        {txStatus && <p className="mb-4">{txStatus}</p>}
        <Button
          onClick={handleTransferPrivate}
          className="px-6 py-3 text-lg font-semibold bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
        >
          Execute Transfer Private
        </Button>
        <div className="mt-4 w-full">
          <h2 className="text-xl font-semibold mb-2">Logs:</h2>
          <pre className="bg-gray-900 p-4 rounded max-h-80 overflow-y-auto text-white">
            {logs.join("\n")}
          </pre>
        </div>
      </div>
    </>
  );
};

TransferPrivateExample.getLayout = (page) => <Layout>{page}</Layout>;
export default TransferPrivateExample;
