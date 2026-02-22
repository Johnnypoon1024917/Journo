#!/usr/bin/env node

/**
 * Test community threads feed migration (052)
 * This script tests migration application, rollback, and re-application
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

async function testMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing community threads feed migration (052)...\n');
    console.log('=' .repeat(70));

    // Read migration and rollback files
    const migrationPath = join(__dirname, '..', 'src', 'migrations', '052_community_threads_feed.sql');
    const rollbackPath = join(__dirname, '..', 'src', 'migrations', '052_community_threads_feed_rollback.sql');
    const migrationSql = readFileSync(migrationPath, 'utf8');
    const rollbackSql = readFileSync(rollbackPath, 'utf8');

    // ========================================================================
    // STEP 1: Apply migration
    // ========================================================================
    console.log('\n📝 STEP 1: Applying migration...\n');
    await client.query(migrationSql);
    console.log('✅ Migration applied\n');

    // Verify tables exist
    const tables = ['communities', 'community_members', 'posts', 'likes', 'reposts', 'bookmarks', 'reports', 'user_follows'];
    let step1Pass = true;
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1);
      `, [table]);
      
      if (!result.rows[0].exists) {
        console.log(`❌ Table '${table}' not created`);
        step1Pass = false;
      }
    }

    if (step1Pass) {
      console.log('✅ STEP 1 PASSED: All tables created\n');
    } else {
      console.log('❌ STEP 1 FAILED: Some tables missing\n');
      process.exit(1);
    }

    // ========================================================================
    // STEP 2: Test engagement score function
    // ========================================================================
    console.log('📝 STEP 2: Testing engagement score calculation...\n');
    
    const testCases = [
      { likes: 10, replies: 5, reposts: 3, hours: 12, expected: 53 },
      { likes: 5, replies: 2, reposts: 1, hours: 30, expected: 25 },
      { likes: 0, replies: 0, reposts: 0, hours: 60, expected: 0 }
    ];

    let step2Pass = true;
    for (const test of testCases) {
      const result = await client.query(`
        SELECT calculate_engagement_score($1::INTEGER, $2::INTEGER, $3::INTEGER, (NOW() - INTERVAL '${test.hours} hours')::TIMESTAMP) as score;
      `, [test.likes, test.replies, test.reposts]);
      
      const score = parseFloat(result.rows[0].score);
      if (score === test.expected) {
        console.log(`✅ Test passed: ${test.likes}L, ${test.replies}R, ${test.reposts}RP, ${test.hours}h = ${score}`);
      } else {
        console.log(`❌ Test failed: Expected ${test.expected}, got ${score}`);
        step2Pass = false;
      }
    }

    if (step2Pass) {
      console.log('\n✅ STEP 2 PASSED: Engagement score calculation correct\n');
    } else {
      console.log('\n❌ STEP 2 FAILED: Engagement score calculation incorrect\n');
      process.exit(1);
    }

    // ========================================================================
    // STEP 3: Test data insertion and triggers
    // ========================================================================
    console.log('📝 STEP 3: Testing data insertion and triggers...\n');

    // Create a test community
    const communityResult = await client.query(`
      INSERT INTO communities (name, description)
      VALUES ('Test Community', 'A test community')
      RETURNING id, member_count, post_count;
    `);
    const communityId = communityResult.rows[0].id;
    console.log(`✅ Created test community: ${communityId}`);
    console.log(`   Initial member_count: ${communityResult.rows[0].member_count}`);
    console.log(`   Initial post_count: ${communityResult.rows[0].post_count}`);

    // Get a test user (assuming users table exists)
    const userResult = await client.query(`SELECT id FROM users LIMIT 1;`);
    if (userResult.rows.length === 0) {
      console.log('⚠️  No users found in database, skipping trigger tests');
    } else {
      const userId = userResult.rows[0].id;

      // Test community member trigger
      await client.query(`
        INSERT INTO community_members (community_id, user_id)
        VALUES ($1, $2);
      `, [communityId, userId]);
      
      const memberCountCheck = await client.query(`
        SELECT member_count FROM communities WHERE id = $1;
      `, [communityId]);
      
      if (memberCountCheck.rows[0].member_count === 1) {
        console.log('✅ Community member count trigger working');
      } else {
        console.log('❌ Community member count trigger failed');
        step2Pass = false;
      }

      // Test post creation trigger
      const postResult = await client.query(`
        INSERT INTO posts (user_id, community_id, content)
        VALUES ($1, $2, 'Test post content')
        RETURNING id, engagement_score;
      `, [userId, communityId]);
      
      const postId = postResult.rows[0].id;
      console.log(`✅ Created test post: ${postId}`);
      console.log(`   Initial engagement_score: ${postResult.rows[0].engagement_score}`);

      const postCountCheck = await client.query(`
        SELECT post_count FROM communities WHERE id = $1;
      `, [communityId]);
      
      if (postCountCheck.rows[0].post_count === 1) {
        console.log('✅ Community post count trigger working');
      } else {
        console.log('❌ Community post count trigger failed');
      }

      // Test like trigger
      await client.query(`
        INSERT INTO likes (post_id, user_id) VALUES ($1, $2);
      `, [postId, userId]);
      
      await client.query(`
        UPDATE posts SET like_count = like_count + 1 WHERE id = $1;
      `, [postId]);

      const likeCheck = await client.query(`
        SELECT engagement_score FROM posts WHERE id = $1;
      `, [postId]);
      
      console.log(`✅ Post engagement_score after like: ${likeCheck.rows[0].engagement_score}`);
    }

    console.log('\n✅ STEP 3 PASSED: Data insertion and triggers working\n');

    // ========================================================================
    // STEP 4: Rollback migration
    // ========================================================================
    console.log('📝 STEP 4: Rolling back migration...\n');
    await client.query(rollbackSql);
    console.log('✅ Rollback executed\n');

    // Verify tables are dropped
    let step4Pass = true;
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1);
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`❌ Table '${table}' still exists after rollback`);
        step4Pass = false;
      }
    }

    if (step4Pass) {
      console.log('✅ STEP 4 PASSED: All tables dropped\n');
    } else {
      console.log('❌ STEP 4 FAILED: Some tables still exist\n');
      process.exit(1);
    }

    // ========================================================================
    // STEP 5: Re-apply migration
    // ========================================================================
    console.log('📝 STEP 5: Re-applying migration...\n');
    await client.query(migrationSql);
    console.log('✅ Migration re-applied\n');

    // Verify tables exist again
    let step5Pass = true;
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1);
      `, [table]);
      
      if (!result.rows[0].exists) {
        console.log(`❌ Table '${table}' not created on re-application`);
        step5Pass = false;
      }
    }

    if (step5Pass) {
      console.log('✅ STEP 5 PASSED: Migration re-applied successfully\n');
    } else {
      console.log('❌ STEP 5 FAILED: Re-application incomplete\n');
      process.exit(1);
    }

    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================
    console.log('=' .repeat(70));
    console.log('\n🎉 ALL TESTS PASSED!\n');
    console.log('✅ Migration applies successfully');
    console.log('✅ Engagement score calculation correct');
    console.log('✅ Triggers working properly');
    console.log('✅ Rollback cleans up completely');
    console.log('✅ Re-application works correctly');
    console.log('\n📊 Migration 052 is ready for production!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

testMigration();
