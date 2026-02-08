# Page Refresh Loop Fix

## Problem
The page was constantly refreshing, making it unusable. This was caused by multiple infinite loops:

1. **Notifications hook** (`useNotifications`) had `accessToken` in its dependency array
2. **NotificationCenter** had `accessToken` in its dependency array AND was fetching on every open
3. **App.tsx** had theme loading functions in its dependency array
4. When these components made API calls and got 401 responses, the API service would automatically refresh the token
5. Token refresh updated `accessToken` in the auth store
6. This triggered the `useEffect` hooks again (because they depended on `accessToken`)
7. New API calls → 401 → token refresh → `accessToken` update → **infinite loop**

## Root Cause
**Over-reactive useEffect dependencies** - Components were re-running their initialization logic every time the access token was refreshed, which happened every 14 minutes or whenever a 401 was encountered.

The auth store uses Zustand's `persist` middleware which stores tokens in localStorage, but components were checking the token synchronously before it was hydrated from storage.

## Solution

### 1. Fixed `useNotifications` Hook
**File:** `frontend/src/hooks/useNotifications.ts`

**Changed:**
```typescript
// BEFORE - triggers on every token refresh
}, [isAuthenticated, accessToken, addNotification, fetchNotifications]);

// AFTER - only triggers on login/logout
}, [isAuthenticated]);
```

**Why:** Notifications only need to be fetched once when the user logs in, not every time the token refreshes. The socket connection handles real-time updates.

### 2. Fixed `NotificationCenter` Component
**File:** `frontend/src/components/kawaii/NotificationCenterWeb.tsx`

**Changed:**
```typescript
// BEFORE - re-fetches every time opened or token changes
useEffect(() => {
  if (visible && isAuthenticated && accessToken) {
    fetchNotifications();
  }
}, [visible, isAuthenticated, accessToken, fetchNotifications]);

// AFTER - doesn't fetch at all, uses already-loaded notifications
useEffect(() => {
  // Don't fetch on open - notifications are already loaded by useNotifications hook
}, [visible, isAuthenticated]);
```

**Why:** 
- Notifications are already fetched by the `useNotifications` hook on login
- Fetching again when opening the center was redundant and caused refresh loops
- Real-time updates come through socket connections
- This prevents any API calls that could trigger token refreshes

### 3. Fixed App Initialization
**File:** `frontend/src/App.tsx`

**Changed:**
```typescript
// BEFORE - triggers when theme functions change
}, [initializeOffline, initializeABTest, loadSystemTheme]);

// AFTER - only runs once on mount
}, []);
```

**Why:** App initialization (theme loading, offline setup, etc.) should only happen once when the app loads, not on every token refresh.

### 4. Fixed Notification Service
**File:** `frontend/src/services/notificationService.ts`

**Changed:** Now gets token directly from store instead of through a utility that might use stale localStorage data.

## How Token Refresh Should Work

### Correct Flow:
1. User makes API request
2. API returns 401 (token expired)
3. API service automatically calls `refreshToken()`
4. New access token is stored in auth store
5. Original API request is retried with new token
6. **No components re-render or re-initialize**

### What Was Happening (Bug):
1. User makes API request
2. API returns 401
3. Token refresh updates `accessToken`
4. **All components with `accessToken` dependency re-run**
5. **New API calls are made (notifications, theme, etc.)**
6. **These might also get 401, triggering more refreshes**
7. **Infinite loop of refreshes**

## Testing

After this fix:
- ✅ Page should not refresh constantly
- ✅ Notifications should load once on login
- ✅ Clicking notification bell should NOT trigger any fetches or refreshes
- ✅ Notification center displays already-loaded notifications
- ✅ Theme should load once on app start
- ✅ Token refresh should happen silently in the background
- ✅ API calls should automatically retry with new token after refresh

## Prevention

**Rule:** Only include `accessToken` in `useEffect` dependencies if you truly need to re-run the effect when the token changes. In most cases, you only need `isAuthenticated` to know if the user is logged in.

**Good:**
```typescript
useEffect(() => {
  if (isAuthenticated) {
    fetchData(); // Only fetch once on login
  }
}, [isAuthenticated]);
```

**Bad:**
```typescript
useEffect(() => {
  if (accessToken) {
    fetchData(); // Fetches every 14 minutes when token refreshes!
  }
}, [accessToken]);
```

**Even Worse:**
```typescript
useEffect(() => {
  if (visible && accessToken) {
    fetchData(); // Fetches every time modal opens AND every token refresh!
  }
}, [visible, accessToken]);
```

## Files Changed
1. `frontend/src/hooks/useNotifications.ts` - Removed `accessToken` dependency
2. `frontend/src/components/kawaii/NotificationCenterWeb.tsx` - Removed fetch on open, removed `accessToken` dependency
3. `frontend/src/App.tsx` - Changed to empty dependency array
4. `frontend/src/services/notificationService.ts` - Get token directly from store
5. `frontend/src/stores/enhancedAuthStore.ts` - Added comment clarification
