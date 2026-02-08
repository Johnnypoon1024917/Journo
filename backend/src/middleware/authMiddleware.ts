import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

// Define our own user interface to avoid conflicts
export interface EnhancedUser {
  id: string; // UUID as string
  email: string;
  role: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
}

// Don't extend Request to avoid conflicts with existing auth middleware
export interface EnhancedAuthenticatedRequest {
  user: EnhancedUser;
}

export const createEnhancedAuthMiddleware = (db: Pool) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get token from Authorization header
      const authHeader = req.get('Authorization');
      const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Access token required'
        });
        return;
      }

      // Verify JWT token
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, jwtSecret) as any;

      // Get user from database
      // TEMPORARILY DISABLED: Email verification check (mail service not set up)
      // TODO: Re-enable email_verified = true condition when mail service is configured
      const query = `
        SELECT id, email, first_name, last_name, role, email_verified, last_login
        FROM users 
        WHERE id = $1
      `;
      const result = await db.query(query, [decoded.userId]);

      if (result.rows.length === 0) {
        res.status(401).json({
          success: false,
          message: 'Invalid token or user not found'
        });
        return;
      }

      const user = result.rows[0];

      // Attach user to request
      (req as any).user = {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.email_verified,
        firstName: user.first_name,
        lastName: user.last_name
      };

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      } else {
        console.error('Enhanced auth middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Authentication failed'
        });
      }
    }
  };
};

// Default middleware for backward compatibility - will be initialized with database
export const enhancedAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  res.status(500).json({
    success: false,
    message: 'Enhanced auth middleware not properly initialized'
  });
};