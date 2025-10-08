// src/pages/api/upload-file.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { uploadFileToS3 } from '../../utils/s3';
import { validateId, checkRateLimit } from '@/utils/validation';
import { randomUUID } from 'crypto';

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

/**
 * Validates file magic numbers (file signatures) to prevent MIME type spoofing
 */
function validateFileSignature(buffer: Buffer, declaredMimeType: string): boolean {
  // Check first few bytes (magic numbers) of the file
  const signatures: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  };
  
  const expectedSignatures = signatures[declaredMimeType];
  if (!expectedSignatures) {
    return false; // Unknown type
  }
  
  // Check if buffer starts with any of the expected signatures
  return expectedSignatures.some(signature => {
    if (buffer.length < signature.length) return false;
    return signature.every((byte, index) => buffer[index] === byte);
  });
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
  
  // Rate limiting
  const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
  const rateLimit = checkRateLimit(`upload-file-${clientIp}`, 5, 60000); // 5 file uploads per minute
  if (!rateLimit.allowed) {
    return res.status(429).json({ message: 'Too many requests', error: 'Please try again later.' });
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

    // 🔍 Debugging: Log Received Fields and Files (dev only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Received Fields:', fields);
      console.log('Received Files:', files);
    }

    // Validate form fields (only proposalId is required for file upload)
    if (!isFormFields(fields)) {
      return res
        .status(400)
        .json({ message: 'Invalid form fields', error: 'proposalId is required and must be a string' });
    }

    // 🛠️ Extract Fields Correctly
    const proposalId = Array.isArray(fields.proposalId) ? fields.proposalId[0] : fields.proposalId;
    
    // Validate proposalId
    const proposalIdValidation = validateId(proposalId, 'proposalId');
    if (!proposalIdValidation.valid) {
      return res.status(400).json({ message: 'Invalid proposalId', error: proposalIdValidation.error || 'Invalid ID format' });
    }
    
    const fileField = files.file;

    // Handle both single file and array of files
    const file = Array.isArray(fileField) ? fileField[0] : fileField;

    if (!file) {
      return res
        .status(400)
        .json({ message: 'No file uploaded', error: 'Please attach a file to your proposal' });
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']; // Customize as needed
    if (!file.mimetype || !allowedTypes.includes(file.mimetype)) {
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
    
    // Validate file signature (magic numbers) to prevent MIME type spoofing
    if (!validateFileSignature(fileBuffer, file.mimetype)) {
      return res
        .status(400)
        .json({ message: 'File validation failed', error: 'File content does not match declared type' });
    }
    
    const contentType = file.mimetype;

    // Define S3 parameters
    const bucketName = 'zkontract';
    
    // Get file extension from original filename (for better UX)
    const fileExt = file.originalFilename?.split('.').pop() || 'bin';
    
    // Generate UUID-based filename to prevent XSS and path traversal attacks
    const safeFilename = `${randomUUID()}.${fileExt}`;
    const key = `metadata/files/${proposalIdValidation.value}-${safeFilename}`;
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
    res.status(500).json({ message: 'Internal Server Error', error: 'Failed to process file upload' });
  }
}
