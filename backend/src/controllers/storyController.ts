import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { socketService } from '../services/socketService.js';
import { badgeService } from '../services/badgeService.js';

export class StoryController {
  // Get all story items for a trip
  static async getStoryItems(req: Request, res: Response) {
    try {
      const { tripId } = req.params;
      const userId = req.user?.userId;

      // Check if user has access to the trip (owner, collaborator, or public)
      const accessCheck = await pool.query(
        `SELECT 
          CASE 
            WHEN t.owner_id = $2 THEN true
            WHEN user_is_collaborator($2, $1) THEN true
            WHEN t.is_public = true THEN true
            ELSE false
          END as has_access
        FROM trips t
        WHERE t.id = $1`,
        [tripId, userId]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      if (!accessCheck.rows[0].has_access) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get story items
      const result = await pool.query(
        `SELECT s.*, u.id as user_id, u.email as user_email, u.name as user_name
         FROM story_items s
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.trip_id = $1
         ORDER BY s.created_at DESC`,
        [tripId]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Error fetching story items:', error);
      res.status(500).json({ error: 'Failed to fetch story items' });
    }
  }

  // Create a new story item
  static async createStoryItem(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { trip_id, type, content_url, caption } = req.body;

      // Validate required fields
      if (!trip_id || !type) {
        return res.status(400).json({ error: 'trip_id and type are required' });
      }

      // Validate story item type
      const validTypes = ['photo', 'youtube', 'note'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ 
          error: 'Invalid type. Must be one of: photo, youtube, note' 
        });
      }

      // Check if user can edit the trip (owner or editor)
      const permissionCheck = await pool.query(
        'SELECT user_can_edit_trip($1, $2) as can_edit',
        [userId, trip_id]
      );

      if (!permissionCheck.rows[0].can_edit) {
        return res.status(403).json({ 
          error: 'You do not have permission to add story items to this trip' 
        });
      }

      // Check if trip exists
      const tripCheck = await pool.query(
        'SELECT * FROM trips WHERE id = $1',
        [trip_id]
      );

      if (tripCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      // Insert story item
      const result = await pool.query(
        `INSERT INTO story_items (trip_id, user_id, type, content_url, caption)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [trip_id, userId, type, content_url || null, caption || null]
      );

      const storyItem = result.rows[0];

      // Check for badges if this is a photo upload
      if (type === 'photo' && userId) {
        try {
          const earnedBadges = await badgeService.checkAllBadges(userId, {
            type: 'photo_upload',
            tripId: trip_id,
            photoTimestamp: new Date()
          });

          if (earnedBadges.length > 0) {
            console.log(`User ${userId} earned ${earnedBadges.length} badge(s):`, earnedBadges.map(b => b.badge_type));
          }
        } catch (badgeError) {
          console.error('Error checking badges for photo upload:', badgeError);
          // Don't fail the story item creation if badge checking fails
        }
      }

      // Emit real-time event
      socketService.emitStoryItemAdded(trip_id, storyItem);

      res.status(201).json({
        success: true,
        data: storyItem,
        message: 'Story item created successfully',
      });
    } catch (error) {
      console.error('Error creating story item:', error);
      res.status(500).json({ error: 'Failed to create story item' });
    }
  }

  // Delete a story item
  static async deleteStoryItem(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      // Check if story item exists and user is the owner
      const checkResult = await pool.query(
        `SELECT s.*, t.owner_id as trip_owner_id
         FROM story_items s
         JOIN trips t ON s.trip_id = t.id
         WHERE s.id = $1`,
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Story item not found' });
      }

      const storyItem = checkResult.rows[0];

      // Only the story item creator or trip owner can delete
      if (storyItem.user_id !== userId && storyItem.trip_owner_id !== userId) {
        return res.status(403).json({ 
          error: 'You do not have permission to delete this story item' 
        });
      }

      // Delete story item
      await pool.query('DELETE FROM story_items WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Story item deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting story item:', error);
      res.status(500).json({ error: 'Failed to delete story item' });
    }
  }
}
