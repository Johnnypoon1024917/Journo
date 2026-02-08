# Final Debug Steps

## The Issue
- Other API calls work (stickers, etc.) with the same token
- Only `/api/notifications` returns 401
- Token is being sent (`hasToken: true`)

## What to Check

### 1. Backend Console Logs
When the 401 happens, check backend console for:
```
🔐 Auth middleware - checking authentication
Token received: eyJhbGciOiJIUzI1NiIsInR5...
```

**If you see this**, the token reached the middleware.
**If you DON'T see this**, the middleware isn't being called.

### 2. Check Token in Network Tab
1. Open DevTools → Network
2. Find the failed `/api/notifications` request
3. Click on it → Headers tab
4. Look for `Authorization` header under "Request Headers"
5. Should be: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5...`

**If missing**, frontend is not sending it (but logs say it is, so this is unlikely).

### 3. Compare with Working Request
1. Find a successful sticker request in Network tab
2. Compare its Authorization header with the notification request
3. They should be identical

### 4. Test Notification Endpoint Directly
Run in browser console:
```javascript
const state = window.useEnhancedAuthStore.getState();
fetch('http://localhost:5000/api/notifications?limit=5', {
  headers: {
    'Authorization': `Bearer ${state.accessToken}`,
    'Content-Type': 'application/json'
  }
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

**If this works**, the issue is in how the notification service calls the API.
**If this fails**, the issue is in the backend notification endpoint.

## Possible Causes

### Cause 1: Middleware Not Applied
The `router.use(authenticateToken)` might not be working.
**Fix**: Apply auth to each route individually.

### Cause 2: Route Order Issue
Another route might be catching the request first.
**Check**: Order of route registration in `index.ts`.

### Cause 3: CORS Preflight
OPTIONS request might be failing.
**Check**: Network tab for OPTIONS request before GET.

### Cause 4: Token Expired
Token might have expired between login and notification fetch.
**Check**: Decode token and check `exp` field.

## Quick Fix to Try

If backend logs show the middleware IS being called but still returns 401, add this logging to the notification controller:

```typescript
static async getNotifications(req: Request, res: Response): Promise<void> {
  console.log('📬 getNotifications called');
  console.log('   User from req:', (req as any).user);
  console.log('   Headers:', req.headers.authorization);
  // ... rest of method
}
```

This will show if the user is being attached to the request by the auth middleware.
