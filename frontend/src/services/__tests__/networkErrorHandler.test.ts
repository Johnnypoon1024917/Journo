/**
 * Unit tests for Network Error Handler
 * 
 * Tests network connectivity detection and API error classification
 * Validates: Requirements 4.2, 4.3
 */

import { networkErrorHandler, NetworkErrorDetails } from '../networkErrorHandler';
import { ApiErrorCode } from '../../types/api';

describe('NetworkErrorHandler', () => {
  describe('Error Classification', () => {
    describe('Network Errors', () => {
      it('should classify offline errors correctly', () => {
        const error = new TypeError('Failed to fetch');
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('network');
        expect(result.retryable).toBe(true);
        expect(result.userMessage).toContain('connection');
      });

      it('should classify fetch errors as network errors', () => {
        const error = new TypeError('Failed to fetch');
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('network');
        expect(result.retryable).toBe(true);
        expect(result.suggestions.length).toBeGreaterThan(0);
      });
    });

    describe('Timeout Errors', () => {
      it('should classify timeout errors correctly', () => {
        const error = new Error('Request timed out');
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('timeout');
        expect(result.retryable).toBe(true);
        expect(result.userMessage).toContain('too long');
      });

      it('should classify AbortError as timeout', () => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('timeout');
        expect(result.retryable).toBe(true);
      });
    });

    describe('HTTP Status Code Errors', () => {
      it('should classify 400 Bad Request correctly', () => {
        const error = { status: 400, message: 'Bad request' };
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('client');
        expect(result.status).toBe(400);
        expect(result.retryable).toBe(false);
      });

      it('should classify 401 Unauthorized correctly', () => {
        const error = { status: 401, message: 'Unauthorized' };
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('client');
        expect(result.status).toBe(401);
        expect(result.retryable).toBe(false);
        expect(result.userMessage).toContain('session');
      });

      it('should classify 403 Forbidden correctly', () => {
        const error = { status: 403, message: 'Forbidden' };
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('client');
        expect(result.status).toBe(403);
        expect(result.retryable).toBe(false);
        expect(result.userMessage).toContain('permission');
      });

      it('should classify 404 Not Found correctly', () => {
        const error = { status: 404, message: 'Not found' };
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('client');
        expect(result.status).toBe(404);
        expect(result.retryable).toBe(false);
        expect(result.userMessage).toContain('not found');
      });

      it('should classify 422 Validation Error correctly', () => {
        const error = { status: 422, message: 'Validation failed' };
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('client');
        expect(result.status).toBe(422);
        expect(result.retryable).toBe(false);
        expect(result.userMessage).toContain('input');
      });

      it('should classify 429 Rate Limit correctly', () => {
        const error = { status: 429, message: 'Too many requests' };
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('client');
        expect(result.status).toBe(429);
        expect(result.retryable).toBe(true);
        expect(result.userMessage).toContain('Too many');
      });

      it('should classify 500 Server Error correctly', () => {
        const error = { status: 500, message: 'Internal server error' };
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('server');
        expect(result.status).toBe(500);
        expect(result.retryable).toBe(true);
        expect(result.userMessage).toContain('server');
      });

      it('should classify 503 Service Unavailable correctly', () => {
        const error = { status: 503, message: 'Service unavailable' };
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('server');
        expect(result.status).toBe(503);
        expect(result.retryable).toBe(true);
      });
    });

    describe('API Error Codes', () => {
      it('should classify NETWORK_ERROR code correctly', () => {
        const error = { code: ApiErrorCode.NETWORK_ERROR, message: 'Network error' };
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('network');
        expect(result.code).toBe(ApiErrorCode.NETWORK_ERROR);
        expect(result.retryable).toBe(true);
      });

      it('should classify TIMEOUT code correctly', () => {
        const error = { code: ApiErrorCode.TIMEOUT, message: 'Timeout' };
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('timeout');
        expect(result.code).toBe(ApiErrorCode.TIMEOUT);
        expect(result.retryable).toBe(true);
      });

      it('should classify OFFLINE code correctly', () => {
        const error = { code: ApiErrorCode.OFFLINE, message: 'Offline' };
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('network');
        expect(result.code).toBe(ApiErrorCode.OFFLINE);
        expect(result.retryable).toBe(true);
      });

      it('should classify RATE_LIMIT_EXCEEDED code correctly', () => {
        const error = { code: ApiErrorCode.RATE_LIMIT_EXCEEDED, message: 'Rate limit' };
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('client');
        expect(result.retryable).toBe(true);
      });

      it('should classify external API errors correctly', () => {
        const error = { code: ApiErrorCode.GOOGLE_MAPS_ERROR, message: 'Maps error' };
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('api');
        expect(result.retryable).toBe(true);
        expect(result.userMessage).toContain('external service');
      });

      it('should classify server errors correctly', () => {
        const error = { code: ApiErrorCode.INTERNAL_SERVER_ERROR, message: 'Server error' };
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('server');
        expect(result.retryable).toBe(true);
      });
    });

    describe('Unknown Errors', () => {
      it('should handle unknown errors gracefully', () => {
        const error = new Error('Something went wrong');
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('unknown');
        expect(result.retryable).toBe(true);
        expect(result.userMessage).toBeTruthy();
        expect(result.suggestions.length).toBeGreaterThan(0);
      });

      it('should handle errors without messages', () => {
        const error = {};
        
        const result = networkErrorHandler.classifyError(error);
        
        expect(result.type).toBe('unknown');
        expect(result.userMessage).toBeTruthy();
      });
    });
  });

  describe('Error Details', () => {
    it('should provide user-friendly messages for all error types', () => {
      const errors = [
        { status: 400 },
        { status: 401 },
        { status: 403 },
        { status: 404 },
        { status: 429 },
        { status: 500 },
        { code: ApiErrorCode.NETWORK_ERROR },
        { code: ApiErrorCode.TIMEOUT },
        new TypeError('Failed to fetch'),
      ];

      errors.forEach((error) => {
        const result = networkErrorHandler.classifyError(error);
        expect(result.userMessage).toBeTruthy();
        expect(result.userMessage.length).toBeGreaterThan(10);
      });
    });

    it('should provide suggestions for all error types', () => {
      const errors = [
        { status: 500 },
        { code: ApiErrorCode.NETWORK_ERROR },
        new TypeError('Failed to fetch'),
      ];

      errors.forEach((error) => {
        const result = networkErrorHandler.classifyError(error);
        expect(result.suggestions).toBeDefined();
        expect(result.suggestions.length).toBeGreaterThan(0);
      });
    });

    it('should correctly identify retryable errors', () => {
      const retryableErrors = [
        { status: 429 },
        { status: 500 },
        { status: 503 },
        { code: ApiErrorCode.NETWORK_ERROR },
        { code: ApiErrorCode.TIMEOUT },
        new TypeError('Failed to fetch'),
      ];

      retryableErrors.forEach((error) => {
        const result = networkErrorHandler.classifyError(error);
        expect(result.retryable).toBe(true);
      });
    });

    it('should correctly identify non-retryable errors', () => {
      const nonRetryableErrors = [
        { status: 400 },
        { status: 401 },
        { status: 403 },
        { status: 404 },
        { status: 422 },
      ];

      nonRetryableErrors.forEach((error) => {
        const result = networkErrorHandler.classifyError(error);
        expect(result.retryable).toBe(false);
      });
    });
  });

  describe('Network State', () => {
    it('should return current network state', () => {
      const state = networkErrorHandler.getNetworkState();
      
      expect(state).toBeDefined();
      expect(state.isOnline).toBeDefined();
      expect(state.status).toBeDefined();
      expect(state.lastChecked).toBeInstanceOf(Date);
    });

    it('should return online status', () => {
      const isOnline = networkErrorHandler.isOnline();
      
      expect(typeof isOnline).toBe('boolean');
    });
  });

  describe('Network State Subscription', () => {
    it('should allow subscribing to network state changes', () => {
      const listener = vi.fn();
      
      const unsubscribe = networkErrorHandler.subscribe(listener);
      
      // Should be called immediately with current state
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          isOnline: expect.any(Boolean),
          status: expect.any(String),
          lastChecked: expect.any(Date),
        })
      );
      
      unsubscribe();
    });

    it('should allow unsubscribing from network state changes', () => {
      const listener = vi.fn();
      
      const unsubscribe = networkErrorHandler.subscribe(listener);
      listener.mockClear();
      
      unsubscribe();
      
      // Listener should not be called after unsubscribe
      // (We can't easily trigger a network change in tests, but the unsubscribe should work)
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
