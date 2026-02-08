import { Request, Response } from 'express';
import { EnhancedAuthService } from '../services/enhancedAuthService';
import { EmailService } from '../services/emailService';
import { AuditService } from '../services/auditService';
import { RateLimitService } from '../services/rateLimitService';
import { Pool } from 'pg';

export class EnhancedAuthController {
  private authService: EnhancedAuthService;
  private emailService: EmailService;
  private auditService: AuditService;
  private rateLimitService: RateLimitService;

  constructor(db: Pool) {
    this.emailService = new EmailService(db);
    this.auditService = new AuditService(db);
    this.rateLimitService = new RateLimitService(db);
    this.authService = new EnhancedAuthService(
      db,
      this.emailService,
      this.auditService,
      this.rateLimitService
    );
  }

  /**
   * Get cookie options for refresh token
   * Uses 'lax' sameSite in development for localhost, 'strict' in production
   */
  private getRefreshTokenCookieOptions(maxAge: number) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In development, don't set domain to allow cookies to work across localhost ports
    // The browser will default to the current domain (localhost:5000)
    // and allow it to be sent to localhost:3000 with credentials: 'include'
    const options: any = {
      httpOnly: true,
      secure: isProduction, // Only use secure in production (requires HTTPS)
      sameSite: (isProduction ? 'strict' : 'lax') as 'strict' | 'lax',
      maxAge,
      path: '/',
    };
    
    // Don't set domain in development - let browser handle it
    // Setting domain: 'localhost' might cause issues
    
    console.log('🍪 Cookie options:', options);
    
    return options;
  }

  /**
   * Register a new user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName } = req.body;
      const ipAddress = this.getClientIp(req);
      const userAgent = req.get('User-Agent');

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      const result = await this.authService.register(
        email,
        password,
        firstName,
        lastName,
        ipAddress,
        userAgent
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          user: result.user,
          verificationRequired: result.verificationRequired
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Login user
   */
  login = async (req: Request, res: Response): Promise<void> => {
    console.log('🎯 Enhanced Auth Controller - Login endpoint hit!');
    console.log('📨 Request body:', { email: req.body.email, hasPassword: !!req.body.password, rememberMe: req.body.rememberMe });
    
    try {
      const { email, password, rememberMe } = req.body;
      const ipAddress = this.getClientIp(req);
      const userAgent = req.get('User-Agent');

      // Validate required fields
      if (!email || !password) {
        console.log('❌ Missing email or password');
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      console.log('📞 Calling authService.login...');
      const result = await this.authService.login(
        email,
        password,
        rememberMe || false,
        ipAddress,
        userAgent
      );

      console.log('📥 Login result received:', { 
        success: result.success, 
        hasUser: !!result.user,
        hasAccessToken: !!result.accessToken,
        hasRefreshToken: !!result.refreshToken 
      });

      if (result.success) {
        // NO COOKIES - Return everything in response body
        // Frontend will store in memory only
        console.log('✅ Login successful, returning tokens in response body');
        
        res.json({
          success: true,
          message: result.message,
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken, // Return in body, not cookie
          expiresIn: '15m' // Let frontend know when to refresh
        });
      } else {
        const statusCode = result.requiresTwoFactor ? 202 : 401;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          requiresTwoFactor: result.requiresTwoFactor,
          lockoutTime: result.lockoutTime
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Request password reset
   */
  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      const ipAddress = this.getClientIp(req);
      const userAgent = req.get('User-Agent');

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required'
        });
        return;
      }

      const result = await this.authService.requestPasswordReset(
        email,
        ipAddress,
        userAgent
      );

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Reset password with token
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      const ipAddress = this.getClientIp(req);
      const userAgent = req.get('User-Agent');

      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Token and new password are required'
        });
        return;
      }

      const result = await this.authService.resetPassword(
        token,
        newPassword,
        ipAddress,
        userAgent
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Verify email address
   */
  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;
      const ipAddress = this.getClientIp(req);
      const userAgent = req.get('User-Agent');

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
        return;
      }

      const result = await this.authService.verifyEmail(
        token,
        ipAddress,
        userAgent
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Resend email verification
   */
  resendEmailVerification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      const ipAddress = this.getClientIp(req);
      const userAgent = req.get('User-Agent');

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required'
        });
        return;
      }

      // Check rate limiting
      const rateLimitCheck = await this.rateLimitService.checkRateLimit(
        ipAddress || 'unknown',
        'email_verification',
        3, // max 3 attempts
        60 * 60 * 1000 // per hour
      );

      if (!rateLimitCheck.allowed) {
        res.status(429).json({
          success: false,
          message: `Too many verification requests. Try again in ${Math.ceil(rateLimitCheck.resetTime! / 60000)} minutes.`
        });
        return;
      }

      // This would need to be implemented in the auth service
      // For now, return a generic success message
      res.json({
        success: true,
        message: 'If an unverified account with this email exists, a new verification email has been sent.'
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Refresh access token
   * Accepts refresh token in request body (not cookies)
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get refresh token from request body
      const { refreshToken } = req.body;
      const ipAddress = this.getClientIp(req);
      const userAgent = req.get('User-Agent');

      console.log('🔄 Refresh token request:', {
        hasRefreshToken: !!refreshToken,
        tokenPreview: refreshToken ? refreshToken.substring(0, 20) + '...' : 'none',
        ipAddress,
        userAgent: userAgent?.substring(0, 50)
      });

      if (!refreshToken) {
        console.warn('⚠️ No refresh token in request body');
        res.status(401).json({
          success: false,
          message: 'Refresh token not provided'
        });
        return;
      }

      const result = await this.authService.refreshToken(
        refreshToken,
        ipAddress,
        userAgent
      );

      if (result.success) {
        console.log('✅ Refresh successful, returning new tokens');
        
        res.json({
          success: true,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken, // Return new refresh token
          expiresIn: '15m'
        });
      } else {
        console.warn('⚠️ Refresh token validation failed:', result.message);
        res.status(401).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Logout user
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const ipAddress = this.getClientIp(req);
      const userAgent = req.get('User-Agent');

      if (refreshToken) {
        await this.authService.logout(refreshToken, ipAddress, userAgent);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get current user profile
   */
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // User should be attached to request by auth middleware
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Change password (authenticated user)
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = (req as any).user;
      const ipAddress = this.getClientIp(req);
      const userAgent = req.get('User-Agent');

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
        return;
      }

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const result = await this.authService.changePassword(
        user.id,
        currentPassword,
        newPassword,
        ipAddress,
        userAgent
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get user's security events
   */
  getSecurityEvents = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const events = await this.auditService.getSecurityEvents(user.id, limit);

      res.json({
        success: true,
        events
      });
    } catch (error) {
      console.error('Get security events error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Check if user is using default password
   */
  checkDefaultPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const isUsingDefault = await this.authService.isUsingDefaultPassword(user.id);

      res.json({
        success: true,
        isUsingDefaultPassword: isUsingDefault
      });
    } catch (error) {
      console.error('Check default password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Helper methods

  private getClientIp(req: Request): string {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any)?.socket?.remoteAddress ||
      req.get('X-Forwarded-For') ||
      req.get('X-Real-IP') ||
      'unknown'
    );
  }
}