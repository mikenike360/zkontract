import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { validateId, checkRateLimit, isValidAleoAddress } from '@/utils/validation';
import { validateAuthRequest, verifyMessageContent } from '@/utils/auth';

// 1. Initialize the S3 client with credentials from process.env
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,     // from .env.local
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // from .env.local
  region: process.env.AWS_REGION,                // e.g. 'us-east-1'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
    const rateLimit = checkRateLimit(`upload-bounty-${clientIp}`, 10, 60000); // 10 requests per minute
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    
    // Parse JSON from the request body
    const { bountyId, metadata, caller, signature, message, timestamp, nonce } = req.body;
    
    if (!bountyId || !metadata || !caller) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate bountyId
    const bountyIdValidation = validateId(bountyId, 'bountyId');
    if (!bountyIdValidation.valid) {
      return res.status(400).json({ error: bountyIdValidation.error });
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
    
    // Verify the message contains the correct action and bountyId
    if (!verifyMessageContent(message, 'upload_bounty', { bountyId })) {
      return res.status(400).json({ error: 'Message content mismatch' });
    }
    
    // Note: For new bounties, we can't verify ownership yet since they don't exist on-chain
    // The blockchain transaction must be submitted first, then metadata can be uploaded
    // Consider adding additional validation based on your workflow

    // 3. Prepare S3 parameters. Adjust the Bucket & Key path 
    //    to match your needs.
    const params = {
      Bucket: 'zkontract',            // <-- Replace with your bucket
      Key: `metadata/bounties/${bountyIdValidation.value}.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json',
    };

    // 4. Upload to S3
    await s3.putObject(params).promise();

    // 5. Return success
    return res.status(200).json({ message: 'Upload successful' });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to process upload request' });
  }
}
