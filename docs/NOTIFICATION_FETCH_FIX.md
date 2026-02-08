# Notification Fetch Fix

## Problem
Notifications were being created in the database but not appearing in the frontend. The issue had multiple causes:

### 1. Database Connection Issue
- Check scripts were being run from wrong directory
- `DATABASE_URL` was undefined when run from project root
- Scripts need to be run from `backend/` directory to load `.env` correctly

### 2. Token Not Available
- Notifications were being fetched before auth token was restored
- `getAuthToken()` was returning `undefined`
- API requests were failing with 401 Unauthorized

### 3. Wrong Auth Store
- Components were using `useAuthStore` instead of `useEnhancedAuthStore`
- Token was available in enhanced store but not being accessed

## Solution

### 1. Fixed Auth Store Usage
Updated all notification-related components to use `useEnhancedAuthStore`:
- `frontend/src/hooks/useNotifications.ts`
- `frontend/src/components/notifications/GlobalNotifications.tsx`
- `frontend/src/components/kawaii/NotificationCenterWeb.tsx`

### 2. Fixed Notification Fetching
Updated `useNotifications` hook to:
- Depend on BOTH `isAuthenticated` AND `accessToken`
- Only fetch when token is actually available
- Remove artificial delays
- Fetch immediately when auth is ready

### 3. Fixed NotificationCenter
Updated `NotificationCenterWeb.tsx` to:
- Fetch notifications when panel opens AND user is authenticated
- Check for both `isAuthenticated` and `accessToken` before fetching

### 4. Added Logging
Added detailed logging to track token availability:
- `getAuthToken()` now logs token preview
- `getNotifications()` logs if token is available
- `useNotifications` logs when auth is ready

## Verification

### Check Notifications in Database
```bash
cd backend
node check_notifications.mjs
```

### Expected Flow
1. User logs in
2. `useEnhancedAuthStore` sets `isAuthenticated` and `accessToken`
3. `GlobalNotifications` renders and calls `useNotifications()`
4. `useNotifications` detects auth is ready → fetches notifications
5. Notifications appear in UI
6. Socket connection established for real-time updates

### Console Logs to Watch For
```
✅ Auth ready, fetching notifications with token: eyJhbGciOiJIUzI1NiIs...
getAuthToken called, token exists: true token preview: eyJhbGciOiJIUzI1NiIs...
📬 getNotifications - token available: true
🌐 API Request: { endpoint: '/notifications?limit=50&offset=0', method: 'GET', hasToken: true }
```

## Files Modified
- `frontend/src/hooks/useNotifications.ts` - Fixed auth store, removed delay, added token dependency
- `frontend/src/components/notifications/GlobalNotification