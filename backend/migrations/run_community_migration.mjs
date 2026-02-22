#!/usr/bin/env node

/**
 * Run community threads feed migration (052)
 * This script applies the migration and verifies the database structure
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

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running community threads feed migration (052)...\n');

    // Read migration file
    const migrationPath = join(__dirname, '..', 'src', 'migrations', '052_community_threads_feed.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    // Execute migration
    console.log('📄 Executing migration...');
    await client.query(sql);
    console.log('✅ Migration executed successfully\n');

    // Verify tables were created
    console.log('🔍 Verifying database structure...\n');

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

    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);

      if (result.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
        
        // Get column count
        const columns = await client.query(`
          SELECT COUNT(*) as count
          FROM information_schema.columns 
          WHERE table_name = $1;
        `, [table]);
        
        console.log(`   └─ ${columns.rows[0].count} columns`);
      } else {
        console.log(`❌ Table '${table}' does NOT exist`);
      }
    }

    // Verify indexes
    console.log('\n🔍 Verifying indexes...\n');
    
    const indexes = await client.query(`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('posts', 'likes', 'reposts', 'bookmarks', 'reports', 'community_members', 'user_follows', 'communities')
      ORDER BY tablename, indexname;
    `);

    console.log(`✅ Found ${indexes.rows.length} indexes:`);
    let currentTable = '';
    indexes.rows.forEach(idx => {
      if (idx.tablename !== currentTable) {
        currentTable = idx.tablename;
        console.log(`\n   ${idx.tablename}:`);
      }
      console.log(`   └─ ${idx.indexname}`);
    });

    // Verify functions
    console.log('\n🔍 Verifying functions...\n');
    
    const functions = await client.query(`
      SELECT 
        proname as function_name,
        pg_get_function_arguments(oid) as arguments
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
      )
      ORDER BY proname;
    `);

    console.log(`✅ Found ${functions.rows.length} functions:`);
    functions.rows.forEach(fn => {
      console.log(`   └─ ${fn.function_name}(${fn.arguments})`);
    });

    // Verify triggers
    console.log('\n🔍 Verifying triggers...\n');
    
    const triggers = await client.query(`
      SELECT 
        tgname as trigger_name,
        tgrelid::regclass as table_name
      FROM pg_trigger
      WHERE tgname LIKE 'trigger_%'
        AND tgrelid::regclass::text IN ('communities', 'posts', 'community_members')
      ORDER BY table_name, trigger_name;
    `);

    console.log(`✅ Found ${triggers.rows.length} triggers:`);
    let currentTriggerTable = '';
    triggers.rows.forEach(trg => {
      if (trg.table_name !== currentTriggerTable) {
        currentTriggerTable = trg.table_name;
        console.log(`\n   ${trg.table_name}:`);
      }
      console.log(`   └─ ${trg.trigger_name}`);
    });

    // Test engagement score calculation
    console.log('\n🧪 Testing engagement score calculation...\n');
    
    const testScore = await client.query(`
      SELECT calculate_engagement_score(10, 5, 3, NOW() - INTERVAL '12 hours') as score;
    `);
    
    console.log(`✅ Engagement score test (10 likes, 5 replies, 3 reposts, 12h old):`);
    console.log(`   └─ Score: ${testScore.rows[0].score} (expected: 53 = 30 + 10 + 3 + 10)`);

    const testScore2 = await client.query(`
      SELECT calculate_engagement_score(5, 2, 1, NOW() - INTERVAL '30 hours') as score;
    `);
    
    console.log(`✅ Engagement score test (5 likes, 2 replies, 1 repost, 30h old):`);
    console.log(`   └─ Score: ${testScore2.rows[0].score} (expected: 25 = 15 + 4 + 1 + 5)`);

    console.log('\n✅ Migration verification complete!');
    console.log('\n📊 Summary:');
    console.log(`   - ${tables.length} tables created`);
    console.log(`   - ${indexes.rows.length} indexes created`);
    console.log(`   - ${functions.rows.length} functions created`);
    console.log(`   - ${triggers.rows.length} triggers created`);

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
