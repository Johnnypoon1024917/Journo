import { Request, Response } from 'express';
import { pool } from '../config/database.js';

export interface AnalyticsEvent {
  event_name: string;
  user_id?: string;
  trip_id?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsEventsRequest {
  events: AnalyticsEvent[];
}

export const receiveEvents = async (req: Request, res: Response) => {
  try {
    const { events }: AnalyticsEventsRequest = req.body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Events array is required' });
    }

    // Validate events
    for (const event of events) {
      if (!event.event_name || typeof event.event_name !== 'string') {
        return res.status(400).json({ error: 'Each event must have a valid event_name' });
      }
    }

    // Insert events into database
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const event of events) {
        // Validate UUIDs exist if provided
        let validUserId = null;
        let validTripId = null;

        if (event.user_id) {
          const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [event.user_id]);
          if (userCheck.rows.length > 0) {
            validUserId = event.user_id;
          }
        }

        if (event.trip_id) {
          const tripCheck = await client.query('SELECT id FROM trips WHERE id = $1', [event.trip_id]);
          if (tripCheck.rows.length > 0) {
            validTripId = event.trip_id;
          }
        }

        await client.query(
          `INSERT INTO analytics_events (event_name, user_id, trip_id, metadata, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [
            event.event_name,
            validUserId,
            validTripId,
            event.metadata ? JSON.stringify(event.metadata) : null
          ]
        );
      }

      await client.query('COMMIT');
      
      res.status(200).json({ 
        success: true, 
        message: `${events.length} events recorded successfully` 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error recording analytics events:', error);
    res.status(500).json({ error: 'Failed to record analytics events' });
  }
};

export const getEventsSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, eventName } = req.query;
    
    let query = `
      SELECT 
        event_name,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users,
        DATE(created_at) as date
      FROM analytics_events 
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (eventName) {
      query += ` AND event_name = $${paramIndex}`;
      params.push(eventName);
      paramIndex++;
    }

    query += ` GROUP BY event_name, DATE(created_at) ORDER BY date DESC, count DESC`;

    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
};

export const getTopEvents = async (req: Request, res: Response) => {
  try {
    const { limit = 10, days = 7 } = req.query;
    
    const query = `
      SELECT 
        event_name,
        COUNT(*) as total_count,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT trip_id) as unique_trips
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY event_name 
      ORDER BY total_count DESC 
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching top events:', error);
    res.status(500).json({ error: 'Failed to fetch top events' });
  }
};

export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const query = `
      SELECT 
        event_name,
        trip_id,
        metadata,
        created_at
      FROM analytics_events 
      WHERE user_id = $1
      ORDER BY created_at DESC 
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
};