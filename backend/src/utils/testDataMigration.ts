import { Pool } from 'pg';

/**
 * Test script to validate the data migration
 * This creates test data, runs the migration, and verifies the results
 */

interface TestResult {
  passed: boolean;
  testName: string;
  message: string;
  details?: any;
}

async function createTestData(pool: Pool): Promise<void> {
  console.log('📝 Creating test data...');

  // Create a test user
  await pool.query(`
    INSERT INTO users (id, email, name, password_hash)
    VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'Test User', 'hash')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Create a test trip
  await pool.query(`
    INSERT INTO trips (id, title, destination, start_date, end_date, owner_id)
    VALUES (
      '00000000-0000-0000-0000-000000000002',
      'Test Trip for Migration',
      'Hong Kong',
      '2024-01-01',
      '2024-01-03',
      '00000000-0000-0000-0000-000000000001'
    )
    ON CONFLICT (id) DO NOTHING;
  `);

  // Create test days
  await pool.query(`
    INSERT INTO trip_days (id, trip_id, day_number, date)
    VALUES 
      ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 1, '2024-01-01'),
      ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 2, '2024-01-02')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Create test places with coordinates
  await pool.query(`
    INSERT INTO places (id, trip_day_id, name, address, lat, lng, time_start, place_type, display_order)
    VALUES 
      (
        '00000000-0000-0000-0000-000000000005',
        '00000000-0000-0000-0000-000000000003',
        'Victoria Peak',
        'Victoria Peak, Hong Kong',
        22.2783,
        114.1747,
        '09:00:00',
        'attraction',
        1
      ),
      (
        '00000000-0000-0000-0000-000000000006',
        '00000000-0000-0000-0000-000000000003',
        'Star Ferry',
        'Star Ferry Pier, Hong Kong',
        22.2930,
        114.1689,
        '12:00:00',
        'transport',
        2
      ),
      (
        '00000000-0000-0000-0000-000000000007',
        '00000000-0000-0000-0000-000000000003',
        'Temple Street Night Market',
        'Temple Street, Hong Kong',
        22.3080,
        114.1714,
        '18:00:00',
        'food',
        3
      )
    ON CONFLICT (id) DO NOTHING;
  `);

  console.log('✅ Test data created');
}

