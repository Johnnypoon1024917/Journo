import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Pool } from 'pg';
import { EmailService } from './emailService';
import { AuditService } from './auditService';
import { RateLimitService } from './rateLimitService';

export interface User {
  id: string; // UUID as string
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  role: string; // User role (user, admin, moderator)
  email_verified: boolean;
  email_verification_token?: string;
  email_verification_expires?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  failed_login_attempts: number;
  account_locked_until?: Date;
  last_login?: Date;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  password_changed_at: Date;
  terms_accepted_at?: Date;
  privacy_accepted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface LoginResult {
  success: boolean;
  user?: Omit<User, 'password_hash' | 'two_factor_secret'>;
  accessToken?: string;
  refreshToken?: string;
  requiresTwoFactor?: boolean;
  message?: string;
  lockoutTime?: number;
}

export interface RegisterResult {
  success: boolean;
  user?: Omit<User, 'password_hash' | 'two_factor_secret'>;
  message?: string;
  verificationRequired?: boolean;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
}

export interface TokenValidationResult {
  valid: boolean;
  user?: Omit<User, 'password_hash' | 'two_factor_secret'>;
  message?: string;
}

export class EnhancedAuthService {
  private db: Pool;
  private emailService: EmailService;
  private auditService: AuditService;
  private rateLimitService: RateLimitService;
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private saltRounds: number = 12;
  private maxFailedAttempts: number = 5;
  private lockoutDuration: number = 15 * 60 * 1000; // 15 minutes
  private accessTokenExpiry: string = '15m';
  private refreshTokenExpiry: string = '30d';
  private passwordResetExpiry: number = 15 * 60 * 1000; // 15 minutes
  private emailVerificationExpiry: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    db: Pool,
    emailService: EmailService,
    auditService: AuditService,
    rateLimitService: RateLimitService
  ) {
    this.db = db;
    this.emailService = emailService;
    this.auditService = auditService;
    this.rateLimitService = rateLimitService;
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  }

