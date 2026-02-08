/**
 * FormHandler Service
 * 
 * Comprehensive form submission and validation system that provides:
 * - Real-time field validation with immediate user feedback
 * - Proper form state management to prevent duplicate submissions
 * - Flexible validation schema support
 * - Error handling and user feedback
 * 
 * Validates Requirements: 9.1, 9.2, 9.4, 9.7
 */

import api from './api';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type FieldType = 'text' | 'email' | 'date' | 'number' | 'select' | 'checkbox' | 'url' | 'tel';

export interface ValidationError {
  field: string;
  message: string;
}

export interface FieldValidation {
  required?: boolean;
  type?: FieldType;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: (value: any, formData?: Record<string, any>) => ValidationError | null;
  validateOnChange?: boolean; // Enable real-time validation for this field
}

export interface ValidationSchema {
  fields: Record<string, FieldValidation>;
  customValidators?: Array<(formData: Record<string, any>) => ValidationError | null>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  fieldErrors: ValidationError[];
}

export interface SubmissionState {
  isSubmitting: boolean;
  hasErrors: boolean;
  fieldErrors: Record<string, string>;
  lastSubmission: Date | null;
  submitCount: number;
}

export interface SubmissionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface SubmissionError {
  message: string;
  fieldErrors?: Record<string, string>;
  statusCode?: number;
}

export interface FormHandlerOptions {
  preventDuplicateSubmissions?: boolean;
  duplicateSubmissionDelay?: number; // milliseconds
  validateOnChange?: boolean; // Enable real-time validation globally
  validateOnBlur?: boolean;
  onValidationChange?: (errors: Record<string, string>) => void;
  onSubmissionStateChange?: (state: SubmissionState) => void;
}

// ============================================================================
// FormHandler Class
// ============================================================================

export class FormHandler {
  private schema: ValidationSchema;
  private options: FormHandlerOptions;
  private submissionState: SubmissionState;
  private validationCache: Map<string, ValidationError | null>;

  constructor(schema: ValidationSchema, options: FormHandlerOptions = {}) {
    this.schema = schema;
    this.options = {
      preventDuplicateSubmissions: true,
      duplicateSubmissionDelay: 1000,
      validateOnChange: true,
      validateOnBlur: true,
      ...options,
    };
    this.submissionState = {
      isSubmitting: false,
      hasErrors: false,
      fieldErrors: {},
      lastSubmission: null,
      submitCount: 0,
    };
    this.validationCache = new Map();
  }

  // ============================================================================
  // Validation Methods
  // ============================================================================

