-- ============================================
-- Centralized Theme System Migration
-- ============================================
-- Creates tables for system-wide and trip-specific color themes
-- All colors stored in database for admin/user configuration

-- System Color Theme Table (Admin configurable)
CREATE TABLE IF NOT EXISTS system_color_theme (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_name VARCHAR(100) NOT NULL DEFAULT 'systemcolor',
    
    -- Kawaii Primary Colors (50-950 scale)
    primary_50 VARCHAR(7) NOT NULL DEFAULT '#fff5f7',
    primary_100 VARCHAR(7) NOT NULL DEFAULT '#ffe3e8',
    primary_200 VARCHAR(7) NOT NULL DEFAULT '#ffc7d1',
    primary_300 VARCHAR(7) NOT NULL DEFAULT '#ffaaba',
    primary_400 VARCHAR(7) NOT NULL DEFAULT '#ff8ea3',
    primary_500 VARCHAR(7) NOT NULL DEFAULT '#FFB3BA',
    primary_600 VARCHAR(7) NOT NULL DEFAULT '#ff6b7f',
    primary_700 VARCHAR(7) NOT NULL DEFAULT '#ff4d63',
    primary_800 VARCHAR(7) NOT NULL DEFAULT '#ff2f47',
    primary_900 VARCHAR(7) NOT NULL DEFAULT '#e6002b',
    primary_950 VARCHAR(7) NOT NULL DEFAULT '#b30021',
    
    -- Kawaii Cream Background
    cream_bg VARCHAR(7) NOT NULL DEFAULT '#FFF8F0',
    
    -- Kawaii Neutral Colors (50-950 scale)
    neutral_50 VARCHAR(7) NOT NULL DEFAULT '#fafaf9',
    neutral_100 VARCHAR(7) NOT NULL DEFAULT '#f5f5f4',
    neutral_200 VARCHAR(7) NOT NULL DEFAULT '#e7e5e4',
    neutral_300 VARCHAR(7) NOT NULL DEFAULT '#d6d3d1',
    neutral_400 VARCHAR(7) NOT NULL DEFAULT '#a8a29e',
    neutral_500 VARCHAR(7) NOT NULL DEFAULT '#78716c',
    neutral_600 VARCHAR(7) NOT NULL DEFAULT '#57534e',
    neutral_700 VARCHAR(7) NOT NULL DEFAULT '#44403c',
    neutral_800 VARCHAR(7) NOT NULL DEFAULT '#292524',
    neutral_900 VARCHAR(7) NOT NULL DEFAULT '#1c1917',
    neutral_950 VARCHAR(7) NOT NULL DEFAULT '#0f0e0d',
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Trip Color Theme Table (Trip owner configurable)
CREATE TABLE IF NOT EXISTS trip_color_theme (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    theme_name VARCHAR(100) NOT NULL DEFAULT 'tripcolour',
    
    -- Kawaii Primary Colors (50-950 scale)
    primary_50 VARCHAR(7) NOT NULL DEFAULT '#fff5f7',
    primary_100 VARCHAR(7) NOT NULL DEFAULT '#ffe3e8',
    primary_200 VARCHAR(7) NOT NULL DEFAULT '#ffc7d1',
    primary_300 VARCHAR(7) NOT NULL DEFAULT '#ffaaba',
    primary_400 VARCHAR(7) NOT NULL DEFAULT '#ff8ea3',
    primary_500 VARCHAR(7) NOT NULL DEFAULT '#FFB3BA',
    primary_600 VARCHAR(7) NOT NULL DEFAULT '#ff6b7f',
    primary_700 VARCHAR(7) NOT NULL DEFAULT '#ff4d63',
    primary_800 VARCHAR(7) NOT NULL DEFAULT '#ff2f47',
    primary_900 VARCHAR(7) NOT NULL DEFAULT '#e6002b',
    primary_950 VARCHAR(7) NOT NULL DEFAULT '#b30021',
    
    -- Kawaii Cream Background
    cream_bg VARCHAR(7) NOT NULL DEFAULT '#FFF8F0',
    
    -- Kawaii Neutral Colors (50-950 scale)
    neutral_50 VARCHAR(7) NOT NULL DEFAULT '#fafaf9',
    neutral_100 VARCHAR(7) NOT NULL DEFAULT '#f5f5f4',
    neutral_200 VARCHAR(7) NOT NULL DEFAULT '#e7e5e4',
    neutral_300 VARCHAR(7) NOT NULL DEFAULT '#d6d3d1',
    neutral_400 VARCHAR(7) NOT NULL DEFAULT '#a8a29e',
    neutral_500 VARCHAR(7) NOT NULL DEFAULT '#78716c',
    neutral_600 VARCHAR(7) NOT NULL DEFAULT '#57534e',
    neutral_700 VARCHAR(7) NOT NULL DEFAULT '#44403c',
    neutral_800 VARCHAR(7) NOT NULL DEFAULT '#292524',
    neutral_900 VARCHAR(7) NOT NULL DEFAULT '#1c1917',
    neutral_950 VARCHAR(7) NOT NULL DEFAULT '#0f0e0d',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- One theme per trip
    CONSTRAINT unique_trip_theme UNIQUE (trip_id)
);

-- Insert default system color theme
INSERT INTO system_color_theme (theme_name, is_active) 
VALUES ('systemcolor', TRUE)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_color_theme_trip_id ON trip_color_theme(trip_id);
CREATE INDEX IF NOT EXISTS idx_system_color_theme_active ON system_color_theme(is_active);

-- Create partial unique index to ensure only one active system theme
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_system_theme 
ON system_color_theme(is_active) 
WHERE is_active = TRUE;

-- Update timestamp trigger for system_color_theme
CREATE OR REPLACE FUNCTION update_system_color_theme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_color_theme_updated_at
    BEFORE UPDATE ON system_color_theme
    FOR EACH ROW
    EXECUTE FUNCTION update_system_color_theme_updated_at();

-- Update timestamp trigger for trip_color_theme
CREATE OR REPLACE FUNCTION update_trip_color_theme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_color_theme_updated_at
    BEFORE UPDATE ON trip_color_theme
    FOR EACH ROW
    EXECUTE FUNCTION update_trip_color_theme_updated_at();

-- Remove old theme column from trips table (if exists)
-- This is commented out to preserve existing data
-- ALTER TABLE trips DROP COLUMN IF EXISTS theme;

COMMENT ON TABLE system_color_theme IS 'System-wide color theme configurable by admin';
COMMENT ON TABLE trip_color_theme IS 'Trip-specific color theme configurable by trip owner';
