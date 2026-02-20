-- Migration 045: Fix Collaborator Functions
-- Updates functions to remove references to the deleted 'collaborators' table
-- Created: 2026-02-18

-- Fix user_is_collaborator function to only use trip_collaborators
CREATE OR REPLACE FUNCTION user_is_collaborator(p_user_id UUID, p_trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM trip_collaborators 
        WHERE trip_id = p_trip_id 
        AND user_id = p_user_id 
        AND accepted_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Verify other functions are correct
CREATE OR REPLACE FUNCTION user_owns_trip(p_user_id UUID, p_trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM trips WHERE id = p_trip_id AND owner_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trip_is_public(p_trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM trips WHERE id = p_trip_id AND is_public = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Summary: Fixed user_is_collaborator to remove reference to deleted 'collaborators' table
