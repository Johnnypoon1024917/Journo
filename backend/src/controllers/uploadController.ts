import { Request, Response } from 'express';
import { storageService } from '../services/storageService.js';

/**
 * Upload a photo
 */
export const uploadPhoto = async (req: Request, res: Response) => {
  try {
    // In a real implementation, you would use multer or similar middleware
    // to handle multipart/form-data uploads
    // For now, this is a placeholder showing the storage service API
    
    if (!req.body.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Convert base64 to buffer (example)
    const fileBuffer = Buffer.from(req.body.file, 'base64');
    const contentType = req.body.contentType || 'image/jpeg';

    const result = await storageService.upload(fileBuffer, {
      bucket: 'photos',
      contentType
    });

    res.status(201).json({
      message: 'Photo uploaded successfully',
      url: result.url,
      filename: result.filename,
      size: result.size
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload photo' });
  }
};

/**
 * Upload a cover image
 */
export const uploadCover = async (req: Request, res: Response) => {
  try {
    if (!req.body.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fileBuffer = Buffer.from(req.body.file, 'base64');
    const contentType = req.body.contentType || 'image/jpeg';

    const result = await storageService.upload(fileBuffer, {
      bucket: 'covers',
      contentType
    });

    res.status(201).json({
      message: 'Cover image uploaded successfully',
      url: result.url,
      filename: result.filename,
      size: result.size
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload cover image' });
  }
};

/**
 * Delete a file
 */
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    await storageService.delete(url);

    res.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete file' });
  }
};

/**
 * Get file info
 */
export const getFileInfo = async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'No URL provided' });
    }

    const info = await storageService.getFileInfo(url);

    res.json(info);
  } catch (error: any) {
    console.error('Get file info error:', error);
    res.status(500).json({ error: error.message || 'Failed to get file info' });
  }
};
