import { useState } from 'react';
import Head from 'next/head';

const DebugS3 = () => {
  const [bucketName, setBucketName] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!bucketName || !key) {
      setError('Please provide both bucket name and key.');
      return;
    }

    setLoading(true);
    setError(null);
    setContent(null);

    try {
      const res = await fetch(
        `/api/get-object-content?bucketName=${encodeURIComponent(bucketName)}&key=${encodeURIComponent(key)}`
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch object content.');
      } else {
        setContent(data.content);
      }
    } catch (err: any) {
      console.error('Error fetching object content:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Debug S3 Bucket Object - zKontract</title>
      </Head>
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-3xl font-bold mb-6">S3 Object Debugger</h1>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter S3 Bucket Name"
            value={bucketName}
            onChange={(e) => setBucketName(e.target.value)}
            className="px-4 py-2 rounded-md text-black w-full max-w-md mb-2"
          />
          <input
            type="text"
            placeholder="Enter S3 Object Key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="px-4 py-2 rounded-md text-black w-full max-w-md"
          />
        </div>

        <button
          onClick={handleFetch}
          className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          disabled={loading}
        >
          {loading ? 'Fetching...' : 'Fetch Object Content'}
        </button>

        {error && <p className="mt-4 text-red-500">{error}</p>}

        {content && (
          <div className="mt-8 bg-gray-800 p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-4">Object Content</h2>
            <pre className="bg-gray-700 p-4 rounded-md overflow-auto max-h-96">
              {typeof content === 'object' ? JSON.stringify(content, null, 2) : content}
            </pre>
          </div>
        )}

        {!loading && !content && !error && (
          <p className="mt-8 text-gray-400">No content to display. Enter a bucket name and key to fetch data.</p>
        )}
      </div>
    </>
  );
};

export default DebugS3;
