# Notification Authentication Fix

## Problem Summary
Notifications were failing to load with 401 Unauthorized errors due to authentication token issues.

## Root Causes Identified

### 1. Refresh Token Cookie Disappearing
- Refresh token cookie is set on login but disappears immediately
- This prevents token refresh from working
- Without refresh capability, access tokens expire and can't be renewed

### 2. Token Not Available When Notifications Fetch
- Notifications were trying to fetch before auth token was fully restored
- `useNotifications` hook was using old `useAuthStore` instead of `useEnhancedAuthStore`
- Multiple components fetching notifications simultaneously

### 3. Wrong Auth Store Usage
- Several components were using `useAuthStore` instead of `useEnhancedAuthStore`
- This caused token mismatches and undefined token values

## Fixes Applied

### 1. Updated Auth Store References
**Files Changed:**
- `frontend/src/hooks/useNotifications.ts` - Changed from `useAuthStore` to `useEnhancedAuthStore`
- `frontend/src/components/notifications/GlobalNotifications.tsx` - Changed to `useEnhancedAuthStore`
- `frontend/src/components/kawaii/NotificationCenterWeb.tsx` - Changed to `useEnhancedAuthStore`

### 2. Fixed Notification Fetch Timing
**File:** `frontend/src/hooks/useNotifications.ts`
- Removed artificial delay (setTimeout)
- Made hook depend on both `isAuthenticated` AND `accessToken`
- Fetch only happens when both are true
- Added detailed logging to track token availability

### 3. Removed Duplicate Fetches
**File:** `frontend/src/App.tsx`
- Removed duplicate notification fetch from App.tsx
- Notifications are now only fetched by `useNotifications` hook (via `GlobalNotifications`)
- Prevents race conditions and multiple 401 errors

### 4. Fixed NotificationCenter Fetch
**File:** `frontend/src/components/kawaii/NotificationCenterWeb.tsx`
- Changed from empty useEffect to proper dependency array
- Now fetches when panel opens AND user is authenticated with token
- Prevents fetch loops while ensuring data is loaded

### 5. Added Comprehensive Logging
**Files:**
- `frontend/src/stores/enhancedAuthStore.ts` - Login flow logging
- `frontend/src/hooks/useNotifications.ts` - Token availability logging
- `frontend/src/services/notificationService.ts` - Token passing logging

## Current Status

### ✅ Working
- Notifications ARE being created in database (verified with `node backend/check_notifications.mjs`)
- Backend notification service is working correctly
- Socket service is configured correctly
- Auth middleware is working

### ❌ Still Broken
- Refresh token cookie disappears immediately after login
- This causes all subsequent API calls to fail with 401
- Token refresh endpoint returns 401 because no cookie is present

## Next Steps to Complete Fix

### Step 1: Debug Cookie Issue
Check browser console after login for:
```
🔐 Login attempt: { email: '...', rememberMe: ... }
📥 Login response: { success: true, hasAccessToken: true, hasRefreshToken: true }
🍪 Cookies after login: [should show refreshToken]
✅ Auth state after login: { isAuthenticated: true, hasAccessToken: true }
```

### Step 2: Verify Cookie Settings
The cookie should have these settings:
- `httpOnly: true`
- `secure: false` (in development)
- `sameSite: 'lax'` (in development)
- `path: '/'`
- `maxAge: 604800000` (7 days) or `2592000000` (30 days if rememberMe)

### Step 3: Check Browser Cookie Storage
1. Open DevTools → Application → Cookies → http://localhost:5000
2. Look for `refreshToken` cookie
3. Check if it exists and has correct settings
4. If it disappears, check if something is clearing it

### Step 4: Possible Cookie Issues
- **SameSite attribute**: May need to be 'none' with secure:true even in dev
- **Domain mismatch**: Frontend on :3000, backend on :5000
- **CORS credentials**: Already set correctly but verify in Network tab
- **Browser blocking**: Some browsers block third-party cookies

## Testing Instructions

1. **Clear all cookies and localStorage**
2. **Login with a test account**
3. **Check console logs** for the sequence:
   - Login attempt
   - Login response with tokens
   - Cookies after login
   - Auth state set
   - Socket connection
   - Notification fetch attempt
4. **Check Network tab** for:
   - Login request has `credentials: include`
   - Response has `Set-Cookie` header
   - Subsequent requests include Cookie header

## Database Verification

Notifications ARE in the database:
```bash
cd backend
node check_notifications.mjs
```

Shows 25 activity_reordered notifications for both users.

## Files Modified

1. `frontend/src/stores/enhancedAuthStore.ts` - Added logging
2. `frontend/src/hooks/useNotifications.ts` - Fixed auth store, timing, logging
3. `frontend/src/components/notifications/GlobalNotifications.tsx` - Fixed auth store
4. `frontend/src/components/kawaii/NotificationCenterWeb.tsx` - Fixed auth store, fetch timing
5. `frontend/src/App.tsx` - Removed duplicate fetch
6. `frontend/src/services/notificationService.ts` - Added token logging

## Related Issues

- Refresh token cookie management
- Token lifecycle and expiration
- Cross-origin cookie handling
- Auth state synchronization
