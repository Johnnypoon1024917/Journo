-- Collaboration Enhancement Migration
-- This migration adds tables and columns for enhanced collaboration features:
-- 1. invitation_links table for shareable invitation links
-- 2. activity_log table for tracking all trip changes
-- 3. Enhanced trip_collaborators table with presence tracking
-- 4. Enhanced notifications table with categories and priorities

-- ============================================================================
-- NEW TABLES
-- ============================================================================

-- 1. invitation_links table
-- Stores shareable invitation links with expiration
CREATE TABLE IF NOT EXISTS invitation_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('editor', 'viewer')),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    max_uses INTEGER DEFAULT NULL,  -- NULL = unlimited
    use_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for invitation_links
CREATE INDEX IF NOT EXISTS idx_invitation_links_token ON invitation_links(token);
CREATE INDEX IF NOT EXISTS idx_invitation_links_trip_id ON invitation_links(trip_id);
CREATE INDEX IF NOT EXISTS idx_invitation_links_expires_at ON invitation_links(expires_at);

-- Create update trigger for invitation_links
DROP TRIGGER IF EXISTS update_invitation_links_updated_at ON invitation_links;
CREATE TRIGGER update_invitation_links_updated_at 
    BEFORE UPDATE ON invitation_links 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 2. activity_log table
-- Tracks all changes to trip content for audit trail
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'trip_created', 'trip_updated', 'trip_deleted',
        'day_added', 'day_updated', 'day_deleted',
        'place_added', 'place_updated', 'place_deleted', 'place_reordered',
        'packing_item_added', 'packing_item_updated', 'packing_item_deleted',
        'shopping_item_added', 'shopping_item_updated', 'shopping_item_deleted',
        'collaborator_added', 'collaborator_removed', 'collaborator_role_changed',
        'story_added', 'story_deleted'
    )),
    entity_type VARCHAR(50) NOT NULL,  -- 'trip', 'day', 'place', 'packing_item', etc.
    entity_id UUID,  -- ID of the affected entity
    entity_name TEXT,  -- Human-readable name (e.g., "Day 1 - Tokyo Tower")
    changes JSONB,  -- Detailed change data
    metadata JSONB,  -- Additional context
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for activity_log
CREATE INDEX IF NOT EXISTS idx_activity_log_trip_id ON activity_log(trip_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON activity_log(action_type);

-- ============================================================================
-- ENHANCE EXISTING TABLES
-- ============================================================================

-- 3. Enhance trip_collaborators table
-- Add columns for presence tracking and editing status
DO $$ 
BEGIN
    -- Add last_active_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trip_collaborators' AND column_name = 'last_active_at'
    ) THEN
        ALTER TABLE trip_collaborators 
        ADD COLUMN last_active_at TIMESTAMP DEFAULT NOW();
    END IF;

    -- Add is_online column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trip_collaborators' AND column_name = 'is_online'
    ) THEN
        ALTER TABLE trip_collaborators 
        ADD COLUMN is_online BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add current_editing_entity column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trip_collaborators' AND column_name = 'current_editing_entity'
    ) THEN
        ALTER TABLE trip_collaborators 
        ADD COLUMN current_editing_entity VARCHAR(50);
    END IF;

    -- Add current_editing_entity_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trip_collaborators' AND column_name = 'current_editing_entity_id'
    ) THEN
        ALTER TABLE trip_collaborators 
        ADD COLUMN current_editing_entity_id UUID;
    END IF;
END $$;

-- Create index for trip_collaborators
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_last_active ON trip_collaborators(last_active_at DESC);

-- 4. Enhance notifications table
-- Add columns for notification management and categorization
DO $$ 
BEGIN
    -- Add is_read column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'is_read'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add read_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'read_at'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN read_at TIMESTAMP;
    END IF;

    -- Add category column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'category'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN category VARCHAR(50) DEFAULT 'general';
        
        -- Add check constraint for category
        ALTER TABLE notifications 
        ADD CONSTRAINT check_notification_category 
        CHECK (category IN ('collaboration', 'activity', 'mention', 'system', 'general'));
    END IF;

    -- Add priority column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'priority'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN priority VARCHAR(20) DEFAULT 'normal';
        
        -- Add check constraint for priority
        ALTER TABLE notifications 
        ADD CONSTRAINT check_notification_priority 
        CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;

    -- Add action_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'action_url'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN action_url TEXT;
    END IF;

    -- Add expires_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN expires_at TIMESTAMP;
    END IF;
