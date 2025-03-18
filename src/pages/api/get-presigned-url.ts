// pages/api/get-presigned-url.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { key } = req.query;

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'File key is required' });
  }

  // Use the correct environment variable name here
  const bucketName = process.env.AWS_S3_BUCKET_NAME || 'zkontract';
  console.log("Using bucket:", bucketName);

  const params = {
    Bucket: bucketName,
    Key: key,
    Expires: 60, // URL expires in 60 seconds
  };

  try {
    const url = await s3.getSignedUrlPromise('getObject', params);
    res.status(200).json({ url });
  } catch (error) {
    console.error('Error generating presigned URL', error);
    res.status(500).json({ error: 'Could not generate URL' });
  }
}
