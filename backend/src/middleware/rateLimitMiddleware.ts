import { Request, Response, NextFunction } from 'express';
import { RateLimitService } from '../services/rateLimitService.js';
import { Pool } from 'pg';

// Store rate limit service instance
let rateLimitServiceInstance: RateLimitService | null = null;

export const initializeRateLimitMiddleware = (db: Pool): void => {
  rateLimitServiceInstance = new RateLimitService(db);
};

export const rateLimitMiddleware = (action: string, maxAttempts?: number, windowMs?: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!rateLimitServiceInstance) {
        console.error('Rate limit middleware not initialized');
        next();
        return;
      }

      // Get client identifier (IP address or user ID if authenticated)
      const identifier = getClientIdentifier(req);

      // Check rate limit
      const result = await rateLimitServiceInstance.checkRateLimit(
        identifier,
        action,
        maxAttempts,
        windowMs
      );

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxAttempts?.toString() || '100',
        'X-RateLimit-Remaining': result.remaining?.toString() || '0',
        'X-RateLimit-Reset': result.resetTime ? new Date(result.resetTime).toISOString() : ''
      });

      if (!result.allowed) {
        res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter: result.retryAfter ? Math.ceil(result.retryAfter / 1000) : undefined
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // Fail open - allow the request if rate limiting fails
      next();
    }
  };
};

// Helper function to get client identifier
function getClientIdentifier(req: Request): string {
  // Use user ID if authenticated, otherwise use IP address
  const user = (req as any).user;
  if (user && user.id) {
    return `user:${user.id}`;
  }

  // Get IP address from various possible headers
  const ip = req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    req.get('X-Forwarded-For') ||
    req.get('X-Real-IP') ||
    'unknown';

  return `ip:${ip}`;
}

// Specific rate limit configurations for common actions
export const createRateLimitMiddleware = {
  // Authentication endpoints
  login: () => rateLimitMiddleware('login', 10, 15 * 60 * 1000), // 10 attempts per 15 minutes
  register: () => rateLimitMiddleware('register', 5, 60 * 60 * 1000), // 5 attempts per hour
  passwordReset: () => rateLimitMiddleware('password_reset', 3, 60 * 60 * 1000), // 3 attempts per hour
  emailVerification: () => rateLimitMiddleware('email_verification', 5, 60 * 60 * 1000), // 5 attempts per hour

  // API endpoints
  apiGeneral: () => rateLimitMiddleware('api_general', 100, 60 * 1000), // 100 requests per minute
  apiSensitive: () => rateLimitMiddleware('api_sensitive', 20, 60 * 1000), // 20 requests per minute
  
  // Custom rate limits
  custom: (action: string, maxAttempts: number, windowMs: number) => 
    rateLimitMiddleware(action, maxAttempts, windowMs)
};