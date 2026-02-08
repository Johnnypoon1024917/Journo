-- Migration: Create Permission Functions
-- Description: Add database functions for checking user permissions on trips
-- Date: 2026-02-01

-- Function to check if user can edit a trip (owner or editor collaborator)
CREATE OR REPLACE FUNCTION user_can_edit_trip(
  p_user_id UUID,
  p_trip_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM trips t
    LEFT JOIN trip_collaborators tc ON tc.trip_id = t.id AND tc.user_id = p_user_id
    WHERE t.id = p_trip_id
    AND (
      t.owner_id = p_user_id  -- User is owner
      OR (tc.role IN ('editor', 'owner'))  -- User is editor/owner collaborator
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if user can view a trip (owner, collaborator, or public trip)
CREATE OR REPLACE FUNCTION user_can_view_trip(
  p_user_id UUID,
  p_trip_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM trips t
    LEFT JOIN trip_collaborators tc ON tc.trip_id = t.id AND tc.user_id = p_user_id
    WHERE t.id = p_trip_id
    AND (
      t.owner_id = p_user_id  -- User is owner
      OR tc.user_id = p_user_id  -- User is collaborator
      OR t.is_public = true  -- Trip is public
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comments for documentation
COMMENT ON FUNCTION user_can_edit_trip IS 'Check if user has edit permissions on a trip (owner or editor)';
COMMENT ON FUNCTION user_can_view_trip IS 'Check if user has view permissions on a trip (owner, collaborator, or public)';
