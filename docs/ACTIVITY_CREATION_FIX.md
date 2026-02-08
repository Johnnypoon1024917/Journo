# Activity Creation Fix

## Issue
When trying to add an activity, the request fails with a 500 Internal Server Error.

## Root Causes

### 1. Frontend Issue: Virtual Day ✅ FIXED
**Problem**: Trying to create an activity for a "virtual day" that doesn't exist in the database yet.

**Explanation**: 
- When a trip has no days created, the frontend generates "virtual days" for display
- Virtual days have IDs like `virtual-2026-03-03`
- These don't exist in the database
- Trying to create a place with `trip_day_id: virtual-2026-03-03` fails

**Solution**: Check if the day is virtual, and create it first before adding the activity.

```typescript
// Check if this is a virtual day
const isVirtualDay = selectedDay.id.startsWith('virtual-');

let dayId = selectedDay.id;

if (isVirtualDay) {
  // Create the day first
  const newDay = await dayService.createDay({
    trip_id: tripId!,
    day_number: selectedDay.day_number,
    date: selectedDay.date || undefined,
  });
  
  dayId = newDay.id;
}

// Now create the place with the real day ID
await placeService.createPlace({
  trip_day_id: dayId,
  // ... other fields
});
```

### 2. Backend Issue: Missing Database Function ⚠️ NEEDS BACKEND FIX
**Problem**: Database function `user_can_edit_trip(unknown, uuid)` does not exist.

**Error**:
```
error: function user_can_edit_trip(unknown, uuid) does not exist
Hint: No function matches the given name and argument types. You might need to add explicit type casts.
```

**Explanation**:
- The backend code calls `user_can_edit_trip($1, $2)` to check permissions
- This function should exist in the database but is missing
- The function is used in many controllers:
  - placeController.ts
  - dayController.ts
  - tripController.ts
  - packingController.ts
  - storyController.ts
  - collaboratorController.ts
  - versionController.ts

**Required Backend Fix**:
The database migration needs to create this function. It should look something like:

```sql
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
```

## Frontend Changes Made

### File: `frontend/src/pages/ScheduleScreen.tsx`

**Added virtual day detection and creation**:

```typescript
const handleActivitySubmit = async (activityData: ActivityFormData) => {
  // ... validation

  // Check if this is a virtual day
  const isVirtualDay = selectedDay.id.startsWith('virtual-');
  
  let dayId = selectedDay.id;
  
  if (isVirtualDay) {
    console.log('Virtual day detected, creating day first:', selectedDay.date);
    
    try {
      const newDay = await dayService.createDay({
        trip_id: tripId!,
        day_number: selectedDay.day_number,
        date: selectedDay.date || undefined,
      });
      
      dayId = newDay.id;
      console.log('Day created successfully:', newDay.id);
    } catch (dayError: any) {
      console.error('Error creating day:', dayError);
      showError('Failed to create day: ' + (dayError.message || 'Unknown error'));
      return;
    }
  }

  // Create the place with real day ID
  await placeService.createPlace({
    trip_day_id: dayId,
    // ... other fields
  });
};
```

## Testing After Backend Fix

Once the backend `user_can_edit_trip` function is created:

### Test Case 1: Add Activity to Virtual Day
1. Open a trip with no days created
2. Select any date in DateSelector
3. Click FAB (+) button
4. Fill in activity details
5. Click "Add Activity"
6. **Expected**: Day is created, then activity is added
7. **Expected**: Success toast appears
8. **Expected**: Activity appears in DayCard

### Test Case 2: Add Activity to Existing Day
1. Open a trip with days already created
2. Select a date that has a day
3. Click FAB (+) button
4. Fill in activity details
5. Click "Add Activity"
6. **Expected**: Activity is added directly (no day creation)
7. **Expected**: Success toast appears
8. **Expected**: Activity appears in DayCard

### Test Case 3: Permission Check
1. Try to add activity to someone else's trip
2. **Expected**: Permission denied error
3. **Expected**: Error toast appears

## Console Logs to Check

### Virtual Day Creation
```
Virtual day detected, creating day first: 2026-03-08
Day created successfully: abc123-def456-...
Creating activity: {...} for day: abc123-def456-...
Activity created successfully: {...}
```

### Existing Day
```
Creating activity: {...} for day: existing-day-id
Activity created successfully: {...}
```

### Error Cases
```
Error creating day: {...}
// or
Error adding activity: {...}
```

## Backend TODO

### Required Migration
Create a new migration file: `backend/src/migrations/026_create_permission_functions.sql`

```sql
-- Function to check if user can edit a trip
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

-- Function to check if user can view a trip
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
```

### Run Migration
```bash
cd backend
npm run migrate
```

## Workaround (Temporary)

If you need to test immediately without fixing the backend, you can:

1. **Manually create days first**:
   - Use the trip detail page to create days
   - Then add activities to those days

2. **Disable permission check** (NOT RECOMMENDED for production):
   - Comment out the permission check in `placeController.ts`
   - This is insecure and should only be used for testing

## Files Modified

1. **frontend/src/pages/ScheduleScreen.tsx**
   - Added virtual day detection
   - Added day creation before activity creation
   - Enhanced error handling

## Success Criteria

- ✅ Frontend detects virtual days
- ✅ Frontend creates day before adding activity
- ⚠️ Backend permission function needs to be created
- ⏳ Activity creation works after backend fix

## Related Issues

This fix addresses:
- Virtual day handling in activity creation
- Proper error messages for day creation failures
- Graceful handling of backend permission errors

## Next Steps

1. **Backend Team**: Create the `user_can_edit_trip` function in database
2. **Backend Team**: Run migration to add the function
3. **Frontend Team**: Test activity creation after backend fix
4. **QA Team**: Verify all permission scenarios work correctly

## Conclusion

The frontend is now ready to handle activity creation for both virtual and existing days. The backend needs to add the missing `user_can_edit_trip` database function for the feature to work completely.
