import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { storageService } from '../services/storageService.js';

/**
 * Upload a custom sticker
 */
export const uploadSticker = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.body.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { name, category = 'custom', isPublic = false } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Sticker name is required' });
    }

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(req.body.file, 'base64');
    const contentType = req.body.contentType || 'image/png';

    // Validate file size (max 2MB)
    if (fileBuffer.length > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 2MB limit' });
    }

    // Validate content type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
    }

    // Upload to storage
    const result = await storageService.upload(fileBuffer, {
      bucket: 'stickers',
      contentType
    });

    // Save to database
    const insertResult = await pool.query(
      `INSERT INTO stickers (user_id, name, image_url, category, is_public, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, name, result.url, category, isPublic, result.size, contentType]
    );

    res.status(201).json({
      message: 'Sticker uploaded successfully',
      sticker: insertResult.rows[0]
    });
  } catch (error: any) {
    console.error('Upload sticker error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload sticker' });
  }
};

/**
 * Get all stickers (user's custom + public + predefined)
 */
export const getStickers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { category } = req.query;

    // Get user's custom stickers
    let customQuery = `
      SELECT id, user_id, name, image_url, category, is_public, usage_count, created_at, 'custom' as source
      FROM stickers
      WHERE user_id = $1
    `;
    const customParams: any[] = [userId];

    if (category) {
      customQuery += ` AND category = $2`;
      customParams.push(category);
    }

    customQuery += ` ORDER BY created_at DESC`;

    // Get public stickers from other users
    let publicQuery = `
      SELECT id, user_id, name, image_url, category, is_public, usage_count, created_at, 'public' as source
      FROM stickers
      WHERE is_public = true AND user_id != $1
    `;
    const publicParams: any[] = [userId];

    if (category) {
      publicQuery += ` AND category = $2`;
      publicParams.push(category);
    }

    publicQuery += ` ORDER BY usage_count DESC, created_at DESC LIMIT 50`;

    // Get predefined stickers
    let predefinedQuery = `
      SELECT id, NULL as user_id, name, image_url, category, true as is_public, 0 as usage_count, created_at, 'predefined' as source
      FROM predefined_stickers
      WHERE is_active = true
    `;
    const predefinedParams: any[] = [];

    if (category) {
      predefinedQuery += ` AND category = $1`;
      predefinedParams.push(category);
    }

    predefinedQuery += ` ORDER BY display_order ASC`;

    // Execute all queries
    const [customResult, publicResult, predefinedResult] = await Promise.all([
      pool.query(customQuery, customParams),
      pool.query(publicQuery, publicParams),
      pool.query(predefinedQuery, predefinedParams)
    ]);

    res.json({
      custom: customResult.rows,
      public: publicResult.rows,
      predefined: predefinedResult.rows
    });
  } catch (error: any) {
    console.error('Get stickers error:', error);
    res.status(500).json({ error: error.message || 'Failed to get stickers' });
  }
};

/**
 * Get a single sticker by ID
 */
export const getStickerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const result = await pool.query(
      `SELECT * FROM stickers WHERE id = $1 AND (user_id = $2 OR is_public = true)`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sticker not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get sticker error:', error);
    res.status(500).json({ error: error.message || 'Failed to get sticker' });
  }
};

/**
 * Update a sticker
 */
export const updateSticker = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { name, category, isPublic } = req.body;

    // Check ownership
    const checkResult = await pool.query(
      `SELECT * FROM stickers WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sticker not found or unauthorized' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (isPublic !== undefined) {
      updates.push(`is_public = $${paramCount++}`);
      values.push(isPublic);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id, userId);

    const result = await pool.query(
      `UPDATE stickers SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount++} AND user_id = $${paramCount++}
       RETURNING *`,
      values
    );

    res.json({
      message: 'Sticker updated successfully',
      sticker: result.rows[0]
    });
  } catch (error: any) {
    console.error('Update sticker error:', error);
    res.status(500).json({ error: error.message || 'Failed to update sticker' });
  }
};

/**
 * Delete a sticker
 */
