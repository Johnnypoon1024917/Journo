# Data Migration Guide for Funliday UI Redesign

This document describes the data migration process for existing trips to support the new Funliday-style UI redesign.

## Overview

The migration adds and backfills new fields required for the enhanced trip planner interface:
- Display order for drag-and-drop functionality
- Transport modes between places
- Calculated travel times and distances
- Arrival time calculations
- Optimistic update tracking fields

## Migration Files

### 1. `014_backfill_existing_data.sql`
Main migration script that:
- Ensures all places have proper `display_order`
- Sets default `transport_mode` for places
- Initializes `calculated_arrival_time` for places with start times
- Clears stale sync flags
- Backfills `travel_time_seconds` and `travel_distance_meters` using estimated values
- Generates human-readable travel time and distance text
- Creates helper function `estimate_travel_time()` for straight-line distance calculations
- Creates view `places_with_travel_info` for convenient querying
- Adds performance indexes
- Cleans up expired cache entries

### 2. `014_backfill_existing_data_rollback.sql`
Rollback script that:
- Drops the view and function
- Removes indexes
- Clears sync flags
- Optionally clears calculated data (commented out by default)

### 3. `runDataMigration.ts`
Node.js script for running the migration with three modes:
- **dry-run**: Preview changes without applying them
- **migrate**: Execute the migration
- **rollback**: Revert the migration

### 4. `testDataMigration.ts`
Comprehensive test suite that:
- Creates test data
- Runs the migration
- Validates all changes
- Cleans up test data

## Prerequisites

Before running the migration:

1. **Backup your database**
   ```bash
   pg_dump -U postgres -d journo > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Ensure previous migrations are applied**
   - Migration 010: `add_travel_time_to_places.sql`
   - Migration 012: `add_place_order_column.sql`
   - Migration 013: `add_optimistic_update_fields.sql`

3. **Set environment variables**
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=journo
   export DB_USER=postgres
   export DB_PASSWORD=your_password
   ```

## Running the Migration

### Step 1: Test the Migration

Run the test suite to validate the migration logic:

```bash
cd backend
npm run test:migration
```

This will:
- Create test data
- Run the migration
- Validate all changes
- Clean up test data
- Report results

Expected output:
```
🧪 Starting migration tests...
📝 Creating test data...
✅ Test data created
⚙️  Running migration on test data...
✅ Migration executed

🔍 Running validation tests...

📊 Test Results:
════════════════════════════════════════════════════════════
✅ Display Order Set
   Expected 3 places with display_order, found 3
   Details: {"count":3}

✅ Transport Mode Set
   Expected 3 places with transport_mode, found 3
   Details: {"count":3}

... (more tests)

════════════════════════════════════════════════════════════
Total: 10 tests
Passed: 10
Failed: 0
════════════════════════════════════════════════════════════

✅ All tests passed! Migration is ready for production.
```

### Step 2: Dry Run

Preview what the migration will do without making changes:

```bash
cd backend
npm run migrate:data dry-run
```

Expected output:
```
🚀 Starting data migration...
Mode: DRY RUN (no changes will be made)
📋 DRY RUN: Checking current data state...

📊 Current Data Statistics:
  Total trips: 42
  Total places: 387
  Places with display_order: 387
  Places with coordinates: 352
  Places with travel time: 124

✅ Dry run completed. Run without --dry-run to apply changes.
```

### Step 3: Run the Migration

Execute the migration on your database:

```bash
cd backend
npm run migrate:data migrate
```

Expected output:
```
🚀 Starting data migration...
Mode: LIVE
⚙️  Executing migration...
✅ Migration completed successfully

📊 Migration Results:
  Total trips migrated: 42
  Total places migrated: 387
  Places with display_order: 387
  Places with coordinates: 352
  Places with travel time: 352

✅ Migration completed successfully!
```

### Step 4: Verify the Results

Check that the migration worked correctly:

```bash
cd backend
npm run verify-db
```

Or manually query the database:

```sql
-- Check places have display_order
SELECT COUNT(*) FROM places WHERE display_order > 0;

-- Check places have transport_mode
SELECT COUNT(*) FROM places WHERE transport_mode IS NOT NULL;

-- Check travel times are calculated
SELECT COUNT(*) FROM places WHERE travel_time_seconds IS NOT NULL;

-- View sample data
SELECT 
  name, 
  display_order, 
  transport_mode, 
  travel_time_text, 
  travel_distance_text
FROM places_with_travel_info
WHERE trip_id = 'your-trip-id'
ORDER BY day_number, display_order
LIMIT 10;
```

## Rollback

If you need to revert the migration:

```bash
cd backend
npm run migrate:data rollback
```

This will:
- Drop the view and function
- Remove indexes
- Clear sync flags
- Preserve user data

**Note**: The rollback does NOT remove columns added in previous migrations (010, 012, 013). Those are part of the schema and should remain.

## What Gets Migrated

### Existing Data Preserved
- All user-entered place data (name, address, times, costs, notes)
- Original place order (converted to `display_order`)
- All trip and day information
- All relationships between entities

