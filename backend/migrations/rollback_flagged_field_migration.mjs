#!/usr/bin/env node

/**
 * Migration Rollback: Remove flagged_for_review field from posts table
 * 
 * This script rolls back migration 053 by removing the flagged_for_review field.
 */

import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'journo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function rollbackMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Rolling back migration 053: Remove flagged_for_review field...\n');
    
    await client.query('BEGIN');
    
    // Drop index
    await client.query('DROP INDEX IF EXISTS idx_posts_flagged_for_review');
    console.log('  ✓ Dropped index idx_posts_flagged_for_review');
    
    // Drop column
    await client.query('ALTER TABLE posts DROP COLUMN IF EXISTS flagged_for_review');
    console.log('  ✓ Dropped column flagged_for_review from posts table');
    
    await client.query('COMMIT');
    
    console.log('\n✅ Migration 053 rolled back successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run rollback
rollbackMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
