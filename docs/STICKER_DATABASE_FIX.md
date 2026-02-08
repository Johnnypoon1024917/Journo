# Sticker Database Fix

## Problem
When trying to attach stickers, the application was throwing an error:
```
column "emoji_sticker" of relation "sticker_attachments" does not exist
```

## Root Cause
The sticker tables were not properly created in the database. This likely happened because:
1. The database was recreated after the sticker migration was added
2. The migration tracking showed it as "already run" but the tables didn't exist
3. Schema mismatch between migration file and actual database

## Solution
Manually recreated the sticker tables with the correct schema by running `fix_sticker_tables.sql`.

## Tables Created

### 1. `stickers`
Stores user-uploaded custom stickers.

**Columns:**
- `id` - UUID primary key
- `user_id` - Reference to users table
- `name` - Sticker name
- `image_url` - URL to sticker image
- `category` - Sticker category (default: 'custom')
- `is_public` - Whether sticker is publicly available
- `usage_count` - Number of times used
- `file_size` - File size in bytes
- `mime_type` - Image MIME type
- `created_at`, `updated_at` - Timestamps

### 2. `sticker_attachments`
Stores sticker placements on entities (places, days, trips).

**Columns:**
- `id` - UUID primary key
- `sticker_id` - Reference to stickers table (nullable)
- `emoji_sticker` - Emoji text for predefined stickers (nullable)
- `user_id` - Reference to users table
- `entity_type` - Type of entity ('place', 'trip_day', 'trip')
- `entity_id` - UUID of the entity
- `position_x`, `position_y` - Position coordinates (0-100)
- `rotation` - Rotation angle in degrees
- `scale` - Scale factor (0.1-2.0)
- `z_index` - Stacking order
- `created_at`, `updated_at` - Timestamps

**Constraint:** Either `sticker_id` OR `emoji_sticker` must be set (not both).

### 3. `predefined_stickers`
Stores system-provided default stickers.

**Columns:**
- `id` - UUID primary key
- `name` - Sticker name
- `image_url` - URL to sticker image
- `category` - Sticker category
- `tags` - Array of search tags
- `is_active` - Whether sticker is available
- `display_order` - Sort order
- `created_at`, `updated_at` - Timestamps

## Functions Created

### `increment_sticker_usage(p_sticker_id UUID)`
Increments the usage count for a sticker.

### `user_can_attach_sticker(p_user_id UUID, p_entity_type VARCHAR, p_entity_id UUID)`
Checks if a user has permission to attach a sticker to an entity.

## Default Stickers
10 predefined stickers were inserted:
1. Heart (emotions)
2. Star (emotions)
3. Camera (activities)
4. Food (activities)
5. Plane (travel)
6. Map Pin (travel)
7. Sun (weather)
8. Moon (weather)
9. Thumbs Up (reactions)
10. Fire (reactions)

## Verification
To verify the fix worked:
1. Go to Schedule screen
2. Click "貼上貼紙" (Attach Sticker) button
3. Select an emoji or sticker
4. Place it on the day card
5. Should save successfully without errors

## Status
✅ **Fixed** - Sticker tables recreated with correct schema

## Related Files
- `backend/src/migrations/027_sticker_system.sql` - Original migration
- `backend/fix_sticker_tables.sql` - Fix script
- `backend/src/controllers/stickerController.ts` - Sticker API endpoints
- `frontend/src/services/stickerService.ts` - Frontend sticker service
