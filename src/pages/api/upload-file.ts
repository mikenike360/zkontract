// src/pages/api/upload-file.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { uploadFileToS3 } from '../../lib/s3';

/**
 * Define the response structure
 */
type ResponseData = {
  message: string;
  url?: string;
  error?: string;
};

/**
 * Disable Next.js default body parser to use formidable
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Type guard to ensure fields contain required properties
 */
interface FormFields {
  proposalId: string;
  metadata: string;
}

function isFormFields(obj: any): obj is FormFields {
  return (
    obj &&
    typeof obj.proposalId === 'string' &&
    typeof obj.metadata === 'string'
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    // Method Not Allowed
    return res.status(405).json({ message: 'Method Not Allowed', error: 'Only POST requests are allowed' });
  }

  const form = new formidable.IncomingForm({ multiples: false });

  try {
    // Parse the incoming form data
    const { fields, files } = await new Promise<{
      fields: formidable.Fields;
      files: { file?: formidable.File };
    }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    // Validate form fields
    if (!isFormFields(fields)) {
      return res.status(400).json({ message: 'Invalid form fields', error: 'proposalId and metadata are required and must be strings' });
    }

    const { proposalId, metadata } = fields;
    const file = files.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded', error: 'Please attach a file to your proposal' });
    }

    // Optional: Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']; // Customize as needed
    if (file.mimetype && !allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: 'Unsupported file type', error: `Allowed types: ${allowedTypes.join(', ')}` });
    }

    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      return res.status(400).json({ message: 'File size exceeds limit', error: 'Maximum allowed size is 5MB' });
    }

    // Read the file buffer asynchronously
    const fileBuffer = await fs.promises.readFile(file.filepath);
    const contentType = file.mimetype || 'application/octet-stream';

    // Define S3 parameters
    const bucketName = process.env.AWS_S3_BUCKET_NAME!;
    const key = `proposals/${proposalId}-${file.originalFilename}`; // Customize as needed

    // Upload the file to S3
    await uploadFileToS3(bucketName, key, fileBuffer, contentType);

    // Construct the file URL
    const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Optional: Clean up the temporary file
    await fs.promises.unlink(file.filepath);

    // Respond with success and file URL
    res.status(200).json({ message: 'File uploaded successfully', url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Internal Server Error', error: 'Failed to upload file' });
  }
}
