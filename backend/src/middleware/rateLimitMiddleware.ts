import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis.js';
import { Request, Response } from 'express';

/**
 * Create Redis store only if Redis is connected
 */
function createRedisStore(prefix: string) {
  try {
    if (redisClient.isOpen) {
      return new RedisStore({
        // @ts-expect-error - RedisStore types are not fully compatible
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
        prefix,
      });
    }
  } catch (error) {
    console.warn(`Redis store creation failed for ${prefix}, using memory store:`, error);
  }
  return undefined; // Will use default memory store
}

/**
 * Rate limiting middleware for post creation
 * Limits users to 5 posts per hour
 * Validates: Requirements 1.6
 */
export const postCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  
  // Use Redis store for distributed rate limiting (if available)
  store: createRedisStore('ratelimit:post:'),
  
  // Custom key generator - use user ID from authenticated request
  keyGenerator: (req: Request): string => {
    // User ID should be set by authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      // Fallback to IP if user is not authenticated (shouldn't happen for post creation)
      return req.ip || 'unknown';
    }
    return userId;
  },
  
  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'You can only create 5 posts per hour. Please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
  
  // Skip rate limiting for failed requests (only count successful post creations)
  skipFailedRequests: true,
  
  // Skip rate limiting for successful requests that don't create posts
  skipSuccessfulRequests: false,
});

/**
 * General API rate limiting middleware
 * More lenient limits for general API usage
 */
export const generalApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  
  // Use Redis store for distributed rate limiting (if available)
  store: createRedisStore('ratelimit:api:'),
  
  keyGenerator: (req: Request): string => {
    const userId = (req as any).user?.id;
    return userId || req.ip || 'unknown';
  },
  
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});
