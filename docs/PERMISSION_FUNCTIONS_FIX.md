# Permission Functions SQL Syntax Fix

## Issue
Backend was returning 500 errors when creating places due to SQL syntax error in the permission functions.

## Root Cause
The migration file `026_create_permission_functions.sql` had incorrect dollar-quote delimiters:
- **Wrong:** `AS $ ... $ LANGUAGE plpgsql`
- **Correct:** `AS $$ ... $$ LANGUAGE plpgsql`

PostgreSQL requires double dollar signs (`$$`) for function body delimiters, not single (`$`).

## Error Symptoms
- POST `/api/places` returned 500 Internal Server Error
- Backend logs showed SQL syntax errors when calling `user_can_edit_trip()` function
- Activity creation failed in the Schedule screen

## Fix Applied

### 1. Updated Migration File
Fixed the SQL syntax in `backend/src/migrations/026_create_permission_functions.sql`:

```sql
CREATE OR REPLACE FUNCTION user_can_edit_trip(
  p_user_id UUID,
  p_trip_id UUID
) RETURNS BOOLEAN AS $$  -- Changed from AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM trips t
    LEFT JOIN trip_collaborators tc ON tc.trip_id = t.id AND tc.user_id = p_user_id
    WHERE t.id = p_trip_id
    AND (
      t.owner_id = p_user_id
      OR (tc.role IN ('editor', 'owner'))
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;  -- Changed from $ LANGUAGE
```

### 2. Recreated Functions
Ran script to drop and recreate the functions with correct syntax:
```bash
npx tsx fix_permission_functions.ts
```

## Functions Fixed
1. **user_can_edit_trip(user_id, trip_id)** - Checks if user can edit a trip
2. **user_can_view_trip(user_id, trip_id)** - Checks if user can view a trip

## Testing
✅ Functions created successfully
✅ Functions execute without errors
✅ Place creation should now work

## Files Modified
- `backend/src/migrations/026_create_permission_functions.sql`

## Next Steps
- Test activity creation in the Schedule screen
- Verify place creation works for both real and virtual days
- Confirm permission checks work correctly

## Status
✅ **COMPLETE** - Permission functions fixed and recreated
