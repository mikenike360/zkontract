// src/hooks/useDashboardData.ts
import { useEffect, useState } from 'react';
import useSWR from 'swr';

// Example: in DashboardBounties.tsx
import { ProposalData, BountyData } from '@/types';


export type DashboardData = {
  myBounties: BountyData[];
  myProposals: ProposalData[];
};

async function fetchDashboard(url: string): Promise<DashboardData> {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to load dashboard');
  }
  return res.json();
}

export function useDashboardData(publicKey: string | null) {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    publicKey ? `/api/my-dashboard?publicKey=${publicKey}` : null,
    fetchDashboard
  );

  const [fetchedBounties, setFetchedBounties] = useState<Record<number, BountyData>>({});

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

  return { data, error, isLoading, mutate, fetchedBounties };
}
