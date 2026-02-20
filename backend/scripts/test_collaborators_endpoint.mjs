#!/usr/bin/env node

/**
 * Test Collaborators Endpoint
 * Tests the collaborators endpoint to see the actual error
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function testCollaboratorsQuery() {
  console.log('🧪 Testing Collaborators Query');
  console.log('===============================\n');

  const tripId = '4f91a947-c872-4722-b634-3e98a1d4c8e3';

  try {
    // First, check if the trip exists
    console.log('1️⃣ Checking if trip exists...');
    const tripCheck = await pool.query('SELECT id, title, owner_id FROM trips WHERE id = $1', [tripId]);
    
    if (tripCheck.rows.length === 0) {
      console.log('   ✗ Trip not found\n');
      return;
    }
    
    console.log(`   ✓ Trip found: "${tripCheck.rows[0].title}"`);
    console.log(`   Owner ID: ${tripCheck.rows[0].owner_id}\n`);

    // Test the access check functions
    console.log('2️⃣ Testing access control functions...');
    const testUserId = tripCheck.rows[0].owner_id;
    
    try {
      const accessCheck = await pool.query(
        `SELECT user_owns_trip($1, $2) as owns, 
                user_is_collaborator($1, $2) as is_collaborator,
                trip_is_public($2) as is_public`,
        [testUserId, tripId]
      );
      console.log('   ✓ Access check query succeeded');
      console.log('   Result:', accessCheck.rows[0], '\n');
    } catch (error) {
      console.log('   ✗ Access check query failed:', error.message, '\n');
      throw error;
    }

    // Test the collaborators query
    console.log('3️⃣ Testing collaborators query...');
    try {
      const result = await pool.query(
        `SELECT 
          tc.id,
          tc.trip_id,
          tc.user_id,
          tc.role,
          tc.invited_by,
          tc.created_at,
          u.name as user_name,
          u.email as user_email,
          inv.name as inviter_name
        FROM trip_collaborators tc
        JOIN users u ON tc.user_id = u.id
        LEFT JOIN users inv ON tc.invited_by = inv.id
        WHERE tc.trip_id = $1
        ORDER BY 
          CASE tc.role 
            WHEN 'owner' THEN 1 
            WHEN 'editor' THEN 2 
            WHEN 'viewer' THEN 3 
          END,
          tc.created_at ASC`,
        [tripId]
      );
      
      console.log(`   ✓ Query succeeded`);
      console.log(`   Found ${result.rows.length} collaborator(s)\n`);
      
      if (result.rows.length > 0) {
        console.log('   Collaborators:');
        result.rows.forEach(row => {
          console.log(`   - ${row.user_name} (${row.user_email}) - Role: ${row.role}`);
        });
      }
      
      console.log('\n✅ All queries successful!\n');
    } catch (error) {
      console.log('   ✗ Collaborators query failed:', error.message);
      console.log('   Error details:', error, '\n');
      throw error;
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testCollaboratorsQuery();
