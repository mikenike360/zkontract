// pages/api/update-proposal-reward.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { validateId, isValidBoolean, checkRateLimit } from '@/utils/validation';
import { validateAuthRequest, verifyBountyOwnership, verifyMessageContent } from '@/utils/auth';

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
    const { bountyId, proposalId, rewardSent, caller, signature, message, timestamp, nonce } = req.body;
    
    // Rate limiting
    const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
    const rateLimit = checkRateLimit(`update-reward-${clientIp}`, 20, 60000); // 20 requests per minute
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    
    if (!bountyId || !proposalId || rewardSent === undefined || !caller) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate IDs
    const bountyIdValidation = validateId(bountyId, 'bountyId');
    if (!bountyIdValidation.valid) {
      return res.status(400).json({ error: bountyIdValidation.error });
    }
    
    const proposalIdValidation = validateId(proposalId, 'proposalId');
    if (!proposalIdValidation.valid) {
      return res.status(400).json({ error: proposalIdValidation.error });
    }
    
    // Validate rewardSent is boolean
    if (!isValidBoolean(rewardSent)) {
      return res.status(400).json({ error: 'Invalid rewardSent value' });
    }
    
    // ✅ AUTHENTICATION: Verify signature and authorization
    if (!signature || !message || timestamp === undefined || !nonce) {
      return res.status(401).json({ error: 'Missing authentication parameters' });
    }
    
    const authResult = await validateAuthRequest({
      signature,
      message,
      timestamp,
      nonce,
      address: caller,
    });
    
    if (!authResult.valid) {
      return res.status(401).json({ error: authResult.error || 'Authentication failed' });
    }
    
    // Verify the message contains the correct action and data
    if (!verifyMessageContent(message, 'update_proposal_reward', { bountyId, proposalId, rewardSent })) {
      return res.status(400).json({ error: 'Message content mismatch' });
    }
    
    // ✅ AUTHORIZATION: Only bounty creator can update reward status
    const isOwner = await verifyBountyOwnership(caller, bountyIdValidation.value!);
    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to update reward status' });
    }

    const bucket = 'zkontract'; // your actual bucket name
    const key = `metadata/proposals/${bountyIdValidation.value}/${proposalIdValidation.value}.json`;
   

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

    return res.status(200).json({ message: 'Reward field updated successfully' });
  } catch (error) {
    console.error('Error updating proposal reward:', error);
    return res.status(500).json({ error: 'Failed to process update request' });
  }
}