async function runTests(pool: Pool): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Verify display_order is set
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM places
      WHERE trip_day_id IN (
        SELECT id FROM trip_days WHERE trip_id = '00000000-0000-0000-0000-000000000002'
      )
      AND display_order > 0;
    `);

    const count = parseInt(result.rows[0].count);
    results.push({
      passed: count === 3,
      testName: 'Display Order Set',
      message: `Expected 3 places with display_order, found ${count}`,
      details: { count },
    });
  } catch (error) {
    results.push({
      passed: false,
      testName: 'Display Order Set',
      message: `Error: ${error}`,
    });
  }

  // Test 2: Verify transport_mode is set
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM places
      WHERE trip_day_id IN (
        SELECT id FROM trip_days WHERE trip_id = '00000000-0000-0000-0000-000000000002'
      )
      AND transport_mode IS NOT NULL;
    `);

    const count = parseInt(result.rows[0].count);
    results.push({
      passed: count === 3,
      testName: 'Transport Mode Set',
      message: `Expected 3 places with transport_mode, found ${count}`,
      details: { count },
    });
  } catch (error) {
    results.push({
      passed: false,
      testName: 'Transport Mode Set',
      message: `Error: ${error}`,
    });
  }

  // Test 3: Verify travel_time_seconds is calculated for places after the first
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM places
      WHERE trip_day_id IN (
        SELECT id FROM trip_days WHERE trip_id = '00000000-0000-0000-0000-000000000002'
      )
      AND display_order > 1
      AND travel_time_seconds IS NOT NULL;
    `);

    const count = parseInt(result.rows[0].count);
    results.push({
      passed: count === 2,
      testName: 'Travel Time Calculated',
      message: `Expected 2 places with travel_time_seconds, found ${count}`,
      details: { count },
    });
  } catch (error) {
    results.push({
      passed: false,
      testName: 'Travel Time Calculated',
      message: `Error: ${error}`,
    });
  }

  // Test 4: Verify travel_distance_meters is calculated
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM places
      WHERE trip_day_id IN (
        SELECT id FROM trip_days WHERE trip_id = '00000000-0000-0000-0000-000000000002'
      )
      AND display_order > 1
      AND travel_distance_meters IS NOT NULL;
    `);

    const count = parseInt(result.rows[0].count);
    results.push({
      passed: count === 2,
      testName: 'Travel Distance Calculated',
      message: `Expected 2 places with travel_distance_meters, found ${count}`,
      details: { count },
    });
  } catch (error) {
    results.push({
      passed: false,
      testName: 'Travel Distance Calculated',
      message: `Error: ${error}`,
    });
  }

  // Test 5: Verify human-readable text is generated
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM places
      WHERE trip_day_id IN (
        SELECT id FROM trip_days WHERE trip_id = '00000000-0000-0000-0000-000000000002'
      )
      AND display_order > 1
      AND travel_time_text IS NOT NULL
      AND travel_distance_text IS NOT NULL;
    `);

    const count = parseInt(result.rows[0].count);
    results.push({
      passed: count === 2,
      testName: 'Human-Readable Text Generated',
      message: `Expected 2 places with travel text, found ${count}`,
      details: { count },
    });
  } catch (error) {
    results.push({
      passed: false,
      testName: 'Human-Readable Text Generated',
      message: `Error: ${error}`,
    });
  }

  // Test 6: Verify calculated_arrival_time is set for places with time_start
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM places
      WHERE trip_day_id IN (
        SELECT id FROM trip_days WHERE trip_id = '00000000-0000-0000-0000-000000000002'
      )
      AND time_start IS NOT NULL
      AND calculated_arrival_time IS NOT NULL;
    `);

    const count = parseInt(result.rows[0].count);
    results.push({
      passed: count === 3,
      testName: 'Calculated Arrival Time Set',
      message: `Expected 3 places with calculated_arrival_time, found ${count}`,
      details: { count },
    });
  } catch (error) {
    results.push({
      passed: false,
      testName: 'Calculated Arrival Time Set',
      message: `Error: ${error}`,
    });
  }

  // Test 7: Verify is_syncing is false
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM places
      WHERE trip_day_id IN (
        SELECT id FROM trip_days WHERE trip_id = '00000000-0000-0000-0000-000000000002'
      )
      AND is_syncing = TRUE;
    `);

    const count = parseInt(result.rows[0].count);
    results.push({
      passed: count === 0,
      testName: 'Sync Flags Cleared',
      message: `Expected 0 places with is_syncing=true, found ${count}`,
      details: { count },
    });
  } catch (error) {
    results.push({
      passed: false,
      testName: 'Sync Flags Cleared',
      message: `Error: ${error}`,
    });
  }

  // Test 8: Verify view exists
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.views
      WHERE table_name = 'places_with_travel_info';
    `);

    const count = parseInt(result.rows[0].count);
    results.push({
      passed: count === 1,
      testName: 'View Created',
      message: `Expected view places_with_travel_info to exist`,
      details: { exists: count === 1 },
    });
  } catch (error) {
    results.push({
      passed: false,
      testName: 'View Created',
      message: `Error: ${error}`,
    });
  }

  // Test 9: Verify function exists
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM pg_proc
      WHERE proname = 'estimate_travel_time';
    `);

    const count = parseInt(result.rows[0].count);
    results.push({
      passed: count === 1,
      testName: 'Function Created',
      message: `Expected function estimate_travel_time to exist`,
      details: { exists: count === 1 },
    });
  } catch (error) {
    results.push({
      passed: false,
      testName: 'Function Created',
      message: `Error: ${error}`,
    });
  }

  // Test 10: Verify indexes exist
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE indexname IN (
        'idx_places_calculated_arrival',
        'idx_places_syncing',
        'idx_places_transport_mode'
      );
    `);

    const count = parseInt(result.rows[0].count);
    results.push({
      passed: count === 3,
      testName: 'Indexes Created',
      message: `Expected 3 indexes, found ${count}`,
      details: { count },
    });
  } catch (error) {
    results.push({
      passed: false,
      testName: 'Indexes Created',
      message: `Error: ${error}`,
    });
  }

  return results;
}

async function cleanupTestData(pool: Pool): Promise<void> {
  console.log('🧹 Cleaning up test data...');

  try {
    // Delete in correct order to respect foreign key constraints
    await pool.query(`
      DELETE FROM places WHERE trip_day_id IN (
        SELECT id FROM trip_days WHERE trip_id = '00000000-0000-0000-0000-000000000002'
      );
    `);

    await pool.query(`
      DELETE FROM trip_days WHERE trip_id = '00000000-0000-0000-0000-000000000002';
    `);

    // Delete any collaborators first
    await pool.query(`
      DELETE FROM trip_collaborators WHERE trip_id = '00000000-0000-0000-0000-000000000002';
    `);

    await pool.query(`
      DELETE FROM trips WHERE id = '00000000-0000-0000-0000-000000000002';
    `);

    await pool.query(`
      DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
    `);

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.log('⚠️  Cleanup warning (non-critical):', error instanceof Error ? error.message : error);
  }
}

async function main() {
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
    console.log('🧪 Starting migration tests...\n');

    // Create test data
    await createTestData(pool);

    // Run the migration SQL
    console.log('⚙️  Running migration on test data...');
    const fs = await import('fs');
    const path = await import('path');
    const url = await import('url');
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const migrationPath = path.join(__dirname, '../migrations/014_backfill_existing_data.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    await pool.query(migrationSQL);
    console.log('✅ Migration executed\n');

    // Run tests
    console.log('🔍 Running validation tests...\n');
    const results = await runTests(pool);

    // Print results
    console.log('📊 Test Results:');
    console.log('═'.repeat(60));
    
    let passedCount = 0;
    let failedCount = 0;

    results.forEach((result) => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.testName}`);
      console.log(`   ${result.message}`);
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details)}`);
      }
      console.log();

      if (result.passed) {
        passedCount++;
      } else {
        failedCount++;
      }
    });

    console.log('═'.repeat(60));
    console.log(`Total: ${results.length} tests`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log('═'.repeat(60));

    // Cleanup
    await cleanupTestData(pool);

    if (failedCount === 0) {
      console.log('\n✅ All tests passed! Migration is ready for production.');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please review the migration.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
