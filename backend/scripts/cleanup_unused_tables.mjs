#!/usr/bin/env node

/**
 * Database Cleanup Script
 * Removes unused tables from the database schema
 * 
 * Usage: node backend/scripts/cleanup_unused_tables.mjs
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

async function listTables() {
  const result = await pool.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);
  return result.rows.map(row => row.tablename);
}

async function getTableRowCount(tableName) {
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
    return parseInt(result.rows[0].count);
  } catch (error) {
    return 'N/A';
  }
}

async function runCleanup() {
  console.log('🧹 Database Cleanup Script');
  console.log('==========================\n');

  try {
    // List tables before cleanup
    console.log('📊 Current tables in database:');
    const tablesBefore = await listTables();
    console.log(`Total tables: ${tablesBefore.length}\n`);

    // Tables to be removed
    const tablesToRemove = [
      'scraped_locations',
      'collaborators',
      'budget_entries',
      'search_queries',
      'place_interactions',
      'place_suggestions_cache',
      'cache_statistics',
      'scraping_jobs',
      'scraping_schedule',
      'scraping_progress',
      'packing_templates',
      'packing_categories',
      'story_likes',
      'trip_versions',
      'exchange_rates',
      'user_customization_preferences',
      'moderation_flags',
      'moderation_log',
      'feature_flags',
      'quick_plan_ab_tests',
      'quick_plan_usage_analytics',
      'quick_plan_customizations',
      'quick_plan_conversions',
      'system_color_theme',
      'trip_color_theme',
    ];

    // Check which tables exist and their row counts
    console.log('🔍 Checking tables to be removed:\n');
    const existingTables = [];
    for (const table of tablesToRemove) {
      if (tablesBefore.includes(table)) {
        const count = await getTableRowCount(table);
        console.log(`  ✓ ${table} (${count} rows)`);
        existingTables.push(table);
      } else {
        console.log(`  ⊘ ${table} (not found)`);
      }
    }

    if (existingTables.length === 0) {
      console.log('\n✨ No unused tables found. Database is already clean!');
      return;
    }

    console.log(`\n⚠️  About to remove ${existingTables.length} tables`);
    console.log('This action cannot be undone!\n');

    // Read and execute the migration
    const migrationPath = path.join(__dirname, '../src/migrations/043_cleanup_unused_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running cleanup migration...\n');
    await pool.query(migrationSQL);

    // List tables after cleanup
    const tablesAfter = await listTables();
    const removedCount = tablesBefore.length - tablesAfter.length;

    console.log('✅ Cleanup completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`  - Tables before: ${tablesBefore.length}`);
    console.log(`  - Tables after: ${tablesAfter.length}`);
    console.log(`  - Tables removed: ${removedCount}`);
    console.log(`  - Space saved: ~${removedCount * 8}KB (estimated)\n`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the cleanup
runCleanup().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
