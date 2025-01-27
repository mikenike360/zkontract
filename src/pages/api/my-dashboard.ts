// pages/api/my-dashboard.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { Readable } from 'stream';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Helper to convert S3 body to string
async function bodyToString(body: AWS.S3.Body): Promise<string> {
  if (typeof body === 'string') return body;
  if (body instanceof Buffer) return body.toString('utf-8');
  const stream = body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { publicKey } = req.query;
    if (!publicKey || typeof publicKey !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid publicKey' });
    }

    const bucket = 'zkontract';
    const bountiesPrefix = 'metadata/bounties/';
    const proposalsPrefix = 'metadata/proposals/';

    // 1) List all bounties in bounties/
    const bountyList = await s3.listObjectsV2({
      Bucket: bucket,
      Prefix: bountiesPrefix,
    }).promise();

    // We'll store the final array of bounties
    const myBounties: any[] = [];

    if (bountyList.Contents) {
      // For each bounty JSON file
      for (const obj of bountyList.Contents) {
        if (!obj.Key || !obj.Key.endsWith('.json')) continue;

        const bountyObject = await s3.getObject({
          Bucket: bucket,
          Key: obj.Key,
        }).promise();

        if (!bountyObject.Body) continue;
        const bountyStr = await bodyToString(bountyObject.Body);

        try {
          const bountyData = JSON.parse(bountyStr);
          // If this bounty was created by the user
          if (bountyData.creatorAddress === publicKey) {
            // Also fetch proposals
            const bountyId = bountyData.id; // make sure .id matches your schema
            const proposals: any[] = [];

            // list proposals in proposals/<bountyId>/
            const proposalsList = await s3.listObjectsV2({
              Bucket: bucket,
              Prefix: `${proposalsPrefix}${bountyId}/`,
            }).promise();

            if (proposalsList.Contents) {
              for (const pObj of proposalsList.Contents) {
                if (!pObj.Key || !pObj.Key.endsWith('.json')) continue;
                const propDataRaw = await s3.getObject({
                  Bucket: bucket,
                  Key: pObj.Key,
                }).promise();

                if (!propDataRaw.Body) continue;
                const propStr = await bodyToString(propDataRaw.Body);
                try {
                  const proposalData = JSON.parse(propStr);
                  proposals.push(proposalData);
                } catch (parseErr) {
                  console.error('Error parsing proposal', pObj.Key, parseErr);
                }
              }
            }

            bountyData.proposals = proposals;
            myBounties.push(bountyData);
          }
        } catch (err) {
          console.error('Error parsing bounty', obj.Key, err);
        }
      }
    }

    // 2) Get proposals the user submitted
    const myProposals: any[] = [];

    // We list ALL subfolders of proposals/ and filter
    const topLevelList = await s3.listObjectsV2({
      Bucket: bucket,
      Prefix: proposalsPrefix,
      Delimiter: '/',
    }).promise();

    // We expect subfolders like "zkontract/metadata/proposals/<bountyId>/"
    // If your bucket structure doesn't have "folders" as CommonPrefixes, we might do a different approach
    if (topLevelList.CommonPrefixes) {
      // For each bounty subfolder
      for (const prefixObj of topLevelList.CommonPrefixes) {
        const subPrefix = prefixObj.Prefix; // e.g. zkontract/metadata/proposals/12345/
        if (!subPrefix) continue;

        // List the proposals under that subPrefix
        const subList = await s3.listObjectsV2({
          Bucket: bucket,
          Prefix: subPrefix,
        }).promise();

        if (subList.Contents) {
          for (const propObj of subList.Contents) {
            if (!propObj.Key || !propObj.Key.endsWith('.json')) continue;
            const propData = await s3.getObject({
              Bucket: bucket,
              Key: propObj.Key,
            }).promise();

            if (!propData.Body) continue;
            const propStr = await bodyToString(propData.Body);
            try {
              const proposalData = JSON.parse(propStr);
              if (proposalData.proposerAddress === publicKey) {
                myProposals.push(proposalData);
              }
            } catch (err) {
              console.error('Error parsing proposal', propObj.Key, err);
            }
          }
        }
      }
    }

    return res.status(200).json({ myBounties, myProposals });
  } catch (error) {
    console.error('Error in my-dashboard:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard data' });
  }
}
