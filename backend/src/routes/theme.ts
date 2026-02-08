/**
 * Theme Routes
 * 
 * API endpoints for managing system-wide and trip-specific color themes
 */

import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import type { SystemColorTheme, TripColorTheme, UpdateThemeRequest } from '../types/theme.js';

const router = express.Router();

// ============================================
// System Theme Routes (Admin only)
// ============================================

/**
 * GET /api/theme/system
 * Get active system color theme
 */
router.get('/system', async (req, res) => {
  try {
    const result = await pool.query<SystemColorTheme>(
      'SELECT * FROM system_color_theme WHERE is_active = TRUE LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active system theme found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching system theme:', error);
    res.status(500).json({ error: 'Failed to fetch system theme' });
  }
});

/**
 * PUT /api/theme/system
 * Update system color theme (Admin only)
 */
router.put('/system', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updates: UpdateThemeRequest = req.body;
    
    // Build dynamic UPDATE query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const query = `
      UPDATE system_color_theme 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE is_active = TRUE
      RETURNING *
    `;
    
    const result = await pool.query<SystemColorTheme>(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active system theme found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating system theme:', error);
    res.status(500).json({ error: 'Failed to update system theme' });
  }
});

/**
 * POST /api/theme/system/reset
 * Reset system theme to default Kawaii pink (Admin only)
 */
router.post('/system/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query<SystemColorTheme>(`
      UPDATE system_color_theme 
      SET 
        primary_50 = '#fff5f7',
        primary_100 = '#ffe3e8',
        primary_200 = '#ffc7d1',
        primary_300 = '#ffaaba',
        primary_400 = '#ff8ea3',
        primary_500 = '#FFB3BA',
        primary_600 = '#ff6b7f',
        primary_700 = '#ff4d63',
        primary_800 = '#ff2f47',
        primary_900 = '#e6002b',
        primary_950 = '#b30021',
        cream_bg = '#FFF8F0',
        neutral_50 = '#fafaf9',
        neutral_100 = '#f5f5f4',
        neutral_200 = '#e7e5e4',
        neutral_300 = '#d6d3d1',
        neutral_400 = '#a8a29e',
        neutral_500 = '#78716c',
        neutral_600 = '#57534e',
        neutral_700 = '#44403c',
        neutral_800 = '#292524',
        neutral_900 = '#1c1917',
        neutral_950 = '#0f0e0d',
        updated_at = NOW()
      WHERE is_active = TRUE
      RETURNING *
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error resetting system theme:', error);
    res.status(500).json({ error: 'Failed to reset system theme' });
  }
});

// ============================================
// Trip Theme Routes (Trip owner only)
// ============================================

/**
 * GET /api/theme/trip/:tripId
 * Get trip-specific color theme
 */
router.get('/trip/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    
    const result = await pool.query<TripColorTheme>(
      'SELECT * FROM trip_color_theme WHERE trip_id = $1',
      [tripId]
    );
    
    if (result.rows.length === 0) {
      // Return system theme as fallback
      const systemTheme = await pool.query<SystemColorTheme>(
        'SELECT * FROM system_color_theme WHERE is_active = TRUE LIMIT 1'
      );
      return res.json(systemTheme.rows[0] || null);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching trip theme:', error);
    res.status(500).json({ error: 'Failed to fetch trip theme' });
  }
});

/**
 * PUT /api/theme/trip/:tripId
 * Update trip-specific color theme (Trip owner only)
 */
