import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'journo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkDatabase() {
  try {
    console.log('=== Database State Check ===\n');
    
    // Check trips
    const trips = await pool.query('SELECT COUNT(*) FROM trips');
    console.log(`Trips: ${trips.rows[0].count}`);
    
    // Check trip_days
    const days = await pool.query('SELECT COUNT(*) FROM trip_days');
    console.log(`Trip Days: ${days.rows[0].count}`);
    
    // Check places
    const places = await pool.query('SELECT COUNT(*) FROM places');
    console.log(`Places: ${places.rows[0].count}`);
    
    console.log('');
    
    if (parseInt(trips.rows[0].count) > 0) {
      console.log('Sample trips:');
      const sampleTrips = await pool.query(
        'SELECT id, title, start_date, end_date FROM trips ORDER BY created_at DESC LIMIT 3'
      );
      sampleTrips.rows.forEach(t => {
        console.log(`  - ${t.title} (${t.id.substring(0, 8)}...)`);
      });
      console.log('');
    }
    
    if (parseInt(days.rows[0].count) > 0) {
      console.log('Sample days:');
      const sampleDays = await pool.query(
        `SELECT td.id, td.date, td.day_number, t.title 
         FROM trip_days td 
         JOIN trips t ON t.id = td.trip_id 
         ORDER BY td.created_at DESC LIMIT 5`
      );
      sampleDays.rows.forEach(d => {
        console.log(`  - Day ${d.day_number} of "${d.title}" (${d.date})`);
      });
      console.log('');
    }
    
    if (parseInt(places.rows[0].count) > 0) {
      console.log('Sample places:');
      const samplePlaces = await pool.query(
        `SELECT p.id, p.name, p.is_completed, td.day_number, t.title 
         FROM places p
         JOIN trip_days td ON td.id = p.trip_day_id
         JOIN trips t ON t.id = td.trip_id
         ORDER BY p.created_at DESC LIMIT 5`
      );
      samplePlaces.rows.forEach(p => {
        console.log(`  - ${p.name} (Day ${p.day_number} of "${p.title}") - completed: ${p.is_completed}`);
      });
    } else {
      console.log('⚠️  NO PLACES IN DATABASE!');
      console.log('');
      console.log('This is why the checkbox isn\'t working.');
      console.log('You need to:');
      console.log('1. Go to the trip in the UI');
      console.log('2. Add some activities');
      console.log('3. Then test the checkbox');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkDatabase();
