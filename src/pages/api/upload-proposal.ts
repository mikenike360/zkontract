// pages/api/upload-proposal.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { proposalId, metadata } = req.body;
    if (!proposalId || !metadata) {
      return res.status(400).json({ error: 'Missing proposalId or metadata' });
    }
    const bountyId = metadata.bountyId;

    const params = {
      Bucket: 'zkontract', // your S3 bucket
      Key: `metadata/proposals/${bountyId}/${proposalId}.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json',
    };

    await s3.putObject(params).promise();
    return res.status(200).json({ message: 'Proposal uploaded successfully' });
  } catch (error) {
    console.error('Proposal upload error:', error);
    return res.status(500).json({ error: 'Failed to upload proposal' });
  }
}
