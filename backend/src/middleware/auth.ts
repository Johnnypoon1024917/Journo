import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/authService.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// Middleware to verify JWT token and session
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔐 Auth middleware - checking authentication');
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided or invalid format');
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token received:', token.substring(0, 20) + '...');

    // Verify token
    const payload = AuthService.verifyAccessToken(token);
    console.log('✅ Token verified, user:', payload.userId);

    // Attach user to request
    req.user = payload;
    
    console.log('✅ req.user set to:', req.user);
    console.log('✅ req.user.userId:', req.user?.userId);

    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user is admin
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

// Middleware to check if user is admin or moderator
export const requireModerator = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    res.status(403).json({ error: 'Moderator access required' });
    return;
  }

  next();
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = AuthService.verifyAccessToken(token);
      req.user = payload;
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  next();
};

// Alias for authenticate
export const authenticateToken = authenticate;

export default { authenticate, authenticateToken, requireAdmin, requireModerator, optionalAuth };
