/**
 * useFormHandler Hook Tests
 * 
 * Tests for the useFormHandler React hook covering:
 * - Form value management
 * - Real-time validation
 * - Form submission
 * - Error handling
 * - State management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFormHandler } from '../useFormHandler';
import { ValidationSchema } from '../../services/formHandler';
import * as apiModule from '../../services/api';

// Mock the API module
vi.mock('../../services/api', () => ({
  api: {
    request: vi.fn(),
  },
}));

describe('useFormHandler', () => {
  const mockApi = apiModule.api as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const { result } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { title: 'Test Trip' },
        })
      );

      expect(result.current.values.title).toBe('Test Trip');
      expect(result.current.errors).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.submitCount).toBe(0);
    });

    it('should initialize with empty values', () => {
      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const { result } = renderHook(() => useFormHandler(schema));

      expect(result.current.values).toEqual({});
      expect(result.current.errors).toEqual({});
    });
  });

  describe('Value Management', () => {
    it('should update single value', () => {
      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const { result } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { title: '' },
        })
      );

      act(() => {
        result.current.setValue('title', 'New Title');
      });

      expect(result.current.values.title).toBe('New Title');
    });

    it('should update all values', () => {
      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
          email: { required: true, type: 'email' },
        },
      };

      const { result } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { title: '', email: '' },
        })
      );

      act(() => {
        result.current.setValues({
          title: 'New Title',
          email: 'test@example.com',
        });
      });

      expect(result.current.values.title).toBe('New Title');
      expect(result.current.values.email).toBe('test@example.com');
    });

    it('should handle change events', () => {
      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const { result } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { title: '' },
        })
      );

      const event = {
        target: {
          name: 'title',
          value: 'New Title',
          type: 'text',
        },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleChange(event);
      });

      expect(result.current.values.title).toBe('New Title');
    });

    it('should handle checkbox change events', () => {
      const schema: ValidationSchema = {
        fields: {
          isPublic: { required: false },
        },
      };

      const { result } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { isPublic: false },
        })
      );

      const event = {
        target: {
          name: 'isPublic',
          type: 'checkbox',
          checked: true,
        },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleChange(event);
      });

      expect(result.current.values.isPublic).toBe(true);
    });

    it('should handle number input change events', () => {
      const schema: ValidationSchema = {
        fields: {
          budget: { type: 'number' },
        },
      };

      const { result } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { budget: 0 },
        })
      );

      const event = {
        target: {
          name: 'budget',
          value: '1000',
          type: 'number',
        },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleChange(event);
      });

      expect(result.current.values.budget).toBe(1000);
    });
  });

  describe('Validation', () => {
    it('should validate field on change', () => {
      const schema: ValidationSchema = {
        fields: {
          email: { required: true, type: 'email' },
        },
      };

      const { result } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { email: '' },
          validateOnChange: true,
        })
      );

      // Invalid email
      const event1 = {
        target: {
          name: 'email',
          value: 'invalid',
          type: 'text',
        },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleChange(event1);
      });

      expect(result.current.errors.email).toBeDefined();

      // Valid email
      const event2 = {
        target: {
          name: 'email',
          value: 'test@example.com',
          type: 'text',
        },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleChange(event2);
      });

      expect(result.current.errors.email).toBeUndefined();
    });

    it('should validate field on blur', () => {
      const schema: ValidationSchema = {
        fields: {
          email: { required: true, type: 'email' },
        },
      };

      const { result } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { email: 'invalid' },
          validateOnBlur: true,
        })
      );

      const event = {
        target: {
          name: 'email',
          value: 'invalid',
        },
      } as React.FocusEvent<HTMLInputElement>;

      act(() => {
        result.current.handleBlur(event);
      });

      expect(result.current.errors.email).toBeDefined();
    });

    it('should validate entire form', () => {
      const schema: ValidationSchema = {
        fields: {
          title: { required: true, minLength: 3 },
          email: { required: true, type: 'email' },
        },
      };

      const { result } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: {
            title: 'ab',
            email: 'invalid',
          },
        })
      );

      let isValid: boolean = false;

      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.title).toBeDefined();
      expect(result.current.errors.email).toBeDefined();
    });

    it('should clear field error', () => {
      const schema: ValidationSchema = {
        fields: {
          email: { required: true, type: 'email' },
        },
      };

      const { result } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { email: 'invalid' },
          validateOnChange: true,
        })
      );

      // Trigger validation
      const event = {
        target: {
          name: 'email',
          value: 'invalid',
          type: 'text',
        },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleChange(event);
      });

      expect(result.current.errors.email).toBeDefined();

      // Clear error
      act(() => {
        result.current.clearFieldError('email');
      });

      expect(result.current.errors.email).toBeUndefined();
    });

    it('should clear all errors', () => {
      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
          email: { required: true, type: 'email' },
        },
      };

      const { result } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { title: '', email: 'invalid' },
        })
      );

      // Trigger validation
      act(() => {
        result.current.validateForm();
      });

      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

      // Clear all errors
      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.errors).toEqual({});
    });
  });

  describe('Form Submission', () => {
    it('should submit form successfully', async () => {
      const mockResponse = { id: '123', title: 'Test Trip' };
      mockApi.request.mockResolvedValueOnce(mockResponse);

      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { title: 'Test Trip' },
          onSuccess,
        })
      );

      let submissionResult: any;

      await act(async () => {
        submissionResult = await result.current.handleSubmit('/api/trips', 'POST');
      });

      expect(submissionResult.success).toBe(true);
      expect(submissionResult.data).toEqual(mockResponse);
      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
      expect(mockApi.request).toHaveBeenCalledWith('/api/trips', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Trip' }),
      });
    });

    it('should handle submission error', async () => {
      const mockError = new Error('Submission failed');
      mockApi.request.mockRejectedValueOnce(mockError);

      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const onError = vi.fn();

      const { result } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { title: 'Test Trip' },
          onError,
        })
      );

      let submissionResult: any;

      await act(async () => {
        submissionResult = await result.current.handleSubmit('/api/trips', 'POST');
      });

      expect(submissionResult.success).toBe(false);
      expect(submissionResult.error).toBeDefined();
      expect(onError).toHaveBeenCalled();
    });

    it('should prevent submission with validation errors', async () => {
      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const { result } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { title: '' },
        })
      );

      let submissionResult: any;

      await act(async () => {
        submissionResult = await result.current.handleSubmit('/api/trips', 'POST');
      });

      expect(submissionResult.success).toBe(false);
      expect(submissionResult.error).toContain('fix the errors');
      expect(mockApi.request).not.toHaveBeenCalled();
    });

    it('should track submission state', async () => {
      let resolveSubmission: any;
      mockApi.request.mockImplementation(
        () => new Promise((resolve) => {
          resolveSubmission = () => resolve({ id: '123' });
        })
      );

      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const { result } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { title: 'Test Trip' },
        })
      );

      expect(result.current.isSubmitting).toBe(false);

      // Start submission
      let submissionPromise: Promise<any>;
      act(() => {
        submissionPromise = result.current.handleSubmit('/api/trips', 'POST');
      });

      // Should be submitting immediately after calling handleSubmit
      expect(result.current.submissionState.isSubmitting).toBe(true);

      // Resolve the submission
      act(() => {
        resolveSubmission();
      });

      await act(async () => {
        await submissionPromise;
      });

      // Should be done submitting
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should increment submit count', async () => {
      mockApi.request.mockResolvedValue({ id: '123' });

      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const { result, unmount } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { title: 'Test Trip' },
          preventDuplicateSubmissions: false, // Disable to allow rapid submissions
        })
      );

      expect(result.current.submitCount).toBe(0);

      await act(async () => {
        await result.current.handleSubmit('/api/trips', 'POST');
      });

      expect(result.current.submitCount).toBe(1);

      await act(async () => {
        await result.current.handleSubmit('/api/trips', 'POST');
      });

      expect(result.current.submitCount).toBe(2);
      
      unmount();
    });
  });

  describe('Reset', () => {
    it('should reset form to initial values', () => {
      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const { result, unmount } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { title: 'Initial' },
        })
      );

      // Change value
      act(() => {
        result.current.setValue('title', 'Changed');
      });

      expect(result.current.values.title).toBe('Changed');

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.values.title).toBe('Initial');
      expect(result.current.errors).toEqual({});
      expect(result.current.submitCount).toBe(0);
      
      unmount();
    });
  });

  describe('Integration', () => {
    it('should handle complete form flow', async () => {
      mockApi.request.mockResolvedValueOnce({ id: '123', title: 'My Trip' });

      const schema: ValidationSchema = {
        fields: {
          title: { required: true, minLength: 3 },
          email: { required: true, type: 'email' },
        },
      };

      const onSuccess = vi.fn();

      const { result, unmount } = renderHook(() =>
        useFormHandler(schema, {
          initialValues: { title: '', email: '' },
          validateOnChange: true,
          onSuccess,
        })
      );

      // Initial state
      expect(result.current.values).toEqual({ title: '', email: '' });
      expect(result.current.errors).toEqual({});

      // Enter invalid data
      act(() => {
        result.current.handleChange({
          target: { name: 'title', value: 'ab', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.errors.title).toBeDefined();

      // Fix title
      act(() => {
        result.current.handleChange({
          target: { name: 'title', value: 'My Trip', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.errors.title).toBeUndefined();

      // Enter valid email
      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'test@example.com', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Submit form
      await act(async () => {
        await result.current.handleSubmit('/api/trips', 'POST');
      });

      expect(onSuccess).toHaveBeenCalledWith({ id: '123', title: 'My Trip' });
      expect(result.current.submitCount).toBe(1);
      
      unmount();
    });
  });
});
