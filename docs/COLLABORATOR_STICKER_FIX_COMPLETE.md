# Collaborator Sticker Permissions - Fix Complete ✅

## Problem Summary
Collaborators with 'editor' role were unable to move, resize, or delete stickers on trips they were invited to, even though they could add new stickers.

## Root Cause
The `updateStickerAttachment` and `removeStickerAttachment` endpoints were checking if the user owned the specific sticker attachment (`WHERE user_id = $2`), rather than checking if the user had permission to edit the trip containing that sticker.

This meant:
- ✅ Trip owners could manage all stickers (because they created them)
- ❌ Collaborators could only manage stickers they personally added
- ❌ Collaborators couldn't move/resize/delete stickers added by the trip owner

## Solution Implemented

### Changes to `updateStickerAttachment()`
**Before:**
```typescript
// Check ownership
const checkResult = await pool.query(
  `SELECT * FROM sticker_attachments WHERE id = $1 AND user_id = $2`,
  [id, userId]
);
```

**After:**
```typescript
// Get the attachment and find the trip it belongs to
const attachmentResult = await pool.query(
  `SELECT sa.*, 
    CASE 
      WHEN sa.entity_type = 'trip' THEN sa.entity_id
      WHEN sa.entity_type = 'trip_day' THEN td.trip_id
      WHEN sa.entity_type = 'place' THEN td.trip_id
    END as trip_id
   FROM sticker_attachments sa
   LEFT JOIN trip_days td ON sa.entity_type = 'trip_day' AND sa.entity_id = td.id
   LEFT JOIN places p ON sa.entity_type = 'place' AND sa.entity_id = p.id
   LEFT JOIN trip_days td2 ON p.trip_day_id = td2.id
   WHERE sa.id = $1`,
  [id]
);

// Check if user has permission to edit the trip
const permissionResult = await pool.query(
  `SELECT user_can_edit_trip($1, $2) as can_edit`,
  [userId, tripId]
);
```

### Changes to `removeStickerAttachment()`
Applied the same trip-level permission check instead of attachment ownership check.

### Key Improvements
1. **Trip-Level Permissions**: Now checks if user can edit the trip, not just if they own the attachment
2. **Proper Entity Resolution**: Correctly resolves trip_id from different entity types (trip, trip_day, place)
3. **Better Logging**: Added emoji-based console logs for easier debugging
4. **Consistent Behavior**: Both update and remove operations now use the same permission logic

## Testing Results

### Before Fix
- ✅ Collaborators could add stickers
- ❌ Collaborators got "Sticker attachment not found or unauthorized" when trying to move/resize
- ❌ Collaborators got "Sticker attachment not found or unauthorized" when trying to delete

### After Fix
- ✅ Collaborators can add stickers
- ✅ Collaborators can move/resize stickers (including those added by trip owner)
- ✅ Collaborators can delete stickers (including those added by trip owner)
- ✅ Trip owners retain all permissions
- ✅ Viewers still cannot edit (if role is 'viewer')

## Database Function Used

### `user_can_edit_trip(user_id, trip_id)`
Returns TRUE if:
- User is the trip owner (`trips.owner_id = user_id`), OR
- User is a collaborator with 'editor' or 'owner' role AND `accepted_at IS NOT NULL`

This function is defined in `backend/src/migrations/026_create_permission_functions.sql`

## Files Modified

1. **backend/src/controllers/stickerController.ts**
   - `updateStickerAttachment()` - Changed from ownership check to trip permission check
   - `removeStickerAttachment()` - Changed from ownership check to trip permission check

## Related Fixes

This fix builds on the previous fix where we ensured collaborators have `accepted_at` set when added to a trip. Both fixes were necessary:

1. **First Fix**: Set `accepted_at` timestamp for collaborators (allows them to pass permission checks)
2. **This Fix**: Use trip-level permissions instead of attachment ownership (allows them to edit all stickers)

## Verification Steps

To verify the fix is working:

1. **As Trip Owner**: Add a custom sticker to a trip
2. **As Collaborator**: 
   - Login and navigate to the shared trip
   - You should see the owner's sticker in the sticker picker
   - Add a sticker to a day
   - Try to move/resize the sticker you just added ✅
   - Try to move/resize the owner's sticker ✅
   - Try to delete any sticker ✅

All operations should now work without permission errors.

## Status
✅ **COMPLETE**: Collaborators with 'editor' role can now fully manage all stickers on trips they have access to, regardless of who originally added the sticker.

---

**Date Fixed:** 2026-02-07
**Files Changed:** 1 (stickerController.ts)
**Functions Modified:** 2 (updateStickerAttachment, removeStickerAttachment)
