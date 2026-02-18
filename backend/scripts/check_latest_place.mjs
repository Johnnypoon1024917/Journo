import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'journo_db',  // Changed from 'journo' to 'journo_db'
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkPlace() {
  try {
    const placeId = '5b70cc96-756b-4585-843c-fd04278d4959';
    
    console.log(`Checking place: ${placeId}\n`);
    
    const result = await pool.query(
      `SELECT id, name, is_completed, updated_at 
       FROM places 
       WHERE id = $1`,
      [placeId]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Place not found!');
    } else {
      const place = result.rows[0];
      console.log('✅ Place found in database:');
      console.log(`  Name: ${place.name}`);
      console.log(`  is_completed: ${place.is_completed}`);
      console.log(`  updated_at: ${place.updated_at}`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkPlace();
