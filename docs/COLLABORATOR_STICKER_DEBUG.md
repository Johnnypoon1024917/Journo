# Collaborator Sticker Debug Guide

## Issue
Collaborators cannot add, move, or resize stickers.

## Debug Steps

### 1. Check if Collaborator Can See Stickers in Picker

**Open browser console and look for:**
```
🎨 Loading stickers from API...
📦 Raw stickers data from API: {custom: Array(X), public: Array(X), shared: Array(X), predefined: Array(16)}
```

**Expected:** `shared` array should have at least 1 sticker (the owner's custom sticker)

**If shared is empty (0):**
- Check backend logs for: `🤝 Shared stickers query result:`
- Verify the collaborator is in `trip_collaborators` table
- Verify the owner has uploaded custom stickers

### 2. Check if Add Sticker Button is Visible

**Look for the sparkles button (✨) in the Schedule screen**

**If button is not visible:**
- Check if `selectedDay` is set
- Check browser console for any React errors

### 3. Check if Sticker Modal Opens

**Click the sparkles button**

**Expected:** Modal should open showing stickers

**If modal doesn't open:**
- Check console for errors
- Verify `isStickerModalOpen` state is being set

### 4. Check if Sticker Attachment Works

**Select a sticker and click "Attach"**

**Look for console logs:**
```
📌 Attaching sticker to day: {stickerId, dayId, tripId}
📌 Attaching sticker: {stickerId, entityType, elementId, position, tripId}
```

**If you see an error:**
```
❌ Error attaching sticker: [error message]
❌ Error details: {message, response, status}
```

**Common errors:**
- `403 Forbidden` - Permission denied (check backend permissions)
- `404 Not Found` - Sticker or day not found
- `401 Unauthorized` - Not logged in or token expired

### 5. Check Backend Permission

**Backend should log:**
```
Attach sticker request: {userId, stickerId, entityType, entityId, position}
```

**Then check permission:**
```
Permission denied for user: [userId] entity: [entityType] [entityId]
```

**If permission denied:**
- Verify collaborator role is 'editor' (not 'viewer')
- Check `user_can_edit_trip()` function returns true

### 6. Check if Sticker Appears After Attachment

**After successful attachment, look for:**
```
✅ Sticker attached successfully: [placement]
Sticker added successfully!
```

**Then check StickerDisplay:**
```
🎨 StickerDisplay render: {elementId, elementType, tripId, editable, stickersCount, placementsCount}
🔄 Loading placements for: {elementId, elementType, entityType}
✅ Loaded sticker placements: {elementId, count, placements}
```

**If sticker doesn't appear:**
- Check if `editable={true}` is set
- Check if placements array is updated
- Refresh the page to see if sticker persists

### 7. Check Drag/Resize Functionality

**Hover over the sticker**

**Expected:**
- Remove button (X) appears in top-right
- Resize controls appear at bottom
- Cursor changes to grab hand

**Try dragging:**
```
🎯 Sticker drag ended: {placementId, oldPosition, offset, newPosition, elementId, elementType}
✅ Sticker position updated successfully
```

**Try resizing:**
```
🔍 Sticker resize: {placementId, newScale, elementId, elementType}
✅ Sticker scale updated successfully
```

## Quick Fixes

### Fix 1: Collaborator Role
```sql
-- Check collaborator role
SELECT tc.user_id, tc.role, u.email 
FROM trip_collaborators tc
JOIN users u ON tc.user_id = u.id
WHERE tc.trip_id = '[TRIP_ID]';

-- Update to editor if needed
UPDATE trip_collaborators 
SET role = 'editor' 
WHERE trip_id = '[TRIP_ID]' AND user_id = '[USER_ID]';
```

### Fix 2: Clear Rate Limits
```bash
cd backend
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  await pool.query(\"DELETE FROM rate_limits WHERE action = 'attach_sticker'\");
  console.log('✅ Rate limits cleared');
  await pool.end();
})();
"
```

### Fix 3: Verify Permissions Function
```bash
cd backend
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const result = await pool.query(
    'SELECT user_can_edit_trip(\$1, \$2) as can_edit',
    ['[COLLABORATOR_USER_ID]', '[TRIP_ID]']
  );
  console.log('Can edit:', result.rows[0].can_edit);
  await pool.end();
})();
"
```

## Test Checklist

- [ ] Collaborator can see shared stickers in picker
- [ ] Collaborator can click "Add Sticker" button
- [ ] Sticker modal opens
- [ ] Collaborator can select a sticker
- [ ] Sticker attaches successfully (no 403 error)
- [ ] Sticker appears on the day card
- [ ] Collaborator can drag the sticker
- [ ] Collaborator can resize the sticker
- [ ] Collaborator can remove the sticker
- [ ] Changes persist after page refresh

## Contact Points

If all debug steps pass but stickers still don't work:
1. Check if `editable` prop is being passed correctly to StickerDisplay
2. Verify motion/framer-motion is installed and working
3. Check for CSS conflicts hiding the sticker controls
4. Verify the sticker image URL is accessible

---

**Last Updated:** 2026-02-07
