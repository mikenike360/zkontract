// pages/api/delete-bounty.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { validateId, isValidAleoAddress, checkRateLimit } from '@/utils/validation';
import { validateAuthRequest, verifyBountyOwnership, verifyMessageContent } from '@/utils/auth';

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
    // Expecting a JSON body with authentication and bounty/proposal data
    const { caller, bountyId, proposalId, signature, message, timestamp, nonce } = req.body;
    
    // Rate limiting
    const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
    const rateLimit = checkRateLimit(`delete-${clientIp}`, 10, 60000); // 10 requests per minute
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    
    if (!caller || !bountyId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Validate caller address format
    if (!isValidAleoAddress(caller)) {
      return res.status(400).json({ error: 'Invalid caller address format' });
    }
    
    // Validate bountyId
    const bountyIdValidation = validateId(bountyId, 'bountyId');
    if (!bountyIdValidation.valid) {
      return res.status(400).json({ error: bountyIdValidation.error });
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
    
    // Verify the message contains the correct action and bountyId
    if (!verifyMessageContent(message, 'delete_bounty', { bountyId })) {
      return res.status(400).json({ error: 'Message content mismatch' });
    }
    
    // ✅ AUTHORIZATION: Verify bounty ownership
    const isOwner = await verifyBountyOwnership(caller, bountyIdValidation.value!);
    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to delete this bounty' });
    }

    if (proposalId) {
      // Validate proposalId if provided
      const proposalIdValidation = validateId(proposalId, 'proposalId');
      if (!proposalIdValidation.valid) {
        return res.status(400).json({ error: proposalIdValidation.error });
      }
      
      // Delete a single proposal by ID
      await deleteProposal(bountyIdValidation.value!, proposalIdValidation.value!, caller);
      return res.status(200).json({ message: 'Proposal deleted successfully' });
    } else {
      // Delete only the bounty metadata file
      await deleteBounty(bountyIdValidation.value!, caller);
      return res.status(200).json({ message: 'Bounty deleted successfully' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Failed to process deletion request' });
  }
}
