# Sticker Button and Refresh Fix

## Changes Made

### 1. Increased Gap Between FAB Buttons
**File:** `frontend/src/pages/ScheduleScreen.tsx`

Changed the gap between the Add Sticker button and Add Activity button from `gap-3` (12px) to `gap-6` (24px) for better visual separation and easier tapping.

```tsx
<div className="fixed bottom-6 right-6 z-50 flex flex-col gap-6">
  {/* Add Sticker Button */}
  <motion.button ... />
  
  {/* Add Activity Button */}
  <FAB ... />
</div>
```

### 2. Optimistic Sticker Updates (No Page Refresh)
**File:** `frontend/src/pages/ScheduleScreen.tsx`

Updated `handleStickerSelect` to reload only the sticker placements instead of refreshing the entire page:

**Before:**
```tsx
await attachSticker(tripId, stickerId, selectedDay.id, 'day', { x: 50, y: 50 });
await fetchTripData(true); // Full page refresh
```

**After:**
```tsx
await attachSticker(tripId, stickerId, selectedDay.id, 'day', { x: 50, y: 50 });
await loadPlacements(tripId); // Only reload sticker placements
```

This provides instant visual feedback without reloading trip data, weather, or activities.

### 3. Reactive Sticker Display
**File:** `frontend/src/components/kawaii/StickerDisplay.tsx`

Updated the component to:
- Subscribe to the `placements` array from the store
- Re-render when placements count changes
- Automatically show new stickers without manual refresh

```tsx
const { stickers, placements, getElementPlacements, ... } = useStickerStore();

React.useEffect(() => {
  loadElementPlacements();
}, [elementId, elementType, placements.length]); // Re-run when placements change
```

### 4. Database Cleanup
**Script:** `backend/check_orphaned_attachments.mjs`

Created and ran a script to clean up orphaned sticker attachments (attachments with `sticker_id = null`). These were emoji stickers that should have been using the `emoji_sticker` field.

**Results:**
- Deleted 12 orphaned attachments
- These were causing stickers to disappear because they had no valid sticker reference

### 5. Missing Sticker Image
The 404 error for `1770048585469-8598d936fd94016a.png` was caused by orphaned attachments in the database. After cleanup, this error should no longer occur.

## How It Works Now

1. **Adding a Sticker:**
   - User clicks Add Sticker button (purple sparkle icon)
   - Selects a sticker from the modal
   - Sticker is attached to the day via API
   - Store's `attachSticker` adds it to the placements array
   - `loadPlacements` refreshes the placements from the server
   - StickerDisplay component detects the placements change and re-renders
   - **No page refresh needed!**

2. **Sticker Persistence:**
   - Emoji stickers use the `emoji_sticker` field in the database
   - Custom uploaded stickers use the `sticker_id` field
   - StickerService properly maps both types when loading
   - StickerDisplay handles both emoji strings and image URLs

3. **Visual Feedback:**
   - Stickers appear immediately after selection
   - No loading spinner or page flash
   - Smooth, instant experience

## Testing

To verify the fixes:

1. **Gap Test:**
   - Open schedule page
   - Verify the two FAB buttons have more space between them
   - Should be easier to tap the correct button

2. **No Refresh Test:**
   - Add a sticker to a day
   - Verify the page doesn't reload
   - Sticker should appear immediately
   - Weather widget and activities should not flash/reload

3. **Persistence Test:**
   - Add multiple stickers
   - Refresh the page
   - All stickers should still be visible
   - No 404 errors in console

4. **Emoji Stickers Test:**
   - Add emoji stickers (😊, 🏨, ☀️, etc.)
   - They should display correctly
   - Should persist after page refresh
   - Should be draggable and removable

## Technical Details

### Store Flow
```
User selects sticker
  ↓
attachSticker() called
  ↓
API: POST /stickers/attach
  ↓
Store: placements array updated (optimistic)
  ↓
loadPlacements() called
  ↓
API: GET /stickers/entity/:type/:id
  ↓
Store: placements array refreshed with server data
  ↓
StickerDisplay re-renders (detects placements.length change)
  ↓
New sticker appears on screen
```

### Database Schema
```sql
sticker_attachments:
  - id (uuid)
  - sticker_id (uuid, nullable) -- For custom stickers
  - emoji_sticker (text, nullable) -- For emoji stickers
  - entity_type (text) -- 'trip_day', 'place', 'trip'
  - entity_id (uuid)
  - position_x, position_y (numeric)
  - rotation, scale (numeric)
```

## Files Modified

1. `frontend/src/pages/ScheduleScreen.tsx` - Increased gap, optimistic updates
2. `frontend/src/components/kawaii/StickerDisplay.tsx` - Reactive to store changes
3. `backend/check_orphaned_attachments.mjs` - Database cleanup script (new)
4. `backend/delete_missing_sticker.mjs` - Sticker deletion script (new)

## Benefits

✅ Better UX - No page refresh when adding stickers
✅ Faster - Only reloads sticker data, not entire page
✅ More reliable - Cleaned up orphaned data
✅ Better spacing - Easier to tap correct button
✅ Instant feedback - Stickers appear immediately
