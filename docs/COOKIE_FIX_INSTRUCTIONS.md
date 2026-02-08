# Cookie Fix Instructions

## Problem
Refresh token cookie disappears immediately after login, causing 401 errors when fetching notifications.

## Root Cause
The refresh token is set as an **httpOnly cookie** by the backend, but it's not being sent with subsequent requests from the frontend. This is likely due to:

1. **Cross-origin cookie restrictions** - Frontend (localhost:3000) and Backend (localhost:5000) are different origins
2. **Cookie domain mismatch** - Cookie might be set for wrong domain
3. **SameSite attribute** - Browser blocking cross-origin cookies

## How to Debug

### Step 1: Check if Cookie is Being Set
1. Open DevTools → Network tab
2. Login
3. Find the `/api/auth/login` request
4. Check Response Headers for `Set-Cookie` header
5. Should see: `refreshToken=...; Path=/; HttpOnly; SameSite=Lax; Domain=localhost`

### Step 2: Check if Cookie is Being Sent
1. After login, open notification panel (triggers fetch)
2. Find the `/api/notifications` request in Network tab
3. Check Request Headers for `Cookie` header
4. Should see: `Cookie: refreshToken=...`

### Step 3: Check Backend Logs
When refresh fails, backend logs should show:
```
🔄 Refresh token request: {
  hasRefreshToken: false,
  allCookies: {},
  cookieHeader: undefined,
  origin: 'http://localhost:3000'
}
⚠️ No refresh token in cookies
   All cookies received: []
   Cookie header: undefined
```

## Fixes Applied

### 1. Added Domain to Cookie (backend/src/controllers/enhancedAuthController.ts)
```typescript
domain: isProduction ? undefined : 'localhost'
```
This allows the cookie to be shared between localhost:3000 and localhost:5000

### 2. Removed Duplicate Notification Fetches
- Removed fetch from NotificationCenter when it opens
- Only useNotifications hook fetches (via GlobalNotifications)
- Prevents cascade of 401 errors

### 3. Added Comprehensive Logging
- Backend logs all cookie details on refresh attempts
- Frontend logs auth state after login
- Easy to identify where cookies are lost

## Alternative Solutions

If the cookie still doesn't work, try these:

### Option A: Use SameSite=None with Secure
```typescript
{
  httpOnly: true,
  secure: true, // Required with SameSite=None
  sameSite: 'none' as const,
  maxAge,
  path: '/',
}
```
**Note:** Requires HTTPS even in development

### Option B: Run Frontend and Backend on Same Port
Use a proxy in vite.config.ts:
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
```
Then change API_BASE_URL to `/api` (no localhost:5000)

### Option C: Store Refresh Token in Response Body (Less Secure)
Instead of httpOnly cookie, return refresh token in response and store in memory only (not localStorage).

## Testing Steps

1. **Clear all cookies and localStorage**
2. **Restart backend** to apply cookie changes
3. **Hard refresh frontend** (Cmd+Shift+R / Ctrl+Shift+F5)
4. **Login**
5. **Check DevTools → Application → Cookies → http://localhost:5000**
   - Should see `refreshToken` cookie
6. **Open notification panel**
7. **Check Network tab** - should NOT see 401 errors
8. **Check backend console** - should see successful refresh logs

## Expected Behavior

After login:
```
✅ Login successful
✅ Access token stored in memory
✅ Refresh token stored in httpOnly cookie
✅ Cookie sent with all API requests
✅ Token refresh works automatically
✅ Notifications load without 401 errors
```

## Current Status

- ✅ Backend sets cookie with correct options
- ✅ Frontend uses credentials: 'include'
- ✅ CORS configured with credentials: true
- ❌ Cookie not being sent with requests (needs verification)
- ❌ Refresh endpoint returns 401 (no cookie received)

## Next Action

**Check the Network tab** after login to see if the `Set-Cookie` header is present in the login response, and if the `Cookie` header is present in subsequent requests.
