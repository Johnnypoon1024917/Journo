#!/usr/bin/env node

/**
 * Verify Database Functions Script
 * Checks if required PostgreSQL functions exist and recreates them if missing
 * 
 * Usage: node backend/scripts/verify_database_functions.mjs
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

async function functionExists(functionName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = $1
    );
  `, [functionName]);
  return result.rows[0].exists;
}

async function verifyFunctions() {
  console.log('🔍 Database Functions Verification');
  console.log('===================================\n');

  try {
    const requiredFunctions = [
      'user_owns_trip',
      'user_is_collaborator',
      'trip_is_public',
      'update_updated_at_column'
    ];

    console.log('📊 Checking required functions:\n');
    const missingFunctions = [];
    
    for (const func of requiredFunctions) {
      const exists = await functionExists(func);
      if (exists) {
        console.log(`  ✓ ${func}`);
      } else {
        console.log(`  ✗ ${func} (MISSING)`);
        missingFunctions.push(func);
      }
    }

    if (missingFunctions.length === 0) {
      console.log('\n✅ All required functions exist!\n');
      return;
    }

    console.log(`\n⚠️  Found ${missingFunctions.length} missing function(s)`);
    console.log('🔧 Recreating missing functions...\n');

    // Recreate the functions from migration 001
    const functionsSQL = `
-- Database functions for access control
CREATE OR REPLACE FUNCTION user_owns_trip(p_user_id UUID, p_trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM trips WHERE id = p_trip_id AND owner_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION user_is_collaborator(p_user_id UUID, p_trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM trip_collaborators 
        WHERE trip_id = p_trip_id AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trip_is_public(p_trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM trips WHERE id = p_trip_id AND is_public = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

    await pool.query(functionsSQL);

    console.log('✅ Functions recreated successfully!\n');

    // Verify again
    console.log('🔍 Verifying recreation:\n');
    for (const func of missingFunctions) {
      const exists = await functionExists(func);
      console.log(`  ${exists ? '✓' : '✗'} ${func}`);
    }

    console.log('\n🎉 Database functions are now ready!\n');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the verification
verifyFunctions().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
