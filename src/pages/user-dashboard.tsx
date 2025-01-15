import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import BackArrow from '@/components/ui/BackArrow';

const submittedProposals = [
  {
    id: 'p1',
    bountyTitle: 'Design a Landing Page',
    proposalText: 'A fully responsive landing page created using React.',
    submittedAt: 'Jan 10, 2025',
    status: 'pending', // Status can be 'pending', 'denied', or 'accepted'
  },
  {
    id: 'p2',
    bountyTitle: 'Build a React Component',
    proposalText: 'A reusable React component with hooks.',
    submittedAt: 'Jan 12, 2025',
    status: 'accepted',
  },
];

const postedBounties = [
  {
    id: 'b1',
    title: 'Create a Logo Design',
    reward: '5 ALEO',
    deadline: 'Feb 1, 2025',
    proposals: [
      {
        id: 'p3',
        proposer: 'Alice',
        completedWork: 'A logo design concept based on modern aesthetics.',
        submittedAt: 'Jan 15, 2025',
        status: 'pending',
      },
      {
        id: 'p4',
        proposer: 'Bob',
        completedWork: 'A clean and minimalistic logo design.',
        submittedAt: 'Jan 16, 2025',
        status: 'denied',
      },
    ],
  },
  {
    id: 'b2',
    title: 'Develop a Smart Contract',
    reward: '15 ALEO',
    deadline: 'Feb 15, 2025',
    proposals: [
      {
        id: 'p5',
        proposer: 'Charlie',
        completedWork: 'A secure and efficient smart contract for your needs.',
        submittedAt: 'Jan 20, 2025',
        status: 'accepted',
      },
    ],
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return (
        <span className="px-2 py-1 text-xs text-yellow-800 bg-yellow-200 rounded-md">
          Pending
        </span>
      );
    case 'accepted':
      return (
        <span className="px-2 py-1 text-xs text-green-800 bg-green-200 rounded-md">
          Accepted & Paid
        </span>
      );
    case 'denied':
      return (
        <span className="px-2 py-1 text-xs text-red-800 bg-red-200 rounded-md">
          Denied
        </span>
      );
    default:
      return null;
  }
};

const UserDashboard = () => {
  const handleAcceptSolution = (proposalId: string) => {
    console.log(`Solution accepted for proposal ${proposalId}`);
    alert('Solution accepted and payment sent!');
    // Add logic to integrate with your smart contract
  };

  return (
    <>
      <NextSeo
        title="zKontract | My Dashboard"
        description="View your submitted proposals and posted bounties."
      />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          
            <div className="mb-6">
              <BackArrow />
            </div>
        </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-white text-center mb-8">
          My Dashboard
        </h1>

        {/* Submitted Proposals Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">Submitted Proposals</h2>
          {submittedProposals.length > 0 ? (
            <ul className="space-y-4">
              {submittedProposals.map((proposal) => (
                <li
                  key={proposal.id}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
                >
                  <h3 className="text-lg font-medium text-black">{proposal.bountyTitle}</h3>
                  <p className="mt-2 text-sm text-black">{proposal.proposalText}</p>
                  <p className="mt-2 text-xs text-black">Submitted on: {proposal.submittedAt}</p>
                  <div className="mt-2">{getStatusBadge(proposal.status)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-black">You haven’t submitted any proposals yet.</p>
          )}
        </div>

        {/* Posted Bounties Section */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Posted Bounties</h2>
          {postedBounties.length > 0 ? (
            <ul className="space-y-4">
              {postedBounties.map((bounty) => (
                <li
                  key={bounty.id}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
                >
                  <h3 className="text-lg font-medium text-black">{bounty.title}</h3>
                  <p className="mt-2 text-sm text-black">Reward: {bounty.reward}</p>
                  <p className="mt-2 text-xs text-black">Deadline: {bounty.deadline}</p>

                  {/* Submitted Proposals for the Bounty */}
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-black mb-2">Submitted Proposals:</h4>
                    {bounty.proposals.length > 0 ? (
                      <ul className="space-y-3">
                        {bounty.proposals.map((proposal) => (
                          <li
                            key={proposal.id}
                            className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md"
                          >
                            <p className="text-sm text-black">
                              <span className="font-bold">{proposal.proposer}:</span>{' '}
                              {proposal.completedWork}
                            </p>
                            <p className="text-xs text-black">
                              Submitted on: {proposal.submittedAt}
                            </p>
                            <div className="mt-2">{getStatusBadge(proposal.status)}</div>
                            <button
                              onClick={() => handleAcceptSolution(proposal.id)}
                              className="mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-md shadow hover:bg-green-700"
                            >
                              Accept Solution & Send Payment
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-black">
                        No proposals have been submitted for this bounty yet.
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-black">You haven’t posted any bounties yet.</p>
          )}
        </div>
      </div>
    </>
  );
};

UserDashboard.getLayout = function getLayout(page: React.ReactNode) {
  return <Layout>{page}</Layout>;
};

export default UserDashboard;
