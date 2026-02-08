#!/usr/bin/env node

/**
 * Decode JWT token without verification to see payload
 */

// Paste your access token here
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ2ZDYyZmRjLTdiMWMtNGUyMC04M2Y5LWRiNzMyM2ZiYmI0Niwicm9sZSI6InVzZXIiLCJpYXQiOjE3Mzg5NTI0NjcsImV4cCI6MTczODk1MzM2N30.cBcnMvhGmbeo1MZJYFJE9KswQY4X_0KZRsZZof2ac-E';

console.log('🔍 Decoding token...\n');

const parts = ACCESS_TOKEN.split('.');
if (parts.length !== 3) {
  console.log('❌ Invalid token format');
  process.exit(1);
}

const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
const payload = Buffer.from(parts[1], 'base64').toString();

console.log('Header:', header);
console.log('\nPayload (raw):', payload);

try {
  const payloadObj = JSON.parse(payload);
  console.log('\nPayload (parsed):', payloadObj);
  console.log('\nuserId type:', typeof payloadObj.userId);
  console.log('userId value:', payloadObj.userId);
} catch (e) {
  console.log('\n❌ Failed to parse payload:', e.message);
}
