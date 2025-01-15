import { useRouter } from 'next/router';
import { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import Button from '@/components/ui/button';
import BackArrow from '@/components/ui/BackArrow';

type Bounty = {
  id: string;
  title: string;
  description: string;
  reward: string;
  deadline: string;
};

// Placeholder data for active bounties
const BOUNTIES: Bounty[] = [
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

const BountyCard = ({ bounty }: { bounty: Bounty }) => {
    const router = useRouter();
  
    const handleViewDetails = () => {
      router.push(`/bounty/${bounty.id}`); // Redirect to the dynamic route for the bounty
    };
  
    return (
      <div
        className="rounded-lg shadow-lg bg-white dark:bg-gray-800 p-4 cursor-pointer hover:shadow-xl transition-shadow"
        onClick={handleViewDetails}
      >
       
        <h3 className="text-lg font-medium text-black">
        {bounty.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{bounty.description}</p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm font-medium text-green-600 dark:text-green-400">{bounty.reward}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{bounty.deadline}</span>
        </div>
        <Button
          className="mt-4 w-full text-sm dark:text-white"
          size="small"
        >
          View Details
        </Button>
      </div>
    );
  };
  

const BoardPage: NextPageWithLayout = () => {
    const router = useRouter();

    const handleAddBounty = () => {
        router.push('/post-bounty'); // Redirect to the "Post a Bounty" page
        
      };

      const handleDashboard = () => {
        router.push('/user-dashboard'); // Redirect to the "Post a Bounty" page
        
      };

      return (
        <>
          <NextSeo
            title="zKontract | Active Bounties"
            description="Browse all active bounties in the zKontract system."
          />
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
            {/* Back Arrow */}
            <div className="mb-6">
              <BackArrow />
            </div>
      
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
              zKontract Bounty Board
            </h1>
      
            {/* Button Section */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <Button
                onClick={handleAddBounty}
                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
              >
                Add Bounty
              </Button>
              <Button
                onClick={handleDashboard}
                className="px-6 py-2 text-sm bg-purple-600 text-white rounded-md shadow hover:bg-purple-700"
                >
                My Profile
            </Button>
              
            </div>
      
            {/* Bounty List Section */}
            {BOUNTIES.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {BOUNTIES.map((bounty) => (
                  <BountyCard key={bounty.id} bounty={bounty} />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                No active bounties at the moment.
              </div>
            )}
          </div>
        </>
      );
      
};

BoardPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default BoardPage;
