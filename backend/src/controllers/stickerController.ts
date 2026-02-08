import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { storageService } from '../services/storageService.js';

/**
 * SIMPLIFIED STICKER CONTROLLER WITH CORRECT AUTHENTICATION
 * 
 * Key fixes:
 * 1. Use req.user?.userId (not req.user?.id)
 * 2. Simplified permission checks
 * 3. Better error messages
 * 4. Default emoji stickers (no database needed)
 * 5. Custom sticker upload support
 */

// Default emoji stickers (always available)
const DEFAULT_STICKERS = [
  { id: 'emoji-1', image: '🎒', category: 'activities', tags: ['travel', 'adventure'], aiGenerated: false },
  { id: 'emoji-2', image: '✈️', category: 'transportation', tags: ['flight', 'airplane'], aiGenerated: false },
  { id: 'emoji-3', image: '🍜', category: 'food', tags: ['food', 'dining'], aiGenerated: false },
  { id: 'emoji-4', image: '🏨', category: 'landmarks', tags: ['hotel', 'accommodation'], aiGenerated: false },
  { id: 'emoji-5', image: '😊', category: 'emotions', tags: ['happy', 'smile'], aiGenerated: false },
  { id: 'emoji-6', image: '☀️', category: 'weather', tags: ['sunny', 'weather'], aiGenerated: false },
  { id: 'emoji-7', image: '🌸', category: 'seasonal', tags: ['spring', 'sakura'], aiGenerated: false, season: 'spring' },
  { id: 'emoji-8', image: '❄️', category: 'seasonal', tags: ['winter', 'snow'], aiGenerated: false, season: 'winter' },
  { id: 'emoji-9', image: '🗺️', category: 'activities', tags: ['map', 'navigation'], aiGenerated: false },
  { id: 'emoji-10', image: '📸', category: 'activities', tags: ['photo', 'camera'], aiGenerated: false },
  { id: 'emoji-11', image: '🎉', category: 'emotions', tags: ['party', 'celebration'], aiGenerated: false },
  { id: 'emoji-12', image: '🌊', category: 'weather', tags: ['ocean', 'water'], aiGenerated: false },
  { id: 'emoji-13', image: '🏔️', category: 'landmarks', tags: ['mountain', 'nature'], aiGenerated: false },
  { id: 'emoji-14', image: '🚗', category: 'transportation', tags: ['car', 'drive'], aiGenerated: false },
  { id: 'emoji-15', image: '🍕', category: 'food', tags: ['pizza', 'italian'], aiGenerated: false },
  { id: 'emoji-16', image: '🎭', category: 'activities', tags: ['theater', 'culture'], aiGenerated: false },
];

/**
 * Get all stickers (returns default emojis + custom stickers)
 * Now includes stickers from trip collaborators
 */
