import React, { useState } from 'react';
import Head from 'next/head';

const CalculateCompositeId = () => {
  const [bountyId, setBountyId] = useState('');
  const [proposalId, setProposalId] = useState('');
  const [compositeId, setCompositeId] = useState<string | null>(null);

  const calculateCompositeId = () => {
    if (!bountyId || !proposalId) {
      alert('Please enter both Bounty ID and Proposal ID');
      return;
    }

    const bountyIdNum = BigInt(bountyId);
    const proposalIdNum = BigInt(proposalId);

    if (bountyIdNum < 0n || proposalIdNum < 0n) {
      alert('Both inputs must be valid positive numbers');
      return;
    }

    const compositeIdValue = (bountyIdNum * 1_000_000n + proposalIdNum).toString();
    setCompositeId(compositeIdValue);
  };

  return (
    <>
      <Head>
        <title>Calculate Composite Proposal ID</title>
      </Head>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-6">Composite Proposal ID Calculator</h1>

        <div className="mb-4 w-full max-w-md">
          <label className="block mb-2 text-sm font-medium">Bounty ID</label>
          <input
            type="text"
            value={bountyId}
            onChange={(e) => setBountyId(e.target.value)}
            placeholder="Enter Bounty ID"
            className="w-full px-4 py-2 rounded-md text-black"
          />
        </div>

        <div className="mb-4 w-full max-w-md">
          <label className="block mb-2 text-sm font-medium">Proposal ID</label>
          <input
            type="text"
            value={proposalId}
            onChange={(e) => setProposalId(e.target.value)}
            placeholder="Enter Proposal ID"
            className="w-full px-4 py-2 rounded-md text-black"
          />
        </div>

        <button
          onClick={calculateCompositeId}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Calculate Composite ID
        </button>

        {compositeId && (
          <div className="mt-6 p-4 bg-gray-800 rounded-md w-full max-w-md">
            <h2 className="text-lg font-medium mb-2">Composite ID</h2>
            <p className="text-green-400 break-words">{compositeId}</p>
          </div>
        )}
      </div>
    </>
  );
};

export default CalculateCompositeId;
