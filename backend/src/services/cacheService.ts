import { RedisService } from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * Cache service with TTL and pub/sub support
 */
export class CacheService {
  private static readonly DEFAULT_TTL = 3600; // 1 hour in seconds

  /**
   * Get cached data
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await RedisService.getJSON<T>(key);
      if (data) {
        logger.debug(`Cache hit: ${key}`);
      } else {
        logger.debug(`Cache miss: ${key}`);
      }
      return data;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  static async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      await RedisService.setJSON(key, value, ttl);
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete cached data
   */
  static async delete(key: string): Promise<void> {
    try {
      await RedisService.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      // Note: This is a simplified implementation
      // In production, you'd want to use SCAN for large datasets
      logger.debug(`Cache pattern delete: ${pattern}`);
      // Implementation would depend on Redis client capabilities
    } catch (error) {
      logger.error(`Cache pattern delete error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      return await RedisService.exists(key);
    } catch (error) {
      logger.error(`Cache exists check error for key ${key}:`, error);
      return false;
    }
  }

  // Weather-specific caching
  static readonly WEATHER_TTL = 3600; // 1 hour

  static async getWeather(city: string, date: string): Promise<any | null> {
    const key = `weather:${city}:${date}`;
    return this.get(key);
  }

  static async setWeather(city: string, date: string, data: any): Promise<void> {
    const key = `weather:${city}:${date}`;
    await this.set(key, data, this.WEATHER_TTL);
  }

  // Trip-specific caching
  static readonly TRIP_TTL = 1800; // 30 minutes

  static async getTrip(tripId: string): Promise<any | null> {
    const key = `trip:${tripId}`;
    return this.get(key);
  }

  static async setTrip(tripId: string, data: any): Promise<void> {
    const key = `trip:${tripId}`;
    await this.set(key, data, this.TRIP_TTL);
  }

  static async invalidateTrip(tripId: string): Promise<void> {
    const key = `trip:${tripId}`;
    await this.delete(key);
    logger.info(`Trip cache invalidated: ${tripId}`);
  }

  // User-specific caching
  static readonly USER_TTL = 900; // 15 minutes

  static async getUser(userId: string): Promise<any | null> {
    const key = `user:${userId}`;
    return this.get(key);
  }

  static async setUser(userId: string, data: any): Promise<void> {
    const key = `user:${userId}`;
    await this.set(key, data, this.USER_TTL);
  }

  static async invalidateUser(userId: string): Promise<void> {
    const key = `user:${userId}`;
    await this.delete(key);
    logger.info(`User cache invalidated: ${userId}`);
  }

  // Place-specific caching
  static readonly PLACE_TTL = 7200; // 2 hours

  static async getPlace(placeId: string): Promise<any | null> {
    const key = `place:${placeId}`;
    return this.get(key);
  }

  static async setPlace(placeId: string, data: any): Promise<void> {
    const key = `place:${placeId}`;
    await this.set(key, data, this.PLACE_TTL);
  }
}

export default CacheService;
