# FormHandler Service

## Overview

The FormHandler service provides comprehensive form submission and validation capabilities for the travel platform. It implements real-time field validation, proper form state management to prevent duplicate submissions, and flexible validation schema support.

**Validates Requirements:** 9.1, 9.2, 9.4, 9.7

## Features

- ✅ **Real-time Field Validation**: Immediate user feedback as they type
- ✅ **Comprehensive Validation**: Support for required fields, type validation, length constraints, patterns, and custom validators
- ✅ **Duplicate Submission Prevention**: Prevents accidental duplicate form submissions
- ✅ **Flexible Validation Schema**: Easy-to-define validation rules
- ✅ **Error Handling**: Graceful handling of network errors and API validation errors
- ✅ **State Management**: Track submission state, errors, and submission count
- ✅ **React Hook Integration**: Easy-to-use `useFormHandler` hook for React components

## Basic Usage

### Using the React Hook (Recommended)

```typescript
import { useFormHandler } from '../hooks/useFormHandler';
import { ValidationSchema } from '../services/formHandler';

function MyForm() {
  const schema: ValidationSchema = {
    fields: {
      title: {
        required: true,
        type: 'text',
        minLength: 3,
        maxLength: 100,
      },
      email: {
        required: true,
        type: 'email',
      },
      age: {
        type: 'number',
        min: 18,
        max: 120,
      },
    },
  };

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
  } = useFormHandler(schema, {
    initialValues: { title: '', email: '', age: '' },
    onSuccess: (data) => {
      console.log('Form submitted successfully:', data);
    },
    onError: (error) => {
      console.error('Form submission failed:', error);
    },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit('/api/endpoint', 'POST');
  };

  return (
    <form onSubmit={onSubmit}>
      <input
        name="title"
        value={values.title}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {errors.title && <span className="error">{errors.title}</span>}

      <input
        name="email"
        type="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {errors.email && <span className="error">{errors.email}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### Using the FormHandler Class Directly

```typescript
import { FormHandler, ValidationSchema } from '../services/formHandler';

const schema: ValidationSchema = {
  fields: {
    title: {
      required: true,
      minLength: 3,
    },
    email: {
      required: true,
      type: 'email',
    },
  },
};

const formHandler = new FormHandler(schema, {
  preventDuplicateSubmissions: true,
  validateOnChange: true,
});

// Validate a single field
const error = formHandler.validateField('email', 'invalid-email');
console.log(error); // { field: 'email', message: 'Email must be a valid email address' }

// Validate entire form
const result = formHandler.validateForm({
  title: 'My Trip',
  email: 'user@example.com',
});
console.log(result.isValid); // true

// Submit form
const submissionResult = await formHandler.submitForm(
  { title: 'My Trip', email: 'user@example.com' },
  '/api/trips',
  'POST'
);

