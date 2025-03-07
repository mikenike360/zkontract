// pages/api/get-bounty.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { readBountyMappings } from '@/components/aleo/rpc';
import { parseBountyChainData } from '@/utils/parseBountyChainData';

// Simple in-memory cache
const chainDataCache: { [id: string]: any } = {};

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

/**
 * GET /api/get-bounty?id=<bountyId>
 * Returns the single bounty stored in zkontract/metadata/bounties/<id>.json,
 * but overrides "creatorAddress", "reward", and "status" from on-chain data.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "id" query parameter.' });
    }

    const bucketName = 'zkontract';
    const key = `metadata/bounties/${id}.json`;

    // 1. Fetch from S3
    const getResult = await s3.getObject({ Bucket: bucketName, Key: key }).promise();
    if (!getResult.Body) {
      return res.status(404).json({ error: 'Bounty file not found or empty' });
    }

    const fileContent = getResult.Body.toString('utf-8');
    const bountyData = JSON.parse(fileContent);

    // 2. Fetch on-chain data with caching
    let chainDataRaw;
    if (chainDataCache[id]) {
      chainDataRaw = chainDataCache[id];
    } else {
      chainDataRaw = await readBountyMappings(id);
      chainDataCache[id] = chainDataRaw;
      // Optionally, you can set an expiration time for each cache entry.
    }

    // 3. Parse on-chain data
    const chainData = parseBountyChainData(chainDataRaw);
    // chainData = { creator: "aleo1...", payment: 15, status: "Open" }

    // 4. Merge/overwrite S3 data with chain data
    bountyData.creatorAddress = chainData.creator;
    bountyData.reward = chainData.payment;    // Assuming 'reward' is a number in your BountyData type
    bountyData.status = chainData.status;       // e.g., "Open"

    // 5. Return merged data
    return res.status(200).json(bountyData);
  } catch (error) {
    console.error('Error fetching bounty:', error);
    return res.status(500).json({ error: 'Failed to retrieve bounty' });
  }
}