END $$;

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to clean up expired invitation links
CREATE OR REPLACE FUNCTION cleanup_expired_invitation_links()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM invitation_links
        WHERE expires_at < NOW() AND is_active = TRUE
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to validate invitation link
CREATE OR REPLACE FUNCTION validate_invitation_link(p_token VARCHAR)
RETURNS TABLE (
    is_valid BOOLEAN,
    link_id UUID,
    trip_id UUID,
    role VARCHAR,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN il.id IS NULL THEN FALSE
            WHEN il.is_active = FALSE THEN FALSE
            WHEN il.expires_at < NOW() THEN FALSE
            WHEN il.max_uses IS NOT NULL AND il.use_count >= il.max_uses THEN FALSE
            ELSE TRUE
        END as is_valid,
        il.id as link_id,
        il.trip_id,
        il.role,
        CASE 
            WHEN il.id IS NULL THEN 'Link not found'
            WHEN il.is_active = FALSE THEN 'Link has been revoked'
            WHEN il.expires_at < NOW() THEN 'Link has expired'
            WHEN il.max_uses IS NOT NULL AND il.use_count >= il.max_uses THEN 'Link has reached maximum uses'
            ELSE 'Valid'
        END as reason
    FROM invitation_links il
    WHERE il.token = p_token;
    
    -- If no link found, return invalid result
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, NULL::VARCHAR, 'Link not found'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increment invitation link use count
CREATE OR REPLACE FUNCTION increment_invitation_link_use(p_link_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE invitation_links 
    SET use_count = use_count + 1,
        updated_at = NOW()
    WHERE id = p_link_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log activity (can be called from application or triggers)
CREATE OR REPLACE FUNCTION log_activity(
    p_trip_id UUID,
    p_user_id UUID,
    p_action_type VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_entity_name TEXT,
    p_changes JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO activity_log (
        trip_id, user_id, action_type, entity_type, 
        entity_id, entity_name, changes, metadata
    ) VALUES (
        p_trip_id, p_user_id, p_action_type, p_entity_type,
        p_entity_id, p_entity_name, p_changes, p_metadata
    )
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

-- To rollback this migration, run the following commands:
-- 
-- -- Drop helper functions
-- DROP FUNCTION IF EXISTS log_activity(UUID, UUID, VARCHAR, VARCHAR, UUID, TEXT, JSONB, JSONB);
-- DROP FUNCTION IF EXISTS increment_invitation_link_use(UUID);
-- DROP FUNCTION IF EXISTS validate_invitation_link(VARCHAR);
-- DROP FUNCTION IF EXISTS cleanup_expired_invitation_links();
-- 
-- -- Drop indexes for notifications
-- DROP INDEX IF EXISTS idx_notifications_created_at;
-- DROP INDEX IF EXISTS idx_notifications_category;
-- DROP INDEX IF EXISTS idx_notifications_is_read;
-- 
-- -- Remove columns from notifications
-- ALTER TABLE notifications DROP COLUMN IF EXISTS expires_at;
-- ALTER TABLE notifications DROP COLUMN IF EXISTS action_url;
-- ALTER TABLE notifications DROP CONSTRAINT IF EXISTS check_notification_priority;
-- ALTER TABLE notifications DROP COLUMN IF EXISTS priority;
-- ALTER TABLE notifications DROP CONSTRAINT IF EXISTS check_notification_category;
-- ALTER TABLE notifications DROP COLUMN IF EXISTS category;
-- ALTER TABLE notifications DROP COLUMN IF EXISTS read_at;
-- ALTER TABLE notifications DROP COLUMN IF EXISTS is_read;
-- 
-- -- Drop index for trip_collaborators
-- DROP INDEX IF EXISTS idx_trip_collaborators_last_active;
-- 
-- -- Remove columns from trip_collaborators
-- ALTER TABLE trip_collaborators DROP COLUMN IF EXISTS current_editing_entity_id;
-- ALTER TABLE trip_collaborators DROP COLUMN IF EXISTS current_editing_entity;
-- ALTER TABLE trip_collaborators DROP COLUMN IF EXISTS is_online;
-- ALTER TABLE trip_collaborators DROP COLUMN IF EXISTS last_active_at;
-- 
-- -- Drop activity_log table and indexes
-- DROP INDEX IF EXISTS idx_activity_log_action_type;
-- DROP INDEX IF EXISTS idx_activity_log_created_at;
-- DROP INDEX IF EXISTS idx_activity_log_user_id;
-- DROP INDEX IF EXISTS idx_activity_log_trip_id;
-- DROP TABLE IF EXISTS activity_log;
-- 
-- -- Drop invitation_links table, trigger, and indexes
-- DROP TRIGGER IF EXISTS update_invitation_links_updated_at ON invitation_links;
-- DROP INDEX IF EXISTS idx_invitation_links_expires_at;
-- DROP INDEX IF EXISTS idx_invitation_links_trip_id;
-- DROP INDEX IF EXISTS idx_invitation_links_token;
-- DROP TABLE IF EXISTS invitation_links;
