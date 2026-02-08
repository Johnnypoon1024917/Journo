#!/usr/bin/env node

import dotenv from 'dotenv';

dotenv.config();

console.log('📊 Database Configuration:\n');
console.log('DATABASE_URL from .env:');
console.log(process.env.DATABASE_URL);
console.log('\n');

// Parse the URL to show details
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('Parsed details:');
    console.log(`  Host: ${url.hostname}`);
    console.log(`  Port: ${url.port || '5432'}`);
    console.log(`  Database: ${url.pathname.substring(1)}`);
    console.log(`  User: ${url.username}`);
  } catch (e) {
    console.log('Could not parse DATABASE_URL');
  }
}