if (submissionResult.success) {
  console.log('Success:', submissionResult.data);
} else {
  console.error('Error:', submissionResult.error);
}
```

## Validation Schema

### Field Validation Options

```typescript
interface FieldValidation {
  required?: boolean;              // Field is required
  type?: FieldType;                // Field type validation
  minLength?: number;              // Minimum string length
  maxLength?: number;              // Maximum string length
  min?: number;                    // Minimum numeric value
  max?: number;                    // Maximum numeric value
  pattern?: RegExp;                // Custom regex pattern
  customValidator?: (value, formData) => ValidationError | null;
  validateOnChange?: boolean;      // Enable real-time validation
}
```

### Supported Field Types

- `text`: Plain text
- `email`: Email address validation
- `url`: URL validation
- `tel`: Phone number validation
- `number`: Numeric validation
- `date`: Date validation
- `select`: Select dropdown
- `checkbox`: Checkbox input

### Example Schema with All Options

```typescript
const schema: ValidationSchema = {
  fields: {
    // Required text field with length constraints
    title: {
      required: true,
      type: 'text',
      minLength: 3,
      maxLength: 100,
      validateOnChange: true,
    },

    // Email validation
    email: {
      required: true,
      type: 'email',
    },

    // URL validation
    website: {
      type: 'url',
      required: false,
    },

    // Numeric range validation
    budget: {
      type: 'number',
      min: 0,
      max: 1000000,
    },

    // Pattern validation
    zipCode: {
      pattern: /^\d{5}(-\d{4})?$/,
    },

    // Custom validator
    password: {
      required: true,
      minLength: 8,
      customValidator: (value) => {
        if (!/[A-Z]/.test(value)) {
          return {
            field: 'password',
            message: 'Password must contain at least one uppercase letter',
          };
        }
        return null;
      },
    },
  },

  // Form-level custom validators
  customValidators: [
    // Validate date range
    (formData) => {
      if (formData.start_date && formData.end_date) {
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        if (start > end) {
          return {
            field: 'end_date',
            message: 'End date must be after start date',
          };
        }
      }
      return null;
    },
  ],
};
```

## Common Validation Patterns

The service provides pre-built validation patterns:

```typescript
import { ValidationPatterns } from '../services/formHandler';

const schema: ValidationSchema = {
  fields: {
    email: {
      pattern: ValidationPatterns.email,
    },
    phone: {
      pattern: ValidationPatterns.phone,
    },
    website: {
      pattern: ValidationPatterns.url,
    },
    date: {
      pattern: ValidationPatterns.date,
    },
  },
};
```

## Custom Validators

The service provides common custom validators:

```typescript
import { CustomValidators } from '../services/formHandler';

const schema: ValidationSchema = {
  fields: {
    start_date: { required: true, type: 'date' },
    end_date: { required: true, type: 'date' },
    password: { required: true, minLength: 8 },
    confirmPassword: { required: true },
  },
  customValidators: [
    // Validate date range
    CustomValidators.dateRange('start_date', 'end_date'),
    
    // Validate password match
    CustomValidators.matchField('password', 'confirmPassword', 'Password'),
  ],
};
```

## Real-time Validation

Enable real-time validation for immediate user feedback:

```typescript
const formHandler = new FormHandler(schema, {
  validateOnChange: true,  // Validate as user types
  validateOnBlur: true,    // Validate when field loses focus
});
```

Or enable per-field:

```typescript
const schema: ValidationSchema = {
  fields: {
    email: {
      required: true,
      type: 'email',
      validateOnChange: true,  // Only this field validates on change
    },
  },
};
```

## Duplicate Submission Prevention

Prevent accidental duplicate submissions:

```typescript
const formHandler = new FormHandler(schema, {
  preventDuplicateSubmissions: true,
  duplicateSubmissionDelay: 1000,  // Minimum 1 second between submissions
});
```

## Error Handling

The FormHandler automatically handles various error scenarios:

### Network Errors
```typescript
// Automatically detects offline status
{
  success: false,
  error: 'No internet connection. Please check your network and try again.'
}
```

### API Validation Errors
```typescript
// Parses field-specific errors from API
{
  success: false,
  error: 'Validation failed',
  fieldErrors: {
    email: 'Email already exists',
    title: 'Title is too short'
  }
}
```

### Generic Errors
```typescript
{
  success: false,
  error: 'An unexpected error occurred. Please try again.'
}
```

## State Management

Track form submission state:

```typescript
const state = formHandler.getSubmissionState();

console.log(state);
// {
//   isSubmitting: false,
//   hasErrors: false,
//   fieldErrors: {},
//   lastSubmission: Date,
//   submitCount: 3
// }
```

## Integration with Design System

Use with design system components:

```typescript
import { Input } from '../design-system/atoms/Input';
import { Button } from '../design-system/atoms/Button';
import { useFormHandler } from '../hooks/useFormHandler';

