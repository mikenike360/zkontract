import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import BackArrow from '@/components/ui/BackArrow';
import useSWR from 'swr';
import ProposalItem from '@/components/ui/ProposalItem';
import { ProposalData } from '@/components/ui/ProposalItem';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { useEffect, useState } from 'react';
import { handleAcceptSolution, handleDenySolution } from '@/utils/proposalActions';
import { handleDeleteBounty } from '@/utils/deleteBounty';
import Button from '@/components/ui/button';

type BountyData = {
  id: number; // e.g. 12345
  title: string;
  reward: string;
  deadline: string;
  creatorAddress: string;
  proposals?: ProposalData[];
};

type DashboardData = {
  myBounties: BountyData[];
  myProposals: ProposalData[];
};

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

  // 2) Load data with SWR
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    publicKey ? `/api/my-dashboard?publicKey=${publicKey}` : null,
    fetchDashboard
  );

  // 3) Keep track of individually fetched bounties (if needed)
  const [fetchedBounties, setFetchedBounties] = useState<Record<number, BountyData>>({});

  // 4) For each proposal, fetch the bounty if not in fetchedBounties
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

  // Helper: group proposals by their bountyId
  function groupProposalsByBounty(proposals: ProposalData[]) {
    return proposals.reduce<Record<number, ProposalData[]>>((acc, proposal) => {
      const { bountyId } = proposal;
      if (!acc[bountyId]) {
        acc[bountyId] = [];
      }
      acc[bountyId].push(proposal);
      return acc;
    }, {});
  }

  return (
    <Layout>
      <NextSeo
        title="zKontract | My Dashboard"
        description="View or manage your bounties and proposals."
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <BackArrow />
        </div>

        <h1 className="text-2xl font-bold text-primary-content text-center mb-8">
          My Dashboard
        </h1>

        <h3 className="text-1xl text-primary-content text-center mb-8">
          Note: Please verify you have enought public Aleo to cover transaction fees!
        </h3>

        {isLoading && <p className="text-center text-info">Loading...</p>}
        {error && <p className="text-center text-error">Error: {error.message}</p>}

        {/* Only render the main content if data is available */}
        {data && (
          <div className="space-y-12">
            {/* (A) My Submitted Proposals */}
            <div>
              <h2 className="text-xl font-semibold text-primary-content mb-4">
                My Submitted Proposals
              </h2>
              {data.myProposals.length > 0 ? (
                (() => {
                  const proposalsByBounty = groupProposalsByBounty(data.myProposals);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-base-content">
                      {Object.entries(proposalsByBounty).map(([bountyId, proposals]) => {
                        const bounty = fetchedBounties[+bountyId];
                        return (
                          <div
                            key={bountyId}
                            className="card rounded-lg shadow p-4 bg-base-100 border"
                          >
                            <p className="font-semibold mb-2">Bounty ID: {bountyId}</p>
                            {bounty ? (
                              <p className="mb-2">Bounty Title: {bounty.title}</p>
                            ) : (
                              <p className="mb-2 italic">Loading bounty info...</p>
                            )}
                            <ul className="space-y-2">
                              {proposals.map((prop) => (
                                <li key={`${prop.bountyId}-${prop.proposalId}`}>
                                  <ProposalItem
                                    proposal={prop}
                                    bounty={bounty}
                                    showActions={false}
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <p className="text-primary-content">
                  You haven’t submitted any proposals yet.
                </p>
              )}
            </div>

            {/* (B) My Posted Bounties */}
            <div>
              <h2 className="text-xl font-semibold text-primary-content mb-4">
                My Posted Bounties
              </h2>
              {data.myBounties.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-primary-content">
                    {data.myBounties.map((bounty) => {
                      // Check if any proposal for this bounty has an accepted status
                      const hasAcceptedProposal =
                        bounty.proposals && bounty.proposals.some((p) => p.status === "accepted");

                      return (
                        <div
                          key={bounty.id}
                          className="card rounded-lg shadow p-4 bg-base-100 border text-primary-content"
                        >
                          {/* Bounty title + ID */}
                          <h3 className="text-lg font-medium text-base-content mb-1">
                            {bounty.title} (ID: {bounty.id})
                          </h3>
                          <p className="text-sm text-base-content mb-1">
                            Reward: {bounty.reward} Aleo
                          </p>
                          <p className="text-sm text-base-content">
                            Deadline: {bounty.deadline}
                          </p>

                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-base-content mb-2">
                              Proposals For Review:
                            </h4>
                            {bounty.proposals && bounty.proposals.length > 0 ? (
                              <div className="p-2 rounded space-y-3">
                                {bounty.proposals.map((p) => (
                                  <ProposalItem
                                    key={p.proposalId}
                                    proposal={p}
                                    bounty={bounty}
                                    onAccept={(b, proposal) =>
                                      handleAcceptSolution(
                                        wallet,
                                        publicKey,
                                        b,
                                        proposal,
                                        setTxStatus,
                                        mutate
                                      )
                                    }
                                    onDeny={(b, proposal) =>
                                      handleDenySolution(
                                        wallet,
                                        publicKey,
                                        b,
                                        proposal,
                                        setTxStatus,
                                        mutate
                                      )
                                    }
                                    showActions={true}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="text-base-content">
                                No proposals for this bounty yet.
                              </p>
                            )}
                            {/* Show Delete Data button only if an accepted proposal exists */}
                            {hasAcceptedProposal && (
                              <div className="flex justify-center mt-2">
                                <Button
                                  onClick={() =>
                                    handleDeleteBounty(wallet, publicKey, bounty, setTxStatus, mutate)
                                  }
                                  className="btn btn-error text-sm"
                                  size="small"
                                >
                                  Delete Data
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Tip section moved OUTSIDE the grid */}
                  <div className="mt-6 text-center">
                    <p className="text-sm text-primary-content">
                      <strong>Tip:</strong> If your dashboard is loading slow, delete old bounties.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-base-content">You haven’t posted any bounties yet.</p>
              )}
            </div>

          </div>
        )}

        {txStatus && (
          <div className="text-center text-sm text-primary-content mt-4">
            Transaction Status: {txStatus}
          </div>
        )}
      </div>
    </Layout>
  );
}
