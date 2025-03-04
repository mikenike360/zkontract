// pages/bounty/[id].tsx

import { useState } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import BackArrow from '@/components/ui/BackArrow';
import useSWR from 'swr';

// 1) Import wallet adapter hooks & classes
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import {
  Transaction,
  WalletAdapterNetwork,
} from '@demox-labs/aleo-wallet-adapter-base';

// Bounty data type
type Bounty = {
  id: number | string;
  title: string;
  description: string;
  reward: string;
  deadline: string;
};

// We fetch bounty from S3 via /api/get-bounty?id=<id>
const fetchBounty = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to fetch bounty');
  }
  return res.json() as Promise<Bounty>;
};

// Contract constants
const BOUNTY_PROGRAM_ID = 'zkontractv5.aleo';
const SUBMIT_PROPOSAL_FUNCTION = 'submit_proposal';

const BountyPage = () => {
  const router = useRouter();
  const { id } = router.query; // e.g. /bounty/12345 => id = '12345'

  // 2) Access wallet & publicKey
  const { wallet, publicKey } = useWallet();

  // 3) SWR fetch for bounty
  const { data: bounty, error, isLoading } = useSWR<Bounty>(
    id ? `/api/get-bounty?id=${id}` : null,
    fetchBounty
  );

  // Proposal modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proposal, setProposal] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Submission state
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  // Open/close modal
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProposal('');
    setUploadedFile(null);
  };

// 4) Submit proposal by calling `submit_proposal` on-chain, then uploading to S3
const handleSubmitProposal = async () => {
  if (!wallet || !publicKey) {
    alert('Please connect your Aleo wallet before submitting a proposal.');
    return;
  }
  if (!id) {
    alert('No bounty ID found. Invalid route?');
    return;
  }

  try {
    setIsSubmittingProposal(true);
    setTxStatus(null);

    // Convert "id" from string => number
    const bountyId = Number(id);
    // Generate a unique proposalId; contract uses bountyId * 1_000_000 + proposalId
    // We'll just pick a reasonably sized proposalId
    const proposalId = Math.floor(Date.now() % 1000000);

    const inputs = [
      publicKey,             // caller
      `${bountyId}u64`,      // bounty_id
      `${proposalId}u64`,    // proposal_id
      publicKey,             // proposer_address
    ];

    // Create the transaction
    const proposalTx = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.TestnetBeta,
      BOUNTY_PROGRAM_ID,
      SUBMIT_PROPOSAL_FUNCTION,
      inputs,
      1_000_000, // 1 ALEO credit in microcredits
      false
    );

    // Request transaction execution
    const txId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(proposalTx);
    console.log('Proposal transaction submitted:', txId);

    // Poll for finalization
    let finalized = false;
    const maxRetries = 300;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const status = await (wallet.adapter as LeoWalletAdapter).transactionStatus(txId);
      console.log(`Status check #${attempt + 1}: ${status}`);
      setTxStatus(status);

      if (status === 'Finalized') {
        finalized = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!finalized) {
      throw new Error('Transaction did not finalize in time.');
    }

    // Prepare the proposal metadata
    const proposalMetadata = {
      bountyId,
      proposalId,
      caller: publicKey,
      proposerAddress: publicKey,
      proposalText: proposal,
      status: "Pending",
      // Additional fields can be added here if needed
    };

    let fileUrl: string | undefined;
    let fileName: string | undefined;

    // If a file is attached, upload it via /api/upload-file
    // Note: We are NOT sending metadata here because the file endpoint only handles files.
    if (uploadedFile) {
      const formData = new FormData();
      formData.append('proposalId', proposalId.toString());
      formData.append('file', uploadedFile, uploadedFile.name);

      const fileRes = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      });
      const fileData = await fileRes.json();
      if (!fileRes.ok) {
        throw new Error(fileData.error || 'Failed to upload file');
      }
      fileUrl = fileData.url;
      fileName = uploadedFile.name;
    }

    // Merge the file URL and file name into the metadata if a file was uploaded
    const completeMetadata = {
      ...proposalMetadata,
      ...(fileUrl ? { fileUrl, fileName } : {}),
    };

    // Upload the proposal metadata via /api/upload-proposal.
    // Both proposalId and metadata are sent as strings.
    const metaRes = await fetch('/api/upload-proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        proposalId: proposalId.toString(),
        metadata: JSON.stringify(completeMetadata),
      }),
    });
    const metaData = await metaRes.json();
    if (!metaRes.ok) {
      throw new Error(metaData.error || 'Failed to upload proposal metadata');
    }

    alert('Proposal submitted successfully!');
    handleCloseModal();
  } catch (error) {
    console.error('Error submitting proposal:', error);
    alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    setIsSubmittingProposal(false);
  }
};





  // Loading states
  if (isLoading) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        Loading bounty...
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center text-red-500 dark:text-red-400">
        Error: {error.message}
      </div>
    );
  }
  if (!bounty) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        Bounty not found.
      </div>
    );
  }

  // Rendering the page
  return (
    <>
      <NextSeo
        title={`zKontract | ${bounty.title}`}
        description={`Details of bounty: ${bounty.title}`}
      />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <BackArrow />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {bounty.title}
        </h1>
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          {bounty.description}
        </p>
        <div className="mt-8 flex justify-between items-center">
          <span className="text-lg font-medium text-green-600 dark:text-green-400">
            Reward: {bounty.reward}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Deadline: {bounty.deadline}
          </span>
        </div>

        {/* Submit Proposal Button */}
        <div className="mt-12">
          <button
            onClick={handleOpenModal}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Submit Proposal
          </button>
        </div>

        {/* Show transaction status (optional) */}
        {txStatus && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Transaction Status: {txStatus}
          </div>
        )}
      </div>

      {/* Proposal Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-primary p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-bold text-black dark:text-black mb-4">
              Submit Proposal
            </h2>
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="Write your proposal here..."
              className="w-full p-3 border rounded-md text-gray-900 dark:text-black dark:bg-gray-700"
            />
            <div className="mt-4">
              <label className="block text-sm font-medium text-black dark:text-black">
                Attach a File
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                className="mt-2 block w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
              />
              {uploadedFile && (
                <p className="mt-2 text-sm text-green-600">
                  Selected File: {uploadedFile.name}
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitProposal}
                disabled={isSubmittingProposal}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {isSubmittingProposal ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

BountyPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};


export default BountyPage;
