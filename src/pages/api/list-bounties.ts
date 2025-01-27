import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export default async function handler(req, res) {
  try {
    const bucketName = 'zkontract';
    const bountiesPrefix = 'metadata/bounties/';
    const proposalsPrefix = 'metadata/proposals/';

    // Fetch all bounties
    const bountiesList = await s3.listObjectsV2({
      Bucket: bucketName,
      Prefix: bountiesPrefix,
    }).promise();

    const activeBounties = [];

    for (const bountyObj of bountiesList.Contents || []) {
      if (!bountyObj.Key || !bountyObj.Key.endsWith('.json')) continue;

      const bountyData = JSON.parse(
        (await s3.getObject({ Bucket: bucketName, Key: bountyObj.Key }).promise()).Body.toString()
      );

      // Fetch all proposals for this bounty
      const proposalsList = await s3.listObjectsV2({
        Bucket: bucketName,
        Prefix: `${proposalsPrefix}${bountyData.id}/`,
      }).promise();

      const proposals = await Promise.all(
        (proposalsList.Contents || []).map(async (proposalObj) => {
          if (!proposalObj.Key || !proposalObj.Key.endsWith('.json')) return null;

          const proposalData = JSON.parse(
            (await s3.getObject({ Bucket: bucketName, Key: proposalObj.Key }).promise()).Body.toString()
          );

          return proposalData;
        })
      );

      // Check if any proposal has status "accepted"
      const hasAcceptedProposal = proposals.some((proposal) => proposal?.status === 'accepted');

      // Only include bounties without accepted proposals
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
