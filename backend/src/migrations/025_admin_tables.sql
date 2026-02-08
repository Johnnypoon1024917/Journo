-- Migration 025: Add missing admin tables for moderation and feature flags
-- Created: 2024-01-09

-- Create moderation flags table
CREATE TABLE IF NOT EXISTS moderation_flags (
  id SERIAL PRIMARY KEY,
  resource_type VARCHAR(50) NOT NULL, -- 'trip', 'story_item', 'user'
  resource_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed', 'resolved'
  moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create moderation log table
CREATE TABLE IF NOT EXISTS moderation_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL, -- 'flag', 'hide', 'delete', 'warn', 'dismiss', 'ban', 'restore'
  resource_type VARCHAR(50) NOT NULL, -- 'trip', 'story_item', 'user'
  resource_id TEXT NOT NULL,
  moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_moderation_flags_resource ON moderation_flags(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_moderation_flags_status ON moderation_flags(status);
CREATE INDEX IF NOT EXISTS idx_moderation_flags_created_at ON moderation_flags(created_at);

CREATE INDEX IF NOT EXISTS idx_moderation_log_resource ON moderation_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_moderator ON moderation_log(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_created_at ON moderation_log(created_at);

CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);

-- Insert some default feature flags
INSERT INTO feature_flags (name, enabled, rollout_percentage, description) VALUES
  ('quick_plan_v2', true, 100, 'Enable Quick Plan v2 with enhanced destination suggestions'),
  ('community_moderation', true, 100, 'Enable community content moderation features'),
  ('advanced_analytics', true, 100, 'Enable advanced analytics dashboard'),
  ('offline_sync', true, 100, 'Enable offline synchronization capabilities'),
  ('ai_suggestions', false, 0, 'Enable AI-powered travel suggestions'),
  ('premium_features', false, 10, 'Enable premium subscription features')
ON CONFLICT (name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE moderation_flags IS 'Content moderation flags for user-reported content';
COMMENT ON TABLE moderation_log IS 'Log of all moderation actions taken by administrators';
COMMENT ON TABLE feature_flags IS 'Feature flags for controlling application features and rollouts';

COMMENT ON COLUMN moderation_flags.resource_type IS 'Type of resource being flagged (trip, story_item, user)';
COMMENT ON COLUMN moderation_flags.resource_id IS 'ID of the resource being flagged';
COMMENT ON COLUMN moderation_flags.status IS 'Current status of the flag (pending, reviewed, dismissed, resolved)';

COMMENT ON COLUMN moderation_log.action IS 'Action taken by moderator (flag, hide, delete, warn, dismiss, ban, restore)';
COMMENT ON COLUMN moderation_log.metadata IS 'Additional metadata about the moderation action';

COMMENT ON COLUMN feature_flags.rollout_percentage IS 'Percentage of users who should see this feature (0-100)';