  /**
   * Validate a single field value
   * Provides real-time validation feedback
   */
  validateField(fieldName: string, value: any, formData?: Record<string, any>): ValidationError | null {
    const fieldValidation = this.schema.fields[fieldName];
    if (!fieldValidation) {
      return null;
    }

    // Required validation
    if (fieldValidation.required) {
      if (value === undefined || value === null || value === '') {
        return {
          field: fieldName,
          message: `${this.formatFieldName(fieldName)} is required`,
        };
      }
    }

    // Skip further validation if field is empty and not required
    if (!fieldValidation.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Type-specific validation
    if (fieldValidation.type) {
      const typeError = this.validateFieldType(fieldName, value, fieldValidation.type);
      if (typeError) {
        return typeError;
      }
    }

    // Length validation for strings
    if (typeof value === 'string') {
      if (fieldValidation.minLength && value.length < fieldValidation.minLength) {
        return {
          field: fieldName,
          message: `${this.formatFieldName(fieldName)} must be at least ${fieldValidation.minLength} characters`,
        };
      }
      if (fieldValidation.maxLength && value.length > fieldValidation.maxLength) {
        return {
          field: fieldName,
          message: `${this.formatFieldName(fieldName)} must be at most ${fieldValidation.maxLength} characters`,
        };
      }
    }

    // Numeric range validation
    if (typeof value === 'number') {
      if (fieldValidation.min !== undefined && value < fieldValidation.min) {
        return {
          field: fieldName,
          message: `${this.formatFieldName(fieldName)} must be at least ${fieldValidation.min}`,
        };
      }
      if (fieldValidation.max !== undefined && value > fieldValidation.max) {
        return {
          field: fieldName,
          message: `${this.formatFieldName(fieldName)} must be at most ${fieldValidation.max}`,
        };
      }
    }

    // Pattern validation
    if (fieldValidation.pattern && typeof value === 'string') {
      if (!fieldValidation.pattern.test(value)) {
        return {
          field: fieldName,
          message: `${this.formatFieldName(fieldName)} format is invalid`,
        };
      }
    }

    // Custom validator
    if (fieldValidation.customValidator) {
      const customError = fieldValidation.customValidator(value, formData);
      if (customError) {
        return customError;
      }
    }

    return null;
  }

  /**
   * Validate field type
   */
  private validateFieldType(fieldName: string, value: any, type: FieldType): ValidationError | null {
    const formattedName = this.formatFieldName(fieldName);

    switch (type) {
      case 'email':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(String(value))) {
          return {
            field: fieldName,
            message: `${formattedName} must be a valid email address`,
          };
        }
        break;

      case 'url':
        try {
          new URL(String(value));
        } catch {
          return {
            field: fieldName,
            message: `${formattedName} must be a valid URL`,
          };
        }
        break;

      case 'tel':
        const phonePattern = /^[\d\s\-\+\(\)]+$/;
        if (!phonePattern.test(String(value))) {
          return {
            field: fieldName,
            message: `${formattedName} must be a valid phone number`,
          };
        }
        break;

      case 'number':
        if (isNaN(Number(value))) {
          return {
            field: fieldName,
            message: `${formattedName} must be a number`,
          };
        }
        break;

      case 'date':
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          return {
            field: fieldName,
            message: `${formattedName} must be a valid date`,
          };
        }
        break;
    }

