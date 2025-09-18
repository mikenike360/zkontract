// pages/bounty/[id].tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import BackArrow from '@/components/ui/BackArrow';
import useSWR from 'swr';

import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { BOUNTY_PROGRAM_ID } from '@/types';

// Import the new submitProposal function
import { submitProposal } from '@/utils/submitProposal';
import TransactionModal from '@/components/ui/TransactionModal';
import { useTransactionModal } from '@/hooks/useTransactionModal';
import AlertModal from '@/components/ui/AlertModal';
import { useAlertModal } from '@/hooks/useAlertModal';
import { validateFile, getFileTypeDescription, formatFileSize, DEFAULT_FILE_CONFIG } from '@/utils/fileValidation';

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
  const [hasExistingProposal, setHasExistingProposal] = useState(false);
  const [isCheckingProposal, setIsCheckingProposal] = useState(true);

  // Alert and transaction modal hooks
  const { alertState, hideAlert, showError } = useAlertModal();
  const { modalState, executeTransactionWithModal, hideTransactionModal } = useTransactionModal();

  // Check if user has already submitted a proposal to this bounty
  useEffect(() => {
    const checkExistingProposal = async () => {
      if (!publicKey || !id) {
        setIsCheckingProposal(false);
        return;
      }

      try {
        const response = await fetch(`/api/my-dashboard?publicKey=${publicKey}`);
        if (response.ok) {
          const data = await response.json();
          const userProposals = data.myProposals || [];
          
          // Check if user has already submitted a proposal to this bounty
          const existingProposal = userProposals.find(
            (proposal: any) => proposal.bountyId === Number(id)
          );
          
          setHasExistingProposal(!!existingProposal);
        }
      } catch (error) {
        console.error('Error checking existing proposals:', error);
      } finally {
        setIsCheckingProposal(false);
      }
    };

    checkExistingProposal();
  }, [publicKey, id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleOpenModal = () => {
    if (hasExistingProposal) {
      showError('Proposal Already Submitted', 'You have already submitted a proposal to this bounty. Only one proposal per bounty is allowed.');
      return;
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProposal('');
    setUploadedFile(null);
  };

  // Submit proposal handler using transaction modal
  const handleSubmitProposal = async () => {
    if (!wallet || !publicKey) {
      showError('Wallet Required', 'Please connect your Aleo wallet before submitting a proposal.');
      return;
    }
    if (!id) {
      showError('Invalid Route', 'No bounty ID found. Please try again.');
      return;
    }
    if (hasExistingProposal) {
      showError('Proposal Already Submitted', 'You have already submitted a proposal to this bounty. Only one proposal per bounty is allowed.');
      return;
    }

    // Validate file before starting transaction
    const fileValidation = validateFile(uploadedFile);
    if (!fileValidation.isValid) {
      showError('Invalid File', fileValidation.errorMessage || 'Please check your file and try again.');
      return;
    }

    setIsSubmittingProposal(true);
    const bountyId = Number(id);

    await executeTransactionWithModal(
      'Submit Proposal',
      // Transaction function - we'll extract the core logic from submitProposal utility
      async () => {
        // For now, use the existing utility but extract the txId
        const result = await submitProposal({
          wallet,
          publicKey,
          bountyId,
          proposalText: proposal,
          uploadedFile,
        });
        return result.txId;
      },
      // Finalization function
      async (txId: string) => {
        // The submitProposal utility already handles finalization and S3 upload
        // So we don't need additional logic here
      },
      // Success callback
      () => {
        setIsSubmittingProposal(false);
        handleCloseModal();
        setHasExistingProposal(true);
        console.log('Proposal submitted successfully');
      }
    ).catch((error) => {
      console.error('Error submitting proposal:', error);
      setIsSubmittingProposal(false);
    });
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
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-28">

        {/* Card Container */}
        <div className="card bg-secondary shadow-xl p-8 flex flex-col resize overflow-auto">
          <div className="flex flex-col gap-6 flex-grow">
            {/* Header: Title and Description */}
            <div>
              <h1 className="text-3xl font-bold text-primary-content">
                {bounty.title}
              </h1>
              <p className="mt-2 text-primary-content">{bounty.description}</p>
            </div>
          </div>
          {/* Footer: Reward and Deadline */}
          <div className="flex justify-between items-center mt-6 pt-4">
            <div className="w-1/2 text-center text-lg font-medium text-green-600">
              Reward: {bounty.reward}
            </div>
            <div className="w-1/2 text-center text-lg text-primary-content">
              Deadline: {bounty.deadline}
            </div>
          </div>


        </div>
        {/* Button outside the card */}
        <div className="flex justify-center mt-6">
          {isCheckingProposal ? (
            <button
              disabled
              className="py-3 px-6 bg-gray-400 text-gray-600 rounded-md shadow cursor-not-allowed"
            >
              Checking...
            </button>
          ) : hasExistingProposal ? (
            <button
              disabled
              className="py-3 px-6 bg-gray-400 text-gray-600 rounded-md shadow cursor-not-allowed"
            >
              Proposal Already Submitted
            </button>
          ) : (
            <button
              onClick={handleOpenModal}
              className="py-3 px-6 bg-secondary text-secondary-content rounded-md shadow hover:opacity-75"
            >
              Submit A Proposal
            </button>
          )}
        </div>
          {/* Back Arrow */}
          <div className="mt-4">
            <BackArrow />
          </div>

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-secondary p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-bold text-primary-content mb-4">
              Submit Proposal
            </h2>
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="Write your proposal here..."
              className="w-full p-3 border rounded-md text-black"
            />
            <div className="mt-4">
              <label className="block text-sm font-medium text-primary-content">
                Attach a File (Optional)
              </label>
              <div className="mt-1 text-xs text-primary-content opacity-70">
                Allowed: {getFileTypeDescription(DEFAULT_FILE_CONFIG.allowedTypes)} | Max: {formatFileSize(DEFAULT_FILE_CONFIG.maxSizeInBytes)}
              </div>
              <input
                type="file"
                accept={DEFAULT_FILE_CONFIG.allowedTypes.join(',')}
                onChange={handleFileUpload}
                className="mt-2 block w-full text-sm text-primary-content"
              />
              {uploadedFile && (
                <>
                  {(() => {
                    const validation = validateFile(uploadedFile);
                    return validation.isValid ? (
                      <p className="mt-2 text-sm text-green-600">
                        ✓ Selected: {uploadedFile.name} ({formatFileSize(uploadedFile.size)})
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-red-600">
                        ✗ {validation.errorMessage}
                      </p>
                    );
                  })()}
                </>
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
                disabled={isSubmittingProposal || (uploadedFile ? !validateFile(uploadedFile).isValid : false)}
                className={`px-4 py-2 rounded-md ${
                  isSubmittingProposal || (uploadedFile ? !validateFile(uploadedFile).isValid : false)
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-accent text-primary-content hover:opacity-75'
                }`}
              >
                {isSubmittingProposal ? 'Submitting...' : 'Submit'}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        showCancel={alertState.showCancel}
        onConfirm={alertState.onConfirm}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
      />

      {/* Transaction Progress Modal */}
      <TransactionModal
        isOpen={modalState.isOpen}
        onClose={hideTransactionModal}
        status={modalState.status}
        title={modalState.title}
        txId={modalState.txId}
        errorMessage={modalState.errorMessage}
      />
    </>
  );
};

BountyPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default BountyPage;
