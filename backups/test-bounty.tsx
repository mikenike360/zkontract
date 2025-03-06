import React, { useState } from 'react';
import { readBountyMappings } from '../aleo/rpc';

export default function TestBountyPage() {
  const [bountyId, setBountyId] = useState('1737834595311u64');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleFetch() {
    try {
      setLoading(true);
      setError('');
      setData(null);
  
      // Pass bountyId directly as a string
      const result = await readBountyMappings(bountyId);
      setData(result);
    } catch (err) {
      setError((err as Error).message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }
  

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Read Bounty Mappings Test</h1>
      <label>
        Bounty ID:
        <input
          type="text"
          className="text-black"
          value={bountyId}
          onChange={(e) => setBountyId(e.target.value)}
          style={{ margin: '0 1rem' }}
        />
      </label>
      <button onClick={handleFetch}>Fetch</button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {data && (
        <div>
          <h2>Result:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
