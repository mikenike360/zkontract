// pages/api/update-proposal-status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bountyId, proposalId, newStatus } = req.body;
    if (!bountyId || !proposalId || !newStatus) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const bucket = 'zkontract'; // your real bucket name
    const key = `metadata/proposals/${bountyId}/${proposalId}.json`;
    console.log(key);

    // Fetch existing .json
    const getRes = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    if (!getRes.Body) {
      return res.status(404).json({ error: 'Proposal not found.' });
    }

    // Parse & update status
    const proposalData = JSON.parse(getRes.Body.toString('utf-8'));
    proposalData.status = newStatus;

    // Re-upload
    await s3.putObject({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(proposalData),
      ContentType: 'application/json',
    }).promise();

    return res.status(200).json({ message: `Proposal status set to ${newStatus}` });
  } catch (error) {
    console.error('Error updating proposal status:', error);
    return res.status(500).json({ error: 'Failed to update proposal status' });
  }
}
