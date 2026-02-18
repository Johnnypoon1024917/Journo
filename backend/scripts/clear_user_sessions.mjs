import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'journo_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function clearSessions() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Clearing all user sessions...');
    
    const result = await client.query('DELETE FROM user_sessions');
    console.log(`✅ Deleted ${result.rowCount} sessions`);
    console.log('');
    console.log('Now log out and log in again - the refresh token should work!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

clearSessions();
