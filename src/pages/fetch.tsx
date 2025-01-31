import React, { useState } from 'react';
import Head from 'next/head';
import { readProposalMappings } from '../aleo/rpc'; // Replace with your actual file path

const FetchProposalMappings = () => {
  const [bountyId, setBountyId] = useState('');
  const [proposalId, setProposalId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    if (!bountyId || !proposalId) {
      setError('Please provide both Bounty ID and Proposal ID.');
      setLoading(false);
      return;
    }

    try {
      const bountyIdNum = parseInt(bountyId, 10);
      const proposalIdNum = parseInt(proposalId, 10);

      if (isNaN(bountyIdNum) || isNaN(proposalIdNum)) {
        setError('Bounty ID and Proposal ID must be valid numbers.');
        setLoading(false);
        return;
      }

      const data = await readProposalMappings(bountyIdNum, proposalIdNum);
      setResult(data);
    } catch (err) {
      console.error('Error fetching proposal mappings:', err);
      setError('Failed to fetch proposal mappings. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Fetch Proposal Mappings</title>
      </Head>
      <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6">Fetch Proposal Mappings</h1>

        <div className="w-full max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Bounty ID</label>
            <input
              type="text"
              value={bountyId}
              onChange={(e) => setBountyId(e.target.value)}
              placeholder="Enter Bounty ID"
              className="w-full px-4 py-2 rounded-md text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Proposal ID</label>
            <input
              type="text"
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}
              placeholder="Enter Proposal ID"
              className="w-full px-4 py-2 rounded-md text-black"
            />
          </div>

          <button
            onClick={handleFetch}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500"
            disabled={loading}
          >
            {loading ? 'Fetching...' : 'Fetch Proposal Mappings'}
          </button>

          {error && <p className="text-red-500 mt-4">{error}</p>}

          {result && (
            <div className="mt-6 p-4 bg-gray-800 rounded-md">
              <h2 className="text-lg font-semibold mb-2">Mapping Results</h2>
              <pre className="bg-gray-700 p-4 rounded-md text-green-400">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FetchProposalMappings;
