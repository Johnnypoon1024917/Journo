-- Drop and recreate sticker tables to fix schema issues

-- Drop existing tables
DROP TABLE IF EXISTS sticker_attachments CASCADE;
DROP TABLE IF EXISTS stickers CASCADE;
DROP TABLE IF EXISTS predefined_stickers CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS increment_sticker_usage(UUID);
DROP FUNCTION IF EXISTS user_can_attach_sticker(UUID, VARCHAR, UUID);

-- Recreate stickers table
CREATE TABLE stickers (
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

-- Recreate sticker attachments table
CREATE TABLE sticker_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sticker_id UUID REFERENCES stickers(id) ON DELETE CASCADE,
    emoji_sticker TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('place', 'trip_day', 'trip')),
    entity_id UUID NOT NULL,
    position_x DECIMAL(5,2) DEFAULT 50.0,
    position_y DECIMAL(5,2) DEFAULT 50.0,
    rotation DECIMAL(5,2) DEFAULT 0.0,
    scale DECIMAL(3,2) DEFAULT 1.0,
    z_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_sticker_type CHECK (
        (sticker_id IS NOT NULL AND emoji_sticker IS NULL) OR
        (sticker_id IS NULL AND emoji_sticker IS NOT NULL)
    )
);

-- Recreate predefined stickers table
CREATE TABLE predefined_stickers (
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

-- Create indexes
CREATE INDEX idx_stickers_user_id ON stickers(user_id);
CREATE INDEX idx_stickers_category ON stickers(category);
CREATE INDEX idx_stickers_is_public ON stickers(is_public);
CREATE INDEX idx_stickers_created_at ON stickers(created_at DESC);

CREATE INDEX idx_sticker_attachments_sticker_id ON sticker_attachments(sticker_id);
CREATE INDEX idx_sticker_attachments_user_id ON sticker_attachments(user_id);
CREATE INDEX idx_sticker_attachments_entity ON sticker_attachments(entity_type, entity_id);
CREATE INDEX idx_sticker_attachments_created_at ON sticker_attachments(created_at DESC);

CREATE INDEX idx_predefined_stickers_category ON predefined_stickers(category);
CREATE INDEX idx_predefined_stickers_is_active ON predefined_stickers(is_active);
CREATE INDEX idx_predefined_stickers_display_order ON predefined_stickers(display_order);

-- Create triggers
CREATE TRIGGER update_stickers_updated_at 
    BEFORE UPDATE ON stickers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sticker_attachments_updated_at 
    BEFORE UPDATE ON sticker_attachments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predefined_stickers_updated_at 
    BEFORE UPDATE ON predefined_stickers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default predefined stickers
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
    ('Fire', '/stickers/default/fire.svg', 'reactions', ARRAY['hot', 'amazing'], 10);

-- Recreate functions
CREATE OR REPLACE FUNCTION increment_sticker_usage(p_sticker_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE stickers 
    SET usage_count = usage_count + 1 
    WHERE id = p_sticker_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION user_can_attach_sticker(
    p_user_id UUID, 
    p_entity_type VARCHAR(50), 
    p_entity_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    CASE p_entity_type
        WHEN 'place' THEN
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
            RETURN user_owns_trip(p_user_id, p_entity_id) 
                OR user_is_collaborator(p_user_id, p_entity_id);
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;
