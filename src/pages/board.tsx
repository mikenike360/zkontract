import { useRouter } from 'next/router';
import { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import Button from '@/components/ui/button';
import BackArrow from '@/components/ui/BackArrow';
import useSWR from 'swr';

// Helper function to format reward (already in ALEO format)
const formatReward = (reward: string): string => {
  const rewardNum = parseFloat(reward);
  return `${rewardNum.toLocaleString()} ALEO`;
};

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

  const maxChars = 120;
  const shortDescription =
    bounty.description.length > maxChars
      ? bounty.description.slice(0, maxChars) + '...'
      : bounty.description;

  return (
    <div className="card bg-base-100 border border-base-300 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 p-0 flex flex-col min-h-[280px] group">
      {/* Header with Badge */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 border-b border-base-300">
        <div className="flex items-start justify-between mb-3">
          <div className="badge badge-primary font-mono text-xs">
            ID: {bounty.id}
          </div>
          <div className="badge badge-success gap-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            OPEN
          </div>
        </div>
        <h3 className="text-lg font-bold text-base-content line-clamp-2 group-hover:text-primary transition-colors">
          {bounty.title}
        </h3>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col">
        <p className="text-sm text-base-content/80 leading-relaxed mb-4 flex-grow">
          {shortDescription}
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Reward Card */}
          <div className="bg-success/5 border border-success/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center">
                <span className="text-success text-xs">💰</span>
              </div>
              <span className="text-xs font-medium text-base-content/70">Reward</span>
            </div>
            <div className="text-sm font-bold text-success">
              {formatReward(bounty.reward)}
            </div>
          </div>

          {/* Deadline Card */}
          <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-warning/20 rounded-full flex items-center justify-center">
                <span className="text-warning text-xs">📅</span>
              </div>
              <span className="text-xs font-medium text-base-content/70">Deadline</span>
            </div>
            <div className="text-sm font-bold text-base-content">
              {bounty.deadline}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleViewDetails}
          className="btn btn-primary btn-sm w-full gap-2 group-hover:btn-primary-focus transition-all"
        >
          <span className="text-sm">👁️</span>
          View Details
        </button>
      </div>
    </div>
  );
};

const BoardPage: NextPageWithLayout = () => {
  const router = useRouter();

  // Use SWR to fetch bounties from the backend
  const { data: bounties, error, isLoading, mutate } = useSWR<Bounty[]>('bounties', fetchBounties, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true, // Revalidate when window gets focus
  });

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
      <div className="min-h-screen bg-base-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mt-20 sm:mt-28">
          
          {/* Enhanced Header Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary text-2xl">🎯</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-base-content">
                Bounty Board
              </h1>
            </div>
            <p className="text-base-content/70 text-lg max-w-2xl mx-auto">
              Discover and contribute to exciting projects in the Aleo ecosystem
            </p>
            
            {/* Stats Section */}
            <div className="flex justify-center mt-8">
              <div className="stats stats-horizontal shadow-lg bg-base-100 border border-base-300">
                <div className="stat">
                  <div className="stat-figure text-primary">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="stat-title">Active Bounties</div>
                  <div className="stat-value text-primary">{bounties?.length || 0}</div>
                  <div className="stat-desc">Available to work on</div>
                </div>
                
                <div className="stat">
                  <div className="stat-figure text-success">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="stat-title">Total Value</div>
                  <div className="stat-value text-success">
                    {bounties ? Math.round(bounties.reduce((sum, b) => sum + parseFloat(b.reward), 0)).toLocaleString() : 0} ALEO
                  </div>
                  <div className="stat-desc">In rewards available</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button
              onClick={handleAddBounty}
              className="btn btn-primary gap-2 px-6"
            >
              <span className="text-lg">➕</span>
              Post New Bounty
            </button>
            <button
              onClick={handleDashboard}
              className="btn btn-outline gap-2 px-6"
            >
              <span className="text-lg">📊</span>
              My Dashboard
            </button>
            <button
              onClick={() => mutate()}
              className="btn btn-ghost gap-2 px-6"
            >
              <span className="text-lg">🔄</span>
              Refresh
            </button>
          </div>

          {/* Content Section */}
          <div className="space-y-8">
            {/* Error State */}
            {error && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-error text-xl">⚠️</span>
                </div>
                <h3 className="text-lg font-semibold text-error mb-2">Failed to Load Bounties</h3>
                <p className="text-error/80">{error.message}</p>
                <button
                  onClick={() => mutate()}
                  className="btn btn-error btn-sm mt-4"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-3 bg-base-200 px-6 py-4 rounded-lg">
                  <span className="loading loading-spinner loading-md"></span>
                  <span className="text-base-content font-medium">Loading bounties...</span>
                </div>
              </div>
            )}

            {/* Bounties Grid */}
            {bounties && bounties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {bounties.map((bounty) => (
                  <BountyCard key={bounty.id} bounty={bounty} />
                ))}
              </div>
            ) : (
              !isLoading && !error && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-base-content/50 text-2xl">📋</span>
                  </div>
                  <h3 className="text-xl font-semibold text-base-content mb-2">No Active Bounties</h3>
                  <p className="text-base-content/60 mb-6">
                    Be the first to post a bounty and start building the future!
                  </p>
                  <button
                    onClick={handleAddBounty}
                    className="btn btn-primary gap-2"
                  >
                    <span className="text-lg">➕</span>
                    Post First Bounty
                  </button>
                </div>
              )
            )}
          </div>

          {/* Navigation */}
          <div className="mt-12 flex justify-center">
            <BackArrow />
          </div>
        </div>
      </div>
    </>
  );
};

BoardPage.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>{page}</Layout>;
};

export default BoardPage;
