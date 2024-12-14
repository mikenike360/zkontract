import { useState, useEffect, ChangeEvent } from 'react';
import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import Base from '@/components/ui/base';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import Button, { ButtonProps } from '@/components/ui/button'; // Updated import
import {
  Transaction,
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from '@demox-labs/aleo-wallet-adapter-base';
import { NFTProgramId } from '@/aleo/nft-program';
import { padArray, safeParseInt, splitStringToBigInts } from '@/lib/util';
import useSWR from 'swr';
import { TESTNET3_API_URL, getNFTs } from '@/aleo/rpc';
import BulkAdd from '@/components/ui/forms/bulk-add';
import CSVExportButton from '@/components/ui/button/csv-export';

const Add: NextPageWithLayout = () => {
  const { wallet, publicKey } = useWallet();
  const { data, error, isLoading } = useSWR('getAllNFTs', () => getNFTs(TESTNET3_API_URL));

  const [url, setUrl] = useState('');
  const [editions, setEditions] = useState(0); // Default value is 0
  const [fee, setFee] = useState<string>('6.5');
  const [feePublic, setFeePublic] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (transactionId) {
      intervalId = setInterval(() => {
        getTransactionStatus(transactionId!);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [transactionId]);

  const prepareTokenId = (url: string): { id0: string, id1: string } => {
    const urlHash = splitStringToBigInts(url.trim());
    const paddedUrl = padArray(urlHash, 2); // Ensure two elements
    return { id0: `${paddedUrl[0]}u128`, id1: `${paddedUrl[1]}u128` };
  };
  
  

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!publicKey) {
      alert('Wallet not connected. Please connect your wallet first.');
      return;
    }
  
    try {
      // Validate the relative path
      if (!url.startsWith('bafy') || !url.endsWith('.json')) {
        alert('Invalid relative URL. Please provide a valid IPFS CID with a file path.');
        return;
      }
  
      // Prepare TokenId from the relative path
      const formattedTokenId = prepareTokenId(url);
      console.log('Formatted TokenId:', formattedTokenId);
  
      // Prepare the transaction inputs
      const inputs = [
        `{ id0: ${formattedTokenId.id0}, id1: ${formattedTokenId.id1} }`,
        `${editions}scalar`,
      ];
  
      console.log('Inputs for add_nft:', inputs);
  
      // Create the transaction
      const feeMicrocredits = Math.floor(parseFloat(fee) * 1_000_000);
      const aleoTransaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.TestnetBeta,
        NFTProgramId,
        'add_nft',
        inputs,
        feeMicrocredits,
        feePublic
      );
  
      console.log('Aleo Transaction:', aleoTransaction);
  
      // Submit the transaction
      const txId = await wallet?.adapter?.requestTransaction(aleoTransaction);
      console.log('Transaction ID:', txId);
      setTransactionId(txId);
    } catch (error) {
      console.error('Transaction submission failed:', error);
      alert('Failed to submit transaction.');
    }
  };
  
  
  
  

  const getTransactionStatus = async (txId: string) => {
    const status = await (
      wallet?.adapter as LeoWalletAdapter
    ).transactionStatus(txId);
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
              onSubmit={handleSubmit}
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
                  onChange={(event) => setEditions(safeParseInt(event.currentTarget.value) || 0)} // Default to 0
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
      {data && data.nfts && (
      <Base key="list">
        <div className="flex flex-col items-center justify-center">
          <div className="flex justify-between w-full">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Current NFTs
            </h2>
            <div className="my-4">
              <CSVExportButton
                data={data.nfts.map((item: any) => ({
                  url: item.url || 'Invalid URL',
                  imageUrl: item.properties?.image || 'Fallback Image URL',
                  edition: item.edition || 'Unknown',
                }))}
                filename="nfts.csv"
              />
            </div>
          </div>
          <div
            key={'headers'}
            className="flex w-full underline items-center justify-between my-4"
          >
            <div className="w-1/5">Image</div>
            <div className="w-3/5">NFT URL</div>
            <div className="w-1/5">Edition</div>
          </div>
          {data.nfts.map((item: any, index: number) => (
            <div
              key={index}
              className="flex w-full items-center justify-between my-2"
            >
              {/* Image Section */}
              <div className="w-1/5">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={item.properties?.image || '#'}
                >
                  <img
                    src={item.properties?.image || 'https://via.placeholder.com/100'}
                    style={{ width: '100px' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/100'; // Fallback image
                    }}
                    alt="NFT"
                  />
                </a>
              </div>
              {/* URL Section */}
              <div className="w-3/5">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={item.url ? `https://${item.url}` : '#'}
                >
                  {item.url ? `https://${item.url}` : 'Invalid URL'}
                </a>
              </div>
              {/* Edition Section */}
              <div className="w-1/5">{item.edition || 'Unknown'}</div>
            </div>
          ))}
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
