# Authentication Error Handling

## Overview

Automatic authentication error handling that redirects users to the login page when their session expires or authentication fails.

## Features

1. **Global Error Interception**: Automatically catches 401 authentication errors across the entire application
2. **Automatic Redirect**: Redirects users to login page when authentication fails
3. **Return Path Preservation**: Saves the current page so users can return after logging in
4. **Session Cleanup**: Clears authentication state on logout
5. **Duplicate Prevention**: Prevents multiple simultaneous redirects

## Implementation

### Core Files

1. **`frontend/src/utils/authErrorHandler.ts`**
   - Global authentication error handler
   - Return path management
   - Redirect logic

2. **`frontend/src/hooks/useAuthErrorHandler.ts`**
   - React hook for component-level error handling
   - Provides convenient API for components

3. **`frontend/src/services/api.ts`**
   - Integrated with API request handler
   - Automatically handles 401 errors

## Usage

### Automatic Handling (Recommended)

The API service automatically handles authentication errors. No additional code needed in most cases:

```typescript
// This will automatically redirect to login on 401 errors
const trips = await tripService.getTrips(page, limit, token);
```

### Manual Handling in Components

For explicit error handling in components:

```typescript
import { useAuthErrorHandler } from '../../hooks/useAuthErrorHandler';

function MyComponent() {
  const { handleError } = useAuthErrorHandler();
  
  const fetchData = async () => {
    try {
      const data = await api.get('/endpoint');
    } catch (error) {
      handleError(error); // Will redirect if 401
      // Handle other errors...
    }
  };
}
```

### Wrapping Functions

Wrap async functions for automatic error handling:

```typescript
import { useAuthErrorHandler } from '../../hooks/useAuthErrorHandler';

function MyComponent() {
  const { withErrorHandling } = useAuthErrorHandler();
  
  const fetchData = withErrorHandling(async () => {
    return await api.get('/endpoint');
  });
  
  // fetchData will automatically redirect on 401
}
```

### Direct Usage

For non-React contexts:

```typescript
import { handleAuthError } from '../utils/authErrorHandler';

try {
  const data = await fetch('/api/endpoint');
} catch (error) {
  handleAuthError(error, '/current/path');
}
```

## Return Path Flow

1. **User visits protected page**: `/trips/123`
2. **Authentication fails**: 401 error
3. **Path saved**: `/trips/123` stored in sessionStorage
4. **Redirect to login**: User sent to `/login`
5. **After login**: User redirected back to `/trips/123`

## Login Page Integration

Both login pages automatically check for return paths:

```typescript
// In Login.tsx and BubbleQuestLogin.tsx
import { getReturnPath } from '../utils/authErrorHandler';

const from = (location.state as any)?.from?.pathname || getReturnPath() || '/';

// After successful login
navigate(from, { replace: true });
```

## API Integration

The API service has three layers of protection:

1. **Token Refresh Attempt**: Tries to refresh expired tokens
2. **Auth Error Detection**: Catches 401 errors
3. **Global Handler**: Triggers redirect on authentication failure

```typescript
// In api.ts
try {
  // ... API request
} catch (error) {
  if (error instanceof ApiError && error.status === 401) {
    handleAuthError(error); // Automatic redirect
  }
  throw error;
}
```

## Examples

### Example 1: TripList Component

```typescript
import { useAuthErrorHandler } from '../../hooks/useAuthErrorHandler';

export const TripList: React.FC = () => {
  const { handleError } = useAuthErrorHandler();
  
  const fetchTrips = async () => {
    try {
      const response = await tripService.getTrips(page, 10, token);
      setTrips(response.data);
    } catch (err) {
      handleError(err); // Redirects if 401
      setError(err.message);
    }
  };
};
```

### Example 2: Protected Route

```typescript
import { useAuthErrorHandler } from '../../hooks/useAuthErrorHandler';

function ProtectedPage() {
  const { withErrorHandling } = useAuthErrorHandler();
  
  useEffect(() => {
    const loadData = withErrorHandling(async () => {
      const data = await api.get('/protected-data');
      setData(data);
    });
    
    loadData();
  }, []);
}
```

### Example 3: Form Submission

```typescript
import { useAuthErrorHandler } from '../../hooks/useAuthErrorHandler';

function CreateTripForm() {
  const { handleError } = useAuthErrorHandler();
  
  const handleSubmit = async (formData) => {
    try {
      await tripService.createTrip(formData, token);
      navigate('/trips');
    } catch (error) {
      handleError(error); // Redirects if 401
      showErrorToast(error.message);
    }
  };
}
```

## Testing

### Test Authentication Expiry

1. Log in to the application
2. Manually expire the token (or wait for expiration)
3. Try to access a protected resource
4. Should automatically redirect to login
5. After logging in, should return to original page

### Test Return Path

1. Visit `/trips/123` while logged out
2. Should redirect to `/login`
3. Log in successfully
4. Should redirect back to `/trips/123`

## Configuration

### Customize Redirect Behavior

Edit `authErrorHandler.ts` to customize:

```typescript
// Change redirect destination
window.location.href = '/custom-login';

// Add custom logic before redirect
console.log('Logging out user...');
trackAnalytics('auth_expired');

// Customize return path storage
localStorage.setItem('returnPath', currentPath); // Instead of sessionStorage
```

### Disable for Specific Paths

```typescript
export function handleAuthError(error: unknown, currentPath?: string): void {
  if (error instanceof ApiError && error.status === 401) {
    // Don't redirect for public pages
    if (currentPath?.startsWith('/public')) {
      return;
    }
    
    // ... rest of logic
  }
}
```

## Troubleshooting

### Issue: Multiple Redirects

**Solution**: The handler includes a flag to prevent duplicate redirects. If you see multiple redirects, check for:
- Multiple error handlers in the same component
- Errors being caught and re-thrown multiple times

### Issue: Return Path Not Working

**Solution**: Check that:
- sessionStorage is available in the browser
- Login page imports `getReturnPath`
- Path is being saved before redirect

### Issue: Not Redirecting

**Solution**: Verify that:
- Error is an `ApiError` with status 401
- `handleAuthError` is being called
- No other error handlers are preventing the redirect

## Best Practices

1. **Use Automatic Handling**: Let the API service handle most cases
2. **Add Local Handling**: Use `handleError` for component-specific logic
3. **Preserve Context**: Always pass current path when possible
4. **Test Thoroughly**: Test with expired tokens and network errors
5. **User Feedback**: Show loading states during redirect

## Security Considerations

- Clears all authentication state on logout
- Uses sessionStorage (cleared on tab close) for return paths
- Prevents redirect loops with flag
- Logs out user completely before redirect

## Future Enhancements

- [ ] Add toast notification before redirect
- [ ] Implement countdown timer (e.g., "Redirecting in 3 seconds...")
- [ ] Add option to stay on page and retry
- [ ] Track authentication failures in analytics
- [ ] Add refresh token retry before redirect
