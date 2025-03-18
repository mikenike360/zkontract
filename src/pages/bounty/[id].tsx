// pages/bounty/[id].tsx

import { useState } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import BackArrow from '@/components/ui/BackArrow';
import useSWR from 'swr';

import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { BOUNTY_PROGRAM_ID } from '@/types';

// Import the new submitProposal function
import { submitProposal } from '@/utils/submitProposal';

const SUBMIT_PROPOSAL_FUNCTION = 'submit_proposal'; // not needed here anymore if defined in utils

// Bounty data type
type Bounty = {
  id: number | string;
  title: string;
  description: string;
  reward: string;
  deadline: string;
};

const fetchBounty = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to fetch bounty');
  }
  return res.json() as Promise<Bounty>;
};

const BountyPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { wallet, publicKey } = useWallet();

  const { data: bounty, error, isLoading } = useSWR<Bounty>(
    id ? `/api/get-bounty?id=${id}` : null,
    fetchBounty
  );

  // Modal and proposal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proposal, setProposal] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProposal('');
    setUploadedFile(null);
  };

  // Refactored submit proposal handler using our utility function
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

      const bountyId = Number(id);

      // Call our refactored function from /utils/submit_proposal.ts
      const { txId, proposalId } = await submitProposal({
        wallet,
        publicKey,
        bountyId,
        proposalText: proposal,
        uploadedFile,
      });

      console.log('Proposal submitted successfully:', txId);
      // Optionally, update txStatus based on further polling if desired.
      alert('Proposal submitted successfully!');
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading bounty...</div>;
  }
  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }
  if (!bounty) {
    return <div className="text-center text-gray-500">Bounty not found.</div>;
  }

  return (
    <>
      <NextSeo
        title={`zKontract | ${bounty.title}`}
        description={`Details of bounty: ${bounty.title}`}
      />
      <div className="mx-auto mt-12 w-full sm:w-11/12 md:w-10/12 lg:w-9/12 px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-primary-content mt-12">{bounty.title}</h1>
        <p className="mt-4 text-primary-content">{bounty.description}</p>
        <div className="mt-8 flex justify-between items-center">
          <span className="text-md font-medium text-green-600">Reward: {bounty.reward}</span>
          <span className="text-sm text-primary-content">Deadline: {bounty.deadline}</span>
        </div>
        <div className="mt-12">
          <button
            onClick={handleOpenModal}
            className="py-3 px-4 bg-secondary-content text-secondary rounded-md shadow hover:opacity-75"
          >
            Submit A Proposal
          </button>
        </div>
        <div className="mb-6">

    {/* Back Arrow */}
     <div className="mb-6">
          <BackArrow />
          </div>
        </div>
        {txStatus && (
          <div className="mt-4 text-center text-sm text-primary-content">
            Transaction Status: {txStatus}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-secondary p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-bold text-primary-content mb-4">Submit Proposal</h2>
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="Write your proposal here..."
              className="w-full p-3 border rounded-md text-black"
            />
            <div className="mt-4">
              <label className="block text-sm font-medium text-primary-content">Attach a File</label>
              <input
                type="file"
                onChange={handleFileUpload}
                className="mt-2 block w-full text-sm text-primary-content"
              />
              {uploadedFile && (
                <p className="mt-2 text-sm text-green-600">Selected File: {uploadedFile.name}</p>
              )}
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-accent text-primary-content rounded-md hover:opacity-75"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitProposal}
                disabled={isSubmittingProposal}
                className="px-4 py-2 bg-accent text-primary-content rounded-md hover:opacity-75"
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
