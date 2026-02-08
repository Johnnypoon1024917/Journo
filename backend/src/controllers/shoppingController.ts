import { Request, Response } from 'express';
import { pool } from '../config/database.js';

export class ShoppingController {
  /**
   * GET /api/shopping/trip/:tripId
   * Get all shopping items for a trip
   */
  static async getShoppingItemsByTrip(req: Request, res: Response): Promise<void> {
    try {
      const { tripId } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify user has access to this trip
      const tripAccess = await pool.query(
        `SELECT 1 FROM trips 
         WHERE id = $1 AND (owner_id = $2 OR id IN (
           SELECT trip_id FROM trip_collaborators WHERE user_id = $2
         ))`,
        [tripId, userId]
      );

      if (tripAccess.rows.length === 0) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Get all shopping items for this trip
      const result = await pool.query(
        `SELECT s.*, 
                u.first_name as created_by_first_name, 
                u.last_name as created_by_last_name,
                pu.first_name as purchased_by_first_name,
                pu.last_name as purchased_by_last_name
         FROM shopping_items s
         LEFT JOIN users u ON s.user_id = u.id
         LEFT JOIN users pu ON s.purchased_by = pu.id
         WHERE s.trip_id = $1
         ORDER BY s.is_purchased ASC, s.priority DESC, s.created_at DESC`,
        [tripId]
      );

      res.json({ items: result.rows });
    } catch (error) {
      console.error('Error fetching shopping items:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/shopping
   * Create a new shopping item
   */
  static async createShoppingItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        tripId,
        name,
        category,
        quantity,
        notes,
        priority,
        estimatedPrice,
        currency,
        storeName,
        storeUrl
      } = req.body;

      // Verify user has access to this trip
      const tripAccess = await pool.query(
        `SELECT 1 FROM trips 
         WHERE id = $1 AND (owner_id = $2 OR id IN (
           SELECT trip_id FROM trip_collaborators WHERE user_id = $2
         ))`,
        [tripId, userId]
      );

      if (tripAccess.rows.length === 0) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const result = await pool.query(
        `INSERT INTO shopping_items (
          trip_id, user_id, name, category, quantity, notes, priority,
          estimated_price, currency, store_name, store_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          tripId, userId, name, category, quantity || 1, notes,
          priority || 'normal', estimatedPrice, currency || 'USD',
          storeName, storeUrl
        ]
      );

      res.status(201).json({ item: result.rows[0] });
    } catch (error) {
      console.error('Error creating shopping item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * PUT /api/shopping/:itemId
   * Update a shopping item
   */
  static async updateShoppingItem(req: Request, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        name, category, quantity, notes, priority,
        estimatedPrice, actualPrice, currency, storeName, storeUrl
      } = req.body;

      // Verify user has access to this item's trip
      const accessCheck = await pool.query(
        `SELECT s.trip_id FROM shopping_items s
         JOIN trips t ON s.trip_id = t.id
         WHERE s.id = $1 AND (t.owner_id = $2 OR t.id IN (
           SELECT trip_id FROM trip_collaborators WHERE user_id = $2
         ))`,
        [itemId, userId]
      );

      if (accessCheck.rows.length === 0) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const result = await pool.query(
        `UPDATE shopping_items SET
          name = COALESCE($1, name),
          category = COALESCE($2, category),
          quantity = COALESCE($3, quantity),
          notes = COALESCE($4, notes),
          priority = COALESCE($5, priority),
          estimated_price = COALESCE($6, estimated_price),
          actual_price = COALESCE($7, actual_price),
          currency = COALESCE($8, currency),
          store_name = COALESCE($9, store_name),
          store_url = COALESCE($10, store_url)
         WHERE id = $11
         RETURNING *`,
        [name, category, quantity, notes, priority, estimatedPrice, actualPrice, currency, storeName, storeUrl, itemId]
      );

      res.json({ item: result.rows[0] });
    } catch (error) {
      console.error('Error updating shopping item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * PATCH /api/shopping/:itemId/toggle
   * Toggle purchased status
   */
  static async togglePurchased(req: Request, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify user has access to this item's trip
      const accessCheck = await pool.query(
        `SELECT s.trip_id, s.is_purchased FROM shopping_items s
         JOIN trips t ON s.trip_id = t.id
         WHERE s.id = $1 AND (t.owner_id = $2 OR t.id IN (
           SELECT trip_id FROM trip_collaborators WHERE user_id = $2
         ))`,
        [itemId, userId]
      );

      if (accessCheck.rows.length === 0) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const currentStatus = accessCheck.rows[0].is_purchased;
      const newStatus = !currentStatus;

      const result = await pool.query(
        `UPDATE shopping_items SET
          is_purchased = $1,
          purchased_at = $2,
          purchased_by = $3
         WHERE id = $4
         RETURNING *`,
        [newStatus, newStatus ? new Date() : null, newStatus ? userId : null, itemId]
      );

      res.json({ item: result.rows[0] });
    } catch (error) {
      console.error('Error toggling shopping item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * DELETE /api/shopping/:itemId
   * Delete a shopping item
   */
  static async deleteShoppingItem(req: Request, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify user has access to this item's trip
      const accessCheck = await pool.query(
        `SELECT s.trip_id FROM shopping_items s
         JOIN trips t ON s.trip_id = t.id
         WHERE s.id = $1 AND (t.owner_id = $2 OR t.id IN (
           SELECT trip_id FROM trip_collaborators WHERE user_id = $2
         ))`,
        [itemId, userId]
      );

      if (accessCheck.rows.length === 0) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await pool.query('DELETE FROM shopping_items WHERE id = $1', [itemId]);

      res.json({ message: 'Shopping item deleted successfully' });
    } catch (error) {
      console.error('Error deleting shopping item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
