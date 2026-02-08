-- Migration: Add custom packing categories support
-- This migration adds a table to store custom packing categories per trip

-- Create custom packing categories table
CREATE TABLE IF NOT EXISTS packing_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(trip_id, name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_packing_categories_trip_id ON packing_categories(trip_id);
CREATE INDEX IF NOT EXISTS idx_packing_categories_display_order ON packing_categories(trip_id, display_order);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_packing_categories_updated_at ON packing_categories;
CREATE TRIGGER update_packing_categories_updated_at 
    BEFORE UPDATE ON packing_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
