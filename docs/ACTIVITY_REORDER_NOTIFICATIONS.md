# Activity Reorder Notifications - Implementation

## Problems Fixed

### 1. Page Refresh When Clicking Notifications
**Issue:** Clicking on a notification caused a full page refresh instead of smooth navigation.

**Root Cause:** NotificationCenter was using `window.location.href` for navigation.

**Solution:** Changed to use React Router's `useNavigate()` hook for client-side navigation.

**File:** `frontend/src/components/kawaii/NotificationCenterWeb.tsx`
- Added `import { useNavigate } from 'react-router-dom'`
- Changed `window.location.href = actionUrl` to `navigate(actionUrl)`
- Added `onClose()` before navigation to close the notification panel

### 2. Missing Activity Reorder Notifications
**Issue:** When a user reorders activities in a trip, collaborators were not receiving notifications about the change.

**Solution:** Added notification service method and integrated it into the place controller.

## Backend Changes

#### 1. Added Notification Method
**File:** `backend/src/services/notificationService.ts`

Added `notifyActivityReordered()` method that:
- Gets all collaborators for the trip (except the user who reordered)
- Creates a notification for each collaborator
- Uses 'activity' category with 'low' priority
- Includes trip name, place name, and who made the change

```typescript
static async notifyActivityReordered(
  tripId: string,
  placeName: string,
  reorderedByUserId: string,
  reorderedByName: string
): Promise<void>
```

#### 2. Updated Place Controller
**File:** `backend/src/controllers/placeController.ts`

Modified `movePlace()` method to:
- Get the place name after successful reorder
- Get the user's name who performed the reorder
- Call `NotificationService.notifyActivityReordered()`
- Handle errors gracefully (notification failure doesn't break the reorder)

### Notification Details

**Type:** `activity_reordered`
**Category:** `activity`
**Priority:** `low` (not urgent, just informational)
**Title:** "Activity reordered"
**Message:** "{User} reordered "{Place}" in {Trip}"
**Action URL:** `/trips/{tripId}` (clicking takes you to the trip)

### Data Included
- `tripId` - ID of the trip
- `tripName` - Name of the trip
- `placeName` - Name of the activity that was reordered
- `reorderedByUserId` - ID of user who reordered
- `reorderedByName` - Name of user who reordered

## Testing

To test:
1. Open a trip with multiple collaborators
2. Reorder an activity (drag and drop)
3. Check that other collaborators receive a notification
4. Click on the notification - should navigate smoothly without page refresh
5. Notification should appear in:
   - Notification bell icon (unread count increases)
   - Notification center when opened
   - Toast notification (if enabled)

## Related Files
- `backend/src/services/notificationService.ts` - Notification creation
- `backend/src/controllers/placeController.ts` - Place reorder logic
- `backend/src/routes/places.ts` - Route definition
- `frontend/src/components/kawaii/NotificationCenterWeb.tsx` - Notification UI and navigation
- `frontend/src/pages/ScheduleScreen.tsx` - Frontend reorder handling
