import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { readBountyMappings } from '@/components/aleo/rpc';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export default async function handler(
  _req: NextApiRequest, 
  res: NextApiResponse
) {
  // Prevent caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    const bucketName = 'zkontract';
    const bountiesPrefix = 'metadata/bounties/';

    // Fetch all bounties
    const bountiesList = await s3.listObjectsV2({
      Bucket: bucketName,
      Prefix: bountiesPrefix,
    }).promise();

    const activeBounties = [];

    for (const bountyObj of bountiesList.Contents || []) {
      if (!bountyObj.Key || !bountyObj.Key.endsWith('.json')) continue;

      // 1) Get the object, then check `Body` before using it:
      const bountyDataObj = await s3.getObject({
        Bucket: bucketName,
        Key: bountyObj.Key,
      }).promise();

      if (!bountyDataObj.Body) {
        console.error(`No body found for object ${bountyObj.Key}`);
        continue; // skip this bounty
      }

      // Now it's safe to toString():
      const bountyDataString = bountyDataObj.Body.toString();
      
      // Check for empty or invalid JSON
      if (!bountyDataString.trim()) {
        console.error(`Empty JSON file found: ${bountyObj.Key}`);
        continue; // Skip this bounty
      }
      
      let bountyData;
      try {
        bountyData = JSON.parse(bountyDataString);
      } catch (parseError) {
        console.error(`Invalid JSON in bounty file ${bountyObj.Key}:`, parseError);
        continue; // Skip this bounty
      }

      // Check contract status first (same as dashboard logic)
      let isBountyCompleted = false;
      try {
        console.log(`Checking contract status for bounty ${bountyData.id}`);
        const contractData = await readBountyMappings(bountyData.id.toString());
        console.log(`Bounty ${bountyData.id} contract status:`, contractData.status);
        isBountyCompleted = contractData.status === "1" || contractData.status === "1u8";
        if (isBountyCompleted) {
          console.log(`Bounty ${bountyData.id} is completed on-chain, hiding from board`);
          continue; // Skip this bounty
        }
      } catch (contractError) {
        console.log(`Could not fetch contract status for bounty ${bountyData.id}, checking proposals instead`);
      }

      // Fetch all proposals for this bounty to check if any are accepted (fallback)
      const proposalsPrefix = 'metadata/proposals/';
      const proposalsList = await s3.listObjectsV2({
        Bucket: bucketName,
        Prefix: `${proposalsPrefix}${bountyData.id}/`,
      }).promise();

      let hasAcceptedProposal = false;

      // Check if any proposal is accepted
      for (const proposalObj of proposalsList.Contents || []) {
        if (!proposalObj.Key || !proposalObj.Key.endsWith('.json')) continue;

        const proposalDataObj = await s3.getObject({
          Bucket: bucketName,
          Key: proposalObj.Key,
        }).promise();

        if (!proposalDataObj.Body) {
          console.error(`No body found for proposal object ${proposalObj.Key}`);
          continue;
        }

        const proposalData = JSON.parse(proposalDataObj.Body.toString());
        
        // Debug logging
        console.log(`Bounty ${bountyData.id}, Proposal ${proposalData.proposalId}: status = "${proposalData.status}"`);
        
        // Use the same logic as dashboard - normalize status
        const normalizedStatus = proposalData.status?.toLowerCase().trim() || 'initial';
        
        // Check if this proposal is accepted (same logic as dashboard getEffectiveStatus)
        if (normalizedStatus === 'accepted') {
          console.log(`Found accepted proposal for bounty ${bountyData.id}, hiding from board`);
          hasAcceptedProposal = true;
          break; // No need to check more proposals
        }
      }

      // Only add bounty to active list if no proposal is accepted
      if (!hasAcceptedProposal) {
        activeBounties.push(bountyData);
      }
      
    }

    res.status(200).json(activeBounties);
  } catch (error) {
    console.error('Error fetching bounties:', error);
    res.status(500).json({ error: 'Failed to fetch bounties' });
  }
}
