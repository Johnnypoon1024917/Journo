import { apiRequest } from './api';
import { getAuthToken } from '../utils/auth';

interface UploadResponse {
  message: string;
  url: string;
  filename: string;
  size: number;
}

// Compress image before upload
const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

export const uploadService = {
  // Upload a photo (for places, story items, etc.)
  async uploadPhoto(file: File): Promise<UploadResponse> {
    try {
      const token = getAuthToken();
      // Compress image
      const base64 = await compressImage(file);

      const response = await apiRequest<UploadResponse>('/upload/photo', {
        method: 'POST',
        body: JSON.stringify({
          file: base64,
          contentType: 'image/jpeg',
        }),
        token: token || undefined,
      });

      return response;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  },

  // Upload a cover image (for trips)
  async uploadCover(file: File): Promise<UploadResponse> {
    try {
      const token = getAuthToken();
      // Compress image
      const base64 = await compressImage(file, 1920, 1080, 0.85);

      const response = await apiRequest<UploadResponse>('/upload/cover', {
        method: 'POST',
        body: JSON.stringify({
          file: base64,
          contentType: 'image/jpeg',
        }),
        token: token || undefined,
      });

      return response;
    } catch (error) {
      console.error('Error uploading cover:', error);
      throw error;
    }
  },

  // Delete a file
  async deleteFile(url: string): Promise<void> {
    try {
      const token = getAuthToken();
      await apiRequest<{ message: string }>('/upload/file', {
        method: 'DELETE',
        body: JSON.stringify({ url }),
        token: token || undefined,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  // Get file info
  async getFileInfo(url: string): Promise<any> {
    try {
      const token = getAuthToken();
      const response = await apiRequest<any>(`/upload/info?url=${encodeURIComponent(url)}`, {
        method: 'GET',
        token: token || undefined,
      });
      return response;
    } catch (error) {
      console.error('Error getting file info:', error);
      throw error;
    }
  },
};
