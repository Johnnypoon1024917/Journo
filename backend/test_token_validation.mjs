#!/usr/bin/env node

/**
 * Test if a token can be validated
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Paste your access token here
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ2ZDYyZmRjLTdiMWMtNGUyMC04M2Y5LWRiNzMyM2ZiYmI0Niwicm9sZSI6InVzZXIiLCJpYXQiOjE3Mzg5NTI0NjcsImV4cCI6MTczODk1MzM2N30.cBcnMvhGmbeo1MZJYFJE9KswQY4X_0KZRsZZof2ac-E';

console.log('🧪 Testing token validation...\n');
console.log('JWT_SECRET:', JWT_SECRET ? 'Present' : 'Missing');
console.log('Token:', ACCESS_TOKEN.substring(0, 50) + '...\n');

try {
  const decoded = jwt.verify(ACCESS_TOKEN, JWT_SECRET);
  console.log('✅ Token is VALID');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.log('❌ Token is INVALID');
  console.log('Error:', error.message);
  
  if (error.name === 'TokenExpiredError') {
    console.log('Token expired at:', error.expiredAt);
  }
}
