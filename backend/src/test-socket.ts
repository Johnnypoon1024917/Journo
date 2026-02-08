/**
 * Simple Socket.IO connection test
 * Run this file to verify Socket.IO is working correctly
 * 
 * Usage: tsx src/test-socket.ts
 */

import { io } from 'socket.io-client';

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:5000';
const TEST_TRIP_ID = 'test-trip-123';

console.log('🧪 Socket.IO Connection Test');
console.log('================================');
console.log(`Connecting to: ${SOCKET_URL}`);
console.log('');

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server');
  console.log(`   Socket ID: ${socket.id}`);
  console.log('');

  // Test joining a trip room
  console.log(`📍 Joining trip room: ${TEST_TRIP_ID}`);
  socket.emit('trip:join', TEST_TRIP_ID);
});

socket.on('trip:joined', (data) => {
  console.log('✅ Successfully joined trip room');
  console.log('   Response:', JSON.stringify(data, null, 2));
  console.log('');

  // Test leaving the trip room
  console.log(`📍 Leaving trip room: ${TEST_TRIP_ID}`);
  socket.emit('trip:leave', TEST_TRIP_ID);
});

socket.on('trip:left', (data) => {
  console.log('✅ Successfully left trip room');
  console.log('   Response:', JSON.stringify(data, null, 2));
  console.log('');

  // Disconnect after test
  console.log('🔌 Disconnecting...');
  socket.disconnect();
});

socket.on('disconnect', (reason) => {
  console.log('✅ Disconnected from server');
  console.log(`   Reason: ${reason}`);
  console.log('');
  console.log('================================');
  console.log('✅ All tests passed!');
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.log('');
  console.log('Make sure the backend server is running on', SOCKET_URL);
  process.exit(1);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Test timeout - server not responding');
  process.exit(1);
}, 10000);
