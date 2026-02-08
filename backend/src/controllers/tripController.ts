import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { socketService } from '../services/socketService.js';

export class TripController {
  // Create a new trip
  static async createTrip(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      
      console.log('🎯 TripController.createTrip called');
      console.log('User ID:', userId);
      console.log('Request body:', req.body);
      console.log('Auth header:', req.headers.authorization ? 'present' : 'missing');
      
      const {
        title,
        destination,
        start_date,
        end_date,
        cover_image_url,
        theme = 'default',
        total_budget,
        currency_code = 'USD',
        is_public = true,
        is_community = false,
      } = req.body;

      // Validate required fields
      if (!title || title.trim().length === 0) {
        console.log('❌ Validation failed: Title is required');
        return res.status(400).json({ error: 'Title is required' });
      }

      // Validate date range if both dates are provided
      if (start_date && end_date) {
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (startDate > endDate) {
          console.log('❌ Validation failed: Invalid date range');
          return res.status(400).json({ error: 'Start date must be before end date' });
        }
      }

      // Validate theme
      const validThemes = ['default', 'adventure', 'romantic', 'foodie', 'chill'];
      if (theme && !validThemes.includes(theme)) {
        console.log('❌ Validation failed: Invalid theme');
        return res.status(400).json({ error: 'Invalid theme' });
      }

      console.log('✅ Validation passed, inserting trip into database...');

      // Use transaction to create trip and days together
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Insert trip into database
        const tripResult = await client.query(
          `INSERT INTO trips (
            title, destination, start_date, end_date, cover_image_url, 
            theme, owner_id, total_budget, currency_code, is_public, is_community
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *`,
          [
            title,
            destination || null,
            start_date || null,
            end_date || null,
            cover_image_url || null,
            theme,
            userId,
            total_budget || null,
            currency_code,
            is_public,
            is_community,
          ]
        );

        const trip = tripResult.rows[0];
        console.log('✅ Trip created successfully:', trip.id);

        // Create days if start_date and end_date are provided
        if (start_date && end_date) {
          const startDate = new Date(start_date);
          const endDate = new Date(end_date);
          
          // Generate all dates between start and end
          const dates: string[] = [];
          const current = new Date(startDate);
          
          while (current <= endDate) {
            // Format as YYYY-MM-DD (DATE type, not TIMESTAMP)
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const day = String(current.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${day}`);
            current.setDate(current.getDate() + 1);
          }

          console.log(`Creating ${dates.length} days for trip...`);

          // Insert all days
          for (let i = 0; i < dates.length; i++) {
            await client.query(
              `INSERT INTO trip_days (trip_id, day_number, date)
               VALUES ($1, $2, $3)`,
              [trip.id, i + 1, dates[i]]
            );
          }

          console.log(`✅ Created ${dates.length} days`);
        }

        await client.query('COMMIT');

        res.status(201).json({
          success: true,
          data: trip,
          message: 'Trip created successfully',
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error creating trip:', error);
      res.status(500).json({ error: 'Failed to create trip' });
    }
  }

  // Get all trips for the authenticated user
  static async getTrips(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Get total count (owned trips + collaborated trips)
      const countResult = await pool.query(
        `SELECT COUNT(DISTINCT t.id) 
         FROM trips t
         LEFT JOIN trip_collaborators tc ON t.id = tc.trip_id
         WHERE t.owner_id = $1 OR tc.user_id = $1`,
        [userId]
      );
      const total = parseInt(countResult.rows[0].count);

      // Get trips with pagination (owned + collaborated)
      const result = await pool.query(
        `SELECT DISTINCT t.*, tc.role as user_role
         FROM trips t
         LEFT JOIN trip_collaborators tc ON t.id = tc.trip_id AND tc.user_id = $1
         WHERE t.owner_id = $1 OR tc.user_id = $1
         ORDER BY t.display_order DESC, t.created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      });
    } catch (error) {
      console.error('Error fetching trips:', error);
      res.status(500).json({ error: 'Failed to fetch trips' });
    }
  }

  // Get a single trip by ID
  static async getTripById(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      // Check if user has access (owner, collaborator, or public trip)
      const accessCheck = await pool.query(
        `SELECT 
          t.*,
          CASE 
            WHEN t.owner_id = $2 THEN true
            WHEN user_is_collaborator($2, $1) THEN true
            WHEN t.is_public = true THEN true
            ELSE false
          END as has_access
        FROM trips t
        WHERE t.id = $1`,
        [id, userId]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      const trip = accessCheck.rows[0];

      if (!trip.has_access) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Remove the has_access field before returning
      delete trip.has_access;

      res.json({
        success: true,
        data: trip,
      });
    } catch (error) {
      console.error('Error fetching trip:', error);
      res.status(500).json({ error: 'Failed to fetch trip' });
    }
  }

