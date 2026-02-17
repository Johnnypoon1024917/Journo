import { Request, Response } from 'express';
import { pool } from '../config/database.js';

export class AdminController {
  // Get dashboard metrics
  static async getDashboardMetrics(_req: Request, res: Response) {
    try {
      const client = await pool.connect();
      
      try {
        // Calculate DAU (Daily Active Users) - users who performed any action today
        const dauQuery = `
          SELECT COUNT(DISTINCT user_id) as dau
          FROM analytics_events 
          WHERE created_at >= CURRENT_DATE
          AND user_id IS NOT NULL
        `;
        const dauResult = await client.query(dauQuery);
        const dau = parseInt(dauResult.rows[0]?.dau || '0');

        // Calculate MAU (Monthly Active Users) - users who performed any action in last 30 days
        const mauQuery = `
          SELECT COUNT(DISTINCT user_id) as mau
          FROM analytics_events 
          WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
          AND user_id IS NOT NULL
        `;
        const mauResult = await client.query(mauQuery);
        const mau = parseInt(mauResult.rows[0]?.mau || '0');

        // Trips created today
        const tripsCreatedTodayQuery = `
          SELECT COUNT(*) as count
          FROM trips 
          WHERE created_at >= CURRENT_DATE
        `;
        const tripsCreatedTodayResult = await client.query(tripsCreatedTodayQuery);
        const tripsCreatedToday = parseInt(tripsCreatedTodayResult.rows[0]?.count || '0');

        // Total trips created
        const tripsCreatedTotalQuery = `
          SELECT COUNT(*) as count
          FROM trips
        `;
        const tripsCreatedTotalResult = await client.query(tripsCreatedTotalQuery);
        const tripsCreatedTotal = parseInt(tripsCreatedTotalResult.rows[0]?.count || '0');

        // Community posts today
        const communityPostsTodayQuery = `
          SELECT COUNT(*) as count
          FROM trips 
          WHERE is_community = true 
          AND created_at >= CURRENT_DATE
        `;
        const communityPostsTodayResult = await client.query(communityPostsTodayQuery);
        const communityPostsToday = parseInt(communityPostsTodayResult.rows[0]?.count || '0');

        // Total community posts
        const communityPostsTotalQuery = `
          SELECT COUNT(*) as count
          FROM trips 
          WHERE is_community = true
        `;
        const communityPostsTotalResult = await client.query(communityPostsTotalQuery);
        const communityPostsTotal = parseInt(communityPostsTotalResult.rows[0]?.count || '0');

        // Offline syncs today
        const offlineSyncsTodayQuery = `
          SELECT COUNT(*) as count
          FROM analytics_events 
          WHERE event_name = 'offline_sync_completed'
          AND created_at >= CURRENT_DATE
        `;
        const offlineSyncsTodayResult = await client.query(offlineSyncsTodayQuery);
        const offlineSyncsToday = parseInt(offlineSyncsTodayResult.rows[0]?.count || '0');

        // Storage used (estimate based on story items with content_url)
        const storageQuery = `
          SELECT COUNT(*) as photo_count
          FROM story_items 
          WHERE type = 'photo' 
          AND content_url IS NOT NULL
        `;
        const storageResult = await client.query(storageQuery);
        const photoCount = parseInt(storageResult.rows[0]?.photo_count || '0');
        // Estimate 2MB per photo on average
        const storageUsedGb = (photoCount * 2) / 1024;

        // API errors today (from analytics events)
        const apiErrorsTodayQuery = `
          SELECT COUNT(*) as count
          FROM analytics_events 
          WHERE event_name LIKE '%error%'
          AND created_at >= CURRENT_DATE
        `;
        const apiErrorsTodayResult = await client.query(apiErrorsTodayQuery);
        const apiErrorsToday = parseInt(apiErrorsTodayResult.rows[0]?.count || '0');

        // Active users (users who have been active in last 24 hours)
        const activeUsersQuery = `
          SELECT DISTINCT 
            ae.user_id,
            u.name,
            u.email,
            MAX(ae.created_at) as last_active,
            COUNT(DISTINCT t.id) as trip_count
          FROM analytics_events ae
          JOIN users u ON u.id = ae.user_id
          LEFT JOIN trips t ON t.owner_id = u.id
          WHERE ae.created_at >= NOW() - INTERVAL '24 hours'
          AND ae.user_id IS NOT NULL
          GROUP BY ae.user_id, u.name, u.email
          ORDER BY last_active DESC
          LIMIT 10
        `;
        const activeUsersResult = await client.query(activeUsersQuery);
        const activeUsers = activeUsersResult.rows.map(row => ({
          user_id: row.user_id,
          name: row.name,
          email: row.email,
          last_active: row.last_active,
          trip_count: parseInt(row.trip_count || '0')
        }));

        const metrics = {
          dau,
          mau,
          trips_created_today: tripsCreatedToday,
          trips_created_total: tripsCreatedTotal,
          community_posts_today: communityPostsToday,
          community_posts_total: communityPostsTotal,
          offline_syncs_today: offlineSyncsToday,
          storage_used_gb: Math.round(storageUsedGb * 100) / 100, // Round to 2 decimal places
          api_errors_today: apiErrorsToday,
          active_users: activeUsers
        };

        res.json(metrics);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ 
        error: 'Failed to fetch dashboard metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get system health metrics
  static async getSystemHealth(_req: Request, res: Response) {
    try {
      const client = await pool.connect();
      
      try {
        // Database health
        const dbHealthQuery = `
          SELECT 
            COUNT(*) as connection_count,
            AVG(EXTRACT(EPOCH FROM (NOW() - query_start)) * 1000) as avg_query_time_ms
          FROM pg_stat_activity 
          WHERE state = 'active'
        `;
        const dbHealthResult = await client.query(dbHealthQuery);
        const dbHealth = dbHealthResult.rows[0];

        // Storage metrics (estimate)
        const storageQuery = `
          SELECT 
            COUNT(*) as total_files,
            SUM(CASE WHEN type = 'photo' THEN 2 ELSE 0 END) as estimated_mb
          FROM story_items 
          WHERE content_url IS NOT NULL
        `;
        const storageResult = await client.query(storageQuery);
        const storage = storageResult.rows[0];
        const totalGb = (parseInt(storage.estimated_mb || '0')) / 1024;
        const maxStorageGb = 100; // Assume 100GB limit for now

        // Error rates
        const errorRatesQuery = `
          SELECT 
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as last_hour,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7d
          FROM analytics_events 
          WHERE event_name LIKE '%error%'
        `;
        const errorRatesResult = await client.query(errorRatesQuery);
        const errorRates = errorRatesResult.rows[0];

        const systemHealth = {
          database: {
            status: 'healthy' as const,
            connection_count: parseInt(dbHealth.connection_count || '0'),
            query_avg_time_ms: Math.round(parseFloat(dbHealth.avg_query_time_ms || '0'))
          },
          storage: {
            total_gb: maxStorageGb,
            used_gb: Math.round(totalGb * 100) / 100,
            available_gb: Math.round((maxStorageGb - totalGb) * 100) / 100,
            percentage_used: Math.round((totalGb / maxStorageGb) * 100)
          },
          external_apis: {
            google_maps: 'healthy' as const, // TODO: Implement actual health checks
            weather: 'healthy' as const,
            currency: 'healthy' as const
          },
          error_rates: {
            last_hour: parseInt(errorRates.last_hour || '0'),
            last_24h: parseInt(errorRates.last_24h || '0'),
            last_7d: parseInt(errorRates.last_7d || '0')
          }
        };

        res.json(systemHealth);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
      res.status(500).json({ 
        error: 'Failed to fetch system health',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get users with filtering and search
  static async getUsers(req: Request, res: Response) {
    try {
      const {
        search,
        role,
        created_after,
        created_before,
        has_trips,
        is_blocked,
        page = 1,
        limit = 20
      } = req.query;

      const client = await pool.connect();
      
      try {
        let whereConditions = ['1=1'];
        const queryParams: any[] = [];
        let paramIndex = 1;

        // Search by name or email
        if (search) {
          whereConditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
          queryParams.push(`%${search}%`);
          paramIndex++;
        }

        // Filter by role
        if (role) {
          whereConditions.push(`u.role = $${paramIndex}`);
          queryParams.push(role);
          paramIndex++;
        }

        // Filter by creation date
        if (created_after) {
          whereConditions.push(`u.created_at >= $${paramIndex}`);
          queryParams.push(created_after);
          paramIndex++;
        }

        if (created_before) {
          whereConditions.push(`u.created_at <= $${paramIndex}`);
          queryParams.push(created_before);
          paramIndex++;
        }

        // Filter by trip ownership
        if (has_trips === 'true') {
          whereConditions.push('trip_count > 0');
        } else if (has_trips === 'false') {
          whereConditions.push('trip_count = 0');
        }

        // Filter by blocked status
        if (is_blocked === 'true') {
          whereConditions.push(`u.role = 'blocked'`);
        } else if (is_blocked === 'false') {
          whereConditions.push(`u.role != 'blocked'`);
        }

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        const query = `
          SELECT 
            u.id,
            u.email,
            u.name,
            u.role,
            u.created_at,
            COUNT(t.id) as trip_count,
            MAX(ae.created_at) as last_active,
            CASE WHEN u.role = 'blocked' THEN true ELSE false END as is_blocked
          FROM users u
          LEFT JOIN trips t ON t.owner_id = u.id
          LEFT JOIN analytics_events ae ON ae.user_id = u.id
          WHERE ${whereConditions.join(' AND ')}
          GROUP BY u.id, u.email, u.name, u.role, u.created_at
          ORDER BY u.created_at DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(parseInt(limit as string), offset);

        const result = await client.query(query, queryParams);

        // Get total count for pagination
        const countQuery = `
          SELECT COUNT(DISTINCT u.id) as total
          FROM users u
          LEFT JOIN trips t ON t.owner_id = u.id
          WHERE ${whereConditions.join(' AND ')}
        `;

        const countResult = await client.query(countQuery, queryParams.slice(0, -2));
        const total = parseInt(countResult.rows[0]?.total || '0');

        const users = result.rows.map(row => ({
          id: row.id,
          email: row.email,
          name: row.name,
          role: row.role,
          created_at: row.created_at,
          trip_count: parseInt(row.trip_count || '0'),
          last_active: row.last_active,
          is_blocked: row.is_blocked
        }));

        res.json({
          users,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string))
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Block/unblock user
  static async updateUserStatus(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { action } = req.body; // 'block' or 'unblock'

      if (!['block', 'unblock'].includes(action)) {
        res.status(400).json({ error: 'Invalid action. Must be "block" or "unblock"' });
        return;
      }

      const client = await pool.connect();
      
      try {
        // Get current user info
        const userQuery = 'SELECT * FROM users WHERE id = $1';
        const userResult = await client.query(userQuery, [userId]);
        
        if (userResult.rows.length === 0) {
          res.status(404).json({ error: 'User not found' });
          return;
        }

        const newRole = action === 'block' ? 'blocked' : 'user';

        // Update user role
        const updateQuery = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING *';
        const updateResult = await client.query(updateQuery, [newRole, userId]);

        // Log the moderation action
        const logQuery = `
          INSERT INTO moderation_log (action, resource_type, resource_id, moderator_id, reason)
          VALUES ($1, 'user', $2, $3, $4)
        `;
        await client.query(logQuery, [
          action === 'block' ? 'ban' : 'restore',
          userId,
          (req as any).user.id,
          `User ${action}ed by admin`
        ]);

        res.json({
          message: `User ${action}ed successfully`,
          user: updateResult.rows[0]
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ 
        error: 'Failed to update user status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Export users as CSV
  static async exportUsers(_req: Request, res: Response) {
    try {
      const client = await pool.connect();
      
      try {
        const query = `
          SELECT 
            u.id,
            u.email,
            u.name,
            u.role,
            u.created_at,
            COUNT(t.id) as trip_count,
            MAX(ae.created_at) as last_active
          FROM users u
          LEFT JOIN trips t ON t.owner_id = u.id
          LEFT JOIN analytics_events ae ON ae.user_id = u.id
          GROUP BY u.id, u.email, u.name, u.role, u.created_at
          ORDER BY u.created_at DESC
        `;

        const result = await client.query(query);

        // Generate CSV content
        const headers = ['ID', 'Email', 'Name', 'Role', 'Created At', 'Trip Count', 'Last Active'];
        const csvContent = [
          headers.join(','),
          ...result.rows.map(row => [
            row.id,
            `"${row.email}"`,
            `"${row.name}"`,
            row.role,
            row.created_at,
            row.trip_count || 0,
            row.last_active || 'Never'
          ].join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      res.status(500).json({ 
        error: 'Failed to export users',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get flagged content for moderation
  static async getFlaggedContent(req: Request, res: Response) {
    try {
      const {
        resource_type,
        status = 'pending',
        page = 1,
        limit = 20
      } = req.query;

      const client = await pool.connect();
      
      try {
        let whereConditions = ['1=1'];
        const queryParams: any[] = [];
        let paramIndex = 1;

        // Filter by resource type
        if (resource_type) {
          whereConditions.push(`mf.resource_type = $${paramIndex}`);
          queryParams.push(resource_type);
          paramIndex++;
        }

        // Filter by status
        if (status) {
          whereConditions.push(`mf.status = $${paramIndex}`);
          queryParams.push(status);
          paramIndex++;
        }

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        const query = `
          SELECT 
            mf.*,
            CASE 
              WHEN mf.resource_type = 'trip' THEN 
                json_build_object(
                  'id', t.id,
                  'title', t.title,
                  'destination', t.destination,
                  'owner_name', u_owner.name,
                  'owner_email', u_owner.email,
                  'is_community', t.is_community,
                  'likes_count', t.likes_count,
                  'views_count', t.views_count
                )
              WHEN mf.resource_type = 'story_item' THEN
                json_build_object(
                  'id', si.id,
                  'type', si.type,
                  'caption', si.caption,
                  'content_url', si.content_url,
                  'trip_title', t2.title,
                  'author_name', u_author.name,
                  'author_email', u_author.email
                )
              WHEN mf.resource_type = 'user' THEN
                json_build_object(
                  'id', u_flagged.id,
                  'name', u_flagged.name,
                  'email', u_flagged.email,
                  'role', u_flagged.role,
                  'trip_count', (SELECT COUNT(*) FROM trips WHERE owner_id = u_flagged.id)
                )
            END as resource_data,
            CASE 
              WHEN mf.moderator_id IS NOT NULL THEN
                json_build_object(
                  'id', u_mod.id,
                  'name', u_mod.name,
                  'email', u_mod.email
                )
            END as moderator_data
          FROM moderation_flags mf
          LEFT JOIN trips t ON mf.resource_type = 'trip' AND mf.resource_id = t.id::text
          LEFT JOIN users u_owner ON t.owner_id = u_owner.id
          LEFT JOIN story_items si ON mf.resource_type = 'story_item' AND mf.resource_id = si.id::text
          LEFT JOIN trips t2 ON si.trip_id = t2.id
          LEFT JOIN users u_author ON si.user_id = u_author.id
          LEFT JOIN users u_flagged ON mf.resource_type = 'user' AND mf.resource_id = u_flagged.id::text
          LEFT JOIN users u_mod ON mf.moderator_id = u_mod.id
          WHERE ${whereConditions.join(' AND ')}
          ORDER BY mf.created_at DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(parseInt(limit as string), offset);

        const result = await client.query(query, queryParams);

        // Get total count for pagination
        const countQuery = `
          SELECT COUNT(*) as total
          FROM moderation_flags mf
          WHERE ${whereConditions.join(' AND ')}
        `;

        const countResult = await client.query(countQuery, queryParams.slice(0, -2));
        const total = parseInt(countResult.rows[0]?.total || '0');

        const flags = result.rows.map(row => ({
          id: row.id,
          resource_type: row.resource_type,
          resource_id: row.resource_id,
          reason: row.reason,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
          resource: row.resource_data,
          moderator: row.moderator_data
        }));

        res.json({
          flags,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string))
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching flagged content:', error);
      res.status(500).json({ 
        error: 'Failed to fetch flagged content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Take moderation action
  static async takeModerationAction(req: Request, res: Response) {
    try {
      const { flagId } = req.params;
      const { action, reason } = req.body; // 'flag', 'hide', 'delete', 'warn', 'dismiss'

      if (!['flag', 'hide', 'delete', 'warn', 'dismiss'].includes(action)) {
        res.status(400).json({ error: 'Invalid action' });
        return;
      }

      const client = await pool.connect();
      
      try {
        // Get the flag details
        const flagQuery = 'SELECT * FROM moderation_flags WHERE id = $1';
        const flagResult = await client.query(flagQuery, [flagId]);
        
        if (flagResult.rows.length === 0) {
          res.status(404).json({ error: 'Flag not found' });
          return;
        }

        const flag = flagResult.rows[0];

        // Update flag status
        let newStatus = 'reviewed';
        if (action === 'dismiss') {
          newStatus = 'dismissed';
        } else if (action === 'delete' || action === 'hide') {
          newStatus = 'resolved';
        }

        const updateFlagQuery = `
          UPDATE moderation_flags 
          SET status = $1, moderator_id = $2, updated_at = NOW()
          WHERE id = $3
          RETURNING *
        `;
        await client.query(updateFlagQuery, [newStatus, (req as any).user.id, flagId]);

        // Log the moderation action
        const logQuery = `
          INSERT INTO moderation_log (action, resource_type, resource_id, moderator_id, reason)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(logQuery, [
          action,
          flag.resource_type,
          flag.resource_id,
          (req as any).user.id,
          reason || `Moderation action: ${action}`
        ]);

        // Take action on the resource
        if (action === 'hide' && flag.resource_type === 'trip') {
          // Hide trip from community
          await client.query(
            'UPDATE trips SET is_community = false WHERE id = $1',
            [flag.resource_id]
          );
        } else if (action === 'delete' && flag.resource_type === 'trip') {
          // Delete trip (cascade will handle related data)
          await client.query('DELETE FROM trips WHERE id = $1', [flag.resource_id]);
        } else if (action === 'delete' && flag.resource_type === 'story_item') {
          // Delete story item
          await client.query('DELETE FROM story_items WHERE id = $1', [flag.resource_id]);
        } else if (action === 'warn' && flag.resource_type === 'user') {
          // TODO: Send warning email to user
          console.log(`Warning sent to user ${flag.resource_id}`);
        }

        res.json({
          message: `Moderation action "${action}" completed successfully`,
          flag_id: flagId,
          action,
          status: newStatus
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error taking moderation action:', error);
      res.status(500).json({ 
        error: 'Failed to take moderation action',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create a new flag (for reporting content)
  static async createFlag(req: Request, res: Response) {
    try {
      const { resource_type, resource_id, reason } = req.body;

      if (!['trip', 'story_item', 'user'].includes(resource_type)) {
        res.status(400).json({ error: 'Invalid resource type' });
        return;
      }

      if (!resource_id || !reason) {
        res.status(400).json({ error: 'Resource ID and reason are required' });
        return;
      }

      const client = await pool.connect();
      
      try {
        // Check if resource exists
        let resourceExists = false;
        if (resource_type === 'trip') {
          const result = await client.query('SELECT id FROM trips WHERE id = $1', [resource_id]);
          resourceExists = result.rows.length > 0;
        } else if (resource_type === 'story_item') {
          const result = await client.query('SELECT id FROM story_items WHERE id = $1', [resource_id]);
          resourceExists = result.rows.length > 0;
        } else if (resource_type === 'user') {
          const result = await client.query('SELECT id FROM users WHERE id = $1', [resource_id]);
          resourceExists = result.rows.length > 0;
        }

        if (!resourceExists) {
          res.status(404).json({ error: 'Resource not found' });
          return;
        }

        // Create the flag
        const insertQuery = `
          INSERT INTO moderation_flags (resource_type, resource_id, reason)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        const result = await client.query(insertQuery, [resource_type, resource_id, reason]);

        res.status(201).json({
          message: 'Content flagged successfully',
          flag: result.rows[0]
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating flag:', error);
      res.status(500).json({ 
        error: 'Failed to create flag',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get moderation log
  static async getModerationLog(req: Request, res: Response) {
    try {
      const {
        resource_type,
        action,
        moderator_id,
        page = 1,
        limit = 20
      } = req.query;

      const client = await pool.connect();
      
      try {
        let whereConditions = ['1=1'];
        const queryParams: any[] = [];
        let paramIndex = 1;

        // Filter by resource type
        if (resource_type) {
          whereConditions.push(`ml.resource_type = $${paramIndex}`);
          queryParams.push(resource_type);
          paramIndex++;
        }

        // Filter by action
        if (action) {
          whereConditions.push(`ml.action = $${paramIndex}`);
          queryParams.push(action);
          paramIndex++;
        }

        // Filter by moderator
        if (moderator_id) {
          whereConditions.push(`ml.moderator_id = $${paramIndex}`);
          queryParams.push(moderator_id);
          paramIndex++;
        }

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        const query = `
          SELECT 
            ml.*,
            json_build_object(
              'id', u.id,
              'name', u.name,
              'email', u.email
            ) as moderator_data
          FROM moderation_log ml
          JOIN users u ON ml.moderator_id = u.id
          WHERE ${whereConditions.join(' AND ')}
          ORDER BY ml.created_at DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(parseInt(limit as string), offset);

        const result = await client.query(query, queryParams);

        // Get total count for pagination
        const countQuery = `
          SELECT COUNT(*) as total
          FROM moderation_log ml
          WHERE ${whereConditions.join(' AND ')}
        `;

        const countResult = await client.query(countQuery, queryParams.slice(0, -2));
        const total = parseInt(countResult.rows[0]?.total || '0');

        const logs = result.rows.map(row => ({
          id: row.id,
          action: row.action,
          resource_type: row.resource_type,
          resource_id: row.resource_id,
          reason: row.reason,
          metadata: row.metadata,
          created_at: row.created_at,
          moderator: row.moderator_data
        }));

        res.json({
          logs,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string))
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching moderation log:', error);
      res.status(500).json({ 
        error: 'Failed to fetch moderation log',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get analytics insights
  static async getAnalyticsInsights(_req: Request, res: Response) {
    try {
      const client = await pool.connect();
      
      try {
        // Top destinations
        const topDestinationsQuery = `
          SELECT 
            destination,
            COUNT(*) as trip_count,
            SUM(likes_count) as total_likes,
            SUM(views_count) as total_views
          FROM trips
          WHERE destination IS NOT NULL AND destination != ''
          GROUP BY destination
          ORDER BY trip_count DESC
          LIMIT 10
        `;
        const topDestinationsResult = await client.query(topDestinationsQuery);

        // Most liked trips
        const mostLikedTripsQuery = `
          SELECT 
            t.id,
            t.title,
            t.destination,
            t.likes_count,
            t.views_count,
            u.name as owner_name,
            u.email as owner_email
          FROM trips t
          JOIN users u ON t.owner_id = u.id
          WHERE t.is_community = true
          ORDER BY t.likes_count DESC
          LIMIT 10
        `;
        const mostLikedTripsResult = await client.query(mostLikedTripsQuery);

        // Event counts by type
        const eventCountsQuery = `
          SELECT 
            event_name,
            COUNT(*) as count
          FROM analytics_events
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY event_name
          ORDER BY count DESC
          LIMIT 20
        `;
        const eventCountsResult = await client.query(eventCountsQuery);

        // Conversion funnel
        const conversionFunnelQuery = `
          SELECT 
            COUNT(DISTINCT CASE WHEN event_name = 'trip_created' THEN user_id END) as trips_created,
            COUNT(DISTINCT CASE WHEN event_name = 'trip_shared' THEN user_id END) as trips_shared,
            COUNT(DISTINCT CASE WHEN event_name = 'community_posted' THEN user_id END) as community_posted
          FROM analytics_events
          WHERE created_at >= NOW() - INTERVAL '30 days'
        `;
        const conversionFunnelResult = await client.query(conversionFunnelQuery);
        const funnel = conversionFunnelResult.rows[0];

        // Suggestion analytics (if tables exist)
        let suggestionAnalytics = null;
        try {
          const suggestionStatsQuery = `
            SELECT 
              COUNT(CASE WHEN si.interaction_type = 'view' THEN 1 END) as suggestion_views,
              COUNT(CASE WHEN si.interaction_type = 'click' THEN 1 END) as suggestion_clicks,
              COUNT(CASE WHEN si.interaction_type = 'quick_plan' THEN 1 END) as quick_plans,
              COUNT(DISTINCT ds.destination) as unique_destinations
            FROM suggestion_interactions si
            LEFT JOIN destination_suggestions ds ON si.suggestion_id = ds.id
            WHERE si.created_at >= NOW() - INTERVAL '30 days'
          `;
          const suggestionStatsResult = await client.query(suggestionStatsQuery);
          const suggestionStats = suggestionStatsResult.rows[0];

          // Top suggested destinations
          const topSuggestionsQuery = `
            SELECT 
              ds.destination,
              ds.country,
              COUNT(si.id) as total_interactions,
              COUNT(CASE WHEN si.interaction_type = 'view' THEN 1 END) as views,
              COUNT(CASE WHEN si.interaction_type = 'click' THEN 1 END) as clicks,
              COUNT(CASE WHEN si.interaction_type = 'quick_plan' THEN 1 END) as quick_plans
            FROM destination_suggestions ds
            LEFT JOIN suggestion_interactions si ON ds.id = si.suggestion_id
            WHERE si.created_at >= NOW() - INTERVAL '30 days' OR si.created_at IS NULL
            GROUP BY ds.id, ds.destination, ds.country
            ORDER BY total_interactions DESC
            LIMIT 10
          `;
          const topSuggestionsResult = await client.query(topSuggestionsQuery);

          suggestionAnalytics = {
            stats: {
              suggestion_views: parseInt(suggestionStats.suggestion_views || '0'),
              suggestion_clicks: parseInt(suggestionStats.suggestion_clicks || '0'),
              quick_plans: parseInt(suggestionStats.quick_plans || '0'),
              unique_destinations: parseInt(suggestionStats.unique_destinations || '0'),
              click_rate: suggestionStats.suggestion_views > 0 
                ? Math.round((parseInt(suggestionStats.suggestion_clicks || '0') / parseInt(suggestionStats.suggestion_views || '0')) * 100)
                : 0,
              conversion_rate: suggestionStats.suggestion_clicks > 0
                ? Math.round((parseInt(suggestionStats.quick_plans || '0') / parseInt(suggestionStats.suggestion_clicks || '0')) * 100)
                : 0
            },
            top_suggestions: topSuggestionsResult.rows.map(row => ({
              destination: row.destination,
              country: row.country,
              total_interactions: parseInt(row.total_interactions || '0'),
              views: parseInt(row.views || '0'),
              clicks: parseInt(row.clicks || '0'),
              quick_plans: parseInt(row.quick_plans || '0')
            }))
          };
        } catch (suggestionError) {
          // Suggestion tables might not exist yet
          console.log('Suggestion analytics not available:', suggestionError);
        }

        const insights = {
          top_destinations: topDestinationsResult.rows.map(row => ({
            destination: row.destination,
            trip_count: parseInt(row.trip_count || '0'),
            total_likes: parseInt(row.total_likes || '0'),
            total_views: parseInt(row.total_views || '0')
          })),
          most_liked_trips: mostLikedTripsResult.rows.map(row => ({
            id: row.id,
            title: row.title,
            destination: row.destination,
            likes_count: parseInt(row.likes_count || '0'),
            views_count: parseInt(row.views_count || '0'),
            owner_name: row.owner_name,
            owner_email: row.owner_email
          })),
          event_counts: eventCountsResult.rows.map(row => ({
            event_name: row.event_name,
            count: parseInt(row.count || '0')
          })),
          conversion_funnel: {
            trips_created: parseInt(funnel.trips_created || '0'),
            trips_shared: parseInt(funnel.trips_shared || '0'),
            community_posted: parseInt(funnel.community_posted || '0'),
            share_rate: funnel.trips_created > 0 
              ? Math.round((parseInt(funnel.trips_shared || '0') / parseInt(funnel.trips_created || '0')) * 100)
              : 0,
            community_rate: funnel.trips_created > 0
              ? Math.round((parseInt(funnel.community_posted || '0') / parseInt(funnel.trips_created || '0')) * 100)
              : 0
          },
          suggestions: suggestionAnalytics
        };

        res.json(insights);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching analytics insights:', error);
      res.status(500).json({ 
        error: 'Failed to fetch analytics insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all feature flags
  static async getFeatureFlags(_req: Request, res: Response) {
    try {
      const client = await pool.connect();
      
      try {
        const query = 'SELECT * FROM feature_flags ORDER BY name ASC';
        const result = await client.query(query);

        const flags = result.rows.map(row => ({
          id: row.id,
          name: row.name,
          enabled: row.enabled,
          rollout_percentage: row.rollout_percentage,
          description: row.description,
          created_at: row.created_at,
          updated_at: row.updated_at
        }));

        res.json({ flags });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      res.status(500).json({ 
        error: 'Failed to fetch feature flags',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update feature flag
  static async updateFeatureFlag(req: Request, res: Response) {
    try {
      const { flagId } = req.params;
      const { enabled, rollout_percentage, description } = req.body;

      const client = await pool.connect();
      
      try {
        // Build update query dynamically based on provided fields
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (enabled !== undefined) {
          updates.push(`enabled = $${paramIndex}`);
          values.push(enabled);
          paramIndex++;
        }

        if (rollout_percentage !== undefined) {
          if (rollout_percentage < 0 || rollout_percentage > 100) {
            res.status(400).json({ error: 'Rollout percentage must be between 0 and 100' });
            return;
          }
          updates.push(`rollout_percentage = $${paramIndex}`);
          values.push(rollout_percentage);
          paramIndex++;
        }

        if (description !== undefined) {
          updates.push(`description = $${paramIndex}`);
          values.push(description);
          paramIndex++;
        }

        if (updates.length === 0) {
          res.status(400).json({ error: 'No fields to update' });
          return;
        }

        updates.push(`updated_at = NOW()`);
        values.push(flagId);

        const query = `
          UPDATE feature_flags 
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        const result = await client.query(query, values);

        if (result.rows.length === 0) {
          res.status(404).json({ error: 'Feature flag not found' });
          return;
        }

        res.json({
          message: 'Feature flag updated successfully',
          flag: result.rows[0]
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating feature flag:', error);
      res.status(500).json({ 
        error: 'Failed to update feature flag',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}