export const getStickers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🎨 getStickers called for userId:', userId);

    // Get custom stickers from database (user's own stickers)
    const customStickersResult = await pool.query(
      `SELECT id, name, image_url, category, is_public, usage_count, created_at
       FROM stickers
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    console.log('📦 Custom stickers:', customStickersResult.rows.length);

    // Get public stickers from other users
    const publicStickersResult = await pool.query(
      `SELECT id, name, image_url, category, usage_count, created_at
       FROM stickers
       WHERE is_public = true AND user_id != $1
       ORDER BY usage_count DESC, created_at DESC
       LIMIT 50`,
      [userId]
    );
    console.log('🌍 Public stickers:', publicStickersResult.rows.length);

    // Get stickers from trip collaborators AND trip owners (shared within trips)
    // This allows collaborators to see custom stickers from trip owners and other collaborators
    const sharedStickersResult = await pool.query(
      `SELECT DISTINCT s.id, s.name, s.image_url, s.category, s.usage_count, s.created_at, s.user_id
       FROM stickers s
       WHERE s.is_public = false 
         AND s.user_id != $1
         AND (
           -- Stickers from users who are collaborators on the same trips
           EXISTS (
             SELECT 1 FROM trip_collaborators tc1
             INNER JOIN trip_collaborators tc2 ON tc1.trip_id = tc2.trip_id
             WHERE tc1.user_id = s.user_id AND tc2.user_id = $1
           )
           OR
           -- Stickers from trip owners where user is a collaborator
           EXISTS (
             SELECT 1 FROM trips t
             INNER JOIN trip_collaborators tc ON t.id = tc.trip_id
             WHERE t.owner_id = s.user_id AND tc.user_id = $1
           )
         )
       ORDER BY s.created_at DESC`,
      [userId]
    );
    console.log('🤝 Shared stickers query result:', {
      count: sharedStickersResult.rows.length,
      stickers: sharedStickersResult.rows
    });

    res.json({
      custom: customStickersResult.rows,
      public: publicStickersResult.rows,
      shared: sharedStickersResult.rows,
      predefined: DEFAULT_STICKERS
    });
  } catch (error: any) {
    console.error('❌ Get stickers error:', error);
    res.status(500).json({ error: error.message || 'Failed to get stickers' });
  }
};

/**
 * Upload a custom sticker
 */
export const uploadSticker = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { file, name, category, isPublic } = req.body;

    console.log('📤 Upload sticker request:', {
      userId,
      name,
      category,
      isPublic,
      hasFile: !!file
    });

    if (!file || !name) {
      return res.status(400).json({ error: 'File and name are required' });
    }

    // Decode base64 file
    const matches = file.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid file format' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Validate file type (only images)
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }

    // Validate file size (max 5MB)
    if (fileBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size must be less than 5MB' });
    }

    // Upload file to storage
    const uploadResult = await storageService.upload(fileBuffer, {
      bucket: 'stickers',
      contentType: mimeType
    });

    console.log('✅ File uploaded:', uploadResult);

    // Save sticker to database
    const result = await pool.query(
      `INSERT INTO stickers (user_id, name, image_url, category, is_public, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, image_url, category, is_public, created_at`,
      [userId, name, uploadResult.url, category || 'custom', isPublic || false, uploadResult.size, mimeType]
    );

    console.log('✅ Sticker saved to database:', result.rows[0]);

    res.status(201).json({
      message: 'Sticker uploaded successfully',
      sticker: result.rows[0]
    });
  } catch (error: any) {
    console.error('❌ Upload sticker error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload sticker' });
  }
};

/**
 * Delete a custom sticker
 */
export const deleteSticker = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🗑️ Delete sticker request:', { userId, stickerId: id });

    // Check if sticker exists and belongs to user
    const checkResult = await pool.query(
      `SELECT * FROM stickers WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sticker not found or unauthorized' });
    }

    const sticker = checkResult.rows[0];

    // First, delete all attachments of this sticker
    await pool.query(`DELETE FROM sticker_attachments WHERE sticker_id = $1`, [id]);
    console.log('✅ Sticker attachments deleted');

    // Delete the file from storage if it exists
    if (sticker.image_url) {
      try {
        await storageService.delete(sticker.image_url);
        console.log('✅ File deleted from storage:', sticker.image_url);
      } catch (fileError) {
        console.warn('⚠️ Failed to delete file from storage:', fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete sticker from database
    await pool.query(`DELETE FROM stickers WHERE id = $1`, [id]);

    console.log('✅ Sticker deleted successfully');

    res.json({ message: 'Sticker deleted successfully' });
  } catch (error: any) {
    console.error('❌ Delete sticker error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete sticker' });
  }
};

/**
 * Get predefined stickers (default emojis)
 */
export const getPredefinedStickers = async (_req: Request, res: Response) => {
  try {
    res.json(DEFAULT_STICKERS);
  } catch (error: any) {
    console.error('Get predefined stickers error:', error);
    res.status(500).json({ error: error.message || 'Failed to get predefined stickers' });
  }
};

/**
 * Attach a sticker to an entity (place, trip_day, or trip)
 */
export const attachSticker = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId; // FIXED: Use userId not id
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { stickerId, entityType, entityId, positionX, positionY, rotation, scale, zIndex } = req.body;

    console.log('Attach sticker request:', {
      userId,
      stickerId,
      entityType,
      entityId,
      position: { x: positionX, y: positionY }
    });

    if (!stickerId || !entityType || !entityId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate entity type
    const validEntityTypes = ['place', 'trip_day', 'trip'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({ error: 'Invalid entity type' });
    }

    // Check if stickerId is an emoji sticker (default-X or emoji-X) or a UUID
    const isEmojiSticker = stickerId.startsWith('default-') || stickerId.startsWith('emoji-');
    let emojiCharacter: string | null = null;
    let actualStickerId: string | null = null;

    console.log('Processing sticker type:', { stickerId, isEmojiSticker });

    if (isEmojiSticker) {
      // Find the emoji character from DEFAULT_STICKERS
      const emojiSticker = DEFAULT_STICKERS.find(s => s.id === stickerId || s.id === stickerId.replace('default-', 'emoji-'));
      if (!emojiSticker) {
        return res.status(400).json({ error: 'Invalid emoji sticker ID' });
      }
      emojiCharacter = emojiSticker.image;
      console.log('Using emoji sticker:', { emojiCharacter, actualStickerId: null });
    } else {
      // It's a UUID for a custom sticker - verify it exists in database
      const stickerCheck = await pool.query(
        `SELECT id FROM stickers WHERE id = $1`,
        [stickerId]
      );
      
      if (stickerCheck.rows.length === 0) {
        console.error('Custom sticker not found in database:', stickerId);
        return res.status(404).json({ error: 'Custom sticker not found. Please refresh and try again.' });
      }
      
      actualStickerId = stickerId;
      console.log('Using custom sticker:', { actualStickerId, emojiCharacter: null });
    }

    // Check if user can attach sticker to this entity
    let canAttach = false;
    
    try {
      const result = await pool.query(
        `SELECT user_can_attach_sticker($1, $2, $3) as can_attach`,
        [userId, entityType, entityId]
      );
      canAttach = result.rows[0]?.can_attach || false;
    } catch (dbError) {
      console.error('Permission check error:', dbError);
      // If function doesn't exist, do manual check
      if (entityType === 'trip_day') {
        const check = await pool.query(
          `SELECT td.id FROM trip_days td
           JOIN trips t ON t.id = td.trip_id
           WHERE td.id = $1 AND (t.owner_id = $2 OR user_can_edit_trip($2, t.id))`,
          [entityId, userId]
        );
        canAttach = check.rows.length > 0;
      } else if (entityType === 'place') {
        const check = await pool.query(
          `SELECT p.id FROM places p
           JOIN trip_days td ON td.id = p.trip_day_id
           JOIN trips t ON t.id = td.trip_id
           WHERE p.id = $1 AND (t.owner_id = $2 OR user_can_edit_trip($2, t.id))`,
          [entityId, userId]
        );
        canAttach = check.rows.length > 0;
      } else if (entityType === 'trip') {
        const check = await pool.query(
          `SELECT id FROM trips WHERE id = $1 AND (owner_id = $2 OR user_can_edit_trip($2, $1))`,
          [entityId, userId]
        );
        canAttach = check.rows.length > 0;
      }
    }

    if (!canAttach) {
      console.log('Permission denied for user:', userId, 'entity:', entityType, entityId);
      return res.status(403).json({ error: 'You do not have permission to attach stickers to this item' });
    }

    // Create attachment with either sticker_id or emoji_sticker
    console.log('Inserting sticker attachment:', {
      actualStickerId: actualStickerId || null,
      emojiCharacter: emojiCharacter || null,
      userId,
      entityType,
      entityId
    });

    const result = await pool.query(
      `INSERT INTO sticker_attachments 
       (sticker_id, emoji_sticker, user_id, entity_type, entity_id, position_x, position_y, rotation, scale, z_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        actualStickerId || null,  // Explicitly use null if not set
        emojiCharacter || null,   // Explicitly use null if not set
        userId, 
        entityType, 
        entityId, 
        positionX || 50.0, 
        positionY || 50.0, 
        rotation || 0.0, 
        scale || 1.0, 
        zIndex || 0
      ]
    );

    console.log('Sticker attached successfully:', result.rows[0].id);

    res.status(201).json({
      message: 'Sticker attached successfully',
      attachment: result.rows[0]
    });
  } catch (error: any) {
    console.error('Attach sticker error:', error);
    res.status(500).json({ error: error.message || 'Failed to attach sticker' });
  }
};

/**
 * Get sticker attachments for an entity
 */
export const getEntityStickers = async (req: Request, res: Response) => {
  console.log('🎯🎯🎯 GET_ENTITY_STICKERS ENDPOINT HIT! 🎯🎯🎯');
  try {
    const { entityType, entityId } = req.params;

    console.log('🔍 getEntityStickers called:', { entityType, entityId });
    console.log('🔍 Request params:', req.params);
    console.log('🔍 Request query:', req.query);
    console.log('🔍 Request URL:', req.url);

    const result = await pool.query(
      `SELECT 
        sa.id,
        sa.sticker_id,
        sa.emoji_sticker,
        sa.entity_type,
        sa.entity_id,
        sa.position_x,
        sa.position_y,
        sa.rotation,
        sa.scale,
        sa.z_index,
        sa.created_at,
        sa.updated_at
       FROM sticker_attachments sa
       WHERE sa.entity_type = $1 AND sa.entity_id = $2
       ORDER BY sa.z_index ASC, sa.created_at ASC`,
      [entityType, entityId]
    );

    console.log('✅ getEntityStickers result:', { 
      rowCount: result.rowCount,
      rows: result.rows 
    });

    res.json(result.rows);
  } catch (error: any) {
    console.error('❌ Get entity stickers error:', error);
    res.status(500).json({ error: error.message || 'Failed to get entity stickers' });
  }
};

/**
 * Update sticker attachment position/styling
 */
export const updateStickerAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { positionX, positionY, rotation, scale, zIndex } = req.body;

    console.log('🎨 Updating sticker attachment:', { id, userId, updates: { positionX, positionY, rotation, scale, zIndex } });

    // First, get the attachment and find the trip it belongs to
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

    if (attachmentResult.rows.length === 0) {
      console.log('❌ Sticker attachment not found:', id);
      return res.status(404).json({ error: 'Sticker attachment not found' });
    }

    const attachment = attachmentResult.rows[0];
    const tripId = attachment.trip_id;

    console.log('📦 Found attachment:', { attachmentId: id, entityType: attachment.entity_type, entityId: attachment.entity_id, tripId });

    // Check if user has permission to edit the trip
    const permissionResult = await pool.query(
      `SELECT user_can_edit_trip($1, $2) as can_edit`,
      [userId, tripId]
    );

    if (!permissionResult.rows[0]?.can_edit) {
      console.log('❌ User does not have permission to edit trip:', { userId, tripId });
      return res.status(403).json({ error: 'You do not have permission to edit stickers on this trip' });
    }

    console.log('✅ User has permission to edit trip');

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (positionX !== undefined) {
      updates.push(`position_x = $${paramCount++}`);
      values.push(positionX);
    }
    if (positionY !== undefined) {
      updates.push(`position_y = $${paramCount++}`);
      values.push(positionY);
    }
    if (rotation !== undefined) {
      updates.push(`rotation = $${paramCount++}`);
      values.push(rotation);
    }
    if (scale !== undefined) {
      updates.push(`scale = $${paramCount++}`);
      values.push(scale);
    }
    if (zIndex !== undefined) {
      updates.push(`z_index = $${paramCount++}`);
      values.push(zIndex);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE sticker_attachments SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount++}
       RETURNING *`,
      values
    );

    console.log('✅ Sticker attachment updated successfully');

    res.json({
      message: 'Sticker attachment updated successfully',
      attachment: result.rows[0]
    });
  } catch (error: any) {
    console.error('❌ Update sticker attachment error:', error);
    res.status(500).json({ error: error.message || 'Failed to update sticker attachment' });
  }
}