  // Update a trip
  static async updateTrip(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const {
        title,
        destination,
        start_date,
        end_date,
        cover_image_url,
        theme,
        total_budget,
        currency_code,
        is_public,
        is_community,
        weather_data,
      } = req.body;

      // Check if user can edit this trip (owner or editor)
      const permissionCheck = await pool.query(
        'SELECT user_can_edit_trip($1, $2) as can_edit',
        [userId, id]
      );

      if (!permissionCheck.rows[0].can_edit) {
        return res.status(403).json({ error: 'You do not have permission to edit this trip' });
      }

      // Check if trip exists
      const checkResult = await pool.query(
        'SELECT * FROM trips WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      // Validate date range if both dates are provided
      if (start_date && end_date) {
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (startDate > endDate) {
          return res.status(400).json({ error: 'Start date must be before end date' });
        }
      }

      // Validate theme if provided
      if (theme) {
        const validThemes = ['default', 'adventure', 'romantic', 'foodie', 'chill'];
        if (!validThemes.includes(theme)) {
          return res.status(400).json({ error: 'Invalid theme' });
        }
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramCount++}`);
        values.push(title);
      }
      if (destination !== undefined) {
        updates.push(`destination = $${paramCount++}`);
        values.push(destination);
      }
      if (start_date !== undefined) {
        updates.push(`start_date = $${paramCount++}`);
        values.push(start_date);
      }
      if (end_date !== undefined) {
        updates.push(`end_date = $${paramCount++}`);
        values.push(end_date);
      }
      if (cover_image_url !== undefined) {
        updates.push(`cover_image_url = $${paramCount++}`);
        values.push(cover_image_url);
      }
      if (theme !== undefined) {
        updates.push(`theme = $${paramCount++}`);
        values.push(theme);
      }
      if (total_budget !== undefined) {
        updates.push(`total_budget = $${paramCount++}`);
        values.push(total_budget);
      }
      if (currency_code !== undefined) {
        updates.push(`currency_code = $${paramCount++}`);
        values.push(currency_code);
      }
      if (is_public !== undefined) {
        updates.push(`is_public = $${paramCount++}`);
        values.push(is_public);
      }
      if (is_community !== undefined) {
        updates.push(`is_community = $${paramCount++}`);
        values.push(is_community);
      }
      if (weather_data !== undefined) {
        updates.push(`weather_data = $${paramCount++}`);
        values.push(JSON.stringify(weather_data));
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Create a version snapshot before updating
      try {
        await pool.query(
          'SELECT create_trip_version_snapshot($1, $2, $3)',
          [id, userId, 'Auto-save before update']
        );
      } catch (snapshotError) {
        console.error('Error creating version snapshot:', snapshotError);
        // Continue with update even if snapshot fails
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const result = await pool.query(
        `UPDATE trips SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      const updatedTrip = result.rows[0];

      // Emit socket event for real-time updates
      try {
        socketService.emitTripUpdate(id, updatedTrip);
      } catch (socketError) {
        console.error('Error emitting socket event:', socketError);
        // Don't fail the request if socket emit fails
      }

      // Send notifications to all collaborators (except the person making the edit)
      try {
        // Get the user who made the edit
        const editorResult = await pool.query(
          'SELECT name FROM users WHERE id = $1',
          [userId]
        );
        const editorName = editorResult.rows[0]?.name || 'Someone';

        // Get all collaborators and the trip owner (excluding the editor)
        const collaboratorsResult = await pool.query(
          `SELECT DISTINCT u.id, u.name
           FROM users u
           WHERE u.id IN (
             -- Trip owner
             SELECT owner_id FROM trips WHERE id = $1
             UNION
             -- Collaborators
             SELECT user_id FROM trip_collaborators 
             WHERE trip_id = $1 AND accepted_at IS NOT NULL
           )
           AND u.id != $2`,
          [id, userId]
        );

        // Create notifications for each collaborator
        const { NotificationService } = await import('../services/notificationService.js');
        
        for (const collaborator of collaboratorsResult.rows) {
          // Determine what changed for the notification message
          const changedFields = [];
          if (title !== undefined) changedFields.push('title');
          if (destination !== undefined) changedFields.push('destination');
          if (start_date !== undefined || end_date !== undefined) changedFields.push('dates');
          if (theme !== undefined) changedFields.push('theme');
          if (total_budget !== undefined) changedFields.push('budget');
          
          const changesText = changedFields.length > 0 
            ? ` (${changedFields.join(', ')})`
            : '';

          await NotificationService.createNotification({
            userId: collaborator.id,
            type: 'trip_updated',
            title: 'Trip Updated',
            message: `${editorName} updated "${updatedTrip.title}"${changesText}`,
            category: 'activity',
            priority: 'normal',
            actionUrl: `/trips/${id}`,
            data: {
              tripId: id,
              tripTitle: updatedTrip.title,
              editorId: userId,
              editorName,
              changes: changedFields
            }
          });
        }

        console.log(`✅ Sent trip update notifications to ${collaboratorsResult.rows.length} collaborators`);
      } catch (notificationError) {
        console.error('❌ Error sending notifications:', notificationError);
        // Don't fail the request if notifications fail
      }

      res.json({
        success: true,
        data: updatedTrip,
        message: 'Trip updated successfully',
      });
    } catch (error) {
      console.error('Error updating trip:', error);
      res.status(500).json({ error: 'Failed to update trip' });
    }
  }

