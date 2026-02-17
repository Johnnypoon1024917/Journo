# Authentication System

## Overview

JWT-based authentication with refresh token rotation, secure session management, and role-based access control.

## Authentication Flow

### Registration
1. User submits email, password, name
2. Backend validates input
3. Password hashed with bcrypt
4. User record created
5. JWT tokens generated
6. Tokens returned to client

### Login
1. User submits email and password
2. Backend validates credentials
3. Generate access token (15min expiry)
4. Generate refresh token (7d expiry)
5. Store refresh token in httpOnly cookie
6. Return access token in response body
7. Frontend stores access token in memory

### Token Refresh
1. Access token expires
2. Frontend detects 401 response
3. Automatically calls /auth/refresh
4. Backend validates refresh token from cookie
5. Generate new access token
6. Rotate refresh token (optional)
7. Return new tokens

### Logout
1. User clicks logout
2. Frontend calls /auth/logout
3. Backend invalidates refresh token
4. Clear httpOnly cookie
5. Frontend clears access token from memory
6. Redirect to login

## Token Structure

### Access Token (JWT)
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Refresh Token
- Stored in httpOnly cookie
- Secure flag in production
- SameSite=Strict
- 7-day expiration

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Security
- Access tokens short-lived (15min)
- Refresh tokens httpOnly cookies
- CSRF protection with SameSite
- Secure flag for HTTPS
- Token rotation on refresh

### Session Management
- Database-backed sessions
- Session invalidation on logout
- Automatic cleanup of expired sessions
- Device tracking (optional)

## Authorization

### Roles
- **user**: Standard user
- **admin**: Administrative access
- **commercial**: Business account

### Trip Permissions
- **owner**: Full control
- **editor**: Can modify
- **viewer**: Read-only

### Middleware
```javascript
// Require authentication
requireAuth

// Require specific role
requireRole('admin')

// Require trip permission
requireTripPermission('editor')
```

## Frontend Implementation

### Auth Store (Zustand)
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

### Axios Interceptors
- Attach access token to requests
- Handle 401 responses
- Automatic token refresh
- Retry failed requests

### Protected Routes
```typescript
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

## Backend Implementation

### Middleware
```javascript
// Verify JWT token
export const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
```

### Routes
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh
- GET /auth/me
- POST /auth/forgot-password
- POST /auth/reset-password

## Error Handling

### Common Errors
- 401 Unauthorized: No/invalid token
- 403 Forbidden: Insufficient permissions
- 400 Bad Request: Invalid credentials
- 429 Too Many Requests: Rate limit exceeded

### Error Responses
```json
{
  "error": "Invalid credentials",
  "code": "AUTH_INVALID_CREDENTIALS"
}
```

## Testing

### Test Credentials
- Email: test@example.com
- Password: Test123!

### Test Scenarios
- Successful login/logout
- Token refresh
- Expired token handling
- Invalid credentials
- Permission checks

## Troubleshooting

### Token Not Refreshing
- Check cookie settings
- Verify CORS configuration
- Check refresh token expiry
- Verify backend endpoint

### 401 Errors
- Check token expiration
- Verify token format
- Check Authorization header
- Clear browser storage

### Cookie Issues
- Verify httpOnly flag
- Check Secure flag (HTTPS)
- Verify SameSite setting
- Check domain configuration
