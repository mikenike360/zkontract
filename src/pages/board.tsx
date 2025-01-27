// pages/board.tsx
import { useRouter } from 'next/router';
import { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import Button from '@/components/ui/button';
import BackArrow from '@/components/ui/BackArrow';
import useSWR from 'swr';

type Bounty = {
  id: string;
  title: string;
  description: string;
  reward: string;
  deadline: string;
  status?: string;
};

const fetchBounties = async () => {
  const res = await fetch('/api/list-bounties');
  if (!res.ok) {
    throw new Error('Failed to fetch bounties');
  }
  return res.json() as Promise<Bounty[]>;
};

const BountyCard = ({ bounty }: { bounty: Bounty }) => {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/bounty/${bounty.id}`);
  };

  const maxChars = 100;
  const shortDescription =
    bounty.description.length > maxChars
      ? bounty.description.slice(0, maxChars) + '...'
      : bounty.description;

  return (
    <div
      className="rounded-lg shadow-lg bg-white p-4 cursor-pointer hover:shadow-xl transition-shadow"
      onClick={handleViewDetails}
    >
      <h3 className="text-lg font-medium text-black">{bounty.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        {shortDescription}
      </p>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm font-medium text-green-600 dark:text-green-400">
          Reward: {bounty.reward}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {bounty.deadline}
        </span>
      </div>
      <Button
        className="mt-4 w-full text-sm bg-blue-600 text-black rounded-md hover:bg-blue-800"
        size="small"
      >
        View Details
      </Button>
    </div>
  );
};

const BoardPage: NextPageWithLayout = () => {
  const router = useRouter();

  // Use SWR to fetch bounties from the backend
  const { data: bounties, error, isLoading } = useSWR<Bounty[]>('bounties', fetchBounties);

  const handleAddBounty = () => {
    router.push('/post-bounty');
  };

  const handleDashboard = () => {
    router.push('/user-dashboard');
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
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md shadow hover:bg-blue-800"
          >
            Add Bounty
          </Button>
          <Button
            onClick={handleDashboard}
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md shadow hover:bg-blue-800"
          >
            My Profile
          </Button>
        </div>

        {/* Bounty List Section */}
        {error && (
          <div className="text-center text-red-500 dark:text-red-400">
            Error loading bounties: {error.message}
          </div>
        )}

        {isLoading && (
          <div className="text-center text-gray-500 dark:text-gray-400">
            Loading bounties...
          </div>
        )}

        {bounties && bounties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              No active bounties at the moment.
            </div>
          )
        )}
      </div>
    </>
  );
};

BoardPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default BoardPage;
