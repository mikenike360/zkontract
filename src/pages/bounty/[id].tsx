import { useState } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import BackArrow from '@/components/ui/BackArrow';

const BOUNTIES = [
  {
    id: '1',
    title: 'Design a Landing Page',
    description: 'Create a visually appealing landing page for our project.',
    reward: '10 ALEO',
    deadline: 'Jan 31, 2025',
  },
  {
    id: '2',
    title: 'Smart Contract Audit',
    description: 'Audit our smart contract for vulnerabilities.',
    reward: '50 ALEO',
    deadline: 'Feb 15, 2025',
  },
  {
    id: '3',
    title: 'Build a React Component',
    description: 'Create a reusable React component for our frontend.',
    reward: '20 ALEO',
    deadline: 'Jan 20, 2025',
  },
];

const BountyPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proposal, setProposal] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const bounty = BOUNTIES.find((b) => b.id === id);

  if (!bounty) {
    return <div className="text-center text-gray-500 dark:text-gray-400">Bounty not found.</div>;
  }

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProposal('');
    setUploadedFile(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleSubmitProposal = () => {
    console.log(`Proposal submitted for bounty ${bounty.id}:`, proposal);
    console.log('Uploaded File:', uploadedFile);
    alert('Proposal submitted!');
    handleCloseModal();
  };

  return (
    <>
      <NextSeo
        title={`zKontract | ${bounty.title}`}
        description={`Details of bounty: ${bounty.title}`}
      />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Arrow */}
        <div className="mb-6">
          <BackArrow />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{bounty.title}</h1>
        <p className="mt-4 text-gray-700 dark:text-gray-300">{bounty.description}</p>
        <div className="mt-8 flex justify-between items-center">
          <span className="text-lg font-medium text-green-600 dark:text-green-400">
            Reward: {bounty.reward}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Deadline: {bounty.deadline}</span>
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
      </div>

      {/* Proposal Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
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
                  Uploaded: {uploadedFile.name}
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit
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
