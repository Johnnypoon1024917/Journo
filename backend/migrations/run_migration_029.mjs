import pg from 'pg';
import fs from 'fs';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'journo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigration() {
  try {
    const sql = fs.readFileSync('src/migrations/029_add_is_completed_to_places.sql', 'utf8');
    console.log('Running migration 029...');
    await pool.query(sql);
    console.log('✅ Migration completed');
    
    // Record in migrations table
    await pool.query(
      "INSERT INTO migrations (filename, executed_at) VALUES ('029_add_is_completed_to_places.sql', NOW())"
    );
    console.log('✅ Migration recorded');
    
    // Verify column exists
    const result = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'places' AND column_name = 'is_completed'"
    );
    console.log('Column exists:', result.rows.length > 0);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

runMigration();
