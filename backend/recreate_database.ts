import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const DB_NAME = 'journo';
const DB_USER = 'postgres';
const DB_PASSWORD = 'postgres';
const DB_HOST = 'localhost';
const DB_PORT = 5432;

async function recreateDatabase() {
  // Connect to postgres database to drop/create journo database
  const adminPool = new Pool({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT,
    database: 'postgres',
  });

  try {
    console.log('🔄 Dropping existing database...');
    
    // Terminate all connections to the database
    await adminPool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${DB_NAME}'
        AND pid <> pg_backend_pid();
    `);
    
    // Drop database
    await adminPool.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
    console.log('✅ Database dropped');
    
    // Create database
    console.log('🔄 Creating new database...');
    await adminPool.query(`CREATE DATABASE ${DB_NAME}`);
    console.log('✅ Database created');
    
  } catch (error) {
    console.error('❌ Error recreating database:', error);
    process.exit(1);
  } finally {
    await adminPool.end();
  }

  // Connect to the new database to run migrations
  const pool = new Pool({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
  });

  try {
    console.log('🔄 Running migrations...');
    
    // Create migrations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'src/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && !f.endsWith('.bak'))
      .sort();
    
    console.log(`Found ${files.length} migration files`);
    
    // Run each migration
    for (const file of files) {
      console.log(`  📄 Running: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await pool.query(sql);
        await pool.query(
          'INSERT INTO migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
          [file]
        );
        console.log(`  ✅ Completed: ${file}`);
      } catch (error: any) {
        console.error(`  ❌ Error in ${file}:`, error.message);
        throw error;
      }
    }
    
    console.log('✅ All migrations completed successfully');
    
    // Verify permission functions exist
    const functionsCheck = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN ('user_can_edit_trip', 'user_can_view_trip')
    `);
    
    console.log(`✅ Permission functions created: ${functionsCheck.rows.map(r => r.routine_name).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }

  console.log('\n✅ Database recreated successfully!');
  console.log('📝 Next steps:');
  console.log('   1. Create admin user: npm run create-admin');
  console.log('   2. Start backend: npm run dev');
}

recreateDatabase();
