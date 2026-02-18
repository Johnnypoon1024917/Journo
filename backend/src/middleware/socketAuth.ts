import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  rateLimitCount?: number;
  rateLimitResetTime?: number;
}

interface JWTPayload {
  userId: string;
  email: string;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a user
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    logger.warn(`Rate limit exceeded for user ${userId}`);
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Clean up expired rate limit entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [userId, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(userId);
    }
  }
}, RATE_LIMIT_WINDOW);

/**
 * Socket.IO authentication middleware
 * Verifies JWT token from handshake auth or query parameters
 * Includes rate limiting per user ID to prevent spam
 */
export const socketAuthMiddleware = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      // Allow connection but mark as unauthenticated (for public trip viewing)
      logger.debug('Socket connection without authentication token');
      return next();
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return next(new Error('Server configuration error'));
    }

    const decoded = jwt.verify(token as string, jwtSecret) as JWTPayload;
    
    // Check rate limit
    if (!checkRateLimit(decoded.userId)) {
      logger.warn(`Socket connection rate limited for user: ${decoded.email}`);
      return next(new Error('Rate limit exceeded. Please try again later.'));
    }

    // Attach user info to socket
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;

    logger.info(`Socket authenticated for user: ${decoded.email} (${decoded.userId})`);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token in socket connection:', error.message);
      // Disconnect socket on invalid token
      return next(new Error('Invalid authentication token'));
    }
    
    logger.error('Socket authentication error:', error);
    // Allow connection but don't attach user info for other errors
    next();
  }
};

/**
 * Middleware to check rate limit on socket events
 */
export function socketRateLimitMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
): void {
  if (!socket.userId) {
    // No rate limiting for unauthenticated sockets
    return next();
  }

  if (!checkRateLimit(socket.userId)) {
    logger.warn(`Socket event rate limited for user: ${socket.userEmail}`);
    return next(new Error('Rate limit exceeded'));
  }

  next();
}

export type { AuthenticatedSocket };
