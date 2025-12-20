/**
 * Security utilities for input validation and sanitization
 */

/**
 * Sanitize a string to prevent injection attacks
 * Removes potentially dangerous characters and limits length
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes, control characters, and trim
  let sanitized = input
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate index name format (alphanumeric, hyphens, underscores only)
 * Prevents path traversal and injection attacks
 */
export function validateIndexName(indexName: string): boolean {
  if (!indexName || typeof indexName !== 'string') {
    return false;
  }
  
  // Allow alphanumeric, hyphens, underscores, and dots
  // Max length 100 characters
  const indexNameRegex = /^[a-zA-Z0-9._-]{1,100}$/;
  return indexNameRegex.test(indexName);
}

/**
 * Validate file name to prevent path traversal
 */
export function validateFileName(fileName: string): boolean {
  if (!fileName || typeof fileName !== 'string') {
    return false;
  }
  
  // Prevent path traversal and dangerous characters
  const dangerousPatterns = [
    /\.\./,           // Path traversal
    /[<>:"|?*]/,      // Windows forbidden chars
    /^\/|\\/,         // Absolute paths
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(fileName));
}

/**
 * Validate language code against allowlist
 */
export function validateLanguageCode(lang: string): boolean {
  const ALLOWED_LANGUAGES = ['es', 'hi', 'zh-Hans', 'ar', 'en'];
  return ALLOWED_LANGUAGES.includes(lang);
}

