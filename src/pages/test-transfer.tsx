import React, { useState } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import Button from '@/components/ui/button';

const CREDITS_PROGRAM_ID = 'credits.aleo';
const TRANSFER_PRIVATE_FUNCTION = 'transfer_private';
const TRANSFER_AMOUNT_LITERAL = '5000000u64'; // e.g. 5,000,000
const FEE = 1_000_000; // 1,000,000 microcredits

const TransferPrivateExample = () => {
  const { wallet, publicKey } = useWallet();
  const [txStatus, setTxStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  // Helper to add logs to our <pre> output
  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  // Extract the numeric portion from a string like "5000000u64.private" => 5000000
  const extractValue = (valueStr: string): number => {
    const match = valueStr.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Our main logic for transfer_private
  const handleTransferPrivate = async () => {
    try {
      addLog('Starting transfer_private transaction...');

      // 1) Check wallet connection
      if (!wallet || !publicKey) {
        throw new Error('Wallet not connected');
      }
      addLog(`Wallet and publicKey available: ${publicKey}`);

      // 2) Fetch all unspent private records for credits.aleo
      addLog(`Requesting records for program: ${CREDITS_PROGRAM_ID}`);
      const allRecords = await (wallet.adapter as LeoWalletAdapter).requestRecords(CREDITS_PROGRAM_ID);
      addLog(`Records result: ${JSON.stringify(allRecords)}`);

      if (!allRecords || allRecords.length === 0) {
        throw new Error('No credits records found');
      }

      // Filter private + unspent
      const privateRecords = allRecords.filter(
        (record: any) =>
          record.data?.microcredits && record.data.microcredits.endsWith('u64.private')
      );
      addLog(`Filtered private records: ${JSON.stringify(privateRecords)}`);

      const unspentRecords = privateRecords.filter((record: any) => record.spent === false);
      addLog(`Filtered unspent private records: ${JSON.stringify(unspentRecords)}`);

      if (unspentRecords.length === 0) {
        throw new Error('No unspent private records available');
      }

      // 3) Transfer and Fee amounts
      const transferAmountValue = extractValue(TRANSFER_AMOUNT_LITERAL);
      addLog(`We want to transfer ${transferAmountValue} microcredits privately`);
      addLog(`We also need a private fee of ${FEE} microcredits`);

      // 4) Pick one record with enough to cover our *transfer*
      //    (Does NOT have to cover the fee too, if we are paying fee from a *different* record).
      const transferCandidates = unspentRecords.filter((record: any) => {
        const recordValue = extractValue(record.data.microcredits);
        return recordValue >= transferAmountValue;
      });
      if (transferCandidates.length === 0) {
        throw new Error(
          `No unspent private record can cover ${TRANSFER_AMOUNT_LITERAL} for the transfer.`
        );
      }
      const transferRecord = transferCandidates[0];
      addLog(`Selected transfer record: ${JSON.stringify(transferRecord)}`);

      // 5) Pick a separate record to cover the fee
      //    Must have >= 1,000,000 microcredits (or more for overhead).
      const feeCandidates = unspentRecords.filter((record: any) => {
        const recordValue = extractValue(record.data.microcredits);
        return recordValue >= FEE && record.id !== transferRecord.id;
      });
      if (feeCandidates.length === 0) {
        throw new Error(
          `No separate record can cover the ${FEE} microcredit fee (or we only have the same record).`
        );
      }
      const feeRecord = feeCandidates[0];
      addLog(`Selected fee record: ${JSON.stringify(feeRecord)}`);

      // 6) Build the function inputs
      //    Some wallets/programs allow multiple records if the function signature supports it.
      //    E.g.: [transferRecord, feeRecord, destination, "5000000u64"].
      //    If your function truly expects only [record, address, u64], this won't work.
      const destinationPrivateAddress =
        'aleo1dv6fre2y82gzw58aqga20v8mkjcjm8dj77s8fjfnnflcuhhx6y8qp9ml66';
      const txInputs = [
        transferRecord,       // record to cover the 5M transfer
        destinationPrivateAddress,
        TRANSFER_AMOUNT_LITERAL,
      ];
      addLog(`Transaction inputs: ${JSON.stringify(txInputs)}`);

      // 7) Create the transaction object with isPrivate = true
      const transaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.TestnetBeta,
        CREDITS_PROGRAM_ID,
        TRANSFER_PRIVATE_FUNCTION,
        txInputs,
        1_000_000,      // numeric fee
        true      // isPrivate
      );
      addLog(`Created transaction object: ${JSON.stringify(transaction)}`);

      // 8) Submit the transaction
      const txId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(transaction);
      addLog(`Transaction submitted with txId: ${txId}`);
      setTxStatus(`Transaction submitted: ${txId}`);

      // 9) Poll for finalization
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
      <NextSeo title="Transfer Private" description="Perform a transfer_private transaction" />
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
            {logs.join('\n')}
          </pre>
        </div>
      </div>
    </>
  );
};

TransferPrivateExample.getLayout = (page) => <Layout>{page}</Layout>;
export default TransferPrivateExample;
