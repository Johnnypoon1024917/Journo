#!/usr/bin/env node

/**
 * Restore Active Tables Script
 * Restores bookings and shopping_items tables that were incorrectly deleted
 * 
 * Usage: node backend/scripts/restore_active_tables.mjs
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'journo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function tableExists(tableName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `, [tableName]);
  return result.rows[0].exists;
}

async function restoreTables() {
  console.log('🔧 Restore Active Tables Script');
  console.log('================================\n');

  try {
    // Check which tables need to be restored
    const bookingsExists = await tableExists('bookings');
    const shoppingItemsExists = await tableExists('shopping_items');

    console.log('📊 Current table status:');
    console.log(`  - bookings: ${bookingsExists ? '✓ exists' : '✗ missing'}`);
    console.log(`  - shopping_items: ${shoppingItemsExists ? '✓ exists' : '✗ missing'}\n`);

    if (bookingsExists && shoppingItemsExists) {
      console.log('✨ All tables already exist. No restoration needed!');
      return;
    }

    // Read and execute the restoration migration
    const migrationPath = path.join(__dirname, '../src/migrations/044_restore_active_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running restoration migration...\n');
    await pool.query(migrationSQL);

    // Verify restoration
    const bookingsRestored = await tableExists('bookings');
    const shoppingItemsRestored = await tableExists('shopping_items');

    console.log('✅ Restoration completed!\n');
    console.log('📊 Final table status:');
    console.log(`  - bookings: ${bookingsRestored ? '✓ restored' : '✗ failed'}`);
    console.log(`  - shopping_items: ${shoppingItemsRestored ? '✓ restored' : '✗ failed'}\n`);

    if (bookingsRestored && shoppingItemsRestored) {
      console.log('🎉 All tables successfully restored!');
      console.log('Your application should now work correctly.\n');
    } else {
      console.log('⚠️  Some tables failed to restore. Please check the error messages above.\n');
    }

  } catch (error) {
    console.error('❌ Error during restoration:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the restoration
restoreTables().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
