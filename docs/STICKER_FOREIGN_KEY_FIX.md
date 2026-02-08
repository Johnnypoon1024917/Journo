# Sticker Foreign Key Constraint Fix

## Problem
When attaching emoji stickers, the application was throwing a foreign key constraint error:
```
insert or update on table "sticker_attachments" violates foreign key constraint "sticker_attachments_sticker_id_fkey"
```

## Root Cause
The `attachSticker` controller was passing `actualStickerId` (which was `null` for emoji stickers) to the database INSERT statement. However, JavaScript's `null` wasn't being properly handled by the PostgreSQL driver, causing it to try to validate the value as a foreign key reference instead of treating it as SQL NULL.

## Solution
Explicitly coerce the values to `null` using the `|| null` operator to ensure PostgreSQL receives proper NULL values.

### Code Change
**File:** `backend/src/controllers/stickerController.ts`

**Before:**
```typescript
[
  actualStickerId,    // Could be undefined, causing issues
  emojiCharacter,     // Could be undefined, causing issues
  userId,
  // ...
]
```

**After:**
```typescript
[
  actualStickerId || null,  // Explicitly use null if not set
  emojiCharacter || null,   // Explicitly use null if not set
  userId,
  // ...
]
```

## How It Works

### Emoji Stickers
- `sticker_id` = `null`
- `emoji_sticker` = emoji character (e.g., '🎒', '✈️')
- No foreign key validation needed

### Custom Stickers
- `sticker_id` = UUID reference to `stickers` table
- `emoji_sticker` = `null`
- Foreign key validated against `stickers` table

### Database Constraint
The table has a CHECK constraint ensuring exactly one is set:
```sql
CONSTRAINT check_sticker_type CHECK (
    (sticker_id IS NOT NULL AND emoji_sticker IS NULL) OR
    (sticker_id IS NULL AND emoji_sticker IS NOT NULL)
)
```

## Testing
To verify the fix:
1. Go to Schedule screen
2. Click "貼上貼紙" (Attach Sticker) button
3. Select an emoji sticker (🎒, ✈️, etc.)
4. Place it on the day card
5. Should save successfully without foreign key errors

## Status
✅ **Fixed** - Emoji stickers now attach correctly

## Related Issues
- Previous fix: `STICKER_DATABASE_FIX.md` - Fixed missing `emoji_sticker` column
- This fix: Proper NULL handling for emoji vs custom stickers

## Files Modified
- `backend/src/controllers/stickerController.ts` - Fixed NULL handling in INSERT statement
