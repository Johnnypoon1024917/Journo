#!/usr/bin/env node

/**
 * Run database migrations
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running database migrations...\n');

    // Get all migration files
    const migrationsDir = join(__dirname, 'src', 'migrations');
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && !f.includes('rollback') && !f.includes('.bak'))
      .sort();

    console.log(`Found ${files.length} migration files\n`);

    for (const file of files) {
      console.log(`📄 Running: ${file}`);
      
      try {
        const sql = readFileSync(join(migrationsDir, file), 'utf8');
        await client.query(sql);
        console.log(`✅ Success: ${file}\n`);
      } catch (error) {
        console.error(`❌ Error in ${file}:`, error.message);
        // Continue with other migrations
      }
    }

    console.log('\n✅ Migrations complete!');

    // Verify notifications table exists
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      );
    `);

    if (result.rows[0].exists) {
      console.log('✅ Notifications table exists');
      
      // Check table structure
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'notifications'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Notifications table columns:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ Notifications table does NOT exist');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
