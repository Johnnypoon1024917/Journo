#!/usr/bin/env node

/**
 * Check notifications in database
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkNotifications() {
  try {
    console.log('🔍 Checking notifications...\n');

    // Get recent notifications
    const result = await pool.query(`
      SELECT 
        n.id,
        n.user_id,
        u.email,
        u.first_name,
        u.last_name,
        n.type,
        n.title,
        n.message,
        n.category,
        n.priority,
        n.is_read,
        n.created_at
      FROM notifications n
      JOIN users u ON u.id = n.user_id
      ORDER BY n.created_at DESC
      LIMIT 20
    `);

    if (result.rows.length === 0) {
      console.log('❌ No notifications found in database');
    } else {
      console.log(`✅ Found ${result.rows.length} notifications:\n`);
      result.rows.forEach((notif, index) => {
        console.log(`${index + 1}. ${notif.title}`);
        console.log(`   User: ${notif.first_name} ${notif.last_name} (${notif.email})`);
        console.log(`   Type: ${notif.type} | Category: ${notif.category} | Priority: ${notif.priority}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Read: ${notif.is_read} | Created: ${notif.created_at}`);
        console.log('');
      });
    }

    // Check for activity_reordered notifications specifically
    const reorderResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE type = 'activity_reordered'
    `);

    console.log(`\n📊 Activity reorder notifications: ${reorderResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkNotifications();
