// Input validation utilities for API routes

/**
 * Validates that a value is a positive integer
 */
export function isValidPositiveInteger(value: any): boolean {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

/**
 * Validates that a value is a non-negative integer
 */
export function isValidNonNegativeInteger(value: any): boolean {
  const num = Number(value);
  return Number.isInteger(num) && num >= 0;
}

/**
 * Sanitizes S3 key to prevent path traversal attacks
 */
export function sanitizeS3Key(key: string): string | null {
  // Remove any path traversal attempts
  if (key.includes('..') || key.startsWith('/') || key.includes('\\')) {
    return null;
  }
  
  // Only allow alphanumeric, hyphens, underscores, periods, and forward slashes
  if (!/^[a-zA-Z0-9\-_.\/]+$/.test(key)) {
    return null;
  }
  
  return key;
}

/**
 * Validates an Aleo address format
 */
export function isValidAleoAddress(address: string): boolean {
  // Aleo addresses start with "aleo1" and are 63 characters long
  return typeof address === 'string' && 
         address.startsWith('aleo1') && 
         address.length === 63 &&
         /^aleo1[a-z0-9]{59}$/.test(address);
}

/**
 * Validates proposal status values
 */
export function isValidProposalStatus(status: string): boolean {
  const validStatuses = ['initial', 'accepted', 'denied', 'pending', 'completed'];
  return typeof status === 'string' && validStatuses.includes(status.toLowerCase().trim());
}

/**
 * Validates boolean values
 */
export function isValidBoolean(value: any): boolean {
  return typeof value === 'boolean';
}

/**
 * Sanitizes and validates a bounty/proposal ID
 */
export function validateId(id: any, name: string = 'ID'): { valid: boolean; value?: number; error?: string } {
  if (id === undefined || id === null) {
    return { valid: false, error: `${name} is required` };
  }
  
  const numericId = Number(id);
  
  if (!Number.isInteger(numericId)) {
    return { valid: false, error: `${name} must be an integer` };
  }
  
  if (numericId < 0) {
    return { valid: false, error: `${name} must be non-negative` };
  }
  
  // Reasonable upper bound to prevent overflow attacks
  if (numericId > Number.MAX_SAFE_INTEGER) {
    return { valid: false, error: `${name} is too large` };
  }
  
  return { valid: true, value: numericId };
}

/**
 * Rate limit helper - simple in-memory rate limiting
 * For production, use Redis or Upstash
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requestCounts.get(identifier);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

/**
 * Clean up old rate limit records periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 300000); // Clean up every 5 minutes

