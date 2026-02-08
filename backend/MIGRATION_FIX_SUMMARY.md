# Migration System Fix Summary

## Issues Fixed

### 1. Database Wiping on Every Restart
**Problem:** The migration system was running ALL migrations every time the backend started, including `000_drop_all_tables.sql` which dropped the entire database schema. This caused all user accounts and data to be deleted on every restart.

**Solution:**
- Implemented a migration tracking system using a `schema_migrations` table
- Migrations are now only run once and tracked in the database
- Renamed `000_drop_all_tables.sql` to `000_drop_all_tables.sql.bak` to prevent it from running again

### 2. SQL Syntax Errors in Migrations
**Problem:** Some migrations had incorrect dollar-quote syntax (`$` instead of `$$`) which caused SQL errors.

**Solution:**
- Fixed the dollar-quote syntax in database functions
- Added `DROP TRIGGER IF EXISTS` before creating triggers to prevent conflicts

### 3. Trip Days Fetch Error (500)
**Problem:** The `getDaysByTrip` endpoint was trying to select a non-existent column `travel_distance_meters` from the `places` table.

**Solution:**
- Removed the non-existent column from the SQL query
- Added detailed error logging to help diagnose future issues

## Migration System Behavior

### How It Works Now
1. On startup, the backend creates a `schema_migrations` table if it doesn't exist
2. For each `.sql` file in the migrations directory:
   - Check if it's already been run (exists in `schema_migrations`)
   - If yes, skip it with a message: `⏭️  Skipping (already run): filename.sql`
   - If no, run it in a transaction and record it in `schema_migrations`
3. All migrations are run in alphabetical order by filename

### Adding New Migrations
1. Create a new `.sql` file with a numbered prefix (e.g., `026_new_feature.sql`)
2. The migration will automatically run on the next server start
3. Once run, it will be tracked and never run again

### Resetting the Database (Development Only)
If you need to completely reset the database:
```bash
# Option 1: Drop and recreate the database
dropdb journo_db
createdb journo_db

# Option 2: Restore the drop migration
mv backend/src/migrations/000_drop_all_tables.sql.bak backend/src/migrations/000_drop_all_tables.sql
# Then restart the backend
# IMPORTANT: Move it back to .bak after restart!
mv backend/src/migrations/000_drop_all_tables.sql backend/src/migrations/000_drop_all_tables.sql.bak
```

## User Data Preservation
✅ User accounts and data are now preserved across backend restarts
✅ Migrations only run once
✅ No more need to recreate accounts after every restart
