// File validation utility
// This should match the validation in /api/upload-file.ts

export interface FileValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface FileValidationConfig {
  allowedTypes: string[];
  maxSizeInBytes: number;
}

// Default configuration matching the API
export const DEFAULT_FILE_CONFIG: FileValidationConfig = {
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  maxSizeInBytes: 5 * 1024 * 1024, // 5MB
};

/**
 * Validates a file against allowed types and size limits
 * This should be called before submitting any transaction
 */
export function validateFile(
  file: File | null, 
  config: FileValidationConfig = DEFAULT_FILE_CONFIG
): FileValidationResult {
  // If no file provided, that's okay (file upload is optional)
  if (!file) {
    return { isValid: true };
  }

  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      errorMessage: `Unsupported file type: ${file.type}\nAllowed types: ${config.allowedTypes.join(', ')}`
    };
  }

  // Check file size
  if (file.size > config.maxSizeInBytes) {
    const maxSizeMB = Math.round(config.maxSizeInBytes / (1024 * 1024));
    const fileSizeMB = Math.round(file.size / (1024 * 1024) * 100) / 100;
    return {
      isValid: false,
      errorMessage: `File size exceeds limit.\nFile size: ${fileSizeMB}MB\nMaximum allowed: ${maxSizeMB}MB`
    };
  }

  return { isValid: true };
}

/**
 * Get user-friendly file type description
 */
export function getFileTypeDescription(allowedTypes: string[]): string {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'JPEG images',
    'image/png': 'PNG images', 
    'application/pdf': 'PDF documents'
  };
  
  return allowedTypes
    .map(type => typeMap[type] || type)
    .join(', ');
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
