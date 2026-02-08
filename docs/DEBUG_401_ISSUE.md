# Debug 401 Issue

## Steps to Debug

1. **Open browser console**
2. **After login, run this command:**
   ```javascript
   const state = window.useEnhancedAuthStore?.getState?.() || {};
   console.log('Auth State:', {
     isAuthenticated: state.isAuthenticated,
     hasAccessToken: !!state.accessToken,
     hasRefreshToken: !!state.refreshToken,
     accessTokenPreview: state.accessToken?.substring(0, 30) + '...',
     refreshTokenPreview: state.refreshToken?.substring(0, 30) + '...'
   });
   ```

3. **Check Network tab:**
   - Find the `/api/notifications` request
   - Check Request Headers
   - Look for `Authorization: Bearer ...`
   - If missing, token is not being sent

4. **Check backend logs:**
   - Should see: `🔐 Auth middleware - checking authentication`
   - Should see: `Token received: ...`
   - If you see `❌ No token provided`, frontend is not sending it

## Possible Issues

### Issue 1: Token Not in Store
- Login didn't save tokens properly
- Check login response in Network tab
- Should have `accessToken` and `refreshToken` in response body

### Issue 2: Token Not Being Sent
- `getAuthToken()` in notificationService returns undefined
- Check if it's reading from correct store

### Issue 3: Token Invalid/Expired
- Token might be malformed
- Check backend logs for JWT verification error

## Quick Fix Test

Run this in console after login:
```javascript
// Check if store is accessible
console.log('Store:', window.useEnhancedAuthStore);

// Get current state
const state = window.useEnhancedAuthStore.getState();
console.log('State:', state);

// Try to fetch notifications manually
fetch('http://localhost:5000/api/notifications?limit=5', {
  headers: {
    'Authorization': `Bearer ${state.accessToken}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(d => console.log('Manual fetch result:', d))
.catch(e => console.error('Manual fetch error:', e));
```

If manual fetch works, the issue is in how the notification service gets the token.
