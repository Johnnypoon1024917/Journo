# Authentication State Manager

## Overview

The Authentication State Manager provides centralized, robust authentication state management for the travel platform. It addresses critical UX issues related to authentication persistence, token refresh, and error handling.

## Features

### 1. Token Restoration (Requirement 2.1)
- Automatically restores authentication state from localStorage/sessionStorage on application load
- Validates stored tokens before using them
- Attempts token refresh if stored tokens are expired
- Falls back gracefully if restoration fails

### 2. Authentication Persistence (Requirement 2.2)
- Maintains authentication state across page refreshes
- Persists state across browser sessions
- Tracks last activity timestamp
- Integrates with Zustand persist middleware

### 3. Automatic Token Refresh (Requirement 2.3)
- Implements exponential backoff retry logic for token refresh
- Prevents multiple simultaneous refresh attempts
- Configurable retry behavior (max retries, delays, backoff multiplier)
- Rate-limits refresh attempts to prevent API abuse

### 4. Error Handling (Requirements 2.4, 2.5, 6.4, 6.5)
- Graceful 401 response handling across all API calls
- Session cleanup and redirect logic for failed refresh
- Consistent error handling across authentication methods
- Network error detection and handling

### 5. Enhanced Auth Integration (Requirements 6.1, 6.3)
- Seamless integration with existing enhanced auth system
- Synchronization between enhanced auth and legacy auth stores
- Support for both token-based and cookie-based authentication

## Usage

### Basic Usage

```typescript
import { authenticationStateManager } from '../services/authenticationStateManager';

// Restore authentication state on app load
const state = await authenticationStateManager.restoreAuthenticationState();

// Manually refresh tokens
const result = await authenticationStateManager.refreshTokens();
if (result.success) {
  console.log('Token refreshed:', result.newAccessToken);
}

// Handle authentication errors
await authenticationStateManager.handleAuthenticationError({
  type: 'TOKEN_EXPIRED',
  message: 'Token has expired',
  status: 401,
});

// Clear authentication state (logout)
await authenticationStateManager.clearAuthenticationState();
```

### Integration with useAuth Hook

The `useAuth` hook automatically integrates with the authentication state manager:

```typescript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Authentication state is automatically restored on mount
  // Token refresh happens automatically every 14 minutes
  // Logout properly clears all state
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.name}</p>
      ) : (
        <button onClick={() => login({ email, password })}>Login</button>
      )}
    </div>
  );
}
```

### Integration with API Service

The API service automatically uses the authentication state manager for 401 handling:

```typescript
import api from '../services/api';

// API calls automatically handle 401 responses
const data = await api.get('/trips', { token: accessToken });

// If 401 is received:
// 1. Token refresh is attempted automatically
// 2. Request is retried with new token
// 3. If refresh fails, user is logged out and redirected
```

## Configuration

### Retry Configuration

You can customize the exponential backoff behavior:

```typescript
authenticationStateManager.setRetryConfig({
  maxRetries: 5,           // Maximum number of retry attempts
  initialDelay: 2000,      // Initial delay in milliseconds
  maxDelay: 30000,         // Maximum delay in milliseconds
  backoffMultiplier: 2,    // Multiplier for exponential backoff
});
```

## Error Types

The manager handles different types of authentication errors:

- **TOKEN_EXPIRED**: Token has expired, attempts automatic refresh
- **REFRESH_FAILED**: Token refresh failed, clears state and redirects to login
- **UNAUTHORIZED**: User is not authorized, clears state and redirects to login
- **NETWORK_ERROR**: Network connectivity issue, doesn't clear state (user might be offline)
- **UNKNOWN**: Unknown error, logs but doesn't automatically logout

## Architecture

### State Flow

```
Application Load
    ↓
Restore Authentication State
    ↓
Validate Tokens
    ↓
[Valid] → Continue with authenticated state
    ↓
[Invalid] → Attempt Token Refresh
    ↓
[Success] → Continue with new tokens
    ↓
[Failure] → Clear state, redirect to login
```

### Token Refresh Flow

```
API Request with Token
    ↓
Receive 401 Response
    ↓
Attempt Token Refresh (with exponential backoff)
    ↓
[Success] → Retry original request with new token
    ↓
[Failure] → Clear authentication state
    ↓
Redirect to login page
```

## Best Practices

1. **Always use the authentication state manager for logout**: Don't directly clear store state
2. **Let the manager handle 401 errors**: The API service integrates automatically
3. **Don't manually refresh tokens**: The automatic refresh runs every 14 minutes
4. **Handle network errors gracefully**: Network errors don't automatically logout users
5. **Use the useAuth hook**: It provides the best integration with the state manager

## Testing

The authentication state manager is designed to be testable:

```typescript
import { AuthenticationStateManager } from '../services/authenticationStateManager';

describe('AuthenticationStateManager', () => {
  let manager: AuthenticationStateManager;
  
  beforeEach(() => {
    manager = new AuthenticationStateManager();
  });
  
  it('should restore authentication state', async () => {
    const state = await manager.restoreAuthenticationState();
    expect(state).toBeDefined();
  });
  
  it('should refresh tokens with exponential backoff', async () => {
    const result = await manager.refreshTokens();
    expect(result.success).toBeDefined();
  });
});
```

## Troubleshooting

### Issue: User keeps getting logged out
- Check if tokens are being properly stored in localStorage
- Verify token expiration times are reasonable
- Check network connectivity for refresh requests

### Issue: Token refresh fails repeatedly
- Verify backend refresh endpoint is working
- Check if refresh tokens are being properly sent
- Review retry configuration (might need more retries or longer delays)

### Issue: 401 errors not being handled
- Ensure API calls are using the `apiRequest` function
- Verify tokens are being passed to API calls
- Check if `skipAuthRetry` flag is being used incorrectly

## Related Files

- `frontend/src/services/api.ts` - API service with 401 handling
- `frontend/src/hooks/useAuth.ts` - Authentication hook
- `frontend/src/stores/authStore.ts` - Legacy authentication store
- `frontend/src/stores/enhancedAuthStore.ts` - Enhanced authentication store
- `frontend/src/services/authService.ts` - Authentication API service
