import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'journo',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
});

async function verifySchema() {
  try {
    console.log('🔍 Verifying budget schema...\n');

    // Check budget_configs table
    const configsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'budget_configs'
      ORDER BY ordinal_position
    `);

    console.log('✅ budget_configs table:');
    configsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check expenses table
    const expensesResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'expenses'
      ORDER BY ordinal_position
    `);

    console.log('\n✅ expenses table:');
    expensesResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check indexes
    const indexesResult = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename IN ('budget_configs', 'expenses')
      ORDER BY tablename, indexname
    `);

    console.log('\n✅ Indexes:');
    indexesResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });

    console.log('\n✅ Budget schema verification complete!');
  } catch (error) {
    console.error('❌ Error verifying schema:', error);
  } finally {
    await pool.end();
  }
}

verifySchema();
