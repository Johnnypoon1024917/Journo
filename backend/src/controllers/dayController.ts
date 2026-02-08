import { Request, Response } from 'express';
import { pool } from '../config/database.js';

export class DayController {
  // Get or create a day (upsert) - prevents duplicate day errors
  static async getOrCreateDay(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { trip_id, day_number, date } = req.body;

      console.log('DayController.getOrCreateDay - Request:', { userId, trip_id, day_number, date });

      // Validate required fields
      if (!trip_id || day_number === undefined) {
        return res.status(400).json({ error: 'trip_id and day_number are required' });
      }

      // Check if user can edit the trip
      const permissionCheck = await pool.query(
        'SELECT user_can_edit_trip($1, $2) as can_edit',
        [userId, trip_id]
      );

      if (!permissionCheck.rows[0]?.can_edit) {
        return res.status(403).json({ error: 'You do not have permission to modify this trip' });
      }

      // Check if day already exists
      const existingDay = await pool.query(
        'SELECT * FROM trip_days WHERE trip_id = $1 AND day_number = $2',
        [trip_id, day_number]
      );

      if (existingDay.rows.length > 0) {
        console.log('DayController.getOrCreateDay - Day already exists, returning existing:', existingDay.rows[0].id);
        return res.status(200).json({
          success: true,
          data: existingDay.rows[0],
          message: 'Day already exists',
          existed: true,
        });
      }

      // Create new day
      const result = await pool.query(
        `INSERT INTO trip_days (trip_id, day_number, date)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [trip_id, day_number, date || null]
      );

      console.log('DayController.getOrCreateDay - Day created:', result.rows[0].id);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Day created successfully',
        existed: false,
      });
    } catch (error: any) {
      console.error('Error in getOrCreateDay:', error);
      res.status(500).json({ error: 'Failed to get or create day' });
    }
  }

  // Create a new day for a trip
  static async createDay(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      
      console.log('DayController.createDay - Request received:', {
        userId,
        body: req.body,
        headers: {
          authorization: req.headers.authorization ? 'present' : 'missing',
          contentType: req.headers['content-type']
        }
      });
      
      const { trip_id, day_number, date } = req.body;

      // Validate required fields
      if (!trip_id || day_number === undefined) {
        console.log('DayController.createDay - Validation failed:', { trip_id, day_number });
        return res.status(400).json({ error: 'trip_id and day_number are required' });
      }

      console.log('DayController.createDay - Checking permissions for:', { trip_id, userId });

      // Check if user can edit the trip (owner or editor)
      const permissionCheck = await pool.query(
        'SELECT user_can_edit_trip($1, $2) as can_edit',
        [userId, trip_id]
      );

      console.log('DayController.createDay - Permission check result:', {
        canEdit: permissionCheck.rows[0]?.can_edit
      });

      if (!permissionCheck.rows[0].can_edit) {
        console.log('DayController.createDay - Permission denied for user:', userId);
        return res.status(403).json({ error: 'You do not have permission to add days to this trip' });
      }

      // Check if trip exists
      const tripCheck = await pool.query('SELECT * FROM trips WHERE id = $1', [trip_id]);

      console.log('DayController.createDay - Trip check result:', {
        found: tripCheck.rows.length > 0,
        tripId: trip_id
      });

      if (tripCheck.rows.length === 0) {
        console.log('DayController.createDay - Trip not found:', trip_id);
        return res.status(404).json({ error: 'Trip not found' });
      }

      // Check if day already exists
      const existingDay = await pool.query(
        'SELECT * FROM trip_days WHERE trip_id = $1 AND day_number = $2',
        [trip_id, day_number]
      );

      if (existingDay.rows.length > 0) {
        console.log('DayController.createDay - Day already exists:', existingDay.rows[0].id);
        return res.status(409).json({ 
          error: 'Day already exists for this trip',
          data: existingDay.rows[0]
        });
      }

      // Insert day
      const result = await pool.query(
        `INSERT INTO trip_days (trip_id, day_number, date)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [trip_id, day_number, date || null]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Day created successfully',
      });
    } catch (error: any) {
      console.error('Error creating day:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Day number already exists for this trip' });
      }
      res.status(500).json({ error: 'Failed to create day' });
    }
  }

  // Get all days for a trip
  static async getDaysByTrip(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;

      console.log('getDaysByTrip - Request:', { userId, tripId });

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

      console.log('getDaysByTrip - Access check:', { 
        rowCount: accessCheck.rows.length,
        hasAccess: accessCheck.rows[0]?.has_access 
      });

      if (accessCheck.rows.length === 0) {
        console.log('getDaysByTrip - Trip not found');
        return res.status(404).json({ error: 'Trip not found' });
      }

      if (!accessCheck.rows[0].has_access) {
        console.log('getDaysByTrip - Access denied');
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get days with their places
      const result = await pool.query(
        `SELECT 
          td.id,
          td.trip_id,
          td.day_number,
          td.date::text as date,
          td.title,
          td.notes,
          td.display_order,
          td.created_at,
          td.updated_at,
          COALESCE(
            json_agg(
              json_build_object(
                'id', p.id,
                'trip_day_id', p.trip_day_id,
                'name', p.name,
                'address', p.address,
                'lat', p.lat,
                'lng', p.lng,
                'time_start', p.time_start,
                'time_end', p.time_end,
                'notes', p.notes,
                'image_url', p.image_url,
                'place_type', p.place_type,
                'sticker', p.sticker,
                'cost', p.cost,
                'cost_currency', p.cost_currency,
                'budget_category', p.budget_category,
                'transport_mode', p.transport_mode,
                'travel_time_seconds', p.travel_time_seconds,
                'display_order', p.display_order,
                'is_completed', p.is_completed,
                'created_at', p.created_at,
                'updated_at', p.updated_at
              ) ORDER BY p.display_order, p.created_at
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'
          ) as places
         FROM trip_days td
         LEFT JOIN places p ON p.trip_day_id = td.id
         WHERE td.trip_id = $1
         GROUP BY td.id
         ORDER BY td.day_number`,
        [tripId]
      );

      console.log('getDaysByTrip - Success:', { dayCount: result.rows.length });

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Error fetching days - Full error:', error);
      console.error('Error fetching days - Stack:', (error as Error).stack);
      res.status(500).json({ error: 'Failed to fetch days' });
    }
  }

  // Update a day
  static async updateDay(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { day_number, date } = req.body;

      // Check if user owns the trip
      const checkResult = await pool.query(
        `SELECT td.* FROM trip_days td
         JOIN trips t ON t.id = td.trip_id
         WHERE td.id = $1 AND t.owner_id = $2`,
        [id, userId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Day not found or unauthorized' });
      }

      // Build update query
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (day_number !== undefined) {
        updates.push(`day_number = $${paramCount++}`);
        values.push(day_number);
      }
      if (date !== undefined) {
        updates.push(`date = $${paramCount++}`);
        values.push(date);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id);
      const result = await pool.query(
        `UPDATE trip_days SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Day updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating day:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Day number already exists for this trip' });
      }
      res.status(500).json({ error: 'Failed to update day' });
    }
  }

  // Delete a day
  static async deleteDay(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      // Check if user owns the trip
      const checkResult = await pool.query(
        `SELECT td.* FROM trip_days td
         JOIN trips t ON t.id = td.trip_id
         WHERE td.id = $1 AND t.owner_id = $2`,
        [id, userId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Day not found or unauthorized' });
      }

      // Delete day (cascade will handle places)
      await pool.query('DELETE FROM trip_days WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Day deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting day:', error);
      res.status(500).json({ error: 'Failed to delete day' });
    }
  }

  // Reorder days
  static async reorderDays(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;
      const { dayOrders } = req.body; // Array of { id, day_number }

      if (!Array.isArray(dayOrders) || dayOrders.length === 0) {
        return res.status(400).json({ error: 'dayOrders array is required' });
      }

      // Check if user owns the trip
      const tripCheck = await pool.query(
        'SELECT * FROM trips WHERE id = $1 AND owner_id = $2',
        [tripId, userId]
      );

      if (tripCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found or unauthorized' });
      }

      // Update day numbers in a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        for (const { id, day_number } of dayOrders) {
          await client.query(
            'UPDATE trip_days SET day_number = $1 WHERE id = $2 AND trip_id = $3',
            [day_number, id, tripId]
          );
        }

        await client.query('COMMIT');

        // Fetch updated days
        const result = await pool.query(
          'SELECT * FROM trip_days WHERE trip_id = $1 ORDER BY day_number',
          [tripId]
        );

        res.json({
          success: true,
          data: result.rows,
          message: 'Days reordered successfully',
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error reordering days:', error);
      res.status(500).json({ error: 'Failed to reorder days' });
    }
  }
}
