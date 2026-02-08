-- Sticker system tables
-- This migration creates tables for user-uploaded stickers and sticker attachments

-- Stickers table (for user-uploaded stickers)
CREATE TABLE IF NOT EXISTS stickers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'custom',
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sticker attachments table (for attaching stickers to places/days/trips)
CREATE TABLE IF NOT EXISTS sticker_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sticker_id UUID REFERENCES stickers(id) ON DELETE CASCADE,
    emoji_sticker TEXT, -- For predefined emoji stickers (not in stickers table)
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    -- Polymorphic relationship - can attach to different entities
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('place', 'trip_day', 'trip')),
    entity_id UUID NOT NULL,
    
    -- Position and styling
    position_x DECIMAL(5,2) DEFAULT 50.0,
    position_y DECIMAL(5,2) DEFAULT 50.0,
    rotation DECIMAL(5,2) DEFAULT 0.0,
    scale DECIMAL(3,2) DEFAULT 1.0,
    z_index INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure either sticker_id or emoji_sticker is provided (but not both)
    CONSTRAINT check_sticker_type CHECK (
        (sticker_id IS NOT NULL AND emoji_sticker IS NULL) OR
        (sticker_id IS NULL AND emoji_sticker IS NOT NULL)
    )
);

-- Predefined stickers table (for system/default stickers)
CREATE TABLE IF NOT EXISTS predefined_stickers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stickers_user_id ON stickers(user_id);
CREATE INDEX IF NOT EXISTS idx_stickers_category ON stickers(category);
CREATE INDEX IF NOT EXISTS idx_stickers_is_public ON stickers(is_public);
CREATE INDEX IF NOT EXISTS idx_stickers_created_at ON stickers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sticker_attachments_sticker_id ON sticker_attachments(sticker_id);
CREATE INDEX IF NOT EXISTS idx_sticker_attachments_user_id ON sticker_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_sticker_attachments_entity ON sticker_attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sticker_attachments_created_at ON sticker_attachments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_predefined_stickers_category ON predefined_stickers(category);
CREATE INDEX IF NOT EXISTS idx_predefined_stickers_is_active ON predefined_stickers(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_stickers_display_order ON predefined_stickers(display_order);

-- Create update triggers
DROP TRIGGER IF EXISTS update_stickers_updated_at ON stickers;
CREATE TRIGGER update_stickers_updated_at 
    BEFORE UPDATE ON stickers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sticker_attachments_updated_at ON sticker_attachments;
CREATE TRIGGER update_sticker_attachments_updated_at 
    BEFORE UPDATE ON sticker_attachments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_predefined_stickers_updated_at ON predefined_stickers;
CREATE TRIGGER update_predefined_stickers_updated_at 
    BEFORE UPDATE ON predefined_stickers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default predefined stickers
INSERT INTO predefined_stickers (name, image_url, category, tags, display_order) VALUES
    ('Heart', '/stickers/default/heart.svg', 'emotions', ARRAY['love', 'favorite'], 1),
    ('Star', '/stickers/default/star.svg', 'emotions', ARRAY['favorite', 'highlight'], 2),
    ('Camera', '/stickers/default/camera.svg', 'activities', ARRAY['photo', 'memory'], 3),
    ('Food', '/stickers/default/food.svg', 'activities', ARRAY['restaurant', 'meal'], 4),
    ('Plane', '/stickers/default/plane.svg', 'travel', ARRAY['flight', 'transport'], 5),
    ('Map Pin', '/stickers/default/pin.svg', 'travel', ARRAY['location', 'place'], 6),
    ('Sun', '/stickers/default/sun.svg', 'weather', ARRAY['sunny', 'outdoor'], 7),
    ('Moon', '/stickers/default/moon.svg', 'weather', ARRAY['night', 'evening'], 8),
    ('Thumbs Up', '/stickers/default/thumbs-up.svg', 'reactions', ARRAY['like', 'good'], 9),
    ('Fire', '/stickers/default/fire.svg', 'reactions', ARRAY['hot', 'amazing'], 10)
ON CONFLICT DO NOTHING;

-- Function to increment sticker usage count
CREATE OR REPLACE FUNCTION increment_sticker_usage(p_sticker_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE stickers 
    SET usage_count = usage_count + 1 
    WHERE id = p_sticker_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can attach sticker to entity
CREATE OR REPLACE FUNCTION user_can_attach_sticker(
    p_user_id UUID, 
    p_entity_type VARCHAR(50), 
    p_entity_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    CASE p_entity_type
        WHEN 'place' THEN
            -- Check if user has access to the trip containing this place
            RETURN EXISTS (
                SELECT 1 FROM places p
                JOIN trip_days td ON p.trip_day_id = td.id
                JOIN trips t ON td.trip_id = t.id
                WHERE p.id = p_entity_id 
                AND (
                    t.owner_id = p_user_id 
                    OR user_is_collaborator(p_user_id, t.id)
                )
            );
        WHEN 'trip_day' THEN
            -- Check if user has access to the trip containing this day
            RETURN EXISTS (
                SELECT 1 FROM trip_days td
                JOIN trips t ON td.trip_id = t.id
                WHERE td.id = p_entity_id 
                AND (
                    t.owner_id = p_user_id 
                    OR user_is_collaborator(p_user_id, t.id)
                )
            );
        WHEN 'trip' THEN
            -- Check if user owns or is a collaborator on the trip
            RETURN user_owns_trip(p_user_id, p_entity_id) 
                OR user_is_collaborator(p_user_id, p_entity_id);
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;
