import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Socket.IO authentication middleware
 * Verifies JWT token from handshake auth or query parameters
 */
export const socketAuthMiddleware = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      // Allow connection but mark as unauthenticated (for public trip viewing)
      return next();
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return next(new Error('Server configuration error'));
    }

    const decoded = jwt.verify(token as string, jwtSecret) as JWTPayload;
    
    // Attach user info to socket
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;

    console.log(`Socket authenticated for user: ${decoded.email} (${decoded.userId})`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    // Allow connection but don't attach user info
    next();
  }
};

export type { AuthenticatedSocket };
