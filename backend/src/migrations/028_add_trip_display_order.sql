-- Add display_order column to trips table for user-specific trip ordering
ALTER TABLE trips ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_trips_display_order ON trips(owner_id, display_order DESC);

-- Update existing trips to have sequential display orders based on created_at
WITH ordered_trips AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at DESC) - 1 as new_order
  FROM trips
)
UPDATE trips
SET display_order = ordered_trips.new_order
FROM ordered_trips
WHERE trips.id = ordered_trips.id;
