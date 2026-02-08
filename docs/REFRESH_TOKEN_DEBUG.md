# Refresh Token Cookie Debugging Guide

## Issue
After login, the refresh token endpoint returns 401 (Unauthorized), indicating the refresh token cookie is not being set or sent properly.

## Debug Logging Added

I've added comprehensive logging to help diagnose the issue:

### Login Endpoint (`/api/auth/login`)
Now logs:
- Whether a refresh token was generated
- Token preview (first 20 chars)
- Cookie options being used
- Remember me setting

### Refresh Endpoint (`/api/auth/refresh`)
Now logs:
- Whether refresh token cookie is present
- Token preview if present
- All cookie names received
- IP address and user agent
- Success/failure of token validation

## How to Debug

### Step 1: Check Backend Logs During Login
1. Open your backend terminal
2. Log in through the frontend
3. Look for this log message:
```
🍪 Setting refresh token cookie: {
  hasToken: true,
  tokenPreview: 'abc123...',
  cookieOptions: { httpOnly: true, secure: false, sameSite: 'lax', ... },
  rememberMe: false
}
```

**If you see this:** The backend is setting the cookie correctly.
**If you don't see this:** The auth service isn't generating a refresh token.

### Step 2: Check Browser Developer Tools
1. Open DevTools (F12)
2. Go to Application/Storage tab
3. Look under Cookies → `http://localhost:5000`
4. Check if `refreshToken` cookie exists

**If cookie exists:** Good! The cookie is being set.
**If cookie doesn't exist:** The browser is rejecting the cookie.

### Step 3: Check Network Tab During Login
1. Open DevTools Network tab
2. Log in
3. Find the `/api/auth/login` request
4. Check the Response Headers for `Set-Cookie`

**Should see:** `Set-Cookie: refreshToken=...`
**If missing:** Backend isn't sending the cookie header.

### Step 4: Check Refresh Token Request
1. Wait for or trigger a refresh token request
2. Check backend logs for:
```
🔄 Refresh token request: {
  hasRefreshToken: true/false,
  cookies: ['refreshToken', ...],
  ...
}
```

**If hasRefreshToken is false:** Cookie isn't being sent by browser.

## Common Issues & Solutions

### Issue 1: Cookie Not Being Set
**Symptoms:** No `Set-Cookie` header in login response
**Causes:**
- Auth service not generating refresh token
- Response sent before cookie is set

**Solution:** Check `enhancedAuthService.ts` login method

### Issue 2: Cookie Not Being Sent
**Symptoms:** Cookie exists in browser but not sent in requests
**Causes:**
- CORS credentials not configured
- SameSite policy blocking cookie
- Domain mismatch

**Solutions:**
1. Verify CORS credentials in `index.ts`:
```typescript
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true, // Must be true!
};
```

2. Verify frontend sends credentials:
```typescript
fetch(url, {
  credentials: 'include', // Must be present!
  ...
});
```

3. Check cookie domain matches request domain

### Issue 3: Cookie Expired or Invalid
**Symptoms:** Cookie exists but refresh returns 401
**Causes:**
- Token expired
- Token not in database
- Token revoked

**Solution:** Check backend logs for validation failure message

### Issue 4: SameSite Issues
**Symptoms:** Cookie not sent in cross-origin requests
**Causes:**
- SameSite=strict in development
- Different ports treated as cross-origin

**Solution:** Already fixed - using `sameSite: 'lax'` in development

## Current Configuration

### Backend Cookie Settings (Development)
```typescript
{
  httpOnly: true,      // Prevents JavaScript access
  secure: false,       // Allows HTTP in development
  sameSite: 'lax',     // Allows cookies in development
  maxAge: 604800000,   // 7 days (or 30 if remember me)
  path: '/'            // Available to all paths
}
```

### Frontend Auth Store
```typescript
const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
  method: 'POST',
  credentials: 'include', // Sends cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Next Steps

1. **Restart the backend** to apply the new logging
2. **Clear all cookies** in your browser for localhost
3. **Log in again** and watch the backend logs
4. **Check the browser DevTools** for the cookie
5. **Wait for or trigger a refresh** and check logs again

Share the log output and I can help diagnose the specific issue!

## Quick Test

Run this in your browser console after logging in:
```javascript
// Check if cookie exists
document.cookie.split(';').find(c => c.trim().startsWith('refreshToken='))

// Try manual refresh
fetch('http://localhost:5000/api/auth/refresh', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
}).then(r => r.json()).then(console.log)
```
