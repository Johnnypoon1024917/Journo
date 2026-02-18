import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'journo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function listPlaces() {
  try {
    const result = await pool.query(
      "SELECT id, name, is_completed, trip_day_id FROM places ORDER BY created_at DESC LIMIT 10"
    );
    console.log('Places:');
    result.rows.forEach(p => {
      console.log(`  ${p.id.substring(0, 8)}... - ${p.name}: is_completed = ${p.is_completed}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listPlaces();
