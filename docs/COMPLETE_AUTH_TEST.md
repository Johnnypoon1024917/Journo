# Complete Auth System Test

## Test Procedure

### 1. Clear Everything
```javascript
// Run in browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 2. Login
- Use credentials: `cypoon54@gmail.com` / your password
- Watch console for these logs:

**Expected Login Logs:**
```
🔐 Login attempt: { email: '...', rememberMe: false }
📥 Login response: { success: true, hasAccessToken: true, hasRefreshToken: true }
🍪 === COOKIE CHECK AFTER LOGIN ===
✅ Setting auth state with access token: eyJhbGciOiJIUzI1NiIsInR5...
✅ Storing refresh token in memory: eyJhbGciOiJIUzI1NiIsInR5...
✅ Auth state after login: { isAuthenticated: true, hasAccessToken: true, hasRefreshToken: true }
```

### 3. Check Auth State
```javascript
// Run in console
const state = window.useEnhancedAuthStore.getState();
console.log('=== AUTH STATE ===');
console.log('isAuthenticated:', state.isAuthenticated);
console.log('hasAccessToken:', !!state.accessToken);
console.log('hasRefreshToken:', !!state.refreshToken);
console.log('accessToken:', state.accessToken?.substring(0, 50) + '...');
console.log('refreshToken:', state.refreshToken?.substring(0, 50) + '...');
```

**Expected Output:**
```
isAuthenticated: true
hasAccessToken: true
hasRefreshToken: true
accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQ...
refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQ...
```

### 4. Test Manual API Call
```javascript
// Run in console
const state = window.useEnhancedAuthStore.getState();
fetch('http://localhost:5000/api/notifications?limit=5', {
  headers: {
    'Authorization': `Bearer ${state.accessToken}`,
    'Content-Type': 'application/json'
  }
})
.then(r => {
  console.log('Response status:', r.status);
  return r.json();
})
.then(d => console.log('✅ Manual fetch SUCCESS:', d))
.catch(e => console.error('❌ Manual fetch ERROR:', e));
```

**Expected Output:**
```
Response status: 200
✅ Manual fetch SUCCESS: { notifications: [...], unreadCount: 25, hasMore: false }
```

### 5. Check Notification Fetch Logs
Watch console when notifications try to load:

**Expected Logs:**
```
✅ Auth ready for notifications, token preview: eyJhbGciOiJIUzI1NiIsInR5...
🔑 getAuthToken called: { hasState: true, isAuthenticated: true, hasAccessToken: true, tokenPreview: 'eyJhbGciOiJIUzI1NiIsInR5...' }
📬 getNotifications - token available: true
🌐 API Request: { endpoint: '/notifications?limit=50&offset=0', method: 'GET', hasToken: true }
```

## Troubleshooting

### If accessToken is null after login:
1. Check Network tab → `/api/auth/login` response
2. Should have `accessToken` and `refreshToken` in response body
3. If missing, backend is not returning tokens

### If getAuthToken returns null:
1. Store is not persisting state
2. Check if persist middleware is working
3. Try without persist (comment out persist wrapper)

### If 401 still happens:
1. Token might be invalid
2. Check backend logs for JWT verification error
3. Backend might not be accepting the token format

### If manual fetch works but automatic doesn't:
1. Issue is in notification service
2. Check if `getAuthToken()` is being called
3. Check if token is being passed to `api.get()`

## Backend Logs to Check

When notification request comes in:
```
🔐 Auth middleware - checking authentication
Token received: eyJhbGciOiJIUzI1NiIsInR5...
✅ Token verified, user: 46d62fdc-7b1c-4e20-83f9-db7323fbbb46
```

If you see:
```
❌ No token provided or invalid format
```
Then frontend is NOT sending the Authorization header.

## Files to Check

1. `frontend/src/stores/enhancedAuthStore.ts` - Token storage
2. `frontend/src/services/notificationService.ts` - Token retrieval
3. `frontend/src/services/api.ts` - Token sending
4. `backend/src/middleware/auth.ts` - Token validation
5. `backend/src/controllers/enhancedAuthController.ts` - Token generation
