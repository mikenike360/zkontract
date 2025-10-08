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

// Helper function to format reward from microcredits to ALEO
const formatReward = (reward: string): string => {
  const rewardNum = parseFloat(reward);
  const aleoAmount = rewardNum / 1000000; // Convert microcredits to ALEO
  return `${aleoAmount.toLocaleString()} ALEO`;
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
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mt-20 sm:mt-28">

        {/* Card Container */}
        <div className="card bg-base-100 border border-base-300 shadow-xl p-0 flex flex-col resize overflow-auto">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 sm:p-6 border-b border-base-300">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="badge badge-primary font-mono text-xs">
                  ID: {bounty.id}
                </div>
                <div className="badge badge-success gap-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  OPEN
                </div>
              </div>
              <div className="text-sm text-base-content/60 font-medium hidden sm:block">
                🎯 Bounty Details
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-base-content mb-3 leading-tight">
              {bounty.title}
            </h1>
            <div className="prose max-w-none">
              <p className="text-base-content/80 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                {bounty.description}
              </p>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="p-4 sm:p-6 flex-grow">
            {/* Key Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Reward Card */}
              <div className="bg-success/5 border border-success/20 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success/20 rounded-full flex items-center justify-center">
                    <span className="text-success text-lg sm:text-xl">💰</span>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-base-content/70">Total Reward</div>
                    <div className="text-xl sm:text-2xl font-bold text-success">
                      {formatReward(bounty.reward)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-base-content/60">
                  Payment will be released upon proposal acceptance
                </div>
              </div>

              {/* Deadline Card */}
              <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-warning/20 rounded-full flex items-center justify-center">
                    <span className="text-warning text-lg sm:text-xl">📅</span>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-base-content/70">Submission Deadline</div>
                    <div className="text-lg sm:text-xl font-bold text-base-content">
                      {bounty.deadline}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-base-content/60">
                  Submit your proposal before this date
                </div>
              </div>
            </div>

            {/* Instructions Section */}
            <div className="mt-6 sm:mt-8 bg-info/5 border border-info/20 rounded-lg p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-info/20 rounded-full flex items-center justify-center">
                  <span className="text-info text-sm">📋</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-base-content">How to Submit</h3>
              </div>
              <div className="space-y-3 text-sm text-base-content/80">
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-info rounded-full mt-2 flex-shrink-0"></span>
                  <span>Write a detailed proposal explaining your approach</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-info rounded-full mt-2 flex-shrink-0"></span>
                  <span>Optionally attach relevant files (PDF, images)</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-info rounded-full mt-2 flex-shrink-0"></span>
                  <span>Only one proposal per bounty is allowed</span>
                </div>
              </div>
            </div>
          </div>


        </div>
        
        {/* Action Section */}
        <div className="mt-8 text-center">
          {isCheckingProposal ? (
            <div className="inline-flex items-center gap-3 bg-base-200 px-6 py-4 rounded-lg">
              <span className="loading loading-spinner loading-sm"></span>
              <span className="text-base-content font-medium">Checking your proposal status...</span>
            </div>
          ) : hasExistingProposal ? (
            <div className="bg-success/10 border border-success/20 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                  <span className="text-success text-sm">✓</span>
                </div>
                <span className="text-lg font-semibold text-success">Proposal Submitted</span>
              </div>
              <p className="text-sm text-base-content/70">
                You've already submitted a proposal for this bounty. Check your dashboard for updates.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleOpenModal}
                className="btn btn-primary btn-lg gap-2 px-8"
              >
                <span className="text-lg">📝</span>
                Submit Your Proposal
              </button>
              <p className="text-sm text-base-content/60">
                Ready to take on this challenge? Submit your proposal now!
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <BackArrow />
          <div className="text-xs text-base-content/50">
            Bounty #{bounty.id}
          </div>
        </div>

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-base-100 border border-base-300 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-base-content mb-4">
              Submit Proposal
            </h2>
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="Write your proposal here..."
              className="w-full p-3 border border-base-300 rounded-md bg-base-100 text-base-content focus:border-primary focus:outline-none"
            />
            <div className="mt-4">
              <label className="block text-sm font-medium text-base-content">
                Attach a File (Optional)
              </label>
              <div className="mt-1 text-xs text-base-content/70">
                Allowed: {getFileTypeDescription(DEFAULT_FILE_CONFIG.allowedTypes)} | Max: {formatFileSize(DEFAULT_FILE_CONFIG.maxSizeInBytes)}
              </div>
              <input
                type="file"
                accept={DEFAULT_FILE_CONFIG.allowedTypes.join(',')}
                onChange={handleFileUpload}
                className="mt-2 block w-full text-sm text-base-content file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-content hover:file:bg-primary-focus"
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
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitProposal}
                disabled={isSubmittingProposal || (uploadedFile ? !validateFile(uploadedFile).isValid : false)}
                className={`btn ${
                  isSubmittingProposal || (uploadedFile ? !validateFile(uploadedFile).isValid : false)
                    ? 'btn-disabled'
                    : 'btn-primary'
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

BountyPage.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>{page}</Layout>;
};

export default BountyPage;

