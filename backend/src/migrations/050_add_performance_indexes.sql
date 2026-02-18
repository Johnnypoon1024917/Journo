-- Migration: Add performance indexes
-- Description: Add indexes on frequently queried columns to improve query performance

-- Index on trips.owner_id for faster user trip lookups (already exists as idx_trips_owner_id)
-- CREATE INDEX IF NOT EXISTS idx_trips_owner_id ON trips(owner_id);

-- Index on trips.start_date for date-based queries and sorting
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date);

-- Composite index on trips for user-specific date queries
CREATE INDEX IF NOT EXISTS idx_trips_owner_start_date ON trips(owner_id, start_date DESC);

-- Index on trip_days.trip_id for faster day lookups by trip (already exists as idx_trip_days_trip_id)
-- CREATE INDEX IF NOT EXISTS idx_trip_days_trip_id ON trip_days(trip_id);

-- Index on places.trip_day_id for faster place lookups by day (already exists as idx_places_trip_day_id)
-- CREATE INDEX IF NOT EXISTS idx_places_trip_day_id ON places(trip_day_id);

-- Index on collaborators.trip_id for faster collaborator lookups
CREATE INDEX IF NOT EXISTS idx_collaborators_trip_id ON collaborators(trip_id);

-- Index on collaborators.user_id for user collaboration queries
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON collaborators(user_id);

-- Composite index on collaborators for permission checks
CREATE INDEX IF NOT EXISTS idx_collaborators_trip_user ON collaborators(trip_id, user_id);

-- Index on stories.trip_id for faster story lookups by trip
CREATE INDEX IF NOT EXISTS idx_stories_trip_id ON stories(trip_id);

-- Index on stories.user_id for user story queries
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);

-- Index on stories.created_at for chronological sorting
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

-- Index on notifications.user_id for faster notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Index on notifications.is_read for unread notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);

-- Index on packing_items.packing_list_id for faster packing list lookups (already exists as idx_packing_items_list_id)
-- CREATE INDEX IF NOT EXISTS idx_packing_items_packing_list_id ON packing_items(packing_list_id);

-- Index on budget_entries.trip_id for faster budget queries (already exists as idx_budget_entries_trip_id)
-- CREATE INDEX IF NOT EXISTS idx_budget_entries_trip_id ON budget_entries(trip_id);

-- Index on analytics_events.trip_id for activity history (already exists as idx_analytics_events_trip_id)
-- CREATE INDEX IF NOT EXISTS idx_analytics_events_trip_id ON analytics_events(trip_id);

-- Index on analytics_events.user_id for user activity tracking (already exists as idx_analytics_events_user_id)
-- CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);

-- Index on analytics_events.created_at for chronological queries (already exists as idx_analytics_events_created_at)
-- CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Index on refresh_tokens.user_id for token management
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Index on refresh_tokens.expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Partial index on trips for active trips only (removed CURRENT_DATE as it's not immutable)
-- For active trips filtering, use application-level filtering or a materialized view
-- CREATE INDEX IF NOT EXISTS idx_trips_active ON trips(owner_id, start_date DESC) 
-- WHERE end_date >= CURRENT_DATE OR end_date IS NULL;

-- Index on users.email for login queries (if not already unique)
-- Note: If email is already UNIQUE, this index is automatically created
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add comments for documentation
COMMENT ON INDEX idx_trips_start_date IS 'Improves performance of date-based trip queries';
COMMENT ON INDEX idx_trips_owner_start_date IS 'Composite index for user-specific date queries';
COMMENT ON INDEX idx_collaborators_trip_user IS 'Improves performance of permission checks';
