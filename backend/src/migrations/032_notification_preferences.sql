-- Migration: Add notification_preferences table
-- Description: Create table for user notification preferences
-- Date: 2026-02-07

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    in_app_notifications BOOLEAN DEFAULT TRUE,
    notify_on_collaborator_joined BOOLEAN DEFAULT TRUE,
    notify_on_item_added BOOLEAN DEFAULT TRUE,
    notify_on_item_edited BOOLEAN DEFAULT FALSE,
    notify_on_item_deleted BOOLEAN DEFAULT TRUE,
    notify_on_schedule_changed BOOLEAN DEFAULT TRUE,
    notify_on_mention BOOLEAN DEFAULT TRUE,
    batch_notifications BOOLEAN DEFAULT FALSE,
    batch_interval INTEGER DEFAULT 1 CHECK (batch_interval > 0 AND batch_interval <= 60),
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
ON notification_preferences(user_id);

-- Add comment to table
COMMENT ON TABLE notification_preferences IS 'Stores user notification preferences for controlling when and how notifications are delivered';

-- Add comments to columns
COMMENT ON COLUMN notification_preferences.email_notifications IS 'Enable/disable email notifications';
COMMENT ON COLUMN notification_preferences.push_notifications IS 'Enable/disable push notifications';
COMMENT ON COLUMN notification_preferences.in_app_notifications IS 'Enable/disable in-app notifications';
COMMENT ON COLUMN notification_preferences.batch_notifications IS 'Enable batching of notifications';
COMMENT ON COLUMN notification_preferences.batch_interval IS 'Batch interval in minutes (1-60)';
COMMENT ON COLUMN notification_preferences.quiet_hours_enabled IS 'Enable quiet hours (no notifications during specified time)';
COMMENT ON COLUMN notification_preferences.quiet_hours_start IS 'Start time for quiet hours (HH:MM format)';
COMMENT ON COLUMN notification_preferences.quiet_hours_end IS 'End time for quiet hours (HH:MM format)';

-- Rollback script (commented out)
-- DROP TABLE IF EXISTS notification_preferences;