  /**
   * Register a new user with email verification
   */
  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<RegisterResult> {
    try {
      // Check rate limiting
      const rateLimitCheck = await this.rateLimitService.checkRateLimit(
        ipAddress || 'unknown',
        'register',
        5, // max 5 attempts
        60 * 60 * 1000 // per hour
      );

      if (!rateLimitCheck.allowed) {
        await this.auditService.log({
          action: 'register_rate_limited',
          details: { email, rateLimitCheck },
          ipAddress,
          userAgent,
          success: false
        });
        return {
          success: false,
          message: `Too many registration attempts. Try again in ${Math.ceil(rateLimitCheck.resetTime! / 60000)} minutes.`
        };
      }

      // Validate email format
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          message: 'Invalid email format'
        };
      }

      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          message: passwordValidation.message
        };
      }

      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        await this.auditService.log({
          action: 'register_duplicate_email',
          details: { email },
          ipAddress,
          userAgent,
          success: false
        });
        return {
          success: false,
          message: 'An account with this email already exists'
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, this.saltRounds);

      // Generate email verification token
      // TEMPORARILY DISABLED: Email verification (mail service not set up)
      // TODO: Re-enable when mail service is configured
      const verificationToken = this.generateSecureToken();
      const verificationExpires = new Date(Date.now() + this.emailVerificationExpiry);

      // Create user with email_verified = true (temporarily, until mail service is set up)
      const query = `
        INSERT INTO users (
          email, password_hash, first_name, last_name,
          email_verified, email_verification_token, email_verification_expires,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, true, $5, $6, NOW(), NOW())
        RETURNING id, email, first_name, last_name, email_verified, created_at, updated_at
      `;

      const result = await this.db.query(query, [
        email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        verificationToken,
        verificationExpires
      ]);

      const user = result.rows[0];

      // Send verification email (don't fail registration if email fails in development)
      try {
        await this.emailService.sendEmailVerification(email, verificationToken, firstName);
      } catch (emailError) {
        console.warn('Email sending failed (continuing with registration):', emailError);
        // In development, we'll continue with registration even if email fails
        if (process.env.NODE_ENV === 'production') {
          throw emailError;
        }
      }

      // Log successful registration
      await this.auditService.log({
        userId: user.id,
        action: 'user_registered',
        details: { email, firstName, lastName },
        ipAddress,
        userAgent,
        success: true
      });

      return {
        success: true,
        user,
        message: 'Registration successful. Please check your email to verify your account.',
        verificationRequired: true
      };

    } catch (error) {
      console.error('Registration error:', error);
      await this.auditService.log({
        action: 'register_error',
        details: { email, error: (error as Error).message },
        ipAddress,
        userAgent,
        success: false,
        errorMessage: (error as Error).message
      });
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Login user with enhanced security
   */
  async login(
    email: string,
    password: string,
    rememberMe: boolean = false,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult> {
    console.log('🔐 Login attempt started:', { email, rememberMe, ipAddress });
    
    try {
      // Check rate limiting
      console.log('⏱️ Checking rate limit...');
      const rateLimitCheck = await this.rateLimitService.checkRateLimit(
        ipAddress || 'unknown',
        'login',
        10, // max 10 attempts
        15 * 60 * 1000 // per 15 minutes
      );

      console.log('✅ Rate limit check passed');

      if (!rateLimitCheck.allowed) {
        await this.auditService.log({
          action: 'login_rate_limited',
          details: { email, rateLimitCheck },
          ipAddress,
          userAgent,
          success: false
        });
        return {
          success: false,
          message: `Too many login attempts. Try again in ${Math.ceil(rateLimitCheck.resetTime! / 60000)} minutes.`
        };
      }

      // Get user
      console.log('👤 Looking up user by email...');
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        await this.auditService.log({
          action: 'login_user_not_found',
          details: { email },
          ipAddress,
          userAgent,
          success: false
        });
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      console.log('✅ User found:', { userId: user.id, email: user.email });

      // Check if account is locked
      if (user.account_locked_until && user.account_locked_until > new Date()) {
        const lockoutTime = user.account_locked_until.getTime() - Date.now();
        await this.auditService.log({
          userId: user.id,
          action: 'login_account_locked',
          details: { email, lockoutTime },
          ipAddress,
          userAgent,
          success: false
        });
        return {
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts',
          lockoutTime
        };
      }

      // Verify password
      console.log('🔒 Verifying password...');
      const passwordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!passwordValid) {
        // Increment failed attempts
        await this.incrementFailedLoginAttempts(user.id);
        
        await this.auditService.log({
          userId: user.id,
          action: 'login_invalid_password',
          details: { email, failedAttempts: user.failed_login_attempts + 1 },
          ipAddress,
          userAgent,
          success: false
        });
        
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      console.log('✅ Password verified');

      // Check if email is verified
      // TEMPORARILY DISABLED: Email verification check (mail service not set up)
      // TODO: Re-enable when mail service is configured
      /*
      if (!user.email_verified) {
        await this.auditService.log({
          userId: user.id,
          action: 'login_email_not_verified',
          details: { email },
          ipAddress,
          userAgent,
          success: false
        });
        return {
          success: false,
          message: 'Please verify your email address before logging in'
        };
      }
      */

      // Check if 2FA is required
      console.log('🔐 Checking 2FA status...');
      if (user.two_factor_enabled) {
        // For 2FA, we'll return a temporary token that requires 2FA verification
        const tempToken = this.generateSecureToken();
        // Store temp token in cache/database for 5 minutes
        // This is a simplified implementation - in production, use Redis or similar
        
        await this.auditService.log({
          userId: user.id,
          action: 'login_2fa_required',
          details: { email },
          ipAddress,
          userAgent,
          success: false
        });
        
        return {
          success: false,
          requiresTwoFactor: true,
          message: 'Two-factor authentication required'
        };
      }

      console.log('✅ 2FA not required, proceeding with login');

      // Reset failed attempts and update last login
      await this.resetFailedLoginAttempts(user.id);
      await this.updateLastLogin(user.id);

      // Generate tokens
      const tokenExpiry = rememberMe ? '30d' : this.accessTokenExpiry;
      const accessToken = this.generateAccessToken(user, tokenExpiry);
      const refreshToken = this.generateRefreshToken();

      console.log('🔑 Generated tokens:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        refreshTokenPreview: refreshToken.substring(0, 20) + '...',
        refreshTokenLength: refreshToken.length,
        userId: user.id,
        rememberMe
      });

      // Store refresh token
      try {
        await this.storeRefreshToken(
          user.id,
          refreshToken,
          rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 30 days or 7 days
          ipAddress,
          userAgent
        );
        console.log('✅ Refresh token stored in database');
      } catch (storeError) {
        console.error('❌ Failed to store refresh token:', storeError);
        throw storeError; // Re-throw to be caught by outer catch
      }

      // Remove sensitive data
      const { password_hash, two_factor_secret, ...safeUser } = user;

      await this.auditService.log({
        userId: user.id,
        action: 'login_successful',
        details: { email, rememberMe },
        ipAddress,
        userAgent,
        success: true
      });

      console.log('📤 Returning login result with refresh token');

      return {
        success: true,
        user: safeUser,
        accessToken,
        refreshToken,
        message: 'Login successful'
      };

    } catch (error) {
      console.error('❌ Login error in auth service:', error);
      console.error('Error stack:', (error as Error).stack);
      
      await this.auditService.log({
        action: 'login_error',
        details: { email, error: (error as Error).message },
        ipAddress,
        userAgent,
        success: false,
        errorMessage: (error as Error).message
      });
      
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<PasswordResetResult> {
    try {
      // Check rate limiting
      const rateLimitCheck = await this.rateLimitService.checkRateLimit(
        ipAddress || 'unknown',
        'password_reset',
        3, // max 3 attempts
        60 * 60 * 1000 // per hour
      );

      if (!rateLimitCheck.allowed) {
        await this.auditService.log({
          action: 'password_reset_rate_limited',
          details: { email, rateLimitCheck },
          ipAddress,
          userAgent,
          success: false
        });
        return {
          success: false,
          message: `Too many password reset attempts. Try again in ${Math.ceil(rateLimitCheck.resetTime! / 60000)} minutes.`
        };
      }

      const user = await this.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not
        await this.auditService.log({
          action: 'password_reset_user_not_found',
          details: { email },
          ipAddress,
          userAgent,
          success: false
        });
        return {
          success: true,
          message: 'If an account with this email exists, you will receive a password reset link.'
        };
      }

      // Generate reset token
      const resetToken = this.generateSecureToken();
      const resetExpires = new Date(Date.now() + this.passwordResetExpiry);

      // Store reset token
      const query = `
        UPDATE users 
        SET password_reset_token = $1, password_reset_expires = $2, updated_at = NOW()
        WHERE id = $3
      `;
      await this.db.query(query, [resetToken, resetExpires, user.id]);

      // Send reset email (don't fail if email fails in development)
      try {
        await this.emailService.sendPasswordReset(email, resetToken, user.first_name);
      } catch (emailError) {
        console.warn('Password reset email sending failed:', emailError);
        // In development, we'll continue even if email fails
        if (process.env.NODE_ENV === 'production') {
          throw emailError;
        }
      }

      await this.auditService.log({
        userId: user.id,
        action: 'password_reset_requested',
        details: { email },
        ipAddress,
        userAgent,
        success: true
      });

      return {
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link.'
      };

    } catch (error) {
      console.error('Password reset request error:', error);
      await this.auditService.log({
        action: 'password_reset_error',
        details: { email, error: (error as Error).message },
        ipAddress,
        userAgent,
        success: false,
        errorMessage: (error as Error).message
      });
      return {
        success: false,
        message: 'Password reset request failed. Please try again.'
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<PasswordResetResult> {
    try {
      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          message: passwordValidation.message
        };
      }

      // Find user by reset token
      const query = `
        SELECT * FROM users 
        WHERE password_reset_token = $1 
        AND password_reset_expires > NOW()
      `;
      const result = await this.db.query(query, [token]);
      
      if (result.rows.length === 0) {
        await this.auditService.log({
          action: 'password_reset_invalid_token',
          details: { token },
          ipAddress,
          userAgent,
          success: false
        });
        return {
          success: false,
          message: 'Invalid or expired reset token'
        };
      }

      const user = result.rows[0];

      // Check password history (prevent reuse of last 12 passwords)
      const isPasswordReused = await this.checkPasswordHistory(user.id, newPassword);
      if (isPasswordReused) {
        await this.auditService.log({
          userId: user.id,
          action: 'password_reset_reused_password',
          details: { email: user.email },
          ipAddress,
          userAgent,
          success: false
        });
        return {
          success: false,
          message: 'Cannot reuse a recent password. Please choose a different password.'
        };
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

      // Update password and clear reset token
      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, 
            password_reset_token = NULL, 
            password_reset_expires = NULL,
            failed_login_attempts = 0,
            account_locked_until = NULL,
            updated_at = NOW()
        WHERE id = $2
      `;
      await this.db.query(updateQuery, [passwordHash, user.id]);

      // Add to password history
      await this.addToPasswordHistory(user.id, passwordHash);

      // Invalidate all existing sessions
      await this.invalidateAllUserSessions(user.id);

      // Send confirmation email (don't fail if email fails in development)
      try {
        await this.emailService.sendPasswordChangeConfirmation(user.email, user.first_name);
      } catch (emailError) {
        console.warn('Password change confirmation email sending failed:', emailError);
        // In development, we'll continue even if email fails
        if (process.env.NODE_ENV === 'production') {
          throw emailError;
        }
      }

      await this.auditService.log({
        userId: user.id,
        action: 'password_reset_successful',
        details: { email: user.email },
        ipAddress,
        userAgent,
        success: true
      });

      return {
        success: true,
        message: 'Password reset successful. Please log in with your new password.'
      };

    } catch (error) {
      console.error('Password reset error:', error);
      await this.auditService.log({
        action: 'password_reset_error',
        details: { token, error: (error as Error).message },
        ipAddress,
        userAgent,
        success: false,
        errorMessage: (error as Error).message
      });
      return {
        success: false,
        message: 'Password reset failed. Please try again.'
      };
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(
    token: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const query = `
        SELECT * FROM users 
        WHERE email_verification_token = $1 
        AND email_verification_expires > NOW()
      `;
      const result = await this.db.query(query, [token]);
      
      if (result.rows.length === 0) {
        await this.auditService.log({
          action: 'email_verification_invalid_token',
          details: { token },
          ipAddress,
          userAgent,
          success: false
        });
        return {
          success: false,
          message: 'Invalid or expired verification token'
        };
      }

      const user = result.rows[0];

      // Update user as verified
      const updateQuery = `
        UPDATE users 
        SET email_verified = true, 
            email_verification_token = NULL, 
            email_verification_expires = NULL,
            updated_at = NOW()
        WHERE id = $1
      `;
      await this.db.query(updateQuery, [user.id]);

      await this.auditService.log({
        userId: user.id,
        action: 'email_verified',
        details: { email: user.email },
        ipAddress,
        userAgent,
        success: true
      });

      return {
        success: true,
        message: 'Email verified successfully. You can now log in.'
      };

    } catch (error) {
      console.error('Email verification error:', error);
      await this.auditService.log({
        action: 'email_verification_error',
        details: { token, error: (error as Error).message },
        ipAddress,
        userAgent,
        success: false,
        errorMessage: (error as Error).message
      });
      return {
        success: false,
        message: 'Email verification failed. Please try again.'
      };
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get user
      const user = await this.getUserById(userId);
      if (!user) {
        await this.auditService.log({
          userId,
          action: 'change_password_user_not_found',
          details: { userId },
          ipAddress,
          userAgent,
          success: false
        });
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        await this.auditService.log({
          userId,
          action: 'change_password_invalid_current',
          details: { email: user.email },
          ipAddress,
          userAgent,
          success: false
        });
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // Check if new password is same as current
      const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
      if (isSamePassword) {
        return {
          success: false,
          message: 'New password must be different from current password'
        };
      }

      // Check password history
      const isPasswordReused = await this.checkPasswordHistory(userId, newPassword);
      if (isPasswordReused) {
        await this.auditService.log({
          userId,
          action: 'change_password_reused',
          details: { email: user.email },
          ipAddress,
          userAgent,
          success: false
        });
        return {
          success: false,
          message: 'Cannot reuse a recent password. Please choose a different password.'
        };
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);

      // Update password
      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, password_changed_at = NOW(), updated_at = NOW()
        WHERE id = $2
      `;
      await this.db.query(updateQuery, [newPasswordHash, userId]);

      // Add old password to history
      await this.addToPasswordHistory(userId, user.password_hash);

      // Invalidate all user sessions except current one (optional - for security)
      // This forces re-login on all other devices
      const deleteSessionsQuery = `
        DELETE FROM user_sessions 
        WHERE user_id = $1
      `;
      await this.db.query(deleteSessionsQuery, [userId]);

      await this.auditService.log({
        userId,
        action: 'password_changed',
        details: { email: user.email },
        ipAddress,
        userAgent,
        success: true
      });

      return {
        success: true,
        message: 'Password changed successfully. Please log in again.'
      };

    } catch (error) {
      console.error('Change password error:', error);
      await this.auditService.log({
        userId,
        action: 'change_password_error',
        details: { error: (error as Error).message },
        ipAddress,
        userAgent,
        success: false,
        errorMessage: (error as Error).message
      });
      return {
        success: false,
        message: 'Password change failed. Please try again.'
      };
    }
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      const user = await this.getUserById(decoded.userId);
      
      // TEMPORARILY DISABLED: Email verification check (mail service not set up)
      // TODO: Re-enable when mail service is configured
      if (!user) {
        return {
          valid: false,
          message: 'Invalid token or user not found'
        };
      }

      const { password_hash, two_factor_secret, ...safeUser } = user;
      return {
        valid: true,
        user: safeUser
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Invalid or expired token'
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; accessToken?: string; refreshToken?: string; message?: string }> {
    try {
      // Find session with refresh token
      const query = `
        SELECT 
          us.id as session_id,
          us.user_id,
          us.refresh_token,
          us.expires_at,
          us.is_active,
          u.*
        FROM user_sessions us
        JOIN users u ON us.user_id = u.id
        WHERE us.refresh_token = $1 
        AND us.expires_at > NOW()
        AND us.is_active = true
      `;
      const result = await this.db.query(query, [refreshToken]);
      
      if (result.rows.length === 0) {
        await this.auditService.log({
          action: 'refresh_token_invalid',
          details: { refreshToken },
          ipAddress,
          userAgent,
          success: false
        });
        return {
          success: false,
          message: 'Invalid or expired refresh token'
        };
      }

      const session = result.rows[0];
      const user = session;

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken();

      // Update session with new refresh token
      const updateQuery = `
        UPDATE user_sessions 
        SET refresh_token = $1, last_used = NOW()
        WHERE id = $2
      `;
      await this.db.query(updateQuery, [newRefreshToken, session.session_id]);

      await this.auditService.log({
        userId: user.id,
        action: 'token_refreshed',
        details: { email: user.email },
        ipAddress,
        userAgent,
        success: true
      });

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };

    } catch (error) {
      console.error('Token refresh error:', error);
      await this.auditService.log({
        action: 'refresh_token_error',
        details: { error: (error as Error).message },
        ipAddress,
        userAgent,
        success: false,
        errorMessage: (error as Error).message
      });
      return {
        success: false,
        message: 'Token refresh failed'
      };
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find and deactivate session
      const query = `
        UPDATE user_sessions 
        SET is_active = false 
        WHERE refresh_token = $1
        RETURNING user_id
      `;
      const result = await this.db.query(query, [refreshToken]);
      
      if (result.rows.length > 0) {
        await this.auditService.log({
          userId: result.rows[0].user_id,
          action: 'user_logout',
          details: {},
          ipAddress,
          userAgent,
          success: true
        });
      }

      return {
        success: true,
        message: 'Logged out successfully'
      };

    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  }

  // Private helper methods
  private async getUserByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.db.query(query, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  private async getUserById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  private generateAccessToken(user: User, expiresIn: string = this.accessTokenExpiry): string {
    const payload = {
      userId: user.id,
      email: user.email,
      emailVerified: user.email_verified,
      role: user.role, // Include user role in JWT payload
      jti: crypto.randomUUID() // JWT ID for token tracking
    };
    return jwt.sign(payload, this.jwtSecret, { expiresIn } as jwt.SignOptions);
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
    expiresIn: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresIn);
    const query = `
      INSERT INTO user_sessions (user_id, refresh_token, expires_at, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await this.db.query(query, [userId, refreshToken, expiresAt, ipAddress, userAgent]);
  }

  private async incrementFailedLoginAttempts(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET failed_login_attempts = failed_login_attempts + 1,
          account_locked_until = CASE 
            WHEN failed_login_attempts + 1 >= $1 THEN NOW() + INTERVAL '${this.lockoutDuration} milliseconds'
            ELSE account_locked_until
          END,
          updated_at = NOW()
      WHERE id = $2
    `;
    await this.db.query(query, [this.maxFailedAttempts, userId]);
  }

  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET failed_login_attempts = 0, account_locked_until = NULL, updated_at = NOW()
      WHERE id = $1
    `;
    await this.db.query(query, [userId]);
  }

  private async updateLastLogin(userId: string): Promise<void> {
    const query = 'UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1';
    await this.db.query(query, [userId]);
  }

  private async checkPasswordHistory(userId: string, newPassword: string): Promise<boolean> {
    const query = `
      SELECT password_hash FROM password_history 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 12
    `;
    const result = await this.db.query(query, [userId]);
    
    for (const row of result.rows) {
      if (await bcrypt.compare(newPassword, row.password_hash)) {
        return true;
      }
    }
    return false;
  }

  private async addToPasswordHistory(userId: string, passwordHash: string): Promise<void> {
    const query = `
      INSERT INTO password_history (user_id, password_hash)
      VALUES ($1, $2)
    `;
    await this.db.query(query, [userId, passwordHash]);
  }

  private async invalidateAllUserSessions(userId: string): Promise<void> {
    const query = 'UPDATE user_sessions SET is_active = false WHERE user_id = $1';
    await this.db.query(query, [userId]);
  }

  /**
   * Check if user is using default password (first login)
   */
  async isUsingDefaultPassword(userId: string): Promise<boolean> {
    try {
      const query = `
        SELECT password_changed_at, created_at 
        FROM users 
        WHERE id = $1
      `;
      const result = await this.db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return false;
      }

      const user = result.rows[0];
      
      // If password_changed_at is null or equals created_at, user hasn't changed password
      if (!user.password_changed_at) {
        return true;
      }

      // Check if password_changed_at is within 1 second of created_at (default password)
      const createdAt = new Date(user.created_at).getTime();
      const passwordChangedAt = new Date(user.password_changed_at).getTime();
      const timeDiff = Math.abs(passwordChangedAt - createdAt);
      
      // If changed within 1 second of creation, it's likely the default password
      return timeDiff < 1000;
    } catch (error) {
      console.error('Error checking default password:', error);
      return false;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePasswordStrength(password: string): { valid: boolean; message: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/\d/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }
    return { valid: true, message: 'Password is strong' };
  }
}