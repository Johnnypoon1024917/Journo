import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client
export const redisClient = createClient({
  url: REDIS_URL,
});

// Handle Redis connection events
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redisClient.on('disconnect', () => {
  console.log('❌ Disconnected from Redis');
});

// Initialize Redis connection
export async function initializeRedis(): Promise<void> {
  try {
    await redisClient.connect();
    console.log('🔗 Redis client initialized');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    console.log('⚠️  Continuing without Redis caching');
  }
}

// Redis service class
export class RedisService {
  // Set a value with expiration
  static async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        console.warn('Redis client not connected, skipping cache set');
        return;
      }

      if (expirationSeconds) {
        await redisClient.setEx(key, expirationSeconds, value);
      } else {
        await redisClient.set(key, value);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  // Get a value
  static async get(key: string): Promise<string | null> {
    try {
      if (!redisClient.isOpen) {
        console.warn('Redis client not connected, skipping cache get');
        return null;
      }

      return await redisClient.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  // Delete a key
  static async del(key: string): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        console.warn('Redis client not connected, skipping cache delete');
        return;
      }

      await redisClient.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    try {
      if (!redisClient.isOpen) {
        return false;
      }

      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  // Set JSON value
  static async setJSON(key: string, value: any, expirationSeconds?: number): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      await this.set(key, jsonString, expirationSeconds);
    } catch (error) {
      console.error('Redis setJSON error:', error);
    }
  }

  // Get JSON value
  static async getJSON<T>(key: string): Promise<T | null> {
    try {
      const jsonString = await this.get(key);
      if (!jsonString) {
        return null;
      }
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Redis getJSON error:', error);
      return null;
    }
  }

  // Clear all cache
  static async flushAll(): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        console.warn('Redis client not connected, skipping flush');
        return;
      }

      await redisClient.flushAll();
    } catch (error) {
      console.error('Redis flushAll error:', error);
    }
  }
}