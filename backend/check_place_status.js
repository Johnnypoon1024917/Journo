const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'journo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkPlace() {
  try {
    const result = await pool.query(
      "SELECT id, name, is_completed FROM places WHERE id = '2445edea-6e5d-455c-87fa-dc5d3d642926'"
    );
    console.log('Place status:', result.rows[0]);
    
    // Also check all places
    const allPlaces = await pool.query(
      "SELECT id, name, is_completed FROM places ORDER BY created_at DESC LIMIT 5"
    );
    console.log('\nRecent places:');
    allPlaces.rows.forEach(p => {
      console.log(`  ${p.name}: is_completed = ${p.is_completed}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPlace();
