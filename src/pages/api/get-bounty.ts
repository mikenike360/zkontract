// pages/api/get-bounty.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

/**
 * GET /api/get-bounty?id=<bountyId>
 * Returns the single bounty stored in zkontract/metadata/bounties/<id>.json
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "id" query parameter.' });
    }

    const bucketName = 'zkontract';
    const key = `metadata/bounties/${id}.json`;

    // Fetch the file from S3
    const getResult = await s3.getObject({ Bucket: bucketName, Key: key }).promise();

    if (!getResult.Body) {
      return res.status(404).json({ error: 'Bounty file not found or empty' });
    }

    // Convert buffer/stream to string
    const fileContent = getResult.Body.toString('utf-8');
    // Parse JSON
    const bountyData = JSON.parse(fileContent);

    return res.status(200).json(bountyData);
  } catch (error) {
    console.error('Error fetching bounty:', error);
    return res.status(500).json({ error: 'Failed to retrieve bounty' });
  }
}
