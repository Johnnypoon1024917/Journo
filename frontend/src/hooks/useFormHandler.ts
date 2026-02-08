/**
 * useFormHandler Hook
 * 
 * React hook for using FormHandler service in components.
 * Provides real-time validation, submission state management, and error handling.
 * 
 * Validates Requirements: 9.1, 9.2, 9.4, 9.7
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  FormHandler,
  ValidationSchema,
  FormHandlerOptions,
  SubmissionResult,
  ValidationError,
  SubmissionState,
} from '../services/formHandler';

export interface UseFormHandlerOptions extends FormHandlerOptions {
  initialValues?: Record<string, any>;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export interface UseFormHandlerReturn {
  // Form values
  values: Record<string, any>;
  setValues: (values: Record<string, any>) => void;
  setValue: (field: string, value: any) => void;
  
  // Validation
  errors: Record<string, string>;
  validateField: (field: string) => ValidationError | null;
  validateForm: () => boolean;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
  
  // Submission
  handleSubmit: (endpoint: string, method?: 'POST' | 'PUT' | 'PATCH') => Promise<SubmissionResult>;
  isSubmitting: boolean;
  submitCount: number;
  
  // State
  submissionState: SubmissionState;
  reset: () => void;
  
  // Handlers for form inputs
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  
  // Form handler instance (for advanced usage)
  formHandler: FormHandler;
}

/**
 * Hook for form handling with validation and submission
 */
export function useFormHandler(
  schema: ValidationSchema,
  options: UseFormHandlerOptions = {}
): UseFormHandlerReturn {
  const {
    initialValues = {},
    onSuccess,
    onError,
    ...formHandlerOptions
  } = options;

  // Create form handler instance
  const formHandlerRef = useRef<FormHandler | null>(null);
  if (!formHandlerRef.current) {
    formHandlerRef.current = new FormHandler(schema, formHandlerOptions);
  }
  const formHandler = formHandlerRef.current;

  // Form state
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionState, setSubmissionState] = useState<SubmissionState>(
    formHandler.getSubmissionState()
  );

  // Update form handler callbacks
  useEffect(() => {
    formHandler.updateOptions({
      ...formHandlerOptions,
      onValidationChange: (newErrors) => {
        setErrors(newErrors);
      },
      onSubmissionStateChange: (newState) => {
        setSubmissionState(newState);
      },
    });
  }, [formHandler, formHandlerOptions]);

  // ============================================================================
  // Value Management
  // ============================================================================

  const setValue = useCallback((field: string, value: any) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // ============================================================================
  // Validation
  // ============================================================================

  const validateField = useCallback(
    (field: string): ValidationError | null => {
      const error = formHandler.validateFieldOnChange(field, values[field], values);
      return error;
    },
    [formHandler, values]
  );

  const validateForm = useCallback((): boolean => {
    const result = formHandler.validateForm(values);
    return result.isValid;
  }, [formHandler, values]);

  const clearFieldError = useCallback(
    (field: string) => {
      formHandler.clearFieldError(field);
    },
    [formHandler]
  );

  const clearAllErrors = useCallback(() => {
    formHandler.clearAllErrors();
  }, [formHandler]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      
      let fieldValue: any = value;
      
      // Handle different input types
      if (type === 'checkbox') {
        fieldValue = (e.target as HTMLInputElement).checked;
      } else if (type === 'number') {
        fieldValue = value === '' ? '' : Number(value);
      }

      // Update value
      setValue(name, fieldValue);

      // Real-time validation
      if (formHandlerOptions.validateOnChange !== false) {
        formHandler.validateFieldOnChange(name, fieldValue, {
          ...values,
          [name]: fieldValue,
        });
      }
    },
    [formHandler, formHandlerOptions.validateOnChange, setValue, values]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;

      // Validate on blur if enabled
      if (formHandlerOptions.validateOnBlur !== false) {
        formHandler.validateFieldOnChange(name, value, values);
      }
    },
    [formHandler, formHandlerOptions.validateOnBlur, values]
  );

  // ============================================================================
  // Submission
  // ============================================================================

  const handleSubmit = useCallback(
    async (endpoint: string, method: 'POST' | 'PUT' | 'PATCH' = 'POST'): Promise<SubmissionResult> => {
      const result = await formHandler.submitForm(values, endpoint, method);

      if (result.success) {
        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        if (onError) {
          onError(result.error || 'Submission failed');
        }
      }

      return result;
    },
    [formHandler, values, onSuccess, onError]
  );

  // ============================================================================
  // Reset
  // ============================================================================

  const reset = useCallback(() => {
    setValues(initialValues);
    formHandler.reset();
  }, [formHandler, initialValues]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Values
    values,
    setValues,
    setValue,

    // Validation
    errors,
    validateField,
    validateForm,
    clearFieldError,
    clearAllErrors,

    // Submission
    handleSubmit,
    isSubmitting: submissionState.isSubmitting,
    submitCount: submissionState.submitCount,

    // State
    submissionState,
    reset,

    // Handlers
    handleChange,
    handleBlur,

    // Form handler instance
    formHandler,
  };
}

export default useFormHandler;
