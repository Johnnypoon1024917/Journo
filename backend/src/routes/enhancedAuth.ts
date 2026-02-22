import express from 'express';
import { EnhancedAuthController } from '../controllers/enhancedAuthController.js';
import { createEnhancedAuthMiddleware } from '../middleware/authMiddleware.js';
import { generalApiRateLimit } from '../middleware/rateLimitMiddleware.js';
import { validationMiddleware } from '../middleware/validationMiddleware.js';
import { body } from 'express-validator';
import { Pool } from 'pg';

export function createEnhancedAuthRoutes(db: Pool): express.Router {
  const router = express.Router();
  const authController = new EnhancedAuthController(db);
  const enhancedAuthMiddleware = createEnhancedAuthMiddleware(db);

  // Validation rules
  const registerValidation = [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters')
  ];

  const loginValidation = [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    body('rememberMe')
      .optional()
      .isBoolean()
      .withMessage('Remember me must be a boolean')
  ];

  const passwordResetRequestValidation = [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address')
  ];

  const passwordResetValidation = [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ];

  const emailVerificationValidation = [
    body('token')
      .notEmpty()
      .withMessage('Verification token is required')
  ];

  const changePasswordValidation = [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ];

  // Public routes (no authentication required)
  
  /**
   * @route POST /api/auth/register
   * @desc Register a new user
   * @access Public
   */
  router.post('/register',
    generalApiRateLimit,
    registerValidation,
    validationMiddleware,
    authController.register
  );

  /**
   * @route POST /api/auth/login
   * @desc Login user
   * @access Public
   */
  router.post('/login',
    generalApiRateLimit,
    loginValidation,
    validationMiddleware,
    authController.login
  );

  /**
   * @route POST /api/auth/forgot-password
   * @desc Request password reset
   * @access Public
   */
  router.post('/forgot-password',
    generalApiRateLimit,
    passwordResetRequestValidation,
    validationMiddleware,
    authController.requestPasswordReset
  );

  /**
   * @route POST /api/auth/reset-password
   * @desc Reset password with token
   * @access Public
   */
  router.post('/reset-password',
    generalApiRateLimit,
    passwordResetValidation,
    validationMiddleware,
    authController.resetPassword
  );

  /**
   * @route POST /api/auth/verify-email
   * @desc Verify email address
   * @access Public
   */
  router.post('/verify-email',
    generalApiRateLimit,
    emailVerificationValidation,
    validationMiddleware,
    authController.verifyEmail
  );

  /**
   * @route POST /api/auth/resend-verification
   * @desc Resend email verification
   * @access Public
   */
  router.post('/resend-verification',
    generalApiRateLimit,
    passwordResetRequestValidation, // Same validation as password reset request
    validationMiddleware,
    authController.resendEmailVerification
  );

  /**
   * @route POST /api/auth/refresh
   * @desc Refresh access token
   * @access Public (but requires refresh token cookie)
   */
  router.post('/refresh',
    generalApiRateLimit,
    authController.refreshToken
  );

  /**
   * @route POST /api/auth/logout
   * @desc Logout user
   * @access Public
   */
  router.post('/logout',
    generalApiRateLimit,
    authController.logout
  );

  // Protected routes (authentication required)

  /**
   * @route GET /api/auth/me
   * @desc Get current user profile
   * @access Private
   */
  router.get('/me',
    enhancedAuthMiddleware,
    generalApiRateLimit,
    authController.getProfile
  );

  /**
   * @route POST /api/auth/change-password
   * @desc Change password (authenticated user)
   * @access Private
   */
  router.post('/change-password',
    enhancedAuthMiddleware,
    generalApiRateLimit,
    changePasswordValidation,
    validationMiddleware,
    authController.changePassword
  );

  /**
   * @route GET /api/auth/check-default-password
   * @desc Check if user is using default password
   * @access Private
   */
  router.get('/check-default-password',
    enhancedAuthMiddleware,
    generalApiRateLimit,
    authController.checkDefaultPassword
  );

  /**
   * @route GET /api/auth/security-events
   * @desc Get user's security events
   * @access Private
   */
  router.get('/security-events',
    enhancedAuthMiddleware,
    generalApiRateLimit,
    authController.getSecurityEvents
  );

  /**
   * @route PATCH /api/auth/language
   * @desc Update user language preference
   * @access Private
   */
  router.patch('/language',
    enhancedAuthMiddleware,
    generalApiRateLimit,
    authController.updateLanguage
  );

  return router;
}