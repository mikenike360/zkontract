// pages/post-bounty.tsx
import { useState, useEffect, ReactElement } from 'react';
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import Layout from '@/layouts/_layout';
import BackArrow from '@/components/ui/BackArrow';
import Button from '@/components/ui/button';
import TransactionModal from '@/components/ui/TransactionModal';
import { useTransactionModal } from '@/hooks/useTransactionModal';

import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import {
  Transaction,
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from '@demox-labs/aleo-wallet-adapter-base';

import { CURRENT_NETWORK } from '@/types';
import { BOUNTY_PROGRAM_ID } from '@/types';

// Import the fee calculator function
import { getFeeForFunction } from '@/utils/feeCalculator';
import { signRequest } from '@/utils/signing';

const POST_BOUNTY_FUNCTION = 'post_bounty';

// Helper function to wait for transaction finalization
async function waitForTransactionFinalization(
  wallet: any,
  txId: string
): Promise<void> {
  let finalized = false;
  for (let attempt = 0; attempt < 300; attempt++) { // Wait up to 5 minutes
    try {
      const status = await (wallet.adapter as LeoWalletAdapter).transactionStatus(txId);
      if (status === 'Finalized') {
        finalized = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    } catch (statusErr) {
      console.log('Checking transaction status...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  
  if (!finalized) {
    throw new Error('Transaction did not finalize in time. Please check the blockchain explorer.');
  }
}

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
  
  // Transaction modal hook
  const { modalState, executeTransactionWithModal, hideTransactionModal } = useTransactionModal();



  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet || !publicKey) {
      setErrorMessage('Please connect your wallet to proceed.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const { title, description, reward, deadline } = formData;
    const newBountyId = Date.now();
    setBountyId(newBountyId);

    await executeTransactionWithModal(
      'Post Bounty',
      // Transaction function
      async () => {
        const inputs = [
          publicKey,               // caller
          `${newBountyId}u64`,     // bounty_id
          publicKey,               // creator_address
          `${parseFloat(reward) * 1_000_000}u64`,    // payment_amount in micro credits (ALEO * 1,000,000)
        ];

        const fee = getFeeForFunction(POST_BOUNTY_FUNCTION);
        
        const bountyTransaction = Transaction.createTransaction(
          publicKey,
          CURRENT_NETWORK,
          BOUNTY_PROGRAM_ID,
          POST_BOUNTY_FUNCTION,
          inputs,
          fee,
          false
        );

        const txId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(bountyTransaction);
        setTransactionId(txId);
        return txId;
      },
      // Finalization function
      async (txId: string) => {
        await waitForTransactionFinalization(wallet, txId);
        
        // Upload bounty metadata to S3
        const metadata = {
          id: newBountyId,
          title,
          description,
          reward,
          deadline,
          creatorAddress: publicKey,
        };
        
        // Sign the request for authentication
        const auth = await signRequest(wallet.adapter, 'upload_bounty', { bountyId: newBountyId });
        
        const response = await fetch('/api/upload-bounty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caller: publicKey,
            bountyId: newBountyId,
            metadata,
            signature: auth.signature,
            message: auth.message,
            timestamp: auth.timestamp,
            nonce: auth.nonce,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('S3 upload failed:', errorData);
          throw new Error(`Failed to save bounty metadata: ${errorData.error || 'Unknown error'}`);
        }
        
        console.log('Bounty metadata uploaded successfully to S3');
      },
      // Success callback
      () => {
        setIsSubmitting(false);
        console.log('Bounty posted successfully, redirecting to board');
        // Force a delay to ensure S3 is consistent, then redirect
        setTimeout(() => {
          router.push('/board');
        }, 1000);
      }
    ).catch((error) => {
      console.error('Error posting bounty:', error);
      setErrorMessage('Failed to post bounty. Please try again.');
      setIsSubmitting(false);
    });
  };

  return (
    <>
      <NextSeo
        title="zKontract | Post a Bounty"
        description="Post a new bounty to the zKontract system."
      />
      <div className="min-h-screen bg-base-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mt-20 sm:mt-28">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <svg className="w-8 h-8 text-primary-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-base-content mb-3">
              Post a New Bounty
            </h1>
            <p className="text-lg font-medium text-base-content/80 max-w-2xl mx-auto">
              Create a bounty to find talented developers for your project. Set clear requirements and competitive rewards to attract the best proposals.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-base-100 border border-base-300 rounded-2xl shadow-lg p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Bounty Title Section */}
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-bold text-base-content">
                  Bounty Title *
                </label>
                <p className="text-sm font-medium text-base-content/80 mb-3">
                  Choose a clear, descriptive title that summarizes what you need done
                </p>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Smart Contract Security Audit for DeFi Protocol"
                  className="input input-bordered w-full bg-base-100 border-base-300 text-base-content placeholder-base-content/50 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-bold text-base-content">
                  Detailed Description *
                </label>
                <p className="text-sm font-medium text-base-content/80 mb-3">
                  Provide comprehensive details about the work, requirements, deliverables, and timeline
                </p>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={8}
                  placeholder="Describe the scope of work, specific requirements, expected deliverables, timeline, and any additional context that would help developers understand what you need..."
                  className="textarea textarea-bordered w-full bg-base-100 border-base-300 text-base-content placeholder-base-content/50 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Reward and Deadline Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Reward Section */}
                <div className="space-y-2">
                  <label htmlFor="reward" className="block text-sm font-bold text-base-content">
                    Reward Amount *
                  </label>
                  <p className="text-sm font-medium text-base-content/80 mb-3">
                    Set a competitive reward in ALEO tokens
                  </p>
                  <div className="relative">
                    <input
                      type="number"
                      id="reward"
                      name="reward"
                      value={formData.reward}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.001"
                      placeholder="0.000"
                      className="input input-bordered w-full bg-base-100 border-base-300 text-base-content placeholder-base-content/50 focus:border-primary focus:ring-1 focus:ring-primary pr-16"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-base-content/80 text-sm font-medium">ALEO</span>
                    </div>
                  </div>
                </div>

                {/* Deadline Section */}
                <div className="space-y-2">
                  <label htmlFor="deadline" className="block text-sm font-bold text-base-content">
                    Submission Deadline *
                  </label>
                  <p className="text-sm font-medium text-base-content/80 mb-3">
                    When should proposals be submitted by?
                  </p>
                  <input
                    type="date"
                    id="deadline"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="input input-bordered w-full bg-base-100 border-base-300 text-base-content focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Tips Section */}
              <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-info mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-bold text-base-content mb-2">Tips for Better Bounties</h4>
                    <ul className="text-sm font-medium text-base-content/80 space-y-1">
                      <li>• Be specific about requirements and deliverables</li>
                      <li>• Set realistic deadlines to attract quality proposals</li>
                      <li>• Offer competitive rewards for the scope of work</li>
                      <li>• Include any special requirements or preferences</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full btn btn-primary btn-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                      Posting Bounty...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Post Bounty
                    </>
                  )}
                </Button>
                {errorMessage && (
                  <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg">
                    <p className="text-error text-sm font-medium">{errorMessage}</p>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Back Button */}
          <div className="mt-8 flex justify-center">
            <BackArrow />
          </div>

          {/* Transaction Progress Modal */}
          <TransactionModal
            isOpen={modalState.isOpen}
            onClose={hideTransactionModal}
            status={modalState.status}
            title={modalState.title}
            txId={modalState.txId}
            errorMessage={modalState.errorMessage}
          />
        </div>
      </div>
    </>
  );
}

PostBountyPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default PostBountyPage;
