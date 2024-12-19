import { useState, useEffect, ChangeEvent } from 'react';
import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import Base from '@/components/ui/base';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import Button from '@/components/ui/button';
import {
  Transaction,
  WalletAdapterNetwork,
  WalletTransactionError
} from '@demox-labs/aleo-wallet-adapter-base';
import { NFTProgramId } from '@/aleo/nft-program';
import { padArray, safeParseInt, splitStringToBigInts, joinBigIntsToString } from '@/lib/util';
import useSWR from 'swr';
import { TESTNET3_API_URL, getNFTs } from '@/aleo/rpc';
import BulkAdd from '@/components/ui/forms/bulk-add';
import CSVExportButton from '@/components/ui/button/csv-export';

const Add: NextPageWithLayout = () => {
  const { wallet, publicKey } = useWallet();
  const { data, error, isLoading } = useSWR('getAllNFTs', () => getNFTs(TESTNET3_API_URL));

  const [url, setUrl] = useState('');
  const [editions, setEditions] = useState(0);
  const [fee, setFee] = useState<string>('6.5');
  const [feePublic, setFeePublic] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [formattedTokenId, setFormattedTokenId] = useState<{ id0: string; id1: string } | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);

  const decodeTokenId = (tokenId: { id0: string; id1: string }): string => {
    const bigInts = [
      BigInt(tokenId.id0.replace(/u128$/, '')),
      BigInt(tokenId.id1.replace(/u128$/, '')),
    ];
    return joinBigIntsToString(bigInts);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (transactionId) {
      intervalId = setInterval(() => {
        getTransactionStatus(transactionId);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [transactionId]);

  const prepareTokenId = (relativeUrl: string): { id0: string; id1: string } => {
    const sanitizedUrl = relativeUrl.trim();
    console.debug("Sanitized URL:", sanitizedUrl);

    const urlParts = splitStringToBigInts(sanitizedUrl, 32); // Explicit chunk size
    console.debug("Split URL Parts:", urlParts);

    const paddedParts = padArray(urlParts, 2); // Pad to at least 2 parts
    console.debug("Padded URL Parts:", paddedParts);

    return {
      id0: `${paddedParts[0]}u128`,
      id1: `${paddedParts[1]}u128`,
    };
  };

  const handlePrepareTokenId = (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    const tokenId = prepareTokenId(url);
    setFormattedTokenId(tokenId);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formattedTokenId) return;
  
    try {
      const inputs = [
        { id0: formattedTokenId.id0, id1: formattedTokenId.id1 }, // Should be objects
        `${editions}scalar`, // Should be a string
      ];
  
      console.debug("Transaction Inputs:", inputs);
  
      // Validate inputs are correct types
      if (!formattedTokenId.id0 || typeof formattedTokenId.id0 !== "string") {
        throw new Error("id0 is invalid or not a string.");
      }
      if (!formattedTokenId.id1 || typeof formattedTokenId.id1 !== "string") {
        throw new Error("id1 is invalid or not a string.");
      }
      if (typeof editions !== "number" && typeof editions !== "string") {
        throw new Error("Editions is not a valid number or string.");
      }
  
      const feeMicrocredits = Math.floor(parseFloat(fee) * 1_000_000);
      console.debug("Fee in Microcredits:", feeMicrocredits);
  
      const aleoTransaction = Transaction.createTransaction(
        publicKey!,
        WalletAdapterNetwork.TestnetBeta,
        NFTProgramId,
        'add_nft',
        inputs,
        feeMicrocredits,
        feePublic
      );
  
      console.debug("Prepared Transaction:", aleoTransaction);
  
      const txId = await wallet?.adapter?.requestTransaction(aleoTransaction);
      setTransactionId(txId);
      setShowModal(false);
    } catch (error) {
      console.error("Transaction submission failed:", error);
      alert("Failed to submit transaction. Check console logs for details.");
    }
  };
  
  

  const getTransactionStatus = async (txId: string) => {
    const status = await (wallet?.adapter as LeoWalletAdapter).transactionStatus(txId);
    setStatus(status);
  };

  return (
    <>
      <NextSeo title="Add NFT" description="Add an NFT with the Leo Wallet" />
      <Base key="form">
        <div className="flex">
          <div className="px-4 w-1/2">
            <form
              noValidate
              role="search"
              onSubmit={handlePrepareTokenId}
              className="relative flex w-full flex-col rounded-full md:w-auto"
            >
              <div className="text-center text-lg">Upload 1 NFT</div>
              <label className="flex w-full items-center justify-between py-4">
                URL:
                <input
                  className="w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                  placeholder="The relative URL to your NFT, e.g., privacy-pride/1.json"
                  onChange={(event) => setUrl(event.currentTarget.value)}
                  value={url}
                />
              </label>
              <label className="flex w-full items-center justify-between py-4">
                Edition (default is 0):
                <input
                  className="h-11 w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                  placeholder="Edition number (optional)"
                  onChange={(event) => setEditions(safeParseInt(event.currentTarget.value) || 0)}
                  value={editions}
                />
              </label>
              <label className="flex w-full items-center justify-between py-4">
                Fee:
                <input
                  className="h-11 w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                  placeholder="Fee (in microcredits)"
                  onChange={(event) => {
                    if (/^\d*(\.\d*)?$/.test(event.currentTarget.value)) {
                      setFee(event.currentTarget.value);
                    }
                  }}
                  value={fee}
                />
              </label>
              <div className="flex items-center justify-center">
                <Button
                  disabled={!publicKey || !url || fee === undefined}
                  type="submit"
                  className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
                >
                  {!publicKey ? 'Connect Your Wallet' : 'Submit'}
                </Button>
              </div>
            </form>
          </div>
          <div className="px-4 w-1/2">
            <BulkAdd />
          </div>
        </div>
        {transactionId && (
          <div>
            <div>{`Transaction status: ${status || 'Pending...'}`}</div>
          </div>
        )}
      </Base>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-green-700 bg-opacity-90">
          <div className="bg-green-500 rounded-lg shadow-lg p-6 w-1/3 max-w-lg">
            <h2 className="text-lg font-semibold text-white">Confirm NFT Details</h2>
            
            <p className="mt-4 text-white break-words">
              <strong>Original URL:</strong>
            </p>
            <pre className="bg-green-600 text-white p-2 rounded-md mt-2 break-words whitespace-pre-wrap">
              {url}
            </pre>
            
            <p className="mt-4 text-white">
              <strong>Encoded TokenId:</strong>
            </p>
            <pre className="bg-green-600 text-white p-2 rounded-md mt-2 break-words whitespace-pre-wrap">
              {JSON.stringify(formattedTokenId, null, 2)}
            </pre>
            
            <p className="mt-4 text-white">
              <strong>Decoded URL (Validation):</strong>
            </p>
            <pre className="bg-green-600 text-white p-2 rounded-md mt-2 break-words whitespace-pre-wrap">
              {formattedTokenId ? decodeTokenId(formattedTokenId) : 'N/A'}
            </pre>
            
            <div className="flex justify-end mt-4 space-x-2">
              <Button onClick={() => setShowModal(false)} className="px-4 py-2 bg-green-700 text-white font-medium rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="px-4 py-2 bg-green-800 text-white font-medium rounded-md hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400">
                Confirm and Submit
              </Button>
            </div>
          </div>
        </div>
      )}


      {data && data.nfts && (
        <Base key="list">
          <div className="flex flex-col items-center justify-center">
            <div className="flex justify-between w-full">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Current NFTs
              </h2>
              <div className="my-4">
                <CSVExportButton
                  data={data.nfts
                    .filter((item: any) => item.url && item.properties?.image)
                    .map((item: any) => ({
                      url: item.url || 'Invalid URL',
                      imageUrl: item.properties?.image || 'https://via.placeholder.com/100',
                      edition: item.edition || 'Unknown',
                    }))}
                  filename="nfts.csv"
                />
              </div>
            </div>
          </div>
        </Base>
      )}
    </>
  );
};

Add.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Add;
