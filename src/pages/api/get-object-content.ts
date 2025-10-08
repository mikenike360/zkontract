// src/pages/api/get-object-content.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getObjectContent } from '../../utils/s3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const { key } = req.query;

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "key" query parameter.' });
  }

  // Sanitize key to prevent path traversal
  if (key.includes('..') || key.startsWith('/')) {
    return res.status(400).json({ error: 'Invalid key format.' });
  }

  // Hardcode bucket name for security - never accept from user input
  const bucketName = 'zkontract';

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
      return res.status(404).json({ error: 'Resource not found.' });
    } else if (error.code === 'NoSuchBucket' || error.code === 'AccessDenied') {
      // Log detailed error server-side but return generic message
      return res.status(500).json({ error: 'Failed to retrieve resource.' });
    } else {
      return res.status(500).json({ error: 'Failed to retrieve resource.' });
    }
  }
}

