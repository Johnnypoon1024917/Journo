/**
 * Verification script to check countries seeding
 */
import { pool } from '../config/database.js';

async function verifySeeding() {
  try {
    console.log('🔍 Verifying countries seeding...\n');

    // Count total countries
    const countResult = await pool.query('SELECT COUNT(*) as total FROM countries');
    const total = parseInt(countResult.rows[0].total);
    console.log(`✅ Total countries in database: ${total}`);

    // Count by region
    const regionResult = await pool.query(`
      SELECT region, COUNT(*) as count 
      FROM countries 
      GROUP BY region 
      ORDER BY count DESC
    `);
    console.log('\n📊 Countries by region:');
    regionResult.rows.forEach(row => {
      console.log(`  ${row.region}: ${row.count}`);
    });

    // Sample a few countries
    const sampleResult = await pool.query(`
      SELECT country_name, region, array_length(best_months, 1) as best_months_count
      FROM countries 
      ORDER BY RANDOM() 
      LIMIT 5
    `);
    console.log('\n🎲 Random sample of countries:');
    sampleResult.rows.forEach(row => {
      console.log(`  ${row.country_name} (${row.region}) - ${row.best_months_count} best months`);
    });

    console.log('\n✅ Verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifySeeding();
