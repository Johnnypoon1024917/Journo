# Migration Guide - Activity Flow Rework

## For Existing Trips

If you have existing trips in the database that were created before this update, they won't have days. Here's how to fix them:

### Option 1: Recreate Database (Development Only)
```bash
cd backend
npm run recreate-db
```

### Option 2: Add Days to Existing Trips (Production)

Run this SQL script to add days to existing trips:

```sql
-- Add days to existing trips that have start_date and end_date
DO $$
DECLARE
    trip_record RECORD;
    current_date DATE;
    day_num INTEGER;
BEGIN
    -- Loop through all trips that have dates but no days
    FOR trip_record IN 
        SELECT t.id, t.start_date, t.end_date
        FROM trips t
        LEFT JOIN trip_days td ON t.id = td.trip_id
        WHERE t.start_date IS NOT NULL 
          AND t.end_date IS NOT NULL
          AND td.id IS NULL
        GROUP BY t.id, t.start_date, t.end_date
    LOOP
        -- Generate days for this trip
        current_date := trip_record.start_date;
        day_num := 1;
        
        WHILE current_date <= trip_record.end_date LOOP
            INSERT INTO trip_days (trip_id, day_number, date)
            VALUES (trip_record.id, day_num, current_date);
            
            current_date := current_date + INTERVAL '1 day';
            day_num := day_num + 1;
        END LOOP;
        
        RAISE NOTICE 'Added % days to trip %', day_num - 1, trip_record.id;
    END LOOP;
END $$;
```

## Testing After Migration

1. **Check existing trips have days**:
```sql
SELECT t.id, t.title, COUNT(td.id) as day_count
FROM trips t
LEFT JOIN trip_days td ON t.id = td.trip_id
GROUP BY t.id, t.title
HAVING COUNT(td.id) = 0;
```
Should return 0 rows.

2. **Create new trip and verify days**:
- Create trip via API with start/end dates
- Check that days are created:
```sql
SELECT * FROM trip_days WHERE trip_id = 'YOUR_TRIP_ID' ORDER BY day_number;
```

3. **Test activity creation**:
- Navigate to schedule screen
- Select a date
- Add activity
- Should work without errors

## Rollback Plan

If you need to rollback:

1. **Backend**: Revert these files:
   - `backend/src/controllers/tripController.ts`
   - `backend/src/controllers/dayController.ts`

2. **Frontend**: Revert these files:
   - `frontend/src/pages/ScheduleScreen.tsx`
   - `frontend/src/components/kawaii/DayCard.tsx`
   - `frontend/src/stores/stickerStore.ts`
   - `frontend/src/hooks/useStickerAttachment.ts`

3. **Rebuild**:
```bash
cd backend && npm run build
cd ../frontend && npm run build
```

## Breaking Changes

### API Changes
- `POST /trips` now creates days automatically (side effect)
- `GET /days/trip/:tripId` returns dates as strings, not timestamps

### Frontend Changes
- No more virtual days
- `selectedDay` can be null if no day exists for date
- Activity creation requires existing day

### Behavior Changes
- All days must exist before adding activities
- Dates are always YYYY-MM-DD format
- No on-demand day creation