function TripForm() {
  const {
    values,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
  } = useFormHandler(schema);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit('/api/trips', 'POST');
    }}>
      <Input
        name="title"
        value={values.title}
        onChange={handleChange}
        onBlur={handleBlur}
        variant={errors.title ? 'error' : 'default'}
        placeholder="Trip Title"
      />
      {errors.title && (
        <span className="text-error-500 text-sm">{errors.title}</span>
      )}

      <Button
        type="submit"
        variant="primary"
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        Create Trip
      </Button>
    </form>
  );
}
```

## Testing

Example test for FormHandler:

```typescript
import { FormHandler, ValidationSchema } from '../services/formHandler';

describe('FormHandler', () => {
  const schema: ValidationSchema = {
    fields: {
      email: {
        required: true,
        type: 'email',
      },
    },
  };

  it('validates required fields', () => {
    const formHandler = new FormHandler(schema);
    const result = formHandler.validateForm({ email: '' });
    
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe('Email is required');
  });

  it('validates email format', () => {
    const formHandler = new FormHandler(schema);
    const result = formHandler.validateForm({ email: 'invalid' });
    
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toContain('valid email');
  });

  it('prevents duplicate submissions', async () => {
    const formHandler = new FormHandler(schema, {
      preventDuplicateSubmissions: true,
    });

    // Start first submission
    const promise1 = formHandler.submitForm(
      { email: 'test@example.com' },
      '/api/test'
    );

    // Try second submission immediately
    const result2 = await formHandler.submitForm(
      { email: 'test@example.com' },
      '/api/test'
    );

    expect(result2.success).toBe(false);
    expect(result2.error).toContain('already being submitted');
  });
});
```

## Best Practices

1. **Define Clear Validation Rules**: Be specific about what constitutes valid input
2. **Provide Helpful Error Messages**: Use custom validators for domain-specific messages
3. **Enable Real-time Validation**: Give users immediate feedback
4. **Handle All Error Cases**: Network errors, API errors, and validation errors
5. **Prevent Duplicate Submissions**: Always enable duplicate submission prevention
6. **Use Type Safety**: Leverage TypeScript for type-safe form handling
7. **Test Validation Logic**: Write tests for custom validators and edge cases

## API Reference

### FormHandler Class

#### Constructor
```typescript
new FormHandler(schema: ValidationSchema, options?: FormHandlerOptions)
```

#### Methods
- `validateField(fieldName, value, formData?)`: Validate single field
- `validateForm(formData)`: Validate entire form
- `validateFieldOnChange(fieldName, value, formData?)`: Real-time validation
- `submitForm(formData, endpoint, method?)`: Submit form with validation
- `clearFieldError(fieldName)`: Clear error for specific field
- `clearAllErrors()`: Clear all errors
- `getSubmissionState()`: Get current submission state
- `isSubmitting()`: Check if form is submitting
- `hasErrors()`: Check if form has errors
- `reset()`: Reset form handler state

### useFormHandler Hook

#### Parameters
```typescript
useFormHandler(schema: ValidationSchema, options?: UseFormHandlerOptions)
```

#### Returns
```typescript
{
  values: Record<string, any>;
  setValues: (values) => void;
  setValue: (field, value) => void;
  errors: Record<string, string>;
  validateField: (field) => ValidationError | null;
  validateForm: () => boolean;
  clearFieldError: (field) => void;
  clearAllErrors: () => void;
  handleSubmit: (endpoint, method?) => Promise<SubmissionResult>;
  isSubmitting: boolean;
  submitCount: number;
  submissionState: SubmissionState;
  reset: () => void;
  handleChange: (e) => void;
  handleBlur: (e) => void;
  formHandler: FormHandler;
}
```

## Related Files

- `frontend/src/services/formHandler.ts` - Main service implementation
- `frontend/src/hooks/useFormHandler.ts` - React hook
- `frontend/src/services/__tests__/formHandler.test.ts` - Unit tests
- `frontend/src/hooks/__tests__/useFormHandler.test.tsx` - Hook tests
