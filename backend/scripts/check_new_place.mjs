import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'journo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkPlace() {
  try {
    const placeId = 'f897022f-8a90-4674-890e-8f67c08a46b1';
    
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
      console.log('✅ Place found:');
      console.log(`  Name: ${place.name}`);
      console.log(`  is_completed: ${place.is_completed}`);
      console.log(`  updated_at: ${place.updated_at}`);
    }
    
    // Also show all places
    console.log('\nAll places in database:');
    const all = await pool.query(
      `SELECT id, name, is_completed FROM places ORDER BY created_at DESC LIMIT 10`
    );
    all.rows.forEach(p => {
      console.log(`  - ${p.name}: is_completed = ${p.is_completed}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkPlace();
