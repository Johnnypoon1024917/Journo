import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage configuration
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local'; // 'local' or 'minio'
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, '../../uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

// Ensure storage directory exists
if (STORAGE_TYPE === 'local') {
  if (!fs.existsSync(STORAGE_PATH)) {
    fs.mkdirSync(STORAGE_PATH, { recursive: true });
  }
  
  // Create subdirectories for different file types
  const subdirs = ['photos', 'covers', 'avatars', 'stickers'];
  subdirs.forEach(dir => {
    const dirPath = path.join(STORAGE_PATH, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

interface UploadOptions {
  bucket: 'photos' | 'covers' | 'avatars' | 'stickers';
  filename?: string;
  contentType?: string;
}

interface UploadResult {
  url: string;
  filename: string;
  size: number;
}

class StorageService {
  /**
   * Upload a file to storage
   */
  async upload(
    fileBuffer: Buffer,
    options: UploadOptions
  ): Promise<UploadResult> {
    // Validate file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
    }

    // Generate unique filename if not provided
    const filename = options.filename || this.generateFilename(options.contentType);
    
    if (STORAGE_TYPE === 'local') {
      return this.uploadLocal(fileBuffer, filename, options.bucket);
    } else if (STORAGE_TYPE === 'minio') {
      return this.uploadMinio(fileBuffer, filename, options);
    } else {
      throw new Error(`Unsupported storage type: ${STORAGE_TYPE}`);
    }
  }

  /**
   * Upload file to local filesystem
   */
  private async uploadLocal(
    fileBuffer: Buffer,
    filename: string,
    bucket: string
  ): Promise<UploadResult> {
    const filePath = path.join(STORAGE_PATH, bucket, filename);
    
    // Write file to disk
    await fs.promises.writeFile(filePath, fileBuffer);
    
    // Generate URL (relative to storage path)
    const url = `/uploads/${bucket}/${filename}`;
    
    return {
      url,
      filename,
      size: fileBuffer.length
    };
  }

  /**
   * Upload file to MinIO (S3-compatible storage)
   * Note: This requires minio package to be installed
   */
  private async uploadMinio(
    _fileBuffer: Buffer,
    _filename: string,
    _options: UploadOptions
  ): Promise<UploadResult> {
    // TODO: Implement MinIO upload when minio package is added
    // const minioClient = new Minio.Client({
    //   endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    //   port: parseInt(process.env.MINIO_PORT || '9000'),
    //   useSSL: process.env.MINIO_USE_SSL === 'true',
    //   accessKey: process.env.MINIO_ACCESS_KEY || '',
    //   secretKey: process.env.MINIO_SECRET_KEY || ''
    // });
    
    // await minioClient.putObject(
    //   options.bucket,
    //   filename,
    //   fileBuffer,
    //   fileBuffer.length,
    //   { 'Content-Type': options.contentType || 'application/octet-stream' }
    // );
    
    // const url = `${process.env.MINIO_PUBLIC_URL}/${options.bucket}/${filename}`;
    
    throw new Error('MinIO storage not yet implemented. Please use local storage or implement MinIO support.');
  }

  /**
   * Download a file from storage
   */
  async download(url: string): Promise<Buffer> {
    if (STORAGE_TYPE === 'local') {
      return this.downloadLocal(url);
    } else if (STORAGE_TYPE === 'minio') {
      return this.downloadMinio(url);
    } else {
      throw new Error(`Unsupported storage type: ${STORAGE_TYPE}`);
    }
  }

  /**
   * Download file from local filesystem
   */
  private async downloadLocal(url: string): Promise<Buffer> {
    // Remove /uploads prefix from URL
    const relativePath = url.replace(/^\/uploads\//, '');
    const filePath = path.join(STORAGE_PATH, relativePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    return await fs.promises.readFile(filePath);
  }

  /**
   * Download file from MinIO
   */
  private async downloadMinio(_url: string): Promise<Buffer> {
    // TODO: Implement MinIO download when minio package is added
    throw new Error('MinIO storage not yet implemented. Please use local storage or implement MinIO support.');
  }

  /**
   * Delete a file from storage
   */
  async delete(url: string): Promise<void> {
    if (STORAGE_TYPE === 'local') {
      return this.deleteLocal(url);
    } else if (STORAGE_TYPE === 'minio') {
      return this.deleteMinio(url);
    } else {
      throw new Error(`Unsupported storage type: ${STORAGE_TYPE}`);
    }
  }

  /**
   * Delete file from local filesystem
   */
  private async deleteLocal(url: string): Promise<void> {
    // Remove /uploads prefix from URL
    const relativePath = url.replace(/^\/uploads\//, '');
    const filePath = path.join(STORAGE_PATH, relativePath);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  /**
   * Delete file from MinIO
   */
  private async deleteMinio(_url: string): Promise<void> {
    // TODO: Implement MinIO delete when minio package is added
    throw new Error('MinIO storage not yet implemented. Please use local storage or implement MinIO support.');
  }

  /**
   * Generate a unique filename
   */
  private generateFilename(contentType?: string): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const extension = this.getExtensionFromContentType(contentType);
    
    return `${timestamp}-${randomBytes}${extension}`;
  }

  /**
   * Get file extension from content type
   */
  private getExtensionFromContentType(contentType?: string): string {
    if (!contentType) return '';
    
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'application/pdf': '.pdf'
    };
    
    return extensions[contentType] || '';
  }

  /**
   * Get file info
   */
  async getFileInfo(url: string): Promise<{ size: number; exists: boolean }> {
    if (STORAGE_TYPE === 'local') {
      const relativePath = url.replace(/^\/uploads\//, '');
      const filePath = path.join(STORAGE_PATH, relativePath);
      
      try {
        const stats = await fs.promises.stat(filePath);
        return {
          size: stats.size,
          exists: true
        };
      } catch (error) {
        return {
          size: 0,
          exists: false
        };
      }
    } else {
      throw new Error('getFileInfo not implemented for MinIO storage');
    }
  }
}

export const storageService = new StorageService();
export default storageService;