  // Delete a trip
  static async deleteTrip(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      // Check if user is the owner (only owners can delete)
      const ownerCheck = await pool.query(
        'SELECT user_owns_trip($1, $2) as is_owner',
        [userId, id]
      );

      if (!ownerCheck.rows[0].is_owner) {
        return res.status(403).json({ error: 'Only trip owners can delete trips' });
      }

      // Check if trip exists
      const checkResult = await pool.query(
        'SELECT * FROM trips WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      // Delete trip (cascade will handle related records)
      await pool.query('DELETE FROM trips WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Trip deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting trip:', error);
      res.status(500).json({ error: 'Failed to delete trip' });
    }
  }

  // Get trip by share token (public access, no auth required)
  static async getTripByToken(req: Request, res: Response) {
    try {
      const { token } = req.params;

      // Get trip by share token
      const result = await pool.query(
        'SELECT * FROM trips WHERE share_token = $1 AND is_public = true',
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found or not public' });
      }

      const trip = result.rows[0];

      // Increment view count
      await pool.query(
        'UPDATE trips SET views_count = views_count + 1 WHERE id = $1',
        [trip.id]
      );

      // Return updated trip with incremented view count
      trip.views_count = trip.views_count + 1;

      res.json({
        success: true,
        data: trip,
      });
    } catch (error) {
      console.error('Error fetching trip by token:', error);
      res.status(500).json({ error: 'Failed to fetch trip' });
    }
  }

  // Get trip days by share token (public access, no auth required)
  static async getDaysByToken(req: Request, res: Response) {
    try {
      const { token } = req.params;

      // First, get the trip to verify it's public
      const tripResult = await pool.query(
        'SELECT id FROM trips WHERE share_token = $1 AND is_public = true',
        [token]
      );

      if (tripResult.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found or not public' });
      }

      const tripId = tripResult.rows[0].id;

      // Get all days for the trip
      const daysResult = await pool.query(
        'SELECT * FROM trip_days WHERE trip_id = $1 ORDER BY day_number ASC',
        [tripId]
      );

      // Get all places for each day
      const daysWithPlaces = await Promise.all(
        daysResult.rows.map(async (day) => {
          const placesResult = await pool.query(
            'SELECT * FROM places WHERE trip_day_id = $1 ORDER BY created_at ASC',
            [day.id]
          );
          return {
            ...day,
            places: placesResult.rows,
          };
        })
      );

      res.json(daysWithPlaces);
    } catch (error) {
      console.error('Error fetching days by token:', error);
      res.status(500).json({ error: 'Failed to fetch trip days' });
    }
  }

  // Reorder trips for the authenticated user
  static async reorderTrips(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { tripOrders } = req.body;

      // Validate input
      if (!Array.isArray(tripOrders) || tripOrders.length === 0) {
        return res.status(400).json({ error: 'Invalid trip orders' });
      }

      // Validate each trip order entry
      for (const order of tripOrders) {
        if (!order.tripId || typeof order.displayOrder !== 'number') {
          return res.status(400).json({ error: 'Each trip order must have tripId and displayOrder' });
        }
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Update display order for each trip
        for (const { tripId, displayOrder } of tripOrders) {
          // Verify user has access to this trip
          const accessCheck = await client.query(
            `SELECT 1 FROM trips t
             LEFT JOIN trip_collaborators tc ON t.id = tc.trip_id
             WHERE t.id = $1 AND (t.owner_id = $2 OR tc.user_id = $2)`,
            [tripId, userId]
          );

          if (accessCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: `Access denied for trip ${tripId}` });
          }

          // Update the display order
          await client.query(
            `UPDATE trips SET display_order = $1, updated_at = NOW() WHERE id = $2`,
            [displayOrder, tripId]
          );
        }

        await client.query('COMMIT');

        res.json({
          success: true,
          message: 'Trips reordered successfully',
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error reordering trips:', error);
      res.status(500).json({ error: 'Failed to reorder trips' });
    }
  }
}
