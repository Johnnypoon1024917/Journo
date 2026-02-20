#!/usr/bin/env node

/**
 * Fix Collaborator Functions Script
 * Applies migration 045 to fix the user_is_collaborator function
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'journo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function fixFunctions() {
  console.log('🔧 Fixing Collaborator Functions');
  console.log('=================================\n');

  try {
    const migrationPath = path.join(__dirname, '../src/migrations/045_fix_collaborator_functions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Applying migration 045...\n');
    await pool.query(migrationSQL);

    console.log('✅ Functions fixed successfully!\n');
    console.log('🧪 Testing the fix...\n');

    // Test the function
    const testResult = await pool.query(`
      SELECT user_is_collaborator(
        '46d62fdc-7b1c-4e20-83f9-db7323fbbb46'::uuid,
        '4f91a947-c872-4722-b634-3e98a1d4c8e3'::uuid
      ) as result
    `);

    console.log('   ✓ Function executed without errors');
    console.log(`   Result: ${testResult.rows[0].result}\n`);

    console.log('🎉 All done! The collaborators endpoint should now work.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixFunctions();
