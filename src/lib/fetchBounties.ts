// lib/fetchBounties.ts
export type Bounty = {
    id: string;
    title: string;
    description: string;
    reward: string;
    deadline: string;
  };
  
  export async function fetchBounties(): Promise<Bounty[]> {
    // Placeholder data
    return [
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
  }
  