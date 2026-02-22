import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'journo_db',
  user: 'postgres',
  password: 'postgres',
});

async function checkUser() {
  try {
    const userId = '46d62fdc-7b1c-4e20-83f9-db7323fbbb46';
    
    const result = await pool.query('SELECT id, name, email, profile_picture FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length > 0) {
      console.log('User found:', result.rows[0]);
    } else {
      console.log('User not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser();
