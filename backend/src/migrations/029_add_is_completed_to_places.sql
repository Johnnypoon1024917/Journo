-- Migration: Add is_completed column to places table
-- This allows tracking whether an activity has been completed during the trip

-- Add is_completed column to places table
ALTER TABLE places ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Add index for faster queries filtering by completion status
CREATE INDEX IF NOT EXISTS idx_places_is_completed ON places(is_completed);

-- Add comment for documentation
COMMENT ON COLUMN places.is_completed IS 'Indicates whether this activity/place has been completed/visited';
