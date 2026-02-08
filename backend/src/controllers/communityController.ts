import { Request, Response } from 'express';
import { pool } from '../config/database.js';

export class CommunityController {
  // Get all community trips with top 3 story items
  static async getCommunityTrips(req: Request, res: Response) {
    try {
      const userId = req.user?.userId; // Optional - may be undefined for anonymous users

      // Get all community trips
      const tripsResult = await pool.query(
        `SELECT * FROM trips 
         WHERE is_community = true AND is_public = true 
         ORDER BY created_at DESC`
      );

      const trips = tripsResult.rows;

      // Get top 3 story items for each trip
      const storyItemsMap: Record<string, any[]> = {};
      
      for (const trip of trips) {
        const storyResult = await pool.query(
          `SELECT * FROM story_items 
           WHERE trip_id = $1 
           ORDER BY created_at DESC 
           LIMIT 3`,
          [trip.id]
        );
        storyItemsMap[trip.id] = storyResult.rows;
      }

      // Get liked trip IDs for authenticated user
      let likedTripIds: string[] = [];
      if (userId) {
        const likesResult = await pool.query(
          `SELECT trip_id FROM trip_likes WHERE user_id = $1`,
          [userId]
        );
        likedTripIds = likesResult.rows.map((row) => row.trip_id);
      }

      res.json({
        success: true,
        data: {
          trips,
          storyItemsMap,
          likedTripIds,
        },
      });
    } catch (error) {
      console.error('Error fetching community trips:', error);
      res.status(500).json({ error: 'Failed to fetch community trips' });
    }
  }

  // Like a trip
  static async likeTrip(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id: tripId } = req.params;

      // Check if trip exists and is community
      const tripCheck = await pool.query(
        'SELECT id, is_community FROM trips WHERE id = $1',
        [tripId]
      );

      if (tripCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      if (!tripCheck.rows[0].is_community) {
        return res.status(400).json({ error: 'Trip is not in community feed' });
      }

      // Check if already liked
      const existingLike = await pool.query(
        'SELECT id FROM trip_likes WHERE trip_id = $1 AND user_id = $2',
        [tripId, userId]
      );

      if (existingLike.rows.length > 0) {
        return res.status(400).json({ error: 'Trip already liked' });
      }

      // Create like record
      await pool.query(
        'INSERT INTO trip_likes (trip_id, user_id) VALUES ($1, $2)',
        [tripId, userId]
      );

      // Increment likes count
      await pool.query(
        'UPDATE trips SET likes_count = likes_count + 1 WHERE id = $1',
        [tripId]
      );

      res.json({
        success: true,
        message: 'Trip liked successfully',
      });
    } catch (error) {
      console.error('Error liking trip:', error);
      res.status(500).json({ error: 'Failed to like trip' });
    }
  }

  // Unlike a trip
  static async unlikeTrip(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id: tripId } = req.params;

      // Check if like exists
      const existingLike = await pool.query(
        'SELECT id FROM trip_likes WHERE trip_id = $1 AND user_id = $2',
        [tripId, userId]
      );

      if (existingLike.rows.length === 0) {
        return res.status(400).json({ error: 'Trip not liked' });
      }

      // Delete like record
      await pool.query(
        'DELETE FROM trip_likes WHERE trip_id = $1 AND user_id = $2',
        [tripId, userId]
      );

      // Decrement likes count
      await pool.query(
        'UPDATE trips SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1',
        [tripId]
      );

      res.json({
        success: true,
        message: 'Trip unliked successfully',
      });
    } catch (error) {
      console.error('Error unliking trip:', error);
      res.status(500).json({ error: 'Failed to unlike trip' });
    }
  }

  // Copy a trip to user's own trips
  static async copyTrip(req: Request, res: Response) {
    const client = await pool.connect();
    
    try {
      const userId = req.user?.userId;
      const { id: sourceTripId } = req.params;

      await client.query('BEGIN');

      // Get source trip
      const tripResult = await client.query(
        'SELECT * FROM trips WHERE id = $1 AND is_community = true AND is_public = true',
        [sourceTripId]
      );

      if (tripResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Trip not found or not available for copying' });
      }

      const sourceTrip = tripResult.rows[0];

      // Create new trip for current user
      const newTripResult = await client.query(
        `INSERT INTO trips (
          title, destination, start_date, end_date, cover_image_url, 
          theme, owner_id, total_budget, currency_code, is_public, is_community
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          `${sourceTrip.title} (Copy)`,
          sourceTrip.destination,
          sourceTrip.start_date,
          sourceTrip.end_date,
          sourceTrip.cover_image_url,
          sourceTrip.theme,
          userId,
          sourceTrip.total_budget,
          sourceTrip.currency_code,
          false, // Private by default
          false, // Not in community by default
        ]
      );

      const newTrip = newTripResult.rows[0];

      // Get all days from source trip
      const daysResult = await client.query(
        'SELECT * FROM trip_days WHERE trip_id = $1 ORDER BY day_number ASC',
        [sourceTripId]
      );

      // Copy days and places
      for (const sourceDay of daysResult.rows) {
        // Create new day
        const newDayResult = await client.query(
          `INSERT INTO trip_days (trip_id, day_number, date)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [newTrip.id, sourceDay.day_number, sourceDay.date]
        );

        const newDay = newDayResult.rows[0];

        // Get places for this day
        const placesResult = await client.query(
          'SELECT * FROM places WHERE trip_day_id = $1 ORDER BY created_at ASC',
          [sourceDay.id]
        );

        // Copy places
        for (const sourcePlace of placesResult.rows) {
          await client.query(
            `INSERT INTO places (
              trip_day_id, name, address, lat, lng, time_start, time_end,
              notes, image_url, place_type, sticker, cost, cost_currency,
              budget_category, transport_mode
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
              newDay.id,
              sourcePlace.name,
              sourcePlace.address,
              sourcePlace.lat,
              sourcePlace.lng,
              sourcePlace.time_start,
              sourcePlace.time_end,
              sourcePlace.notes,
              sourcePlace.image_url,
              sourcePlace.place_type,
              sourcePlace.sticker,
              sourcePlace.cost,
              sourcePlace.cost_currency,
              sourcePlace.budget_category,
              sourcePlace.transport_mode,
            ]
          );
        }
      }

      // Get packing list from source trip
      const packingResult = await client.query(
        'SELECT * FROM packing_lists WHERE trip_id = $1',
        [sourceTripId]
      );

      // Copy packing list items
      for (const packingItem of packingResult.rows) {
        await client.query(
          `INSERT INTO packing_lists (
            trip_id, item, category, is_checked, added_by, is_custom
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            newTrip.id,
            packingItem.item,
            packingItem.category,
            false, // Reset checked status
            userId,
            packingItem.is_custom,
          ]
        );
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        data: newTrip,
        message: 'Trip copied successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error copying trip:', error);
      res.status(500).json({ error: 'Failed to copy trip' });
    } finally {
      client.release();
    }
  }
}
