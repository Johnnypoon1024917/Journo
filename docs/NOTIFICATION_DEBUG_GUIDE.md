# Notification System Debugging Guide

## Problem
Collaborators are not receiving notifications when activities are reordered.

## Debugging Steps

### Step 1: Check if Backend is Creating Notifications

Run the check script:
```bash
cd backend
node check_notifications.mjs
```

**Expected output:**
- Should show recent notifications in the database
- Should show count of `activity_reordered` notifications

**If no notifications:** Backend is not creating them. Check backend logs when reordering.

### Step 2: Check Backend Logs

When you reorder an activity, look for these logs in your backend terminal:

```
🔄 movePlace called: { userId: '...', placeId: '...', target_day_id: '...', target_index: 0 }
🔔 Attempting to send activity reorder notification: { tripId: '...', placeName: '...', userId: '...', userName: '...' }
🔔 notifyActivityReordered called: { tripId: '...', placeName: '...', ... }
📋 Found X collaborators to notify: [ 'email@example.com' ]
📍 Trip name: My Trip
📬 Creating notification for email@example.com...
✅ Notification created for email@example.com
✅ All activity reorder notifications sent
Emitted notification to user: <user-id>
```

**If you don't see these logs:**
- The notification method is not being called
- Check if the place controller is using the updated code

**If you see "Found 0 collaborators":**
- The trip has no collaborators
- Check the `trip_collaborators` table

### Step 3: Check Socket Connection (Frontend)

Open browser console and look for:

```
🔌 Initializing socket connection with auth token
Socket connected: <socket-id>
```

**If you don't see these:**
- Socket is not connecting
- Check if user is authenticated
- Check if `accessToken` exists in auth store

**If you see connection errors:**
- Check backend is running
- Check CORS settings
- Check socket.io server is initialized

### Step 4: Check Socket Event Reception (Frontend)

In browser console, look for:

```
📬 Received new notification: { notification: {...}, timestamp: '...' }
```

**If you don't see this:**
- Socket is connected but not receiving events
- Backend might not be emitting to the correct user
- Check backend logs for "Emitted notification to user"

### Step 5: Check Notification Store

In browser console, run:
```javascript
// Check if notifications are in the store
useNotificationStore.getState().notifications
```

**Expected:** Should show array of notifications

**If empty:**
- Notifications are not being added to the store
- Check if `addNotification` is being called in the socket handler

### Step 6: Manual Test

Create a test notification:
```bash
cd backend
node test_notification.mjs
```

This will:
1. Create a notification in the database
2. Show you the notification details
3. Help verify the database connection works

### Step 7: Check Trip Collaborators

Verify the trip has collaborators:
```sql
SELECT 
  tc.trip_id,
  t.name as trip_name,
  u.email,
  u.first_name,
  u.last_name,
  tc.role
FROM trip_collaborators tc
JOIN trips t ON t.id = tc.trip_id
JOIN users u ON u.id = tc.user_id
WHERE tc.trip_id = '<your-trip-id>';
```

**If no results:**
- The trip has no collaborators
- Add collaborators through the UI first

## Common Issues

### Issue 1: No Collaborators Found
**Symptom:** Backend logs show "Found 0 collaborators to notify"

**Solution:**
1. Make sure the trip has collaborators
2. Check the `trip_collaborators` table
3. Verify the user who reordered is not the only collaborator

### Issue 2: Socket Not Connected
**Symptom:** No socket connection logs in browser console

**Solution:**
1. Restart frontend dev server
2. Clear browser cache and reload
3. Check if user is logged in
4. Check if `accessToken` exists

### Issue 3: Notifications Created But Not Received
**Symptom:** Notifications in database but not showing in UI

**Solution:**
1. Check socket connection is active
2. Check backend is emitting socket events
3. Check frontend is listening for `notification:new` events
4. Verify user IDs match between backend emission and frontend connection

### Issue 4: Socket Connected But No Events
**Symptom:** Socket connected but no notification events received

**Solution:**
1. Check backend logs for "Emitted notification to user"
2. Verify the user ID in the socket connection matches the notification recipient
3. Check if socket authentication is working
4. Try manual test with `test_notification.mjs`

## Files to Check

1. **Backend:**
   - `backend/src/controllers/placeController.ts` - Calls notification service
   - `backend/src/services/notificationService.ts` - Creates notifications and emits socket events
   - `backend/src/services/socketService.ts` - Handles socket connections and emissions

2. **Frontend:**
   - `frontend/src/App.tsx` - Initializes socket connection
   - `frontend/src/hooks/useNotifications.ts` - Listens for socket events
   - `frontend/src/stores/notificationStore.ts` - Manages notification state
   - `frontend/src/components/notifications/GlobalNotifications.tsx` - Displays notifications

## Quick Checklist

- [ ] Backend server is running
- [ ] Frontend dev server is running
- [ ] User is logged in
- [ ] Socket connection is established (check browser console)
- [ ] Trip has multiple collaborators
- [ ] Activity reorder triggers backend logs
- [ ] Backend creates notification in database
- [ ] Backend emits socket event
- [ ] Frontend receives socket event
- [ ] Notification appears in UI
