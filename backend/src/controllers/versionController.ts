import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { socketService } from '../services/socketService.js';

export class VersionController {
  // Create a version snapshot
  static async createSnapshot(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;
      const { changeDescription } = req.body;

      // Check if user can edit this trip
      const permissionCheck = await pool.query(
        'SELECT user_can_edit_trip($1, $2) as can_edit',
        [userId, tripId]
      );

      if (!permissionCheck.rows[0].can_edit) {
        return res.status(403).json({ error: 'You do not have permission to create versions for this trip' });
      }

      // Create the snapshot
      const result = await pool.query(
        'SELECT create_trip_version_snapshot($1, $2, $3) as version_id',
        [tripId, userId, changeDescription || null]
      );

      const versionId = result.rows[0].version_id;

      // Get the created version
      const versionResult = await pool.query(
        'SELECT * FROM trip_versions WHERE id = $1',
        [versionId]
      );

      res.status(201).json({
        success: true,
        data: versionResult.rows[0],
        message: 'Version snapshot created successfully',
      });
    } catch (error) {
      console.error('Error creating version snapshot:', error);
      res.status(500).json({ error: 'Failed to create version snapshot' });
    }
  }

  // Get version history for a trip
  static async getVersionHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;

      // Check if user has access to this trip
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

      if (accessCheck.rows.length === 0 || !accessCheck.rows[0].has_access) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get version history (last 5 versions)
      const result = await pool.query(
        `SELECT 
          tv.id,
          tv.trip_id,
          tv.version_number,
          tv.change_description,
          tv.created_at,
          tv.created_by,
          u.name as created_by_name,
          u.email as created_by_email
        FROM trip_versions tv
        LEFT JOIN users u ON tv.created_by = u.id
        WHERE tv.trip_id = $1
        ORDER BY tv.version_number DESC
        LIMIT 5`,
        [tripId]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Error fetching version history:', error);
      res.status(500).json({ error: 'Failed to fetch version history' });
    }
  }

  // Get a specific version
  static async getVersion(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { tripId, versionId } = req.params;

      // Check if user has access to this trip
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

      if (accessCheck.rows.length === 0 || !accessCheck.rows[0].has_access) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get the version
      const result = await pool.query(
        'SELECT * FROM trip_versions WHERE id = $1 AND trip_id = $2',
        [versionId, tripId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Version not found' });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error fetching version:', error);
      res.status(500).json({ error: 'Failed to fetch version' });
    }
  }

  // Restore a version
  static async restoreVersion(req: Request, res: Response) {
    const client = await pool.connect();
    
    try {
      const userId = req.user?.userId;
      const { tripId, versionId } = req.params;

      // Check if user can edit this trip
      const permissionCheck = await client.query(
        'SELECT user_can_edit_trip($1, $2) as can_edit',
        [userId, tripId]
      );

      if (!permissionCheck.rows[0].can_edit) {
        return res.status(403).json({ error: 'You do not have permission to restore versions for this trip' });
      }

      // Get the version to restore
      const versionResult = await client.query(
        'SELECT * FROM trip_versions WHERE id = $1 AND trip_id = $2',
        [versionId, tripId]
      );

      if (versionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Version not found' });
      }

      const version = versionResult.rows[0];
      const versionData = version.version_data;

      // Start transaction
      await client.query('BEGIN');

      // Create a snapshot of current state before restoring
      await client.query(
        'SELECT create_trip_version_snapshot($1, $2, $3)',
        [tripId, userId, `Before restoring version ${version.version_number}`]
      );

      // Delete existing places and days
      await client.query('DELETE FROM places WHERE trip_day_id IN (SELECT id FROM trip_days WHERE trip_id = $1)', [tripId]);
      await client.query('DELETE FROM trip_days WHERE trip_id = $1', [tripId]);

      // Restore trip data
      const tripData = versionData.trip;
      await client.query(
        `UPDATE trips SET 
          title = $1,
          destination = $2,
          start_date = $3,
          end_date = $4,
          cover_image_url = $5,
          theme = $6,
          total_budget = $7,
          currency_code = $8,
          is_public = $9,
          is_community = $10,
          weather_data = $11,
          updated_at = NOW()
        WHERE id = $12`,
        [
          tripData.title,
          tripData.destination,
          tripData.start_date,
          tripData.end_date,
          tripData.cover_image_url,
          tripData.theme,
          tripData.total_budget,
          tripData.currency_code,
          tripData.is_public,
          tripData.is_community,
          tripData.weather_data,
          tripId,
        ]
      );

      // Restore days and places
      if (versionData.days && Array.isArray(versionData.days)) {
        for (const dayData of versionData.days) {
          const day = dayData.day;
          
          // Insert day
          const dayResult = await client.query(
            `INSERT INTO trip_days (id, trip_id, day_number, date, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id`,
            [day.id, tripId, day.day_number, day.date, day.created_at]
          );

          const dayId = dayResult.rows[0].id;

          // Insert places for this day
          if (dayData.places && Array.isArray(dayData.places)) {
            for (const place of dayData.places) {
              await client.query(
                `INSERT INTO places (
                  id, trip_day_id, name, address, lat, lng,
                  time_start, time_end, notes, image_url, place_type,
                  sticker, cost, cost_currency, budget_category,
                  transport_mode, travel_time, travel_distance, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
                [
                  place.id,
                  dayId,
                  place.name,
                  place.address,
                  place.lat,
                  place.lng,
                  place.time_start,
                  place.time_end,
                  place.notes,
                  place.image_url,
                  place.place_type,
                  place.sticker,
                  place.cost,
                  place.cost_currency,
                  place.budget_category,
                  place.transport_mode,
                  place.travel_time,
                  place.travel_distance,
                  place.created_at,
                  place.updated_at,
                ]
              );
            }
          }
        }
      }

      // Commit transaction
      await client.query('COMMIT');

      // Get the restored trip
      const restoredTrip = await client.query('SELECT * FROM trips WHERE id = $1', [tripId]);

      // Emit socket event for real-time updates
      try {
        socketService.emitTripUpdate(tripId, restoredTrip.rows[0]);
      } catch (socketError) {
        console.error('Error emitting socket event:', socketError);
      }

      res.json({
        success: true,
        data: restoredTrip.rows[0],
        message: `Version ${version.version_number} restored successfully`,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error restoring version:', error);
      res.status(500).json({ error: 'Failed to restore version' });
    } finally {
      client.release();
    }
  }

  // Undo - revert to previous version
  static async undo(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;

      // Check if user can edit this trip
      const permissionCheck = await pool.query(
        'SELECT user_can_edit_trip($1, $2) as can_edit',
        [userId, tripId]
      );

      if (!permissionCheck.rows[0].can_edit) {
        return res.status(403).json({ error: 'You do not have permission to undo changes for this trip' });
      }

      // Get the previous version (second most recent)
      const versionResult = await pool.query(
        `SELECT * FROM trip_versions 
        WHERE trip_id = $1 
        ORDER BY version_number DESC 
        LIMIT 1 OFFSET 1`,
        [tripId]
      );

      if (versionResult.rows.length === 0) {
        return res.status(404).json({ error: 'No previous version available to undo' });
      }

      const previousVersion = versionResult.rows[0];

      // Use the restore functionality
      req.params.versionId = previousVersion.id;
      return VersionController.restoreVersion(req, res);
    } catch (error) {
      console.error('Error undoing changes:', error);
      res.status(500).json({ error: 'Failed to undo changes' });
    }
  }
}
