import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';

/**
 * Geolocation Service
 * 
 * Provides geolocation functionality with permission handling for iOS.
 * Implements Requirements 1.2, 1.3, 10.3
 */

export interface GeolocationPermissionStatus {
  location: 'prompt' | 'granted' | 'denied' | 'limited';
  coarseLocation: 'prompt' | 'granted' | 'denied' | 'limited';
}

export interface WatchPositionCallback {
  (position: Position | null, error?: any): void;
}

class GeolocationService {
  private watchIds: Map<string, string> = new Map();

  /**
   * Check location permissions
   */
  async checkPermissions(): Promise<GeolocationPermissionStatus> {
    try {
      const permissions = await Geolocation.checkPermissions();
      return {
        location: permissions.location as GeolocationPermissionStatus['location'],
        coarseLocation: permissions.coarseLocation as GeolocationPermissionStatus['coarseLocation']
      };
    } catch (error) {
      console.error('Error checking geolocation permissions:', error);
      throw error;
    }
  }

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<GeolocationPermissionStatus> {
    try {
      const permissions = await Geolocation.requestPermissions();
      return {
        location: permissions.location as GeolocationPermissionStatus['location'],
        coarseLocation: permissions.coarseLocation as GeolocationPermissionStatus['coarseLocation']
      };
    } catch (error) {
      console.error('Error requesting geolocation permissions:', error);
      throw error;
    }
  }

  /**
   * Get current position
   * Automatically handles permission requests
   */
  async getCurrentPosition(options?: PositionOptions): Promise<Position> {
    try {
      // Check permissions first
      const permissions = await this.checkPermissions();
      
      // Request permissions if not granted
      if (permissions.location !== 'granted') {
        const newPermissions = await this.requestPermissions();
        if (newPermissions.location !== 'granted') {
          throw new Error('Location permission denied');
        }
      }

      const position = await Geolocation.getCurrentPosition(options);
      return position;
    } catch (error) {
      console.error('Error getting current position:', error);
      throw error;
    }
  }

  /**
   * Watch position changes
   * Automatically handles permission requests
   * Returns a watch ID that can be used to clear the watch
   */
  async watchPosition(
    callback: WatchPositionCallback,
    options?: PositionOptions
  ): Promise<string> {
    try {
      // Check permissions first
      const permissions = await this.checkPermissions();
      
      // Request permissions if not granted
      if (permissions.location !== 'granted') {
        const newPermissions = await this.requestPermissions();
        if (newPermissions.location !== 'granted') {
          throw new Error('Location permission denied');
        }
      }

      const watchId = await Geolocation.watchPosition(options || {}, (position, error) => {
        callback(position, error);
      });

      // Store the watch ID
      const id = `watch_${Date.now()}`;
      this.watchIds.set(id, watchId);

      return id;
    } catch (error) {
      console.error('Error watching position:', error);
      throw error;
    }
  }

  /**
   * Clear a position watch
   */
  async clearWatch(id: string): Promise<void> {
    try {
      const watchId = this.watchIds.get(id);
      if (watchId) {
        await Geolocation.clearWatch({ id: watchId });
        this.watchIds.delete(id);
      }
    } catch (error) {
      console.error('Error clearing watch:', error);
      throw error;
    }
  }

  /**
   * Clear all position watches
   */
  async clearAllWatches(): Promise<void> {
    try {
      const promises = Array.from(this.watchIds.keys()).map(id => this.clearWatch(id));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error clearing all watches:', error);
      throw error;
    }
  }
}

export const geolocationService = new GeolocationService();