/**
 * Remove sticker attachment
 */
export const removeStickerAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🗑️ Removing sticker attachment:', { id, userId });

    // First, get the attachment and find the trip it belongs to
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

    if (attachmentResult.rows.length === 0) {
      console.log('❌ Sticker attachment not found:', id);
      return res.status(404).json({ error: 'Sticker attachment not found' });
    }

    const attachment = attachmentResult.rows[0];
    const tripId = attachment.trip_id;

    console.log('📦 Found attachment:', { attachmentId: id, entityType: attachment.entity_type, entityId: attachment.entity_id, tripId });

    // Check if user has permission to edit the trip
    const permissionResult = await pool.query(
      `SELECT user_can_edit_trip($1, $2) as can_edit`,
      [userId, tripId]
    );

    if (!permissionResult.rows[0]?.can_edit) {
      console.log('❌ User does not have permission to edit trip:', { userId, tripId });
      return res.status(403).json({ error: 'You do not have permission to remove stickers from this trip' });
    }

    console.log('✅ User has permission to edit trip');

    await pool.query(`DELETE FROM sticker_attachments WHERE id = $1`, [id]);

    console.log('✅ Sticker attachment removed successfully');

    res.json({ message: 'Sticker attachment removed successfully' });
  } catch (error: any) {
    console.error('❌ Remove sticker attachment error:', error);
    res.status(500).json({ error: error.message || 'Failed to remove sticker attachment' });
  }
}

// Export all functions
export default {
  getStickers,
  uploadSticker,
  deleteSticker,
  getPredefinedStickers,
  attachSticker,
  getEntityStickers,
  updateStickerAttachment,
  removeStickerAttachment
};
