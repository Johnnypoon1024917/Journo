# Notification File Rename Fix

## Problem
There were two files with conflicting names:
- `useNotifications.ts` - New real-time notification system (backend notifications)
- `useNotifications.tsx` - Old toast notification provider (context-based UI notifications)

This caused import conflicts where TripPlanner couldn't find `NotificationProvider`.

## Solution
Renamed the old toast notification system to avoid conflicts:
- `useNotifications.tsx` → `useToastNotifications.tsx`

## Files Updated
1. **Renamed:** `frontend/src/hooks/useNotifications.tsx` → `frontend/src/hooks/useToastNotifications.tsx`
2. **Updated import:** `frontend/src/pages/TripPlanner.tsx`
   - Changed: `import { NotificationProvider } from '../hooks/useNotifications';`
   - To: `import { NotificationProvider } from '../hooks/useToastNotifications';`

## Current State
- **useNotifications.ts** - Real-time notifications from backend (used by GlobalNotifications)
- **useToastNotifications.tsx** - Toast notification provider (used by TripPlanner legacy page)

## To Fix the Error
**Restart your frontend dev server:**
```bash
cd frontend
# Stop the current server (Ctrl+C)
npm run dev
```

The error you're seeing is from the dev server cache. After restarting, it will pick up the renamed file.

## Verification
After restart, check:
1. ✅ TripPlanner page loads without errors
2. ✅ No "Failed to resolve import" errors
3. ✅ Notifications still work on other pages