    return null;
  }

  /**
   * Validate entire form
   */
  validateForm(formData: Record<string, any>): ValidationResult {
    const errors: Record<string, string> = {};
    const fieldErrors: ValidationError[] = [];

    // Validate each field
    Object.keys(this.schema.fields).forEach((fieldName) => {
      const value = formData[fieldName];
      const error = this.validateField(fieldName, value, formData);
      if (error) {
        errors[fieldName] = error.message;
        fieldErrors.push(error);
      }
    });

    // Run custom validators
    if (this.schema.customValidators) {
      this.schema.customValidators.forEach((validator) => {
        const error = validator(formData);
        if (error) {
          errors[error.field] = error.message;
          fieldErrors.push(error);
        }
      });
    }

    const isValid = fieldErrors.length === 0;

    // Update submission state
    this.submissionState.hasErrors = !isValid;
    this.submissionState.fieldErrors = errors;

    // Notify listeners
    if (this.options.onValidationChange) {
      this.options.onValidationChange(errors);
    }

    return {
      isValid,
      errors,
      fieldErrors,
    };
  }

  /**
   * Validate field on change (real-time validation)
   */
  validateFieldOnChange(fieldName: string, value: any, formData?: Record<string, any>): ValidationError | null {
    const fieldValidation = this.schema.fields[fieldName];
    
    // Check if real-time validation is enabled for this field
    const shouldValidate = 
      this.options.validateOnChange || 
      (fieldValidation && fieldValidation.validateOnChange);

    if (!shouldValidate) {
      return null;
    }

    const error = this.validateField(fieldName, value, formData);
    
    // Update validation cache
    this.validationCache.set(fieldName, error);

    // Update submission state
    if (error) {
      this.submissionState.fieldErrors[fieldName] = error.message;
    } else {
      delete this.submissionState.fieldErrors[fieldName];
    }

    // Notify listeners
    if (this.options.onValidationChange) {
      this.options.onValidationChange(this.submissionState.fieldErrors);
    }

    return error;
  }

  /**
   * Clear validation errors for a field
   */
  clearFieldError(fieldName: string): void {
    this.validationCache.delete(fieldName);
    delete this.submissionState.fieldErrors[fieldName];

    if (this.options.onValidationChange) {
      this.options.onValidationChange(this.submissionState.fieldErrors);
    }
  }

  /**
   * Clear all validation errors
   */
  clearAllErrors(): void {
    this.validationCache.clear();
    this.submissionState.fieldErrors = {};
    this.submissionState.hasErrors = false;

    if (this.options.onValidationChange) {
      this.options.onValidationChange({});
    }
  }

  // ============================================================================
  // Submission Methods
  // ============================================================================

  /**
   * Submit form with validation and duplicate prevention
   */
  async submitForm<T = any>(
    formData: Record<string, any>,
    endpoint: string,
    method: 'POST' | 'PUT' | 'PATCH' = 'POST'
  ): Promise<SubmissionResult<T>> {
    // Prevent duplicate submissions
    if (this.options.preventDuplicateSubmissions && this.submissionState.isSubmitting) {
      return {
        success: false,
        error: 'Form is already being submitted',
      };
    }

    // Check duplicate submission delay
    if (
      this.options.preventDuplicateSubmissions &&
      this.submissionState.lastSubmission &&
      this.options.duplicateSubmissionDelay
    ) {
      const timeSinceLastSubmission = Date.now() - this.submissionState.lastSubmission.getTime();
      if (timeSinceLastSubmission < this.options.duplicateSubmissionDelay) {
        return {
          success: false,
          error: 'Please wait before submitting again',
        };
      }
    }

    // Validate form
    const validationResult = this.validateForm(formData);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: 'Please fix the errors before submitting',
        fieldErrors: validationResult.errors,
      };
    }

    // Set submission state
    this.setSubmissionState({
      isSubmitting: true,
      hasErrors: false,
      fieldErrors: {},
      lastSubmission: this.submissionState.lastSubmission,
      submitCount: this.submissionState.submitCount,
    });

    try {
      // Make API request
      let response: T;
      if (method === 'POST') {
        response = await api.post<T>(endpoint, formData);
      } else if (method === 'PUT') {
        response = await api.put<T>(endpoint, formData);
      } else if (method === 'PATCH') {
        response = await api.patch<T>(endpoint, formData);
      } else {
        throw new Error(`Unsupported HTTP method: ${method}`);
      }

      // Update submission state
      this.setSubmissionState({
        isSubmitting: false,
        hasErrors: false,
        fieldErrors: {},
        lastSubmission: new Date(),
        submitCount: this.submissionState.submitCount + 1,
      });

      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      // Handle submission error
      const submissionError = this.handleSubmissionError(error);

      // Update submission state
      this.setSubmissionState({
        isSubmitting: false,
        hasErrors: true,
        fieldErrors: submissionError.fieldErrors || {},
        lastSubmission: this.submissionState.lastSubmission,
        submitCount: this.submissionState.submitCount,
      });

      return {
        success: false,
        error: submissionError.message,
        fieldErrors: submissionError.fieldErrors,
      };
    }
  }

  /**
   * Handle submission errors
   */
  private handleSubmissionError(error: any): SubmissionError {
    // Network error
    if (!navigator.onLine) {
      return {
        message: 'No internet connection. Please check your network and try again.',
        statusCode: 0,
      };
    }

    // API error with field-specific errors
    if (error.response?.data?.errors) {
      const fieldErrors: Record<string, string> = {};
      const errors = error.response.data.errors;

      if (Array.isArray(errors)) {
        errors.forEach((err: any) => {
          if (err.field && err.message) {
            fieldErrors[err.field] = err.message;
          }
        });
      } else if (typeof errors === 'object') {
        Object.keys(errors).forEach((field) => {
          fieldErrors[field] = errors[field];
        });
      }

      return {
        message: error.response.data.message || 'Validation failed',
        fieldErrors,
        statusCode: error.response.status,
      };
    }

    // Generic API error
    if (error.response?.data?.message) {
      return {
        message: error.response.data.message,
        statusCode: error.response.status,
      };
    }

    // Generic error
    return {
      message: error.message || 'An unexpected error occurred. Please try again.',
      statusCode: error.response?.status,
    };
  }

  // ============================================================================
  // State Management Methods
  // ============================================================================

  /**
   * Set submission state
   */
  setSubmissionState(state: SubmissionState): void {
    this.submissionState = state;

    if (this.options.onSubmissionStateChange) {
      this.options.onSubmissionStateChange(state);
    }
  }

  /**
   * Get current submission state
   */
  getSubmissionState(): SubmissionState {
    return { ...this.submissionState };
  }

  /**
   * Check if form is currently submitting
   */
  isSubmitting(): boolean {
    return this.submissionState.isSubmitting;
  }

  /**
   * Check if form has errors
   */
  hasErrors(): boolean {
    return this.submissionState.hasErrors;
  }

  /**
   * Get field errors
   */
  getFieldErrors(): Record<string, string> {
    return { ...this.submissionState.fieldErrors };
  }

  /**
   * Reset form handler state
   */
  reset(): void {
    this.submissionState = {
      isSubmitting: false,
      hasErrors: false,
      fieldErrors: {},
      lastSubmission: null,
      submitCount: 0,
    };
    this.validationCache.clear();

    if (this.options.onValidationChange) {
      this.options.onValidationChange({});
    }
    if (this.options.onSubmissionStateChange) {
      this.options.onSubmissionStateChange(this.submissionState);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Format field name for display in error messages
   */
  private formatFieldName(fieldName: string): string {
    // First, handle underscores
    let formatted = fieldName.replace(/_/g, ' ');
    
    // Then handle camelCase by adding space before uppercase letters (but not consecutive ones)
    formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    // Clean up and capitalize
    return formatted
      .trim()
      .toLowerCase()
      .split(/\s+/) // Split by one or more spaces
      .filter(word => word.length > 0) // Remove empty strings
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Update validation schema
   */
  updateSchema(schema: ValidationSchema): void {
    this.schema = schema;
    this.validationCache.clear();
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<FormHandlerOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a FormHandler instance
 */
export function createFormHandler(
  schema: ValidationSchema,
  options?: FormHandlerOptions
): FormHandler {
  return new FormHandler(schema, options);
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  phone: /^[\d\s\-\+\(\)]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphabetic: /^[a-zA-Z]+$/,
  numeric: /^\d+$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^([01]\d|2[0-3]):([0-5]\d)$/,
};

/**
 * Common custom validators
 */
export const CustomValidators = {
  /**
   * Validate that end date is after start date
   */
  dateRange: (startField: string, endField: string) => {
    return (formData: Record<string, any>): ValidationError | null => {
      const startDate = formData[startField];
      const endDate = formData[endField];

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
          return {
            field: endField,
            message: 'End date must be after start date',
          };
        }
      }

      return null;
    };
  },

  /**
   * Validate that a field matches another field (e.g., password confirmation)
   */
  matchField: (field: string, matchField: string, fieldLabel?: string) => {
    return (formData: Record<string, any>): ValidationError | null => {
      if (formData[field] !== formData[matchField]) {
        return {
          field: matchField,
          message: `${fieldLabel || 'Field'} must match`,
        };
      }
      return null;
    };
  },

  /**
   * Validate minimum age
   */
  minimumAge: (field: string, minAge: number) => {
    return (formData: Record<string, any>): ValidationError | null => {
      const birthDate = new Date(formData[field]);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        if (age - 1 < minAge) {
          return {
            field,
            message: `You must be at least ${minAge} years old`,
          };
        }
      } else if (age < minAge) {
        return {
          field,
          message: `You must be at least ${minAge} years old`,
        };
      }

      return null;
    };
  },
};

export default FormHandler;
