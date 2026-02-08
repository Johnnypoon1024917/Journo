#!/usr/bin/env node

/**
 * Diagnose notification system
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function diagnose() {
  try {
    console.log('🔍 Diagnosing notification system...\n');

    // 1. Check if notifications table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      );
    `);
    console.log(`1. Notifications table exists: ${tableCheck.rows[0].exists ? '✅' : '❌'}`);

    if (!tableCheck.rows[0].exists) {
      console.log('\n❌ CRITICAL: Notifications table does not exist!');
      console.log('   Run: node backend/create_notifications_table.mjs');
      return;
    }

    // 2. Check trips with collaborators
    const tripsResult = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.owner_id,
        COUNT(tc.user_id) as collaborator_count
      FROM trips t
      LEFT JOIN trip_collaborators tc ON tc.trip_id = t.id
      GROUP BY t.id, t.name, t.owner_id
      HAVING COUNT(tc.user_id) > 0
      ORDER BY t.created_at DESC
      LIMIT 5;
    `);

    console.log(`\n2. Trips with collaborators: ${tripsResult.rows.length}`);
    if (tripsResult.rows.length === 0) {
      console.log('   ⚠️  No trips have collaborators!');
      console.log('   Add collaborators to a trip first.');
    } else {
      tripsResult.rows.forEach((trip, i) => {
        console.log(`   ${i + 1}. ${trip.name} (${trip.collaborator_count} collaborators)`);
      });
    }

    // 3. Check a specific trip's collaborators
    if (tripsResult.rows.length > 0) {
      const tripId = tripsResult.rows[0].id;
      console.log(`\n3. Checking collaborators for trip: ${tripsResult.rows[0].name}`);
      
      const collabResult = await pool.query(`
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          tc.role,
          t.owner_id = u.id as is_owner
        FROM trip_collaborators tc
        JOIN users u ON u.id = tc.user_id
        JOIN trips t ON t.id = tc.trip_id
        WHERE tc.trip_id = $1;
      `, [tripId]);

      collabResult.rows.forEach((collab, i) => {
        console.log(`   ${i + 1}. ${collab.email} (${collab.first_name} ${collab.last_name})`);
        console.log(`      Role: ${collab.role} ${collab.is_owner ? '(Owner)' : ''}`);
      });

      // 4. Simulate notification query
      const ownerResult = await pool.query(`
        SELECT owner_id FROM trips WHERE id = $1
      `, [tripId]);
      
      const ownerId = ownerResult.rows[0].owner_id;
      
      console.log(`\n4. Simulating notification query (excluding owner: ${ownerId}):`);
      const notifSimResult = await pool.query(`
        SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
        FROM users u
        JOIN trip_collaborators tc ON tc.user_id = u.id
        WHERE tc.trip_id = $1 AND u.id != $2
      `, [tripId, ownerId]);

      console.log(`   Would notify ${notifSimResult.rows.length} users:`);
      notifSimResult.rows.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email}`);
      });

      if (notifSimResult.rows.length === 0) {
        console.log('\n   ⚠️  No users to notify!');
        console.log('   This means either:');
        console.log('   - The owner is the only collaborator');
        console.log('   - There are no other collaborators besides the owner');
      }
    }

    // 5. Check recent notifications
    const recentNotifs = await pool.query(`
      SELECT 
        n.id,
        n.type,
        n.title,
        u.email,
        n.created_at
      FROM notifications n
      JOIN users u ON u.id = n.user_id
      ORDER BY n.created_at DESC
      LIMIT 5;
    `);

    console.log(`\n5. Recent notifications: ${recentNotifs.rows.length}`);
    recentNotifs.rows.forEach((notif, i) => {
      console.log(`   ${i + 1}. ${notif.type} - ${notif.title}`);
      console.log(`      To: ${notif.email}`);
      console.log(`      At: ${notif.created_at}`);
    });

    console.log('\n✅ Diagnosis complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Notifications table: ${tableCheck.rows[0].exists ? 'EXISTS' : 'MISSING'}`);
    console.log(`   - Trips with collaborators: ${tripsResult.rows.length}`);
    console.log(`   - Total notifications: ${recentNotifs.rows.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

diagnose();
