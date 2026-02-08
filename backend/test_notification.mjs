#!/usr/bin/env node

/**
 * Test notification creation and socket emission
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testNotification() {
  try {
    console.log('🧪 Testing notification system...\n');

    // Get a user to send notification to
    const userResult = await pool.query(`
      SELECT id, email, first_name, last_name
      FROM users
      LIMIT 1
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    const user = userResult.rows[0];
    console.log(`📧 Test user: ${user.email} (${user.first_name} ${user.last_name})`);
    console.log(`   User ID: ${user.id}\n`);

    // Create a test notification
    const notifResult = await pool.query(`
      INSERT INTO notifications 
      (user_id, type, title, message, data, category, priority, action_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      user.id,
      'test_notification',
      'Test Notification',
      'This is a test notification to verify the system is working',
      JSON.stringify({ test: true }),
      'system',
      'normal',
      '/'
    ]);

    console.log('✅ Test notification created in database:');
    console.log(`   ID: ${notifResult.rows[0].id}`);
    console.log(`   Title: ${notifResult.rows[0].title}`);
    console.log(`   Message: ${notifResult.rows[0].message}\n`);

    console.log('📊 Total notifications in database:');
    const countResult = await pool.query('SELECT COUNT(*) FROM notifications');
    console.log(`   ${countResult.rows[0].count} notifications\n`);

    console.log('💡 Next steps:');
    console.log('   1. Check backend logs for socket emission');
    console.log('   2. Check frontend console for socket event reception');
    console.log('   3. Check if notification appears in UI');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testNotification();
