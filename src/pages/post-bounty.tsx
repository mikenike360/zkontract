// pages/post-bounty.tsx
import { useState, useEffect, ReactElement } from 'react';
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import Layout from '@/layouts/_layout';
import BackArrow from '@/components/ui/BackArrow';
import Button from '@/components/ui/button';

import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import {
  Transaction,
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from '@demox-labs/aleo-wallet-adapter-base';

const BOUNTY_PROGRAM_ID = 'zkontractv5.aleo';
const POST_BOUNTY_FUNCTION = 'post_bounty';

function PostBountyPage() {
  const router = useRouter();
  const { wallet, publicKey } = useWallet();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward: '',
    deadline: '',
  });

  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bountyId, setBountyId] = useState<number | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (transactionId && wallet) {
      intervalId = setInterval(async () => {
        try {
          const status = await (wallet.adapter as LeoWalletAdapter).transactionStatus(transactionId);
          console.log('Transaction status:', status);
          setTxStatus(status);

          if (status === 'Finalized') {
            clearInterval(intervalId!);
            intervalId = null;
            await handlePostFinalization();
          }
        } catch (pollError) {
          console.error('Error polling status:', pollError);
        }
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [transactionId, wallet]);

  const handlePostFinalization = async () => {
    try {
      if (!bountyId) throw new Error('No bountyId set!');

      const { title, description, reward, deadline } = formData;
      // Include owner's wallet address in metadata
      const metadata = { 
        id: bountyId, 
        title, 
        description, 
        reward, 
        deadline, 
        creatorAddress: publicKey  // new field
      };

      const res = await fetch('/api/upload-bounty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bountyId, metadata }),
      });

      if (!res.ok) {
        throw new Error('Failed to upload bounty metadata');
      }

      alert('Bounty posted successfully!');
      router.push('/board');
    } catch (error) {
      console.error('Error uploading bounty metadata:', error);
      setErrorMessage('Failed to post bounty metadata. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet || !publicKey) {
      alert('Please connect your wallet to proceed.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const { title, description, reward, deadline } = formData;
      const newBountyId = Date.now();
      setBountyId(newBountyId);

      const inputs = [
        publicKey,               
        `${newBountyId}u64`,     
        publicKey,               
        `${reward}u64`,          
      ];

      const bountyTransaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.TestnetBeta,
        BOUNTY_PROGRAM_ID,
        POST_BOUNTY_FUNCTION,
        inputs,
        1_000_000, 
        true
      );

      const txId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(bountyTransaction);

      
      console.log('Transaction submitted:', txId);
      setTransactionId(txId);
    } catch (error) {
      console.error('Error posting bounty:', error);
      setErrorMessage('Failed to post bounty. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <NextSeo
        title="zKontract | Post a Bounty"
        description="Post a new bounty to the zKontract system."
      />
      <div className="text-primary-content mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 mt-12">


        <h1 className="text-2xl font-bold text-primary-content text-center mb-8">
          Post a Bounty
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-secondary p-6 rounded-lg shadow-lg"
        >
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-secondary-content">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 text-black shadow-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-secondary-content">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 text-black shadow-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="reward" className="block text-sm font-medium text-secondary-content">
              Reward (ALEO)
            </label>
            <input
              type="number"
              id="reward"
              name="reward"
              value={formData.reward}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 text-black shadow-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="deadline" className="block text-sm font-medium text-secondary-content">
              Deadline
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 text-black shadow-sm"
            />
          </div>
          <Button
            type="submit"
            className="w-full py-2 px-4 bg-primary text-primary-content rounded-md shadow hover:bg-accent"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Post Bounty'}
          </Button>
          {errorMessage && (
            <p className="mt-4 text-red-500 text-center">{errorMessage}</p>
          )}
        </form>
        <div className="mb-6">
          <BackArrow />
        </div>

        {transactionId && (
          <div className="mt-4 text-center">
            <div><strong>Transaction ID:</strong> {transactionId}</div>
            <div><strong>Transaction Status:</strong> {txStatus}</div>
          </div>
        )}
      </div>
    </>
  );
}

PostBountyPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default PostBountyPage;
