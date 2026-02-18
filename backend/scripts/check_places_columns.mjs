#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkColumns() {
  try {
    // First check if places table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'places'
      );
    `);
    
    console.log(`Places table exists: ${tableCheck.rows[0].exists}`);
    
    if (!tableCheck.rows[0].exists) {
      console.log('\nListing all tables:');
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      tables.rows.forEach(t => console.log(`  - ${t.table_name}`));
      return;
    }
    
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'places'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Places table columns:');
    result.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });
    
    // Get a sample row
    const sample = await pool.query('SELECT * FROM places LIMIT 1');
    if (sample.rows.length > 0) {
      console.log('\n📄 Sample place columns:');
      console.log(Object.keys(sample.rows[0]).join(', '));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkColumns();