router.put('/trip/:tripId', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId; // Changed from id to userId
    const updates: UpdateThemeRequest = req.body;
    
    // Verify trip ownership
    const tripCheck = await pool.query(
      'SELECT owner_id FROM trips WHERE id = $1',
      [tripId]
    );
    
    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    console.log('🔍 Trip theme update attempt:');
    console.log('  Trip ID:', tripId);
    console.log('  Trip owner_id:', tripCheck.rows[0].owner_id);
    console.log('  Current user_id:', userId);
    console.log('  Match:', tripCheck.rows[0].owner_id === userId);
    
    if (tripCheck.rows[0].owner_id !== userId) {
      console.log('❌ Permission denied: User is not trip owner');
      return res.status(403).json({ 
        error: 'Only trip owner can update theme',
        tripOwnerId: tripCheck.rows[0].owner_id,
        currentUserId: userId
      });
    }
    
    // Check if trip theme exists
    const existingTheme = await pool.query(
      'SELECT id FROM trip_color_theme WHERE trip_id = $1',
      [tripId]
    );
    
    if (existingTheme.rows.length === 0) {
      // Create new trip theme based on system theme
      const systemTheme = await pool.query<SystemColorTheme>(
        'SELECT * FROM system_color_theme WHERE is_active = TRUE LIMIT 1'
      );
      
      if (systemTheme.rows.length === 0) {
        return res.status(500).json({ error: 'No system theme found' });
      }
      
      const theme = systemTheme.rows[0];
      const result = await pool.query<TripColorTheme>(`
        INSERT INTO trip_color_theme (
          trip_id, theme_name,
          primary_50, primary_100, primary_200, primary_300, primary_400,
          primary_500, primary_600, primary_700, primary_800, primary_900, primary_950,
          cream_bg,
          neutral_50, neutral_100, neutral_200, neutral_300, neutral_400,
          neutral_500, neutral_600, neutral_700, neutral_800, neutral_900, neutral_950
        ) VALUES (
          $1, 'tripcolour',
          $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
        )
        RETURNING *
      `, [
        tripId,
        theme.primary_50, theme.primary_100, theme.primary_200, theme.primary_300, theme.primary_400,
        theme.primary_500, theme.primary_600, theme.primary_700, theme.primary_800, theme.primary_900, theme.primary_950,
        theme.cream_bg,
        theme.neutral_50, theme.neutral_100, theme.neutral_200, theme.neutral_300, theme.neutral_400,
        theme.neutral_500, theme.neutral_600, theme.neutral_700, theme.neutral_800, theme.neutral_900, theme.neutral_950
      ]);
      
      // Now apply updates
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });
      
      if (updateFields.length > 0) {
        values.push(tripId);
        const updateQuery = `
          UPDATE trip_color_theme 
          SET ${updateFields.join(', ')}, updated_at = NOW()
          WHERE trip_id = $${paramCount}
          RETURNING *
        `;
        
        const updatedResult = await pool.query<TripColorTheme>(updateQuery, values);
        return res.json(updatedResult.rows[0]);
      }
      
      return res.json(result.rows[0]);
    }
    
    // Update existing trip theme
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(tripId);
    const query = `
      UPDATE trip_color_theme 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE trip_id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query<TripColorTheme>(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating trip theme:', error);
    res.status(500).json({ error: 'Failed to update trip theme' });
  }
});

/**
 * DELETE /api/theme/trip/:tripId
 * Delete trip theme (revert to system theme)
 */
router.delete('/trip/:tripId', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId; // Changed from id to userId
    
    // Verify trip ownership
    const tripCheck = await pool.query(
      'SELECT owner_id FROM trips WHERE id = $1',
      [tripId]
    );
    
    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    if (tripCheck.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only trip owner can delete theme' });
    }
    
    await pool.query('DELETE FROM trip_color_theme WHERE trip_id = $1', [tripId]);
    
    res.json({ message: 'Trip theme deleted, reverted to system theme' });
  } catch (error) {
    console.error('Error deleting trip theme:', error);
    res.status(500).json({ error: 'Failed to delete trip theme' });
  }
});

// ============================================
// User Theme Preference Routes
// ============================================

/**
 * GET /api/theme/user
 * Get current user's theme preference
 */
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId; // Changed from id to userId
    
    const result = await pool.query(
      'SELECT theme_color FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return the user's preferred color or null if not set
    res.json({ 
      primary_500: result.rows[0].theme_color || null 
    });
  } catch (error) {
    console.error('Error fetching user theme:', error);
    res.status(500).json({ error: 'Failed to fetch user theme' });
  }
});

/**
 * PUT /api/theme/user
 * Update current user's theme preference
 */
router.put('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId; // Changed from id to userId
    const { primary_500 } = req.body;
    
    if (!primary_500) {
      return res.status(400).json({ error: 'primary_500 color is required' });
    }
    
    // Validate hex color format
    if (!/^#[0-9A-Fa-f]{6}$/.test(primary_500)) {
      return res.status(400).json({ error: 'Invalid hex color format' });
    }
    
    await pool.query(
      'UPDATE users SET theme_color = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [primary_500, userId]
    );
    
    res.json({ 
      message: 'User theme updated successfully',
      primary_500 
    });
  } catch (error) {
    console.error('Error updating user theme:', error);
    res.status(500).json({ error: 'Failed to update user theme' });
  }
});

/**
 * DELETE /api/theme/user
 * Reset user's theme preference to default
 */
router.delete('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId; // Changed from id to userId
    
    await pool.query(
      'UPDATE users SET theme_color = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
    
    res.json({ message: 'User theme reset to default' });
  } catch (error) {
    console.error('Error resetting user theme:', error);
    res.status(500).json({ error: 'Failed to reset user theme' });
  }
});

export default router;
