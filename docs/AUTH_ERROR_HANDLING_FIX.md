# Authentication Error Handling Fix

## Problem
The application was showing console errors when token refresh failed:
```
Token refresh error: ApiError: Authentication required
  at apiRequest (api.ts:130:17)
  at async Object.getNotifications (notificationService.ts:46:22)
  at async fetchNotifications (notificationStore.ts:78:24)
```

These errors occurred when:
1. User's refresh token cookie expired or was missing
2. Notification components tried to fetch notifications
3. Token refresh failed (expected behavior for expired sessions)
4. Errors were logged even though this is normal behavior

## Root Cause
The error handling was treating expired sessions as unexpected errors, logging them verbosely even though they're expected when a user's session expires naturally.

## Solution

### 1. Improved API Error Handling (`frontend/src/services/api.ts`)
- Reduced verbose logging for authentication failures
- Only log auth errors in development mode
- Added `AUTH_REQUIRED` error code for better error identification
- Cleaner token refresh retry logic

### 2. Enhanced Notification Store (`frontend/src/stores/notificationStore.ts`)
- Check for `AUTH_REQUIRED` error code specifically
- Silently handle authentication errors without logging
- Moved auth error check before general error logging
- Don't set error state for expected auth failures

### 3. Quieter Token Refresh (`frontend/src/stores/enhancedAuthStore.ts`)
- Removed verbose logging of cookies and response data
- Use `console.debug` instead of `console.warn/error` for expected failures
- Only log in development mode
- Treat refresh failures as normal, not exceptional

### 4. Cleaner NotificationBell Component (`frontend/src/components/notifications/NotificationBell.tsx`)
- Check for `AUTH_REQUIRED` error code
- Remove verbose auth state logging
- Use `console.debug` for non-critical errors in dev mode only
- Gracefully handle auth failures without user-facing errors

## Behavior After Fix

### Expected Session Expiry
When a user's session expires naturally:
- ✅ No console errors
- ✅ Notifications silently fail to load
- ✅ User can continue using the app
- ✅ Re-login will restore notification functionality

### Unexpected Errors
For actual errors (network issues, server errors):
- ✅ Still logged to console in development
- ✅ Error state set appropriately
- ✅ User can see something went wrong

### Development Mode
- Token refresh attempts logged with `console.debug`
- Auth failures logged with `console.debug`
- Easy to debug when needed

### Production Mode
- Minimal logging
- Clean console
- Professional user experience

## Testing
1. Log in to the application
2. Wait for refresh token to expire (or delete the cookie)
3. Observe that notifications fail silently without console errors
4. Verify other features continue to work
5. Re-login and verify notifications work again

## Files Modified
- `frontend/src/services/api.ts` - Improved error handling and logging
- `frontend/src/stores/notificationStore.ts` - Better auth error detection
- `frontend/src/stores/enhancedAuthStore.ts` - Quieter token refresh
- `frontend/src/components/notifications/NotificationBell.tsx` - Cleaner error handling
