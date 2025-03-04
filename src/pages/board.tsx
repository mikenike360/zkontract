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
    <div className="card bg-base-100 shadow-lg p-4 hover:shadow-xl transition-shadow flex flex-col min-h-[220px]">
      {/* Top Section: Title and Description */}
      <div>
        <h3 className="text-lg font-medium text-base-content">{bounty.title}</h3>
        <p className="text-sm text-base-content opacity-80 mt-2">
          {shortDescription}
        </p>
      </div>
      {/* Footer Section: Reward, Deadline, and Button */}
      <div className="mt-auto">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-success">
            Reward: {bounty.reward}
          </span>
          <span className="text-xs text-neutral">
            {bounty.deadline}
          </span>
        </div>
        <Button
          onClick={handleViewDetails}
          className="mt-4 w-full btn btn-primary text-sm"
          size="small"
        >
          View Details
        </Button>
      </div>
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
      <div className="mx-auto bg-primary max-w-6xl px-4 sm:px-6 lg:px-8 py-36">


        <h1 className="text-2xl font-bold text-primary-content text-center mb-8">
          zKontract Bounty Board
        </h1>

        {/* Button Section */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <Button
            onClick={handleAddBounty}
            className="px-6 py-2 btn btn-secondary-content text-sm"
          >
            Add Bounty
          </Button>
          <Button
            onClick={handleDashboard}
            className="px-6 py-2 btn btn-secondary-content text-sm"
          >
            My Profile
          </Button>
        </div>

        {/* Bounty List Section */}
        {error && (
          <div className="text-center text-error text-primary-content">
            Error loading bounties: {error.message}
          </div>
        )}

        {isLoading && (
          <div className="text-center text-info text-primary-content">
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
            <div className="text-center text-primary-content">
              No active bounties at the moment.
            </div>
          )
        )}

                {/* Back Arrow */}
                <div className="mb-6">
          <BackArrow />
        </div>
      </div>
    </>
  );
};

BoardPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default BoardPage;
