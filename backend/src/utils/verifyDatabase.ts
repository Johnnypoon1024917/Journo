import { pool } from '../config/database.js';

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database setup...\n');

    // Check connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');

    // Count tables
    const tablesResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    console.log(`✅ Tables created: ${tablesResult.rows[0].count}`);

    // Count functions
    const functionsResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM pg_proc 
      WHERE pronamespace = 'public'::regnamespace
    `);
    console.log(`✅ Functions created: ${functionsResult.rows[0].count}`);

    // Count triggers
    const triggersResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM pg_trigger 
      WHERE tgisinternal = false
    `);
    console.log(`✅ Triggers created: ${triggersResult.rows[0].count}`);

    // List all tables
    const allTablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log('\n📋 Tables:');
    allTablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.tablename}`);
    });

    // Check extensions
    const extensionsResult = await pool.query(`
      SELECT extname FROM pg_extension WHERE extname = 'pgcrypto'
    `);
    console.log(`\n✅ pgcrypto extension: ${extensionsResult.rows.length > 0 ? 'enabled' : 'not found'}`);

    // Check feature flags
    const featureFlagsResult = await pool.query(`
      SELECT name, enabled FROM feature_flags ORDER BY name
    `);
    
    if (featureFlagsResult.rows.length > 0) {
      console.log('\n🚩 Feature Flags:');
      featureFlagsResult.rows.forEach((row) => {
        console.log(`   ${row.enabled ? '✅' : '❌'} ${row.name}`);
      });
    }

    console.log('\n✅ Database verification complete!\n');
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Verification error:', error);
      process.exit(1);
    });
}

export default verifyDatabase;
