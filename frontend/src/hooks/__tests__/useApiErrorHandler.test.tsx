/**
 * Unit tests for useApiErrorHandler hook
 * 
 * Tests API error handling with toast notifications
 * Validates: Requirements 4.2, 4.3
 */

import { renderHook, act } from '@testing-library/react';
import { useApiErrorHandler } from '../useApiErrorHandler';
import { useToast } from '../useToast';
import { networkErrorHandler } from '../../services/networkErrorHandler';
import { ApiErrorCode } from '../../types/api';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('../useToast');
vi.mock('../../services/networkErrorHandler');

describe('useApiErrorHandler', () => {
  let mockToast: {
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockToast = {
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
    };

    (useToast as any).mockReturnValue(mockToast);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleError', () => {
    it('should handle network errors with warning toast', () => {
      (networkErrorHandler.classifyError as jest.Mock).mockReturnValue({
        type: 'network',
        message: 'Network error',
        userMessage: 'No internet connection',
        retryable: true,
        suggestions: ['Check your connection'],
      });

      const { result } = renderHook(() => useApiErrorHandler());
      
      act(() => {
        result.current.handleError(new Error('Network error'));
      });

      expect(mockToast.warning).toHaveBeenCalledWith('No internet connection');
      expect(mockToast.error).not.toHaveBeenCalled();
    });

    it('should handle timeout errors with warning toast', () => {
      (networkErrorHandler.classifyError as jest.Mock).mockReturnValue({
        type: 'timeout',
        message: 'Timeout',
        userMessage: 'Request timed out',
        retryable: true,
        suggestions: ['Try again'],
      });

      const { result } = renderHook(() => useApiErrorHandler());
      
      act(() => {
        result.current.handleError(new Error('Timeout'));
      });

      expect(mockToast.warning).toHaveBeenCalledWith('Request timed out');
    });

    it('should handle server errors with error toast', () => {
      (networkErrorHandler.classifyError as jest.Mock).mockReturnValue({
        type: 'server',
        message: 'Server error',
        userMessage: 'Server is experiencing issues',
        retryable: true,
        suggestions: ['Try again later'],
      });

      const { result } = renderHook(() => useApiErrorHandler());
      
      act(() => {
        result.current.handleError({ status: 500 });
      });

      expect(mockToast.error).toHaveBeenCalledWith('Server is experiencing issues');
    });

    it('should handle retryable client errors with warning toast', () => {
      (networkErrorHandler.classifyError as jest.Mock).mockReturnValue({
        type: 'client',
        message: 'Rate limit',
        userMessage: 'Too many requests',
        retryable: true,
        suggestions: ['Wait a moment'],
      });

      const { result } = renderHook(() => useApiErrorHandler());
      
      act(() => {
        result.current.handleError({ status: 429 });
      });

      expect(mockToast.warning).toHaveBeenCalledWith('Too many requests');
    });

    it('should handle non-retryable client errors with info toast', () => {
      (networkErrorHandler.classifyError as jest.Mock).mockReturnValue({
        type: 'client',
        message: 'Not found',
        userMessage: 'Resource not found',
        retryable: false,
        suggestions: ['Check the URL'],
      });

      const { result } = renderHook(() => useApiErrorHandler());
      
      act(() => {
        result.current.handleError({ status: 404 });
      });

      expect(mockToast.info).toHaveBeenCalledWith('Resource not found');
    });

    it('should use custom message when provided', () => {
      (networkErrorHandler.classifyError as jest.Mock).mockReturnValue({
        type: 'network',
        message: 'Network error',
        userMessage: 'No internet connection',
        retryable: true,
        suggestions: [],
      });

      const { result } = renderHook(() => useApiErrorHandler());
      
      act(() => {
        result.current.handleError(new Error('Network error'), {
          customMessage: 'Custom error message',
        });
      });

      expect(mockToast.warning).toHaveBeenCalledWith('Custom error message');
    });

    it('should not show toast when showToast is false', () => {
      (networkErrorHandler.classifyError as jest.Mock).mockReturnValue({
        type: 'network',
        message: 'Network error',
        userMessage: 'No internet connection',
        retryable: true,
        suggestions: [],
      });

      const { result } = renderHook(() => useApiErrorHandler());
      
      act(() => {
        result.current.handleError(new Error('Network error'), {
          showToast: false,
        });
      });

      expect(mockToast.warning).not.toHaveBeenCalled();
      expect(mockToast.error).not.toHaveBeenCalled();
    });

    it('should call custom onError callback', () => {
      const mockOnError = vi.fn();
      const errorDetails = {
        type: 'network' as const,
        message: 'Network error',
        userMessage: 'No internet connection',
        retryable: true,
        suggestions: [],
      };

      (networkErrorHandler.classifyError as any).mockReturnValue(errorDetails);

      const { result } = renderHook(() => useApiErrorHandler());
      
      act(() => {
        result.current.handleError(new Error('Network error'), {
          onError: mockOnError,
        });
      });

      expect(mockOnError).toHaveBeenCalledWith(errorDetails);
    });

    it('should return error details', () => {
      const errorDetails = {
        type: 'network' as const,
        message: 'Network error',
        userMessage: 'No internet connection',
        retryable: true,
        suggestions: ['Check connection'],
      };

      (networkErrorHandler.classifyError as jest.Mock).mockReturnValue(errorDetails);

      const { result } = renderHook(() => useApiErrorHandler());
      
      let returnedDetails;
      act(() => {
        returnedDetails = result.current.handleError(new Error('Network error'));
      });

      expect(returnedDetails).toEqual(errorDetails);
    });
  });

  describe('withErrorHandling', () => {
    it('should wrap async function and handle errors', async () => {
      const mockError = new Error('Test error');
      const errorDetails = {
        type: 'network' as const,
        message: 'Network error',
        userMessage: 'No internet connection',
        retryable: true,
        suggestions: [],
      };

      (networkErrorHandler.classifyError as any).mockReturnValue(errorDetails);

      const { result } = renderHook(() => useApiErrorHandler());
      
      const failingFunction = vi.fn().mockRejectedValue(mockError);
      
      let wrappedResult;
      await act(async () => {
        const wrapped = result.current.withErrorHandling(failingFunction);
        wrappedResult = await wrapped();
      });

      expect(failingFunction).toHaveBeenCalled();
      expect(mockToast.warning).toHaveBeenCalled();
      expect(wrappedResult).toBeNull();
    });

    it('should return result on success', async () => {
      const { result } = renderHook(() => useApiErrorHandler());
      
      const successFunction = vi.fn().mockResolvedValue('success');
      
      let wrappedResult;
      await act(async () => {
        const wrapped = result.current.withErrorHandling(successFunction);
        wrappedResult = await wrapped();
      });

      expect(successFunction).toHaveBeenCalled();
      expect(mockToast.warning).not.toHaveBeenCalled();
      expect(wrappedResult).toBe('success');
    });

    it('should pass arguments to wrapped function', async () => {
      const { result } = renderHook(() => useApiErrorHandler());
      
      const testFunction = vi.fn().mockResolvedValue('result');
      
      await act(async () => {
        const wrapped = result.current.withErrorHandling(testFunction);
        await wrapped('arg1', 'arg2', 123);
      });

      expect(testFunction).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });
  });

  describe('isRetryable', () => {
    it('should return true for retryable errors', () => {
      (networkErrorHandler.classifyError as jest.Mock).mockReturnValue({
        type: 'network',
        retryable: true,
      });

      const { result } = renderHook(() => useApiErrorHandler());
      
      const isRetryable = result.current.isRetryable(new Error('Network error'));

      expect(isRetryable).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      (networkErrorHandler.classifyError as jest.Mock).mockReturnValue({
        type: 'client',
        retryable: false,
      });

      const { result } = renderHook(() => useApiErrorHandler());
      
      const isRetryable = result.current.isRetryable({ status: 404 });

      expect(isRetryable).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return user-friendly error message', () => {
      (networkErrorHandler.classifyError as jest.Mock).mockReturnValue({
        type: 'network',
        userMessage: 'No internet connection',
      });

      const { result } = renderHook(() => useApiErrorHandler());
      
      const message = result.current.getErrorMessage(new Error('Network error'));

      expect(message).toBe('No internet connection');
    });
  });

  describe('getErrorSuggestions', () => {
    it('should return error suggestions', () => {
      const suggestions = ['Check connection', 'Try again'];
      (networkErrorHandler.classifyError as jest.Mock).mockReturnValue({
        type: 'network',
        suggestions,
      });

      const { result } = renderHook(() => useApiErrorHandler());
      
      const returnedSuggestions = result.current.getErrorSuggestions(new Error('Network error'));

      expect(returnedSuggestions).toEqual(suggestions);
    });
  });
});
