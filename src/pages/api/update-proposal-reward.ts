// pages/api/update-proposal-reward.ts
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
    const { bountyId, proposalId, rewardSent } = req.body;
    if (!bountyId || !proposalId || typeof rewardSent !== 'boolean') {
      return res.status(400).json({ error: 'Missing fields or invalid rewardSent value' });
    }

    const bucket = 'zkontract'; // your actual bucket name
    const key = `metadata/proposals/${bountyId}/${proposalId}.json`;
    const userkey = `metadata/userproposals/${bountyId}/${proposalId}.json`;

    // Fetch existing metadata
    const getRes = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    if (!getRes.Body) {
      return res.status(404).json({ error: 'Proposal not found.' });
    }

    // Parse the JSON, update rewardSent, and re-upload
    const proposalData = JSON.parse(getRes.Body.toString('utf-8'));
    proposalData.rewardSent = rewardSent;

    await s3.putObject({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(proposalData),
      ContentType: 'application/json',
    }).promise();

    await s3.putObject({
      Bucket: bucket,
      Key: userkey,
      Body: JSON.stringify(proposalData),
      ContentType: 'application/json',
    }).promise();


    return res.status(200).json({ message: 'Reward field updated successfully' });
  } catch (error) {
    console.error('Error updating proposal reward:', error);
    return res.status(500).json({ error: 'Failed to update proposal reward' });
  }
}
