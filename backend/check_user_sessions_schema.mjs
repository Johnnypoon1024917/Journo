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

async function checkSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking user_sessions table schema...\n');
    
    // Get table structure
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'user_sessions'
      ORDER BY ordinal_position;
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ user_sessions table does not exist!');
    } else {
      console.log('📋 Current schema:');
      console.table(result.rows);
      
      // Check specifically for user_id
      const userIdCol = result.rows.find(r => r.column_name === 'user_id');
      if (userIdCol) {
        console.log('\n🔑 user_id column:');
        console.log('  Type:', userIdCol.data_type);
        console.log('  Expected: uuid');
        console.log('  Match:', userIdCol.data_type === 'uuid' ? '✅' : '❌');
      }
    }
    
    // Check if there are any existing sessions
    const countResult = await client.query('SELECT COUNT(*) FROM user_sessions');
    console.log('\n📊 Existing sessions:', countResult.rows[0].count);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
