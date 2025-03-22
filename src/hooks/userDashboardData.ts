// src/hooks/useDashboardData.ts
import useSWR from 'swr';
import { ProposalData } from '@/types';

export type DashboardData = {
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

  return { data, error, isLoading, mutate };
}
