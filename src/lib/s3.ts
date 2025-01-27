import AWS from 'aws-sdk';

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION, // Example: 'us-east-1'
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

export async function uploadToS3(bucketName: string, key: string, data: object): Promise<void> {
  const params = {
    Bucket: bucketName,
    Key: key, // The name of the file in the bucket
    Body: JSON.stringify(data), // The data to upload
    ContentType: 'application/json',
  };

  await s3.upload(params).promise();
  console.log(`Uploaded ${key} to ${bucketName}`);
}

export async function getFromS3(bucketName: string, key: string): Promise<object> {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  const result = await s3.getObject(params).promise();
  return JSON.parse(result.Body?.toString() || '{}');
}
