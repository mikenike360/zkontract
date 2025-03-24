// pages/api/delete-bounty.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

// Initialize the S3 client using credentials from your environment
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,     
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Use process.env.AWS_BUCKET_NAME for your bucket name; default to 'zkontract'
const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'zkontract';

/**
 * Deletes only the bounty metadata file.
 */
async function deleteBounty(bountyId: number, caller: string): Promise<void> {
  const bountyMetadataParams = {
    Bucket: BUCKET_NAME,
    Key: `metadata/bounties/${bountyId}.json`,
  };
  await s3.deleteObject(bountyMetadataParams).promise();
}

/**
 * Deletes a single proposal file by its ID.
 */
async function deleteProposal(bountyId: number, proposalId: number, caller: string): Promise<void> {
  const proposalKey = `metadata/proposals/${bountyId}/${proposalId}.json`;
  await s3.deleteObject({
    Bucket: BUCKET_NAME,
    Key: proposalKey,
  }).promise();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow DELETE or POST methods
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Expecting a JSON body with caller and bountyId.
    // Optionally, proposalId can be provided.
    const { caller, bountyId, proposalId } = req.body;
    if (!caller || !bountyId) {
      return res.status(400).json({ error: 'Missing required parameters: caller and bountyId' });
    }

    if (proposalId) {
      // Delete a single proposal by ID
      await deleteProposal(bountyId, proposalId, caller);
      return res.status(200).json({ message: 'Proposal deleted successfully' });
    } else {
      // Delete only the bounty metadata file
      await deleteBounty(bountyId, caller);
      return res.status(200).json({ message: 'Bounty deleted successfully' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete bounty and/or proposal' });
  }
}
