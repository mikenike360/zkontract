// src/pages/api/upload-file.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { uploadFileToS3 } from '../../utils/s3';

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
 * Type guard to ensure fields contain the required proposalId
 */
interface FormFields {
  proposalId: string;
}

function isFormFields(obj: any): obj is FormFields {
  return (
    obj &&
    (
      typeof obj.proposalId === 'string' ||
      (Array.isArray(obj.proposalId) && typeof obj.proposalId[0] === 'string')
    )
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    // Method Not Allowed
    return res
      .status(405)
      .json({ message: 'Method Not Allowed', error: 'Only POST requests are allowed' });
  }

  const form = formidable({ multiples: false });

  try {
    // Parse the incoming form data
    const { fields, files } = await new Promise<{
      fields: formidable.Fields;
      files: formidable.Files;
    }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    // 🔍 Debugging: Log Received Fields and Files
    console.log('Received Fields:', fields);
    console.log('Received Files:', files);

    // Validate form fields (only proposalId is required for file upload)
    if (!isFormFields(fields)) {
      return res
        .status(400)
        .json({ message: 'Invalid form fields', error: 'proposalId is required and must be a string' });
    }

    // 🛠️ Extract Fields Correctly
    const proposalId = Array.isArray(fields.proposalId) ? fields.proposalId[0] : fields.proposalId;
    const fileField = files.file;

    // Handle both single file and array of files
    const file = Array.isArray(fileField) ? fileField[0] : fileField;

    if (!file) {
      return res
        .status(400)
        .json({ message: 'No file uploaded', error: 'Please attach a file to your proposal' });
    }

    // Optional: Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']; // Customize as needed
    if (file.mimetype && !allowedTypes.includes(file.mimetype)) {
      return res
        .status(400)
        .json({ message: 'Unsupported file type', error: `Allowed types: ${allowedTypes.join(', ')}` });
    }

    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      return res
        .status(400)
        .json({ message: 'File size exceeds limit', error: 'Maximum allowed size is 5MB' });
    }

    // Read the file buffer asynchronously
    const fileBuffer = await fs.promises.readFile(file.filepath);
    const contentType = file.mimetype || 'application/octet-stream';

    // Define S3 parameters
    const bucketName = 'zkontract'; 
    const key = `metadata/files/${proposalId}-${file.originalFilename}`; // Customize as needed
    const awsRegion = 'us-east-2';

    // Upload the file to S3
    await uploadFileToS3(bucketName, key, fileBuffer, contentType);

    // Construct the file URL
    const fileUrl = `https://${bucketName}.s3.${awsRegion}.amazonaws.com/${key}`;

    // Optional: Clean up the temporary file
    await fs.promises.unlink(file.filepath);

    // Respond with success and file URL
    res.status(200).json({ message: 'File uploaded successfully', url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Internal Server Error', error: 'Failed to upload file' });
  }
}
