import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

/**
 * Camera Service
 * 
 * Provides camera functionality with permission handling for iOS.
 * Implements Requirements 1.2, 1.3, 10.3
 */

export interface CameraOptions {
  quality?: number; // 0-100
  allowEditing?: boolean;
  resultType?: CameraResultType;
  source?: CameraSource;
  width?: number;
  height?: number;
}

export interface CameraPermissionStatus {
  camera: 'prompt' | 'granted' | 'denied' | 'limited';
  photos: 'prompt' | 'granted' | 'denied' | 'limited';
}

class CameraService {
  /**
   * Check camera and photo library permissions
   */
  async checkPermissions(): Promise<CameraPermissionStatus> {
    try {
      const permissions = await Camera.checkPermissions();
      return {
        camera: permissions.camera as CameraPermissionStatus['camera'],
        photos: permissions.photos as CameraPermissionStatus['photos']
      };
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      throw error;
    }
  }

  /**
   * Request camera and photo library permissions
   */
  async requestPermissions(): Promise<CameraPermissionStatus> {
    try {
      const permissions = await Camera.requestPermissions();
      return {
        camera: permissions.camera as CameraPermissionStatus['camera'],
        photos: permissions.photos as CameraPermissionStatus['photos']
      };
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      throw error;
    }
  }

  /**
   * Take a photo with the camera
   * Automatically handles permission requests
   */
  async takePhoto(options: CameraOptions = {}): Promise<Photo> {
    try {
      // Check permissions first
      const permissions = await this.checkPermissions();
      
      // Request permissions if not granted
      if (permissions.camera !== 'granted') {
        const newPermissions = await this.requestPermissions();
        if (newPermissions.camera !== 'granted') {
          throw new Error('Camera permission denied');
        }
      }

      const photo = await Camera.getPhoto({
        quality: options.quality ?? 90,
        allowEditing: options.allowEditing ?? false,
        resultType: options.resultType ?? CameraResultType.Uri,
        source: options.source ?? CameraSource.Camera,
        width: options.width,
        height: options.height
      });

      return photo;
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }

  /**
   * Pick a photo from the photo library
   * Automatically handles permission requests
   */
  async pickPhoto(options: CameraOptions = {}): Promise<Photo> {
    try {
      // Check permissions first
      const permissions = await this.checkPermissions();
      
      // Request permissions if not granted
      if (permissions.photos !== 'granted') {
        const newPermissions = await this.requestPermissions();
        if (newPermissions.photos !== 'granted') {
          throw new Error('Photo library permission denied');
        }
      }

      const photo = await Camera.getPhoto({
        quality: options.quality ?? 90,
        allowEditing: options.allowEditing ?? false,
        resultType: options.resultType ?? CameraResultType.Uri,
        source: CameraSource.Photos,
        width: options.width,
        height: options.height
      });

      return photo;
    } catch (error) {
      console.error('Error picking photo:', error);
      throw error;
    }
  }

  /**
   * Prompt user to choose between camera or photo library
   * Automatically handles permission requests
   */
  async getPhoto(options: CameraOptions = {}): Promise<Photo> {
    try {
      // Check permissions first
      const permissions = await this.checkPermissions();
      
      // Request permissions if not granted
      if (permissions.camera !== 'granted' || permissions.photos !== 'granted') {
        const newPermissions = await this.requestPermissions();
        if (newPermissions.camera !== 'granted' && newPermissions.photos !== 'granted') {
          throw new Error('Camera and photo library permissions denied');
        }
      }

      const photo = await Camera.getPhoto({
        quality: options.quality ?? 90,
        allowEditing: options.allowEditing ?? false,
        resultType: options.resultType ?? CameraResultType.Uri,
        source: CameraSource.Prompt,
        width: options.width,
        height: options.height
      });

      return photo;
    } catch (error) {
      console.error('Error getting photo:', error);
      throw error;
    }
  }
}

export const cameraService = new CameraService();
