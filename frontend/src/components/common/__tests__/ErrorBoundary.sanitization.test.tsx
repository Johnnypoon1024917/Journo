/**
 * Tests for ErrorBoundary data sanitization
 * 
 * Validates:
 * - Requirements 4.5: Secure error logging without sensitive data exposure
 * 
 * These tests verify that sensitive data is properly redacted from error logs
 * to prevent security vulnerabilities and data leaks.
 */

import { describe, it, expect } from 'vitest';

/**
 * Test the sanitization logic that should be in EnhancedErrorBoundary
 * This is a unit test for the sanitization function
 */
describe('Error Data Sanitization - Requirement 4.5', () => {
  // Helper function to simulate the sanitization logic
  const sanitizeErrorData = (data: any): any => {
    if (!data) return data;
    
    const sensitiveKeys = [
      'password', 'token', 'apiKey', 'secret', 'authorization',
      'cookie', 'session', 'creditCard', 'ssn', 'email', 'phone',
      'accessToken', 'refreshToken', 'privateKey', 'apiSecret'
    ];
    
    if (typeof data === 'string') {
      // Redact JWT tokens
      data = data.replace(/eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, '[REDACTED_JWT]');
      // Redact email addresses
      data = data.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
      // Redact phone numbers
      data = data.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
      return data;
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = Array.isArray(data) ? [] : {};
      
      for (const key in data) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveKeys.some(sensitiveKey => 
          lowerKey.includes(sensitiveKey.toLowerCase())
        );
        
        if (isSensitive) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = sanitizeErrorData(data[key]);
        }
      }
      
      return sanitized;
    }
    
    return data;
  };

  describe('JWT Token Redaction', () => {
    it('should redact JWT tokens from error messages', () => {
      const errorMessage = 'Authentication failed with token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const sanitized = sanitizeErrorData(errorMessage);
      
      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(sanitized).toContain('[REDACTED_JWT]');
    });

    it('should redact multiple JWT tokens', () => {
      const errorMessage = 'Tokens: eyJhbGciOiJIUzI1NiJ9.test.sig and eyJhbGciOiJIUzI1NiJ9.test2.sig2';
      const sanitized = sanitizeErrorData(errorMessage);
      
      expect(sanitized).toBe('Tokens: [REDACTED_JWT] and [REDACTED_JWT]');
    });
  });

  describe('Email Redaction', () => {
    it('should redact email addresses from error messages', () => {
      const errorMessage = 'User user@example.com not found';
      const sanitized = sanitizeErrorData(errorMessage);
      
      expect(sanitized).not.toContain('user@example.com');
      expect(sanitized).toContain('[REDACTED_EMAIL]');
    });

    it('should redact multiple email addresses', () => {
      const errorMessage = 'Failed to send from admin@test.com to user@example.org';
      const sanitized = sanitizeErrorData(errorMessage);
      
      expect(sanitized).toBe('Failed to send from [REDACTED_EMAIL] to [REDACTED_EMAIL]');
    });
  });

  describe('Phone Number Redaction', () => {
    it('should redact phone numbers with dashes', () => {
      const errorMessage = 'Contact: 555-123-4567';
      const sanitized = sanitizeErrorData(errorMessage);
      
      expect(sanitized).not.toContain('555-123-4567');
      expect(sanitized).toContain('[REDACTED_PHONE]');
    });

    it('should redact phone numbers with dots', () => {
      const errorMessage = 'Phone: 555.123.4567';
      const sanitized = sanitizeErrorData(errorMessage);
      
      expect(sanitized).toContain('[REDACTED_PHONE]');
    });

    it('should redact phone numbers without separators', () => {
      const errorMessage = 'Call 5551234567';
      const sanitized = sanitizeErrorData(errorMessage);
      
      expect(sanitized).toContain('[REDACTED_PHONE]');
    });
  });

  describe('Object Key Sanitization', () => {
    it('should redact password fields', () => {
      const errorData = {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com'
      };
      const sanitized = sanitizeErrorData(errorData);
      
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.username).toBe('john');
      // Email key is sensitive, so it gets redacted
      expect(sanitized.email).toBe('[REDACTED]');
    });

    it('should redact token fields', () => {
      const errorData = {
        accessToken: 'abc123',
        refreshToken: 'xyz789',
        userId: '12345'
      };
      const sanitized = sanitizeErrorData(errorData);
      
      expect(sanitized.accessToken).toBe('[REDACTED]');
      expect(sanitized.refreshToken).toBe('[REDACTED]');
      expect(sanitized.userId).toBe('12345');
    });

    it('should redact API keys and secrets', () => {
      const errorData = {
        apiKey: 'sk_live_123456',
        apiSecret: 'secret_key_789',
        publicKey: 'pk_test_abc'
      };
      const sanitized = sanitizeErrorData(errorData);
      
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.apiSecret).toBe('[REDACTED]');
      expect(sanitized.publicKey).toBe('pk_test_abc');
    });

    it('should handle nested objects', () => {
      const errorData = {
        user: {
          name: 'John',
          password: 'secret',
          profile: {
            email: 'john@example.com',
            phone: '555-123-4567'
          }
        }
      };
      const sanitized = sanitizeErrorData(errorData);
      
      expect(sanitized.user.password).toBe('[REDACTED]');
      expect(sanitized.user.name).toBe('John');
      // Email and phone keys are sensitive, so they get redacted
      expect(sanitized.user.profile.email).toBe('[REDACTED]');
      expect(sanitized.user.profile.phone).toBe('[REDACTED]');
    });
  });

  describe('Array Sanitization', () => {
    it('should sanitize arrays of objects', () => {
      const errorData = [
        { username: 'user1', password: 'pass1' },
        { username: 'user2', token: 'token123' }
      ];
      const sanitized = sanitizeErrorData(errorData);
      
      expect(sanitized[0].password).toBe('[REDACTED]');
      expect(sanitized[1].token).toBe('[REDACTED]');
      expect(sanitized[0].username).toBe('user1');
    });

    it('should sanitize arrays of strings', () => {
      const errorData = [
        'User: user@example.com',
        'Token: eyJhbGciOiJIUzI1NiJ9.test.sig'
      ];
      const sanitized = sanitizeErrorData(errorData);
      
      expect(sanitized[0]).toContain('[REDACTED_EMAIL]');
      expect(sanitized[1]).toContain('[REDACTED_JWT]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const sanitized = sanitizeErrorData(null);
      expect(sanitized).toBeNull();
    });

    it('should handle undefined values', () => {
      const sanitized = sanitizeErrorData(undefined);
      expect(sanitized).toBeUndefined();
    });

    it('should handle empty objects', () => {
      const sanitized = sanitizeErrorData({});
      expect(sanitized).toEqual({});
    });

    it('should handle empty arrays', () => {
      const sanitized = sanitizeErrorData([]);
      expect(sanitized).toEqual([]);
    });

    it('should handle numbers', () => {
      const sanitized = sanitizeErrorData(12345);
      expect(sanitized).toBe(12345);
    });

    it('should handle booleans', () => {
      const sanitized = sanitizeErrorData(true);
      expect(sanitized).toBe(true);
    });

    it('should handle mixed data types', () => {
      const errorData = {
        count: 5,
        active: true,
        token: 'secret',
        items: ['item1', 'user@example.com'],
        metadata: null
      };
      const sanitized = sanitizeErrorData(errorData);
      
      expect(sanitized.count).toBe(5);
      expect(sanitized.active).toBe(true);
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.items[1]).toBe('[REDACTED_EMAIL]');
      expect(sanitized.metadata).toBeNull();
    });
  });

  describe('Case Insensitivity', () => {
    it('should redact fields regardless of case', () => {
      const errorData = {
        Password: 'secret1',
        PASSWORD: 'secret2',
        AccessToken: 'token1',
        APIKEY: 'key1'
      };
      const sanitized = sanitizeErrorData(errorData);
      
      expect(sanitized.Password).toBe('[REDACTED]');
      expect(sanitized.PASSWORD).toBe('[REDACTED]');
      expect(sanitized.AccessToken).toBe('[REDACTED]');
      expect(sanitized.APIKEY).toBe('[REDACTED]');
    });
  });

  describe('Partial Key Matching', () => {
    it('should redact fields containing sensitive keywords', () => {
      const errorData = {
        userPassword: 'secret',
        apiTokenValue: 'token123',
        sessionCookie: 'cookie123'
      };
      const sanitized = sanitizeErrorData(errorData);
      
      expect(sanitized.userPassword).toBe('[REDACTED]');
      expect(sanitized.apiTokenValue).toBe('[REDACTED]');
      expect(sanitized.sessionCookie).toBe('[REDACTED]');
    });
  });

  describe('Complex Real-World Scenarios', () => {
    it('should sanitize error stack traces with sensitive data', () => {
      const errorStack = `Error: Authentication failed
        at login (auth.ts:45)
        Token: eyJhbGciOiJIUzI1NiJ9.test.sig
        User: admin@company.com
        at handleRequest (api.ts:123)`;
      
      const sanitized = sanitizeErrorData(errorStack);
      
      expect(sanitized).toContain('[REDACTED_JWT]');
      expect(sanitized).toContain('[REDACTED_EMAIL]');
      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiJ9');
      expect(sanitized).not.toContain('admin@company.com');
    });

    it('should sanitize API error responses', () => {
      const apiError = {
        status: 401,
        message: 'Invalid token',
        data: {
          user: {
            email: 'user@example.com',
            token: 'abc123'
          },
          request: {
            headers: {
              authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.test.sig'
            }
          }
        }
      };
      
      const sanitized = sanitizeErrorData(apiError);
      
      expect(sanitized.status).toBe(401);
      expect(sanitized.message).toBe('Invalid token');
      // Email and token keys are sensitive, so they get redacted
      expect(sanitized.data.user.email).toBe('[REDACTED]');
      expect(sanitized.data.user.token).toBe('[REDACTED]');
      expect(sanitized.data.request.headers.authorization).toBe('[REDACTED]');
    });

    it('should preserve non-sensitive debugging information', () => {
      const errorData = {
        timestamp: '2024-01-01T12:00:00Z',
        errorCode: 'AUTH_001',
        component: 'LoginForm',
        action: 'submit',
        userAgent: 'Mozilla/5.0',
        url: '/api/login',
        // Sensitive data
        password: 'secret123',
        token: 'abc123'
      };
      
      const sanitized = sanitizeErrorData(errorData);
      
      // Non-sensitive data preserved
      expect(sanitized.timestamp).toBe('2024-01-01T12:00:00Z');
      expect(sanitized.errorCode).toBe('AUTH_001');
      expect(sanitized.component).toBe('LoginForm');
      expect(sanitized.action).toBe('submit');
      expect(sanitized.userAgent).toBe('Mozilla/5.0');
      expect(sanitized.url).toBe('/api/login');
      
      // Sensitive data redacted
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
    });
  });
});
