// pages/api/upload-proposal.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { validateId, checkRateLimit, isValidAleoAddress } from '@/utils/validation';
import { validateAuthRequest, verifyMessageContent } from '@/utils/auth';

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
    // Rate limiting
    const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
    const rateLimit = checkRateLimit(`upload-proposal-${clientIp}`, 10, 60000); // 10 requests per minute
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    
    const { proposalId, metadata, caller, signature, message, timestamp, nonce } = req.body;
    if (!proposalId || !metadata || !caller) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate proposalId
    const proposalIdValidation = validateId(proposalId, 'proposalId');
    if (!proposalIdValidation.valid) {
      return res.status(400).json({ error: proposalIdValidation.error });
    }
    
    // Validate caller address
    if (!isValidAleoAddress(caller)) {
      return res.status(400).json({ error: 'Invalid caller address format' });
    }
    
    // ✅ AUTHENTICATION: Verify signature
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
    
    // Verify the message contains the correct action and proposalId
    if (!verifyMessageContent(message, 'upload_proposal', { proposalId })) {
      return res.status(400).json({ error: 'Message content mismatch' });
    }

    // Parse metadata if it is a string
    let parsedMetadata = metadata;
    if (typeof metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid metadata JSON' });
      }
    }

    const bountyId = parsedMetadata.bountyId;
    if (!bountyId) {
      return res.status(400).json({ error: 'Missing bountyId in metadata' });
    }
    
    // Validate bountyId
    const bountyIdValidation = validateId(bountyId, 'bountyId');
    if (!bountyIdValidation.valid) {
      return res.status(400).json({ error: bountyIdValidation.error });
    }

    const params = {
      Bucket: 'zkontract', // your S3 bucket
      Key: `metadata/proposals/${bountyIdValidation.value}/${proposalIdValidation.value}.json`,
      Body: JSON.stringify(parsedMetadata),
      ContentType: 'application/json',
    };


    await s3.putObject(params).promise();

    return res.status(200).json({ message: 'Proposal uploaded successfully' });
  } catch (error) {
    console.error('Proposal upload error:', error);
    return res.status(500).json({ error: 'Failed to process proposal upload' });
  }
}