export const deleteSticker = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    // Check ownership and get image URL
    const checkResult = await pool.query(
      `SELECT * FROM stickers WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sticker not found or unauthorized' });
    }

    const sticker = checkResult.rows[0];

    // Delete from storage
    try {
      await storageService.delete(sticker.image_url);
    } catch (error) {
      console.error('Failed to delete sticker file:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database (cascade will delete attachments)
    await pool.query(`DELETE FROM stickers WHERE id = $1`, [id]);

    res.json({ message: 'Sticker deleted successfully' });
  } catch (error: any) {
    console.error('Delete sticker error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete sticker' });
  }
};

/**
 * Attach a sticker to an entity (place, trip_day, or trip)
 */
export const attachSticker = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { stickerId, entityType, entityId, positionX, positionY, rotation, scale, zIndex } = req.body;

    if (!stickerId || !entityType || !entityId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate entity type
    const validEntityTypes = ['place', 'trip_day', 'trip'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({ error: 'Invalid entity type' });
    }

    // Check if user can attach sticker to this entity
    const canAttach = await pool.query(
      `SELECT user_can_attach_sticker($1, $2, $3) as can_attach`,
      [userId, entityType, entityId]
    );

    if (!canAttach.rows[0].can_attach) {
      return res.status(403).json({ error: 'Unauthorized to attach sticker to this entity' });
    }

    // Check if sticker exists and user has access
    const stickerCheck = await pool.query(
      `SELECT * FROM stickers WHERE id = $1 AND (user_id = $2 OR is_public = true)
       UNION
       SELECT id, NULL as user_id, name, image_url, category, true as is_public, 0 as usage_count, 
              0 as file_size, NULL as mime_type, created_at, updated_at
       FROM predefined_stickers WHERE id = $1`,
      [stickerId, userId]
    );

    if (stickerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sticker not found or unauthorized' });
    }

    // Create attachment
    const result = await pool.query(
      `INSERT INTO sticker_attachments 
       (sticker_id, user_id, entity_type, entity_id, position_x, position_y, rotation, scale, z_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        stickerId, 
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

    // Increment usage count
    await pool.query(`SELECT increment_sticker_usage($1)`, [stickerId]);

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
  try {
    const { entityType, entityId } = req.params;

    const result = await pool.query(
      `SELECT 
        sa.*,
        COALESCE(s.name, ps.name) as sticker_name,
        COALESCE(s.image_url, ps.image_url) as sticker_image_url,
        COALESCE(s.category, ps.category) as sticker_category
       FROM sticker_attachments sa
       LEFT JOIN stickers s ON sa.sticker_id = s.id
       LEFT JOIN predefined_stickers ps ON sa.sticker_id = ps.id
       WHERE sa.entity_type = $1 AND sa.entity_id = $2
       ORDER BY sa.z_index ASC, sa.created_at ASC`,
      [entityType, entityId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Get entity stickers error:', error);
    res.status(500).json({ error: error.message || 'Failed to get entity stickers' });
  }
};

/**
 * Update sticker attachment position/styling
 */
export const updateStickerAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { positionX, positionY, rotation, scale, zIndex } = req.body;

    // Check ownership
    const checkResult = await pool.query(
      `SELECT * FROM sticker_attachments WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sticker attachment not found or unauthorized' });
    }

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

    values.push(id, userId);

    const result = await pool.query(
      `UPDATE sticker_attachments SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount++} AND user_id = $${paramCount++}
       RETURNING *`,
      values
    );

    res.json({
      message: 'Sticker attachment updated successfully',
      attachment: result.rows[0]
    });
  } catch (error: any) {
    console.error('Update sticker attachment error:', error);
    res.status(500).json({ error: error.message || 'Failed to update sticker attachment' });
  }
};

/**
 * Remove sticker attachment
 */
export const removeStickerAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    // Check ownership
    const checkResult = await pool.query(
      `SELECT * FROM sticker_attachments WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sticker attachment not found or unauthorized' });
    }

    await pool.query(`DELETE FROM sticker_attachments WHERE id = $1`, [id]);

    res.json({ message: 'Sticker attachment removed successfully' });
  } catch (error: any) {
    console.error('Remove sticker attachment error:', error);
    res.status(500).json({ error: error.message || 'Failed to remove sticker attachment' });
  }
};

/**
 * Get predefined stickers
 */
export const getPredefinedStickers = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM predefined_stickers 
       WHERE is_active = true 
       ORDER BY display_order ASC, category ASC`
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Get predefined stickers error:', error);
    res.status(500).json({ error: error.message || 'Failed to get predefined stickers' });
  }
};
