#!/usr/bin/env node

/**
 * Rollback community threads feed migration (052)
 * This script rolls back the migration and verifies cleanup
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function rollbackMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Rolling back community threads feed migration (052)...\n');

    // Read rollback file
    const rollbackPath = join(__dirname, '..', 'src', 'migrations', '052_community_threads_feed_rollback.sql');
    const sql = readFileSync(rollbackPath, 'utf8');

    // Execute rollback
    console.log('📄 Executing rollback...');
    await client.query(sql);
    console.log('✅ Rollback executed successfully\n');

    // Verify tables were dropped
    console.log('🔍 Verifying cleanup...\n');

    const tables = [
      'communities',
      'community_members',
      'posts',
      'likes',
      'reposts',
      'bookmarks',
      'reports',
      'user_follows'
    ];

    let allDropped = true;
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);

      if (result.rows[0].exists) {
        console.log(`❌ Table '${table}' still exists`);
        allDropped = false;
      } else {
        console.log(`✅ Table '${table}' dropped`);
      }
    }

    // Verify functions were dropped
    const functions = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_proc
      WHERE proname IN (
        'calculate_engagement_score',
        'update_post_engagement_score',
        'update_communities_updated_at',
        'update_posts_updated_at',
        'trigger_update_engagement_score',
        'increment_community_member_count',
        'decrement_community_member_count',
        'increment_community_post_count',
        'decrement_community_post_count',
        'increment_post_reply_count',
        'decrement_post_reply_count'
      );
    `);

    if (functions.rows[0].count === '0') {
      console.log('\n✅ All functions dropped');
    } else {
      console.log(`\n❌ ${functions.rows[0].count} functions still exist`);
      allDropped = false;
    }

    if (allDropped) {
      console.log('\n✅ Rollback verification complete! All objects cleaned up.');
    } else {
      console.log('\n⚠️  Rollback incomplete. Some objects still exist.');
    }

  } catch (error) {
    console.error('❌ Rollback error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

rollbackMigration();