### New Data Added
- `display_order`: Sequential ordering within each day
- `transport_mode`: Default 'driving' for all places
- `calculated_arrival_time`: Initialized to `time_start` for places with times
- `travel_time_seconds`: Estimated based on straight-line distance
- `travel_distance_meters`: Calculated using Haversine formula
- `travel_time_text`: Human-readable format (e.g., "15 mins")
- `travel_distance_text`: Human-readable format (e.g., "2.5 km")

### Calculated Values
The migration uses **estimated** values based on straight-line distance:
- Travel times are calculated using average speeds:
  - Walking: 5 km/h
  - Transit: 30 km/h
  - Driving: 40 km/h
  - Flight: 500 km/h
- Distances use the Haversine formula for great-circle distance

**Important**: These are temporary estimates. The frontend will recalculate actual routes using the Google Maps Directions API when users view their trips.

## Performance Considerations

### Migration Duration
- Small databases (<100 trips): ~1-2 seconds
- Medium databases (100-1000 trips): ~5-10 seconds
- Large databases (>1000 trips): ~30-60 seconds

### Database Load
- The migration runs in a single transaction
- Uses batch updates where possible
- Creates indexes after data is populated
- Minimal impact on running application

### Downtime
- **No downtime required** if using the feature flag approach
- Old UI continues to work during migration
- New UI can be enabled gradually after migration

## Troubleshooting

### Migration Fails with "column already exists"
This means previous migrations (010, 012, 013) were already applied. This is normal and expected. The migration uses `IF NOT EXISTS` clauses to handle this gracefully.

### Places Missing Coordinates
Places without `lat` and `lng` values will not have travel times calculated. This is expected. The frontend will handle these cases by not showing transport segments.

### Travel Times Seem Inaccurate
The migration uses estimated values based on straight-line distance. These will be replaced with accurate values when:
1. Users view their trips in the new UI
2. The frontend calculates actual routes using Google Maps API
3. The calculated routes are cached in the `transport_routes` table

### Rollback Doesn't Remove Columns
This is intentional. The rollback only removes calculated data and helper objects (views, functions, indexes). The schema columns remain because they're part of the core data model.

## Post-Migration Steps

After successful migration:

1. **Enable the new UI** using the feature flag system
2. **Monitor performance** of route calculations
3. **Check error logs** for any issues with the new features
4. **Gradually roll out** to more users
5. **Collect feedback** on the new interface

## Database Schema Changes

### New Columns (from previous migrations)
```sql
-- From migration 010
ALTER TABLE places ADD COLUMN travel_time_seconds INT;
ALTER TABLE places ADD COLUMN travel_distance_meters INT;
ALTER TABLE places ADD COLUMN travel_time_text TEXT;
ALTER TABLE places ADD COLUMN travel_distance_text TEXT;

-- From migration 012
ALTER TABLE places ADD COLUMN display_order INTEGER DEFAULT 0;

-- From migration 013
ALTER TABLE places ADD COLUMN calculated_arrival_time TIME;
ALTER TABLE places ADD COLUMN is_syncing BOOLEAN DEFAULT FALSE;
ALTER TABLE places ADD COLUMN sync_error TEXT;
```

### New Tables (from migration 013)
```sql
CREATE TABLE transport_routes (
  id UUID PRIMARY KEY,
  from_place_id UUID REFERENCES places(id),
  to_place_id UUID REFERENCES places(id),
  transport_mode TEXT,
  duration_seconds INT,
  distance_meters INT,
  polyline TEXT,
  route_steps JSONB,
  calculated_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE sync_queue (
  id UUID PRIMARY KEY,
  operation_type TEXT,
  resource_type TEXT,
  resource_id UUID,
  data JSONB,
  user_id UUID REFERENCES users(id),
  status TEXT,
  retry_count INT,
  error_message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### New Objects (from migration 014)
```sql
-- Function for estimating travel time
CREATE FUNCTION estimate_travel_time(...) RETURNS INT;

-- View for convenient querying
CREATE VIEW places_with_travel_info AS ...;

-- Performance indexes
CREATE INDEX idx_places_calculated_arrival ON places(calculated_arrival_time);
CREATE INDEX idx_places_syncing ON places(is_syncing);
CREATE INDEX idx_places_transport_mode ON places(transport_mode);
```

## Support

If you encounter issues:

1. Check the migration logs for error messages
2. Verify database connection settings
3. Ensure all prerequisites are met
4. Run the test suite to validate the migration
5. Contact the development team with:
   - Error messages
   - Database statistics (from dry-run)
   - PostgreSQL version
   - Number of trips/places in database

## References

- [Funliday UI Redesign Spec](.kiro/specs/funliday-ui-redesign/)
- [Requirements Document](.kiro/specs/funliday-ui-redesign/requirements.md)
- [Design Document](.kiro/specs/funliday-ui-redesign/design.md)
- [Implementation Tasks](.kiro/specs/funliday-ui-redesign/tasks.md)
