# Custom Sticker Complete Fix

## Issues Fixed

### 1. Custom Stickers Not Deleting Properly
**Problem:** Deleted custom stickers would reappear after page refresh or reopening the modal.

**Root Causes:**
- Sticker attachments weren't being deleted before deleting the sticker
- Frontend was caching sticker data
- Store wasn't reloading after deletion

**Solutions:**
- Updated `deleteSticker` controller to delete attachments first
- Added cache-busting to `getStickers` API call
- Modal now reloads stickers after deletion

### 2. Foreign Key Constraint Errors
**Problem:** Error when attaching custom stickers: "violates foreign key constraint sticker_attachments_sticker_id_fkey"

**Root Cause:** Trying to attach a sticker that doesn't exist in the database

**Solution:** Added validation in `attachSticker` controller to verify custom sticker exists before creating attachment

### 3. FAB Button Spacing
**Problem:** Add Sticker and Add Activity buttons were too close together

**Solution:** Changed gap from `gap-3` (12px) to `gap-6` (24px) and bottom position from `bottom-20` to `bottom-24`

## Files Modified

### Backend

1. **`backend/src/controllers/stickerController.ts`**
   - Added `uploadSticker` and `deleteSticker` to exports
   - Added sticker existence check in `attachSticker`
   - Updated `deleteSticker` to remove attachments first

```typescript
// Verify custom sticker exists before attaching
if (!isEmojiSticker) {
  const stickerCheck = await pool.query(
    `SELECT id FROM stickers WHERE id = $1`,
    [stickerId]
  );
  
  if (stickerCheck.rows.length === 0) {
    return res.status(404).json({ 
      error: 'Custom sticker not found. Please refresh and try again.' 
    });
  }
}

// Delete attachments before deleting sticker
await pool.query(`DELETE FROM sticker_attachments WHERE sticker_id = $1`, [id]);
```

### Frontend

2. **`frontend/src/stores/stickerStore.ts`**
   - Updated `deleteSticker` to remove placements from store
   - Added console logging for debugging

```typescript
deleteSticker: async (stickerId: string) => {
  await stickerService.deleteSticker(stickerId);
  
  set((state) => ({
    stickers: state.stickers.filter((s) => s.id !== stickerId),
    selectedSticker: state.selectedSticker === stickerId ? null : state.selectedSticker,
    placements: state.placements.filter((p) => p.stickerId !== stickerId),
  }));
}
```

3. **`frontend/src/services/stickerService.ts`**
   - Added cache-busting to `getStickers` API call
   - Added no-cache headers

```typescript
const cacheBuster = `_t=${Date.now()}`;
const url = category 
  ? `/stickers?category=${category}&${cacheBuster}` 
  : `/stickers?${cacheBuster}`;
  
const response = await api.get(url, { 
  token: token || undefined,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});
```

4. **`frontend/src/components/kawaii/StickerModal.tsx`**
   - Added reload after deletion

```typescript
const handleDeleteSticker = async (e: React.MouseEvent, stickerId: string) => {
  e.stopPropagation();
  
  if (confirm('Are you sure you want to delete this sticker?')) {
    try {
      await deleteSticker(stickerId);
      await loadStickers(tripId); // Reload to get fresh data
    } catch (error) {
      console.error('Failed to delete sticker:', error);
      alert('Failed to delete sticker. Please try again.');
    }
  }
};
```

5. **`frontend/src/components/kawaii/FAB.tsx`**
   - Changed `bottom-20` to `bottom-24` (6rem)

## Database Cleanup Scripts

Created three utility scripts for managing stickers:

### 1. `backend/cleanup_all_custom_stickers.mjs`
Removes all custom stickers, their attachments, and files from disk.

**Usage:**
```bash
cd backend
node cleanup_all_custom_stickers.mjs
```

**What it does:**
- Deletes all custom sticker attachments
- Deletes all custom stickers from database
- Removes all files from `uploads/stickers/`
- Preserves emoji sticker attachments
- Verifies cleanup was successful

### 2. `backend/verify_sticker_system.mjs`
Checks the current state of the sticker system.

**Usage:**
```bash
cd backend
node verify_sticker_system.mjs
```

**What it checks:**
- Number of custom stickers in database
- Number of attachments (custom vs emoji)
- Orphaned attachments (attachments with missing stickers)
- Foreign key constraints
- Overall system health

### 3. `backend/test_sticker_upload_delete.mjs`
Tests the complete upload and delete flow.

**Usage:**
```bash
cd backend
node test_sticker_upload_delete.mjs
```

**What it tests:**
- Creates a test sticker
- Saves file to disk
- Inserts into database
- Creates an attachment
- Deletes the sticker
- Verifies everything is cleaned up

## How It Works Now

### Upload Flow
1. User clicks "Upload" button in sticker modal
2. Selects an image file
3. File is converted to base64
4. API call to `/stickers/upload`
5. Backend saves file to `uploads/stickers/`
6. Backend inserts record into `stickers` table
7. Frontend reloads stickers from API
8. New sticker appears in modal

### Delete Flow
1. User hovers over custom sticker
2. Red X button appears
3. User clicks X and confirms
4. API call to `/stickers/:id` (DELETE)
5. Backend deletes attachments first
6. Backend deletes file from disk
7. Backend deletes record from database
8. Frontend removes from store
9. Frontend reloads stickers from API
10. Sticker disappears from modal

### Attach Flow
1. User selects a sticker
2. User clicks "Attach" button
3. API call to `/stickers/attach`
4. Backend checks if custom sticker exists (if not emoji)
5. Backend verifies user has permission
6. Backend creates attachment record
7. Frontend updates store with new placement
8. Frontend reloads placements
9. Sticker appears on day card

## Testing Checklist

✅ **Upload Test:**
- [ ] Upload a custom sticker
- [ ] Verify it appears in the modal
- [ ] Verify file exists in `backend/uploads/stickers/`
- [ ] Verify record exists in database

✅ **Delete Test:**
- [ ] Delete a custom sticker
- [ ] Verify it disappears from modal immediately
- [ ] Close and reopen modal
- [ ] Verify sticker is still gone
- [ ] Refresh page
- [ ] Verify sticker is still gone
- [ ] Check database - no record
- [ ] Check disk - no file

✅ **Attach Test:**
- [ ] Upload a custom sticker
- [ ] Attach it to a day
- [ ] Verify it appears on the day card
- [ ] Refresh page
- [ ] Verify sticker is still there
- [ ] No console errors

✅ **Emoji Test:**
- [ ] Attach emoji stickers
- [ ] Verify they work correctly
- [ ] Delete custom stickers
- [ ] Verify emoji stickers are unaffected

## Database State After Cleanup

```
Custom stickers: 0
Custom attachments: 0
Emoji attachments: 2 (preserved)
Orphaned attachments: 0
Files in uploads/stickers/: 0
```

## Benefits

✅ **Reliable deletion** - Stickers are truly deleted, not just hidden
✅ **No orphaned data** - Attachments are cleaned up automatically
✅ **No file leaks** - Files are removed from disk
✅ **Better UX** - Immediate feedback, no stale data
✅ **Cache-proof** - No browser caching issues
✅ **Better spacing** - FAB buttons easier to tap
✅ **Error prevention** - Validates stickers exist before attaching

## Known Limitations

- Emoji stickers (default-X, emoji-X) cannot be deleted (by design)
- Custom stickers can only be deleted by the user who uploaded them
- Deleting a sticker removes all its attachments across all trips
