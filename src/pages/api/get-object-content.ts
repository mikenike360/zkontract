// src/pages/api/get-object-content.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getObjectContent } from '../../lib/s3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const { bucketName, key } = req.query;

  if (!bucketName || typeof bucketName !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "bucketName" query parameter.' });
  }

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "key" query parameter.' });
  }

  try {
    const content = await getObjectContent(bucketName, key);

    // Attempt to parse JSON. If it fails, return as plain text.
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      parsedContent = content; // Fallback to raw content
    }

    return res.status(200).json({ content: parsedContent });
  } catch (error: any) {
    console.error('Error fetching object content:', error);
    if (error.code === 'NoSuchKey') {
      return res.status(404).json({ error: 'The specified key does not exist in the bucket.' });
    } else if (error.code === 'NoSuchBucket') {
      return res.status(404).json({ error: 'The specified bucket does not exist.' });
    } else if (error.code === 'AccessDenied') {
      return res.status(403).json({ error: 'Access denied. Check your AWS credentials and permissions.' });
    } else {
      return res.status(500).json({ error: 'Failed to retrieve object content.' });
    }
  }
}
