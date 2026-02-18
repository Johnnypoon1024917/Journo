import path from 'path';
import logger from './logger.js';

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

/**
 * Maximum file size in bytes (2MB)
 */
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Allowed file extensions
 */
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Validate file type
 */
export function validateFileType(mimetype: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimetype.toLowerCase());
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

/**
 * Validate file extension
 */
export function validateFileExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components
  const basename = path.basename(filename);
  
  // Remove any non-alphanumeric characters except dots, hyphens, and underscores
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Ensure filename doesn't start with a dot (hidden files)
  if (sanitized.startsWith('.')) {
    return '_' + sanitized.substring(1);
  }
  
  return sanitized;
}

/**
 * Generate a unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const ext = path.extname(sanitized);
  const nameWithoutExt = path.basename(sanitized, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return `${nameWithoutExt}_${timestamp}_${random}${ext}`;
}

/**
 * Validate complete file upload
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

export function validateFile(
  filename: string,
  mimetype: string,
  size: number
): FileValidationResult {
  // Validate file type
  if (!validateFileType(mimetype)) {
    logger.warn(`Invalid file type attempted: ${mimetype}`);
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    };
  }

  // Validate file extension
  if (!validateFileExtension(filename)) {
    logger.warn(`Invalid file extension attempted: ${filename}`);
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  // Validate file size
  if (!validateFileSize(size)) {
    logger.warn(`File size exceeded: ${size} bytes`);
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Generate sanitized filename
  const sanitizedFilename = generateUniqueFilename(filename);

  return {
    valid: true,
    sanitizedFilename,
  };
}

/**
 * Validate image dimensions (optional, requires image processing library)
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

export function validateImageDimensions(
  dimensions: ImageDimensions,
  maxWidth: number = 4096,
  maxHeight: number = 4096
): boolean {
  return dimensions.width <= maxWidth && dimensions.height <= maxHeight;
}
