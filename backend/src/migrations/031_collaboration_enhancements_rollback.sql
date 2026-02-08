-- Rollback script for 031_collaboration_enhancements.sql
-- This script reverses all changes made by the collaboration enhancements migration

-- Drop helper functions
DROP FUNCTION IF EXISTS log_activity(UUID, UUID, VARCHAR, VARCHAR, UUID, TEXT, JSONB, JSONB);
DROP FUNCTION IF EXISTS increment_invitation_link_use(UUID);
DROP FUNCTION IF EXISTS validate_invitation_link(VARCHAR);
DROP FUNCTION IF EXISTS cleanup_expired_invitation_links();

-- Drop indexes for notifications
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_category;
DROP INDEX IF EXISTS idx_notifications_is_read;

-- Remove columns from notifications
ALTER TABLE notifications DROP COLUMN IF EXISTS expires_at;
ALTER TABLE notifications DROP COLUMN IF EXISTS action_url;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS check_notification_priority;
ALTER TABLE notifications DROP COLUMN IF EXISTS priority;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS check_notification_category;
ALTER TABLE notifications DROP COLUMN IF EXISTS category;
ALTER TABLE notifications DROP COLUMN IF EXISTS read_at;
ALTER TABLE notifications DROP COLUMN IF EXISTS is_read;

-- Drop index for trip_collaborators
DROP INDEX IF EXISTS idx_trip_collaborators_last_active;

-- Remove columns from trip_collaborators
ALTER TABLE trip_collaborators DROP COLUMN IF EXISTS current_editing_entity_id;
ALTER TABLE trip_collaborators DROP COLUMN IF EXISTS current_editing_entity;
ALTER TABLE trip_collaborators DROP COLUMN IF EXISTS is_online;
ALTER TABLE trip_collaborators DROP COLUMN IF EXISTS last_active_at;

-- Drop activity_log table and indexes
DROP INDEX IF EXISTS idx_activity_log_action_type;
DROP INDEX IF EXISTS idx_activity_log_created_at;
DROP INDEX IF EXISTS idx_activity_log_user_id;
DROP INDEX IF EXISTS idx_activity_log_trip_id;
DROP TABLE IF EXISTS activity_log;

-- Drop invitation_links table, trigger, and indexes
DROP TRIGGER IF EXISTS update_invitation_links_updated_at ON invitation_links;
DROP INDEX IF EXISTS idx_invitation_links_expires_at;
DROP INDEX IF EXISTS idx_invitation_links_trip_id;
DROP INDEX IF EXISTS idx_invitation_links_token;
DROP TABLE IF EXISTS invitation_links;

-- Remove migration record
DELETE FROM schema_migrations WHERE migration_name = '031_collaboration_enhancements.sql';
