import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

export interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

/**
 * Middleware to handle express-validator validation results
 */
export const validationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: ValidationError) => ({
      field: 'field' in error ? String(error.field) : 'unknown',
      message: String(error.msg),
      value: 'value' in error ? error.value : undefined
    }));

    const response: ValidationErrorResponse = {
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    };

    res.status(400).json(response);
    return;
  }

  next();
};

/**
 * Custom validation helper functions
 */
export const customValidators = {
  /**
   * Validate password strength
   */
  isStrongPassword: (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  },

  /**
   * Validate email format (more strict than express-validator default)
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  },

  /**
   * Validate name (no numbers or special characters except hyphens and apostrophes)
   */
  isValidName: (name: string): boolean => {
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    return nameRegex.test(name) && name.trim().length > 0;
  },

  /**
   * Validate that string doesn't contain common SQL injection patterns
   */
  isSafeString: (str: string): boolean => {
    const dangerousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/|;|'|"|`)/,
      /(<script|<iframe|<object|<embed|javascript:|vbscript:|onload=|onerror=)/i
    ];

    return !dangerousPatterns.some(pattern => pattern.test(str));
  },

  /**
   * Validate UUID format
   */
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Validate phone number (international format)
   */
  isValidPhoneNumber: (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  },

  /**
   * Validate date string (ISO format)
   */
  isValidDateString: (dateStr: string): boolean => {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0];
  },

  /**
   * Validate that a number is within a specific range
   */
  isInRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },

  /**
   * Validate array length
   */
  isValidArrayLength: (arr: any[], min: number, max: number): boolean => {
    return Array.isArray(arr) && arr.length >= min && arr.length <= max;
  }
};

/**
 * Sanitization helper functions
 */
export const sanitizers = {
  /**
   * Sanitize string by removing dangerous characters
   */
  sanitizeString: (str: string): string => {
    return str
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[&]/g, '&amp;') // Escape ampersands
      .trim();
  },

  /**
   * Sanitize email by converting to lowercase and trimming
   */
  sanitizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },

  /**
   * Sanitize name by capitalizing first letter of each word
   */
  sanitizeName: (name: string): string => {
    return name
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  },

  /**
   * Sanitize phone number by removing non-digit characters except +
   */
  sanitizePhoneNumber: (phone: string): string => {
    return phone.replace(/[^\d+]/g, '');
  }
};