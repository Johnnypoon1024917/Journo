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

async function fixUserSessions() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing user_sessions table schema...');
    
    // Drop the old table
    console.log('📦 Dropping old user_sessions table...');
    await client.query('DROP TABLE IF EXISTS user_sessions CASCADE');
    
    // Recreate with correct schema
    console.log('🏗️  Creating new user_sessions table with UUID support...');
    await client.query(`
      CREATE TABLE user_sessions (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        refresh_token VARCHAR(255) UNIQUE NOT NULL,
        access_token_jti VARCHAR(255),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address INET,
        user_agent TEXT,
        device_info JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    
    // Create indexes
    console.log('📇 Creating indexes...');
    await client.query('CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id)');
    await client.query('CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token)');
    await client.query('CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at)');
    await client.query('CREATE INDEX idx_user_sessions_access_token_jti ON user_sessions(access_token_jti)');
    
    console.log('✅ user_sessions table fixed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Log out of the application');
    console.log('2. Clear browser cookies and localStorage');
    console.log('3. Log in again');
    console.log('4. The refresh token should now work!');
    
  } catch (error) {
    console.error('❌ Error fixing user_sessions table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixUserSessions().catch(console.error);
