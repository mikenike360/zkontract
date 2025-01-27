import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

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
    // 2. Parse JSON from the request body
    //    If you're sending JSON, use JSON.stringify on the client 
    //    and parse it here.
    const { bountyId, metadata } = req.body;

    // 3. Prepare S3 parameters. Adjust the Bucket & Key path 
    //    to match your needs.
    const params = {
      Bucket: 'zkontract',            // <-- Replace with your bucket
      Key: `metadata/bounties/${bountyId}.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json',
    };

    // 4. Upload to S3
    await s3.putObject(params).promise();

    // 5. Return success
    return res.status(200).json({ message: 'Upload successful' });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload' });
  }
}
