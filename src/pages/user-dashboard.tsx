import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import BackArrow from '@/components/ui/BackArrow';
import useSWR from 'swr';
import ProposalItem from '@/components/ui/ProposalItem';
import { ProposalData } from '@/components/ui/ProposalItem';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { useEffect, useState } from 'react';
import { handleAcceptSolution, handleDenySolution } from '@/utils/proposalActions';


// Types for your bounty data
type BountyData = {
  id: number; // e.g. 12345
  title: string;
  reward: string;
  deadline: string;
  creatorAddress: string;
  proposals?: ProposalData[];
};

// The combined dashboard data returned from /api/my-dashboard
type DashboardData = {
  myBounties: BountyData[];
  myProposals: ProposalData[];
};

// For contract calls
const BOUNTY_PROGRAM_ID = 'zkontractv4.aleo';
const ACCEPT_PROPOSAL_FUNCTION = 'accept_proposal';

export default function UserDashboard() {
  const { wallet, publicKey } = useWallet();
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // 1) Fetch "my-dashboard" data
  const fetchDashboard = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to load dashboard');
    }
    return res.json() as Promise<DashboardData>;
  };

  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    publicKey ? `/api/my-dashboard?publicKey=${publicKey}` : null,
    fetchDashboard
  );

  // 2) Local state: individually fetched bounties
  const [fetchedBounties, setFetchedBounties] = useState<Record<number, BountyData>>({});

  // 3) For each proposal, fetch the bounty if not in fetchedBounties
  useEffect(() => {
    if (data?.myProposals) {
      const uniqueBountyIds = Array.from(new Set(data.myProposals.map((p) => p.bountyId)));

      uniqueBountyIds.forEach(async (bountyId) => {
        if (!fetchedBounties[bountyId]) {
          try {
            const res = await fetch(`/api/get-bounty?id=${bountyId}`);
            if (res.ok) {
              const bounty = (await res.json()) as BountyData;
              setFetchedBounties((prev) => ({ ...prev, [bountyId]: bounty }));
            } else {
              console.error(`Error fetching bounty ${bountyId}:`, await res.text());
            }
          } catch (err) {
            console.error(`Error fetching bounty ${bountyId}:`, err);
          }
        }
      });
    }
  }, [data?.myProposals, fetchedBounties]);

  return (
    <Layout>
      <NextSeo title="zKontract | My Dashboard" description="View or manage your bounties and proposals." />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <BackArrow />
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-8">
          My Dashboard
        </h1>

        {isLoading && <p className="text-center text-gray-400">Loading...</p>}
        {error && (
          <p className="text-center text-red-400">Error: {error.message}</p>
        )}

        {data && (
          <div className="space-y-12">
            {/* (A) My Proposals */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Submitted Proposals
              </h2>
              {data.myProposals.length > 0 ? (
                <ul className="space-y-4">
                  {data.myProposals.map((prop) => {
                    const matchingBounty = fetchedBounties[prop.bountyId];

                    return (
                      <ProposalItem
                        key={`${prop.bountyId}-${prop.proposalId}`}
                        proposal={prop}
                        bounty={matchingBounty}
                        showActions={false}
                      />
                    );
                  })}
                </ul>
              ) : (
                <p className="text-black dark:text-white">
                  You haven’t submitted any proposals yet.
                </p>
              )}
            </div>

            {/* (B) My Bounties Section */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Posted Bounties
              </h2>
              {data.myBounties.length > 0 ? (
                <ul className="space-y-4">
                  {data.myBounties.map((bounty) => (
                    <li
                      key={bounty.id}
                      className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
                    >
                      <h3 className="text-lg font-medium text-black dark:text-black">
                        {bounty.title}
                      </h3>
                      <p className="mt-2 text-sm text-black dark:text-black">
                        Reward: {bounty.reward}
                      </p>
                      <p className="text-xs text-black dark:text-gray-400">
                        Deadline: {bounty.deadline}
                      </p>

                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-black dark:text-black mb-2">
                          Submitted Proposals:
                        </h4>
                        {bounty.proposals && bounty.proposals.length > 0 ? (
                          <ul className="space-y-3">
                            {bounty.proposals.map((p) => (
                              <ProposalItem
                                key={p.proposalId}
                                proposal={p}
                                bounty={bounty}
                                onAccept={(bounty, proposal) => handleAcceptSolution(wallet, publicKey, bounty, proposal, setTxStatus, mutate)}
                                onDeny={(bounty, proposal) => handleDenySolution(bounty, proposal)}
                                showActions={true}
                              />

                            ))}
                          </ul>
                        ) : (
                          <p className="text-black">
                            No proposals for this bounty yet.
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-black dark:text-white">
                  You haven’t posted any bounties yet.
                </p>
              )}
            </div>
          </div>
        )}

        {txStatus && (
          <div className="text-center text-sm text-gray-300 mt-4">
            Transaction Status: {txStatus}
          </div>
        )}
      </div>
    </Layout>
  );
}
