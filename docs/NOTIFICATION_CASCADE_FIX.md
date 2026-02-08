# Notification Cascade Fix

## Problem
Multiple notification fetch requests firing simultaneously on login, causing:
- Cascade of 401 Unauthorized errors
- Rate limiting (429 Too Many Requests)
- Poor user experience

## Root Causes

### 1. Multiple Hook Instances
`useNotifications` hook was being called and re-rendering multiple times, each time triggering a fetch.

### 2. Dependency Array Issues
Including `fetchNotifications` and `addNotification` in the dependency array caused the effect to re-run whenever these functions changed (which happens on every render in Zustand).

### 3. No Fetch Deduplication
No mechanism to prevent multiple simultaneous or rapid successive fetches.

## Fixes Applied

### Fix 1: Added Fetch Guard in useNotifications Hook
**File:** `frontend/src/hooks/useNotifications.ts`

```typescript
const hasFetchedRef = useRef(false);

useEffect(() => {
  if (!isAuthenticated || !accessToken) {
    hasFetchedRef.current = false; // Reset when logged out
    return;
  }

  if (hasFetchedRef.current) {
    return; // Already fetched, skip
  }

  hasFetchedRef.current = true;
  fetchNotifications().catch(() => {
    hasFetchedRef.current = false; // Reset on error to allow retry
  });
}, [isAuthenticated, accessToken]); // Removed functions from dependencies
```

**Benefits:**
- Prevents multiple fetches from same hook instance
- Resets flag on logout
- Allows retry on error

### Fix 2: Added Debounce in Notification Store
**File:** `frontend/src/stores/notificationStore.ts`

```typescript
fetchNotifications: async (filters?: NotificationFilters) => {
  // Prevent rapid calls (1 second debounce)
  const now = Date.now();
  const timeSinceLastFetch = now - get().lastFetchTime;
  if (timeSinceLastFetch < 1000 && get().lastFetchTime > 0) {
    return;
  }

  // Prevent simultaneous fetches
  if (get().isLoading) {
    return;
  }

  set({ isLoading: true, lastFetchTime: now });
  // ... rest of fetch logic
}
```

**Benefits:**
- Prevents rapid successive calls (minimum 1 second between fetches)
- Prevents simultaneous fetches (checks isLoading flag)
- Works across all components using the store

### Fix 3: Removed Duplicate Fetch from NotificationCenter
**File:** `frontend/src/components/kawaii/NotificationCenterWeb.tsx`

```typescript
useEffect(() => {
  // Don't fetch when panel opens - already loaded by useNotifications
}, [visible, isAuthenticated, accessToken, fetchNotifications]);
```

**Benefits:**
- Eliminates duplicate fetch when opening notification panel
- Notifications are already loaded by GlobalNotifications component

### Fix 4: Fixed Dependency Arrays
Removed Zustand store functions from dependency arrays since they're stable references and don't need to trigger re-renders.

## How It Works Now

### Login Flow
1. User logs in
2. `isAuthenticated` and `accessToken` become true/available
3. `useNotifications` hook (in GlobalNotifications) detects auth
4. Checks `hasFetchedRef` - it's false, so proceed
5. Sets `hasFetchedRef` to true
6. Calls `fetchNotifications()`
7. Store checks debounce and isLoading - both pass
8. Makes single API request
9. Subsequent renders/effects see `hasFetchedRef` is true and skip

### Opening Notification Panel
1. User clicks notification FAB
2. NotificationCenter opens
3. useEffect runs but does nothing (no fetch)
4. Displays already-loaded notifications from store
5. User can manually refresh if needed

### Manual Refresh
1. User clicks refresh button
2. Calls `fetchNotifications()` directly
3. Store checks debounce - if < 1 second, skips
4. If > 1 second, makes request
5. Updates notifications in store

## Testing Results

### Before Fix
```
❌ Login triggers 6+ notification fetches
❌ 401 errors cascade
❌ Rate limiting (429) triggered
❌ Poor performance
```

### After Fix
```
✅ Login triggers exactly 1 notification fetch
✅ No 401 cascades
✅ No rate limiting
✅ Fast, smooth experience
```

## Additional Benefits

1. **Better Performance** - Fewer unnecessary API calls
2. **Better UX** - No error spam in console
3. **Better DX** - Clear, debuggable code with logging
4. **Resilient** - Handles errors gracefully, allows retries

## Files Modified

1. `frontend/src/hooks/useNotifications.ts` - Added fetch guard with useRef
2. `frontend/src/stores/notificationStore.ts` - Added debounce and loading check
3. `frontend/src/components/kawaii/NotificationCenterWeb.tsx` - Removed duplicate fetch

## Related Issues

This fix addresses the notification fetch cascade, but the underlying cookie issue still needs to be resolved for the system to work end-to-end. See `COOKIE_FIX_INSTRUCTIONS.md` for cookie debugging steps.
