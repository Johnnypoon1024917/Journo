import { pool } from '../../config/database.js';
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Migration 031: Collaboration Enhancements', () => {
  describe('invitation_links table', () => {
    it('should have all required columns', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'invitation_links'
        ORDER BY ordinal_position;
      `);

      const columns = result.rows.map(r => r.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('trip_id');
      expect(columns).toContain('token');
      expect(columns).toContain('role');
      expect(columns).toContain('created_by');
      expect(columns).toContain('expires_at');
      expect(columns).toContain('max_uses');
      expect(columns).toContain('use_count');
      expect(columns).toContain('is_active');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('should have all required indexes', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'invitation_links';
      `);

      const indexes = result.rows.map(r => r.indexname);
      expect(indexes).toContain('idx_invitation_links_token');
      expect(indexes).toContain('idx_invitation_links_trip_id');
      expect(indexes).toContain('idx_invitation_links_expires_at');
    });

    it('should have role constraint', async () => {
      const result = await pool.query(`
        SELECT constraint_name, check_clause
        FROM information_schema.check_constraints
        WHERE constraint_name LIKE '%invitation_links%role%';
      `);

      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  describe('activity_log table', () => {
    it('should have all required columns', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'activity_log'
        ORDER BY ordinal_position;
      `);

      const columns = result.rows.map(r => r.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('trip_id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('action_type');
      expect(columns).toContain('entity_type');
      expect(columns).toContain('entity_id');
      expect(columns).toContain('entity_name');
      expect(columns).toContain('changes');
      expect(columns).toContain('metadata');
      expect(columns).toContain('created_at');
    });

    it('should have all required indexes', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'activity_log';
      `);

      const indexes = result.rows.map(r => r.indexname);
      expect(indexes).toContain('idx_activity_log_trip_id');
      expect(indexes).toContain('idx_activity_log_user_id');
      expect(indexes).toContain('idx_activity_log_created_at');
      expect(indexes).toContain('idx_activity_log_action_type');
    });

    it('should have action_type constraint', async () => {
      const result = await pool.query(`
        SELECT constraint_name
        FROM information_schema.check_constraints
        WHERE constraint_name LIKE '%activity_log%action_type%';
      `);

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should support JSONB columns', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'activity_log'
        AND data_type = 'jsonb';
      `);

      const jsonbColumns = result.rows.map(r => r.column_name);
      expect(jsonbColumns).toContain('changes');
      expect(jsonbColumns).toContain('metadata');
    });
  });

  describe('trip_collaborators enhancements', () => {
    it('should have new presence tracking columns', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'trip_collaborators'
        AND column_name IN ('last_active_at', 'is_online', 'current_editing_entity', 'current_editing_entity_id');
      `);

      const columns = result.rows.map(r => r.column_name);
      expect(columns).toContain('last_active_at');
      expect(columns).toContain('is_online');
      expect(columns).toContain('current_editing_entity');
      expect(columns).toContain('current_editing_entity_id');
    });

    it('should have last_active index', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'trip_collaborators'
        AND indexname = 'idx_trip_collaborators_last_active';
      `);

      expect(result.rows.length).toBe(1);
    });
  });

  describe('notifications enhancements', () => {
    it('should have new notification management columns', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'notifications'
        AND column_name IN ('is_read', 'read_at', 'category', 'priority', 'action_url', 'expires_at');
      `);

      const columns = result.rows.map(r => r.column_name);
      expect(columns).toContain('is_read');
      expect(columns).toContain('read_at');
      expect(columns).toContain('category');
      expect(columns).toContain('priority');
      expect(columns).toContain('action_url');
      expect(columns).toContain('expires_at');
    });

    it('should have notification indexes', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'notifications'
        AND indexname IN ('idx_notifications_is_read', 'idx_notifications_category', 'idx_notifications_created_at');
      `);

      expect(result.rows.length).toBe(3);
    });

    it('should have category constraint', async () => {
      const result = await pool.query(`
        SELECT constraint_name
        FROM information_schema.check_constraints
        WHERE constraint_name = 'check_notification_category';
      `);

      expect(result.rows.length).toBe(1);
    });

    it('should have priority constraint', async () => {
      const result = await pool.query(`
        SELECT constraint_name
        FROM information_schema.check_constraints
        WHERE constraint_name = 'check_notification_priority';
      `);

      expect(result.rows.length).toBe(1);
    });
  });

  describe('helper functions', () => {
    it('should have cleanup_expired_invitation_links function', async () => {
      const result = await pool.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_name = 'cleanup_expired_invitation_links';
      `);

      expect(result.rows.length).toBe(1);
    });

    it('should have validate_invitation_link function', async () => {
      const result = await pool.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_name = 'validate_invitation_link';
      `);

      expect(result.rows.length).toBe(1);
    });

    it('should have increment_invitation_link_use function', async () => {
      const result = await pool.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_name = 'increment_invitation_link_use';
      `);

      expect(result.rows.length).toBe(1);
    });

    it('should have log_activity function', async () => {
      const result = await pool.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_name = 'log_activity';
      `);

      expect(result.rows.length).toBe(1);
    });
  });

  describe('functional tests', () => {
    it('should validate invitation link correctly', async () => {
      // Test with non-existent token
      const result = await pool.query(`
        SELECT * FROM validate_invitation_link('nonexistent-token');
      `);

      expect(result.rows[0].is_valid).toBe(false);
      expect(result.rows[0].reason).toBe('Link not found');
    });

    it('should log activity correctly', async () => {
      // Create a test trip first (assuming trips table exists)
      const tripResult = await pool.query(`
        SELECT id FROM trips LIMIT 1;
      `);

      if (tripResult.rows.length > 0) {
        const tripId = tripResult.rows[0].id;
        const userResult = await pool.query(`
          SELECT id FROM users LIMIT 1;
        `);

        if (userResult.rows.length > 0) {
          const userId = userResult.rows[0].id;

          const activityResult = await pool.query(`
            SELECT log_activity(
              $1::UUID, 
              $2::UUID, 
              'trip_updated'::VARCHAR, 
              'trip'::VARCHAR, 
              $1::UUID, 
              'Test Trip'::TEXT,
              '{"field": "title"}'::JSONB,
              '{"test": true}'::JSONB
            );
          `, [tripId, userId]);

          expect(activityResult.rows[0].log_activity).toBeDefined();

          // Verify the activity was logged
          const verifyResult = await pool.query(`
            SELECT * FROM activity_log WHERE id = $1;
          `, [activityResult.rows[0].log_activity]);

          expect(verifyResult.rows.length).toBe(1);
          expect(verifyResult.rows[0].action_type).toBe('trip_updated');

          // Clean up
          await pool.query(`
            DELETE FROM activity_log WHERE id = $1;
          `, [activityResult.rows[0].log_activity]);
        }
      }
    });
  });
});
