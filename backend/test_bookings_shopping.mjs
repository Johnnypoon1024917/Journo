#!/usr/bin/env node

/**
 * Test script for bookings and shopping endpoints
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testBookingsTable() {
  console.log('\n📋 Testing bookings table...');
  
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Bookings table does not exist');
      return false;
    }
    
    console.log('✅ Bookings table exists with columns:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error checking bookings table:', error.message);
    return false;
  }
}

async function testShoppingTable() {
  console.log('\n🛒 Testing shopping_items table...');
  
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'shopping_items'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Shopping_items table does not exist');
      return false;
    }
    
    console.log('✅ Shopping_items table exists with columns:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error checking shopping_items table:', error.message);
    return false;
  }
}

async function testBookingsCount() {
  console.log('\n📊 Checking bookings count...');
  
  try {
    const result = await pool.query('SELECT COUNT(*) FROM bookings');
    console.log(`✅ Found ${result.rows[0].count} bookings in database`);
    return true;
  } catch (error) {
    console.error('❌ Error counting bookings:', error.message);
    return false;
  }
}

async function testShoppingCount() {
  console.log('\n📊 Checking shopping items count...');
  
  try {
    const result = await pool.query('SELECT COUNT(*) FROM shopping_items');
    console.log(`✅ Found ${result.rows[0].count} shopping items in database`);
    return true;
  } catch (error) {
    console.error('❌ Error counting shopping items:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Bookings and Shopping Tables\n');
  console.log('Database:', process.env.DATABASE_URL?.split('@')[1] || 'Unknown');
  
  const bookingsTableOk = await testBookingsTable();
  const shoppingTableOk = await testShoppingTable();
  
  if (bookingsTableOk) {
    await testBookingsCount();
  }
  
  if (shoppingTableOk) {
    await testShoppingCount();
  }
  
  console.log('\n✅ All tests complete!');
  
  await pool.end();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
