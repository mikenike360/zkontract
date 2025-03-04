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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow DELETE or POST methods (if DELETE is not sent from your client, you can use POST)
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Expecting a JSON body with caller and bountyId
    const { caller, bountyId } = req.body;
    if (!caller || !bountyId) {
      return res.status(400).json({ error: 'Missing required parameters: caller and bountyId' });
    }

    // Delete the bounty metadata file from S3
    const bountyMetadataParams = {
      Bucket: BUCKET_NAME,
      Key: `metadata/bounties/${bountyId}.json`,
    };
    await s3.deleteObject(bountyMetadataParams).promise();

    // Delete associated proposals from S3.
    // Assuming proposals are stored under a folder: metadata/proposals/<bountyId>/
    const proposalsPrefix = `metadata/proposals/${bountyId}/`;
    const listedObjects = await s3.listObjectsV2({
      Bucket: BUCKET_NAME,
      Prefix: proposalsPrefix,
    }).promise();

    if (listedObjects.Contents && listedObjects.Contents.length > 0) {
      const deleteParams = {
        Bucket: BUCKET_NAME,
        Delete: { Objects: [] as { Key: string }[] },
      };

      listedObjects.Contents.forEach((object) => {
        if (object.Key) {
          deleteParams.Delete.Objects.push({ Key: object.Key });
        }
      });

      await s3.deleteObjects(deleteParams).promise();
    }

    return res.status(200).json({
      message: 'Bounty and associated proposals deleted successfully'
    });
  } catch (error) {
    console.error('Delete bounty error:', error);
    return res.status(500).json({ error: 'Failed to delete bounty and associated proposals' });
  }
}
