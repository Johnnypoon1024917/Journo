import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

/**
 * Script to run the data migration for existing trips
 * This backfills new fields needed for the Funliday-style UI redesign
 */

interface MigrationResult {
  success: boolean;
  message: string;
  stats?: {
    totalTrips: number;
    totalPlaces: number;
    placesWithOrder: number;
    placesWithCoords: number;
    placesWithTravelTime: number;
  };
  error?: string;
}

async function runDataMigration(dryRun: boolean = false): Promise<MigrationResult> {
  // Load environment variables
  const dotenv = await import('dotenv');
  dotenv.config();

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'journo',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('🚀 Starting data migration...');
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);

    // Read the migration SQL file
    const url = await import('url');
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const migrationPath = path.join(__dirname, '../migrations/014_backfill_existing_data.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    if (dryRun) {
      console.log('📋 DRY RUN: Checking current data state...');
      
      // Get current statistics without making changes
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT td.trip_id) as total_trips,
          COUNT(p.id) as total_places,
          COUNT(CASE WHEN p.display_order > 0 THEN 1 END) as places_with_order,
          COUNT(CASE WHEN p.lat IS NOT NULL AND p.lng IS NOT NULL THEN 1 END) as places_with_coords,
          COUNT(CASE WHEN p.travel_time_seconds IS NOT NULL THEN 1 END) as places_with_travel_time
        FROM places p
        JOIN trip_days td ON p.trip_day_id = td.id;
      `;
      
      const result = await pool.query(statsQuery);
      const stats = result.rows[0];

      console.log('\n📊 Current Data Statistics:');
      console.log(`  Total trips: ${stats.total_trips}`);
      console.log(`  Total places: ${stats.total_places}`);
      console.log(`  Places with display_order: ${stats.places_with_order}`);
      console.log(`  Places with coordinates: ${stats.places_with_coords}`);
      console.log(`  Places with travel time: ${stats.places_with_travel_time}`);

      return {
        success: true,
        message: 'Dry run completed successfully',
        stats: {
          totalTrips: parseInt(stats.total_trips),
          totalPlaces: parseInt(stats.total_places),
          placesWithOrder: parseInt(stats.places_with_order),
          placesWithCoords: parseInt(stats.places_with_coords),
          placesWithTravelTime: parseInt(stats.places_with_travel_time),
        },
      };
    }

    // Run the actual migration
    console.log('⚙️  Executing migration...');
    await pool.query('BEGIN');

    try {
      await pool.query(migrationSQL);
      await pool.query('COMMIT');
      console.log('✅ Migration completed successfully');

      // Get final statistics
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT td.trip_id) as total_trips,
          COUNT(p.id) as total_places,
          COUNT(CASE WHEN p.display_order > 0 THEN 1 END) as places_with_order,
          COUNT(CASE WHEN p.lat IS NOT NULL AND p.lng IS NOT NULL THEN 1 END) as places_with_coords,
          COUNT(CASE WHEN p.travel_time_seconds IS NOT NULL THEN 1 END) as places_with_travel_time
        FROM places p
        JOIN trip_days td ON p.trip_day_id = td.id;
      `;
      
      const result = await pool.query(statsQuery);
      const stats = result.rows[0];

      console.log('\n📊 Migration Results:');
      console.log(`  Total trips migrated: ${stats.total_trips}`);
      console.log(`  Total places migrated: ${stats.total_places}`);
      console.log(`  Places with display_order: ${stats.places_with_order}`);
      console.log(`  Places with coordinates: ${stats.places_with_coords}`);
      console.log(`  Places with travel time: ${stats.places_with_travel_time}`);

      return {
        success: true,
        message: 'Migration completed successfully',
        stats: {
          totalTrips: parseInt(stats.total_trips),
          totalPlaces: parseInt(stats.total_places),
          placesWithOrder: parseInt(stats.places_with_order),
          placesWithCoords: parseInt(stats.places_with_coords),
          placesWithTravelTime: parseInt(stats.places_with_travel_time),
        },
      };
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      message: 'Migration failed',
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await pool.end();
  }
}

async function rollbackMigration(): Promise<MigrationResult> {
  // Load environment variables
  const dotenv = await import('dotenv');
  dotenv.config();

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'journo',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('🔄 Starting migration rollback...');

    // Read the rollback SQL file
    const url = await import('url');
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const rollbackPath = path.join(__dirname, '../migrations/014_backfill_existing_data_rollback.sql');
    const rollbackSQL = fs.readFileSync(rollbackPath, 'utf-8');

    await pool.query('BEGIN');

    try {
      await pool.query(rollbackSQL);
      await pool.query('COMMIT');
      console.log('✅ Rollback completed successfully');

      return {
        success: true,
        message: 'Rollback completed successfully',
      };
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    return {
      success: false,
      message: 'Rollback failed',
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await pool.end();
  }
}

// CLI interface
const command = process.argv[2];

if (command === 'dry-run') {
  runDataMigration(true).then((result) => {
    if (result.success) {
      console.log('\n✅ Dry run completed. Run without --dry-run to apply changes.');
      process.exit(0);
    } else {
      console.error('\n❌ Dry run failed:', result.error);
      process.exit(1);
    }
  });
} else if (command === 'migrate') {
  runDataMigration(false).then((result) => {
    if (result.success) {
      console.log('\n✅ Migration completed successfully!');
      process.exit(0);
    } else {
      console.error('\n❌ Migration failed:', result.error);
      process.exit(1);
    }
  });
} else if (command === 'rollback') {
  rollbackMigration().then((result) => {
    if (result.success) {
      console.log('\n✅ Rollback completed successfully!');
      process.exit(0);
    } else {
      console.error('\n❌ Rollback failed:', result.error);
      process.exit(1);
    }
  });
} else {
  console.log('Usage:');
  console.log('  npm run migrate:data dry-run  - Preview changes without applying them');
  console.log('  npm run migrate:data migrate  - Run the migration');
  console.log('  npm run migrate:data rollback - Rollback the migration');
  process.exit(1);
}

export { runDataMigration, rollbackMigration };
