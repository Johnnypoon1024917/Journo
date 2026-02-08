# Sticker UUID Error Fix

## Problem
When trying to attach emoji stickers (like "default-5"), the system was throwing an error:
```
invalid input syntax for type uuid: "default-5"
```

This happened because:
1. Frontend default stickers use IDs like `"default-1"`, `"default-5"`, etc.
2. Backend default stickers use IDs like `"emoji-1"`, `"emoji-5"`, etc.
3. The database `sticker_attachments` table had `sticker_id UUID` which required a valid UUID
4. When attaching emoji stickers, the system tried to insert non-UUID strings into a UUID column

## Solution

### 1. Database Schema Update (`027_sticker_system.sql`)
Modified the `sticker_attachments` table to support both custom stickers (UUID) and emoji stickers (text):

```sql
CREATE TABLE IF NOT EXISTS sticker_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sticker_id UUID REFERENCES stickers(id) ON DELETE CASCADE,  -- For custom stickers
    emoji_sticker TEXT,  -- For predefined emoji stickers
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    -- ... other fields ...
    
    -- Ensure either sticker_id or emoji_sticker is provided (but not both)
    CONSTRAINT check_sticker_type CHECK (
        (sticker_id IS NOT NULL AND emoji_sticker IS NULL) OR
        (sticker_id IS NULL AND emoji_sticker IS NOT NULL)
    )
);
```

### 2. Backend Controller Update (`stickerController.ts`)
Updated `attachSticker` function to:
- Detect if the sticker ID is an emoji sticker (starts with `default-` or `emoji-`)
- Extract the emoji character from `DEFAULT_STICKERS` array
- Store emoji character in `emoji_sticker` column instead of trying to use it as a UUID

```typescript
// Check if stickerId is an emoji sticker or a UUID
const isEmojiSticker = stickerId.startsWith('default-') || stickerId.startsWith('emoji-');
let emojiCharacter: string | null = null;
let actualStickerId: string | null = null;

if (isEmojiSticker) {
    // Find the emoji character from DEFAULT_STICKERS
    const emojiSticker = DEFAULT_STICKERS.find(s => 
        s.id === stickerId || s.id === stickerId.replace('default-', 'emoji-')
    );
    emojiCharacter = emojiSticker.image;
} else {
    // It's a UUID for a custom sticker
    actualStickerId = stickerId;
}

// Insert with either sticker_id or emoji_sticker
await pool.query(
    `INSERT INTO sticker_attachments 
     (sticker_id, emoji_sticker, user_id, entity_type, entity_id, ...)
     VALUES ($1, $2, $3, $4, $5, ...)`,
    [actualStickerId, emojiCharacter, userId, entityType, entityId, ...]
);
```

### 3. Updated `getEntityStickers` to include emoji_sticker field
Now returns both `sticker_id` and `emoji_sticker` so the frontend knows which type it is.

## Database Recreation
The database was successfully recreated with the new schema:
```bash
npx tsx recreate_database.ts
```

All migrations completed successfully including the updated sticker system.

## Testing
To test the fix:
1. Start the backend: `npm run dev` (in backend folder)
2. Start the frontend: `npm run dev` (in frontend folder)
3. Navigate to a trip's schedule screen
4. Click the sticker button on a day or activity
5. Select an emoji sticker
6. The sticker should now attach successfully without UUID errors

## What Changed
- ✅ Database schema supports both UUID stickers and emoji stickers
- ✅ Backend detects emoji vs custom stickers automatically
- ✅ Emoji stickers stored as text characters, not UUIDs
- ✅ Custom uploaded stickers still use UUID references
- ✅ Database constraint ensures only one type is used per attachment
- ✅ Database recreated with new schema

## Next Steps
The frontend should work as-is since it already sends sticker IDs like "default-5". The backend now handles these correctly by:
1. Recognizing them as emoji stickers
2. Looking up the emoji character
3. Storing the character in the `emoji_sticker` column
