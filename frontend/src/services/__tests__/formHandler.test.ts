/**
 * FormHandler Service Tests
 * 
 * Unit tests for the FormHandler service covering:
 * - Field validation
 * - Form validation
 * - Real-time validation
 * - Submission handling
 * - Error handling
 * - State management
 * - Duplicate submission prevention
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  FormHandler,
  ValidationSchema,
  CustomValidators,
  ValidationPatterns,
} from '../formHandler';

describe('FormHandler', () => {
  describe('Field Validation', () => {
    it('should validate required fields', () => {
      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const formHandler = new FormHandler(schema);
      
      // Empty value
      const error1 = formHandler.validateField('title', '');
      expect(error1).not.toBeNull();
      expect(error1?.message).toContain('required');

      // Null value
      const error2 = formHandler.validateField('title', null);
      expect(error2).not.toBeNull();

      // Undefined value
      const error3 = formHandler.validateField('title', undefined);
      expect(error3).not.toBeNull();

      // Valid value
      const error4 = formHandler.validateField('title', 'My Trip');
      expect(error4).toBeNull();
    });

    it('should validate email type', () => {
      const schema: ValidationSchema = {
        fields: {
          email: { type: 'email', required: true },
        },
      };

      const formHandler = new FormHandler(schema);

      // Invalid emails
      expect(formHandler.validateField('email', 'invalid')).not.toBeNull();
      expect(formHandler.validateField('email', 'test@')).not.toBeNull();
      expect(formHandler.validateField('email', '@example.com')).not.toBeNull();

      // Valid emails
      expect(formHandler.validateField('email', 'test@example.com')).toBeNull();
      expect(formHandler.validateField('email', 'user.name+tag@example.co.uk')).toBeNull();
    });

    it('should validate number type', () => {
      const schema: ValidationSchema = {
        fields: {
          age: { type: 'number' },
        },
      };

      const formHandler = new FormHandler(schema);

      // Invalid numbers
      expect(formHandler.validateField('age', 'abc')).not.toBeNull();
      expect(formHandler.validateField('age', 'NaN')).not.toBeNull();

      // Valid numbers
      expect(formHandler.validateField('age', 25)).toBeNull();
      expect(formHandler.validateField('age', '25')).toBeNull();
      expect(formHandler.validateField('age', 0)).toBeNull();
    });

    it('should validate URL type', () => {
      const schema: ValidationSchema = {
        fields: {
          website: { type: 'url' },
        },
      };

      const formHandler = new FormHandler(schema);

      // Invalid URLs
      expect(formHandler.validateField('website', 'not-a-url')).not.toBeNull();
      expect(formHandler.validateField('website', 'example.com')).not.toBeNull();

      // Valid URLs
      expect(formHandler.validateField('website', 'https://example.com')).toBeNull();
      expect(formHandler.validateField('website', 'http://example.com/path')).toBeNull();
    });

    it('should validate date type', () => {
      const schema: ValidationSchema = {
        fields: {
          birthDate: { type: 'date' },
        },
      };

      const formHandler = new FormHandler(schema);

      // Invalid dates
      expect(formHandler.validateField('birthDate', 'not-a-date')).not.toBeNull();
      expect(formHandler.validateField('birthDate', '2024-13-01')).not.toBeNull();

      // Valid dates
      expect(formHandler.validateField('birthDate', '2024-01-15')).toBeNull();
      expect(formHandler.validateField('birthDate', new Date().toISOString())).toBeNull();
    });

    it('should validate string length', () => {
      const schema: ValidationSchema = {
        fields: {
          title: {
            minLength: 3,
            maxLength: 10,
          },
        },
      };

      const formHandler = new FormHandler(schema);

      // Too short
      const error1 = formHandler.validateField('title', 'ab');
      expect(error1).not.toBeNull();
      expect(error1?.message).toContain('at least 3');

      // Too long
      const error2 = formHandler.validateField('title', 'this is too long');
      expect(error2).not.toBeNull();
      expect(error2?.message).toContain('at most 10');

      // Valid length
      expect(formHandler.validateField('title', 'valid')).toBeNull();
    });

    it('should validate numeric range', () => {
      const schema: ValidationSchema = {
        fields: {
          age: {
            type: 'number',
            min: 18,
            max: 100,
          },
        },
      };

      const formHandler = new FormHandler(schema);

      // Too small
      const error1 = formHandler.validateField('age', 17);
      expect(error1).not.toBeNull();
      expect(error1?.message).toContain('at least 18');

      // Too large
      const error2 = formHandler.validateField('age', 101);
      expect(error2).not.toBeNull();
      expect(error2?.message).toContain('at most 100');

      // Valid range
      expect(formHandler.validateField('age', 25)).toBeNull();
      expect(formHandler.validateField('age', 18)).toBeNull();
      expect(formHandler.validateField('age', 100)).toBeNull();
    });

    it('should validate with regex pattern', () => {
      const schema: ValidationSchema = {
        fields: {
          zipCode: {
            pattern: /^\d{5}$/,
          },
        },
      };

      const formHandler = new FormHandler(schema);

      // Invalid patterns
      expect(formHandler.validateField('zipCode', '1234')).not.toBeNull();
      expect(formHandler.validateField('zipCode', '123456')).not.toBeNull();
      expect(formHandler.validateField('zipCode', 'abcde')).not.toBeNull();

      // Valid pattern
      expect(formHandler.validateField('zipCode', '12345')).toBeNull();
    });

    it('should use custom validator', () => {
      const schema: ValidationSchema = {
        fields: {
          password: {
            required: true,
            customValidator: (value) => {
              if (!/[A-Z]/.test(value)) {
                return {
                  field: 'password',
                  message: 'Password must contain uppercase letter',
                };
              }
              return null;
            },
          },
        },
      };

      const formHandler = new FormHandler(schema);

      // Invalid password
      const error = formHandler.validateField('password', 'lowercase');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('uppercase');

      // Valid password
      expect(formHandler.validateField('password', 'Password123')).toBeNull();
    });

    it('should skip validation for empty optional fields', () => {
      const schema: ValidationSchema = {
        fields: {
          website: {
            type: 'url',
            required: false,
          },
        },
      };

      const formHandler = new FormHandler(schema);

      // Empty optional field should pass
      expect(formHandler.validateField('website', '')).toBeNull();
      expect(formHandler.validateField('website', null)).toBeNull();
      expect(formHandler.validateField('website', undefined)).toBeNull();
    });
  });

  describe('Form Validation', () => {
    it('should validate entire form', () => {
      const schema: ValidationSchema = {
        fields: {
          title: { required: true, minLength: 3 },
          email: { required: true, type: 'email' },
          age: { type: 'number', min: 18 },
        },
      };

      const formHandler = new FormHandler(schema);

      // Invalid form
      const result1 = formHandler.validateForm({
        title: 'ab',
        email: 'invalid',
        age: 15,
      });

      expect(result1.isValid).toBe(false);
      expect(result1.errors.title).toBeDefined();
      expect(result1.errors.email).toBeDefined();
      expect(result1.errors.age).toBeDefined();
      expect(result1.fieldErrors).toHaveLength(3);

      // Valid form
      const result2 = formHandler.validateForm({
        title: 'My Trip',
        email: 'user@example.com',
        age: 25,
      });

      expect(result2.isValid).toBe(true);
      expect(result2.errors).toEqual({});
      expect(result2.fieldErrors).toHaveLength(0);
    });

    it('should run custom form validators', () => {
      const schema: ValidationSchema = {
        fields: {
          start_date: { required: true, type: 'date' },
          end_date: { required: true, type: 'date' },
        },
        customValidators: [
          (formData) => {
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            if (start > end) {
              return {
                field: 'end_date',
                message: 'End date must be after start date',
              };
            }
            return null;
          },
        ],
      };

      const formHandler = new FormHandler(schema);

      // Invalid date range
      const result1 = formHandler.validateForm({
        start_date: '2024-12-31',
        end_date: '2024-01-01',
      });

      expect(result1.isValid).toBe(false);
      expect(result1.errors.end_date).toContain('after start date');

      // Valid date range
      const result2 = formHandler.validateForm({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      });

      expect(result2.isValid).toBe(true);
    });

    it('should update submission state after validation', () => {
      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const formHandler = new FormHandler(schema);

      // Invalid form
      formHandler.validateForm({ title: '' });
      let state = formHandler.getSubmissionState();
      expect(state.hasErrors).toBe(true);
      expect(state.fieldErrors.title).toBeDefined();

      // Valid form
      formHandler.validateForm({ title: 'Valid Title' });
      state = formHandler.getSubmissionState();
      expect(state.hasErrors).toBe(false);
      expect(state.fieldErrors).toEqual({});
    });
  });

  describe('Real-time Validation', () => {
    it('should validate field on change when enabled', () => {
      const schema: ValidationSchema = {
        fields: {
          email: { required: true, type: 'email' },
        },
      };

      const formHandler = new FormHandler(schema, {
        validateOnChange: true,
      });

      // Invalid email
      const error1 = formHandler.validateFieldOnChange('email', 'invalid');
      expect(error1).not.toBeNull();

      // Check state was updated
      const state1 = formHandler.getSubmissionState();
      expect(state1.fieldErrors.email).toBeDefined();

      // Valid email
      const error2 = formHandler.validateFieldOnChange('email', 'test@example.com');
      expect(error2).toBeNull();

      // Check state was updated
      const state2 = formHandler.getSubmissionState();
      expect(state2.fieldErrors.email).toBeUndefined();
    });

    it('should not validate on change when disabled', () => {
      const schema: ValidationSchema = {
        fields: {
          email: { required: true, type: 'email' },
        },
      };

      const formHandler = new FormHandler(schema, {
        validateOnChange: false,
      });

      const error = formHandler.validateFieldOnChange('email', 'invalid');
      expect(error).toBeNull();
    });

    it('should validate on change per field', () => {
      const schema: ValidationSchema = {
        fields: {
          email: {
            required: true,
            type: 'email',
            validateOnChange: true,
          },
          title: {
            required: true,
            validateOnChange: false,
          },
        },
      };

      const formHandler = new FormHandler(schema, {
        validateOnChange: false, // Disabled globally
      });

      // Email should validate (enabled per field)
      const error1 = formHandler.validateFieldOnChange('email', 'invalid');
      expect(error1).not.toBeNull();

      // Title should not validate (disabled per field)
      const error2 = formHandler.validateFieldOnChange('title', '');
      expect(error2).toBeNull();
    });

    it('should call validation change callback', () => {
      const onValidationChange = vi.fn();
      const schema: ValidationSchema = {
        fields: {
          email: { required: true, type: 'email' },
        },
      };

      const formHandler = new FormHandler(schema, {
        validateOnChange: true,
        onValidationChange,
      });

      formHandler.validateFieldOnChange('email', 'invalid');
      expect(onValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({ email: expect.any(String) })
      );
    });
  });

  describe('Error Management', () => {
    it('should clear field error', () => {
      const schema: ValidationSchema = {
        fields: {
          email: { required: true, type: 'email' },
        },
      };

      const formHandler = new FormHandler(schema, {
        validateOnChange: true,
      });

      // Add error
      formHandler.validateFieldOnChange('email', 'invalid');
      expect(formHandler.getSubmissionState().fieldErrors.email).toBeDefined();

      // Clear error
      formHandler.clearFieldError('email');
      expect(formHandler.getSubmissionState().fieldErrors.email).toBeUndefined();
    });

    it('should clear all errors', () => {
      const schema: ValidationSchema = {
        fields: {
          email: { required: true, type: 'email' },
          title: { required: true },
        },
      };

      const formHandler = new FormHandler(schema);

      // Add errors
      formHandler.validateForm({ email: 'invalid', title: '' });
      expect(Object.keys(formHandler.getSubmissionState().fieldErrors).length).toBeGreaterThan(0);

      // Clear all errors
      formHandler.clearAllErrors();
      expect(formHandler.getSubmissionState().fieldErrors).toEqual({});
      expect(formHandler.getSubmissionState().hasErrors).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should track submission state', () => {
      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const formHandler = new FormHandler(schema);

      const initialState = formHandler.getSubmissionState();
      expect(initialState.isSubmitting).toBe(false);
      expect(initialState.hasErrors).toBe(false);
      expect(initialState.fieldErrors).toEqual({});
      expect(initialState.lastSubmission).toBeNull();
      expect(initialState.submitCount).toBe(0);
    });

    it('should update submission state', () => {
      const onSubmissionStateChange = vi.fn();
      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const formHandler = new FormHandler(schema, {
        onSubmissionStateChange,
      });

      const newState = {
        isSubmitting: true,
        hasErrors: false,
        fieldErrors: {},
        lastSubmission: null,
        submitCount: 0,
      };

      formHandler.setSubmissionState(newState);
      expect(formHandler.getSubmissionState().isSubmitting).toBe(true);
      expect(onSubmissionStateChange).toHaveBeenCalledWith(newState);
    });

    it('should reset state', () => {
      const schema: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const formHandler = new FormHandler(schema);

      // Add some state
      formHandler.validateForm({ title: '' });
      formHandler.setSubmissionState({
        isSubmitting: false,
        hasErrors: true,
        fieldErrors: { title: 'Error' },
        lastSubmission: new Date(),
        submitCount: 5,
      });

      // Reset
      formHandler.reset();

      const state = formHandler.getSubmissionState();
      expect(state.isSubmitting).toBe(false);
      expect(state.hasErrors).toBe(false);
      expect(state.fieldErrors).toEqual({});
      expect(state.lastSubmission).toBeNull();
      expect(state.submitCount).toBe(0);
    });
  });

  describe('Custom Validators', () => {
    it('should validate date range', () => {
      const validator = CustomValidators.dateRange('start_date', 'end_date');

      // Invalid range
      const error1 = validator({
        start_date: '2024-12-31',
        end_date: '2024-01-01',
      });
      expect(error1).not.toBeNull();
      expect(error1?.message).toContain('after start date');

      // Valid range
      const error2 = validator({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      });
      expect(error2).toBeNull();
    });

    it('should validate matching fields', () => {
      const validator = CustomValidators.matchField('password', 'confirmPassword', 'Password');

      // Non-matching
      const error1 = validator({
        password: 'password123',
        confirmPassword: 'different',
      });
      expect(error1).not.toBeNull();
      expect(error1?.message).toContain('must match');

      // Matching
      const error2 = validator({
        password: 'password123',
        confirmPassword: 'password123',
      });
      expect(error2).toBeNull();
    });
  });

  describe('Validation Patterns', () => {
    it('should provide email pattern', () => {
      expect(ValidationPatterns.email.test('test@example.com')).toBe(true);
      expect(ValidationPatterns.email.test('invalid')).toBe(false);
    });

    it('should provide URL pattern', () => {
      expect(ValidationPatterns.url.test('https://example.com')).toBe(true);
      expect(ValidationPatterns.url.test('example.com')).toBe(false);
    });

    it('should provide phone pattern', () => {
      expect(ValidationPatterns.phone.test('123-456-7890')).toBe(true);
      expect(ValidationPatterns.phone.test('+1 (555) 123-4567')).toBe(true);
      expect(ValidationPatterns.phone.test('abc')).toBe(false);
    });

    it('should provide date pattern', () => {
      expect(ValidationPatterns.date.test('2024-01-15')).toBe(true);
      expect(ValidationPatterns.date.test('01/15/2024')).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    it('should format field names', () => {
      const schema: ValidationSchema = {
        fields: {
          first_name: { required: true },
          emailAddress: { required: true },
          ZIP_CODE: { required: true },
        },
      };

      const formHandler = new FormHandler(schema);

      const error1 = formHandler.validateField('first_name', '');
      expect(error1?.message).toContain('First Name');

      const error2 = formHandler.validateField('emailAddress', '');
      expect(error2?.message).toContain('Email Address');

      const error3 = formHandler.validateField('ZIP_CODE', '');
      expect(error3?.message).toContain('Zip Code');
    });

    it('should update schema', () => {
      const schema1: ValidationSchema = {
        fields: {
          title: { required: true },
        },
      };

      const formHandler = new FormHandler(schema1);

      // Validate with first schema
      const error1 = formHandler.validateField('email', '');
      expect(error1).toBeNull(); // Field not in schema

      // Update schema
      const schema2: ValidationSchema = {
        fields: {
          email: { required: true, type: 'email' },
        },
      };
      formHandler.updateSchema(schema2);

      // Validate with new schema
      const error2 = formHandler.validateField('email', '');
      expect(error2).not.toBeNull(); // Field now in schema
    });

    it('should update options', () => {
      const schema: ValidationSchema = {
        fields: {
          email: { required: true, type: 'email' },
        },
      };

      const formHandler = new FormHandler(schema, {
        validateOnChange: false,
      });

      // Initially disabled
      let error = formHandler.validateFieldOnChange('email', 'invalid');
      expect(error).toBeNull();

      // Enable validation
      formHandler.updateOptions({ validateOnChange: true });

      // Now enabled
      error = formHandler.validateFieldOnChange('email', 'invalid');
      expect(error).not.toBeNull();
    });
  });
});
