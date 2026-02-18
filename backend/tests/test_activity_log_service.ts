import pool from './src/config/database';
import { activityLogService } from './src/services/activityLogService';
import { v4 as uuidv4 } from 'uuid';

async function testActivityLogService() {
  console.log('🧪 Testing Activity Log Service\n');

  let testTripId: string;
  let testUserId: string;
  let activityId: string;

  try {
    // Setup test data
    testTripId = uuidv4();
    testUserId = uuidv4();

    console.log('📝 Setting up test data...');
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
         VALUES ($1, 'Test User', 'test@example.com', 'password_hash', NOW(), NOW())`,
        [testUserId]
      );

      await client.query(
        `INSERT INTO trips (id, title, destination, start_date, end_date, owner_id, created_at, updated_at)
         VALUES ($1, 'Test Trip', 'Tokyo', '2024-01-01', '2024-01-05', $2, NOW(), NOW())`,
        [testTripId, testUserId]
      );
    } finally {
      client.release();
    }

    // Test 1: Log Activity
    console.log('\n✅ Test 1: Log Activity');
    const activity = await activityLogService.logActivity({
      tripId: testTripId,
      userId: testUserId,
      actionType: 'place_added',
      entityType: 'place',
      entityId: uuidv4(),
      entityName: 'Tokyo Tower',
      changes: { name: 'Tokyo Tower', lat: 35.6586, lng: 139.7454 },
      metadata: { ip: '127.0.0.1', userAgent: 'test' }
    });

    activityId = activity.id;
    console.log('   Activity logged:', {
      id: activity.id,
      actionType: activity.actionType,
      entityName: activity.entityName,
      userName: activity.userName
    });

    // Test 2: Get Activity Log
    console.log('\n✅ Test 2: Get Activity Log');
    const activityLog = await activityLogService.getActivityLog(testTripId);
    console.log('   Retrieved activities:', activityLog.activities.length);
    console.log('   Total:', activityLog.total);
    console.log('   Has more:', activityLog.hasMore);

    // Test 3: Get Activity Log with Filters
    console.log('\n✅ Test 3: Get Activity Log with Filters');
    const filteredLog = await activityLogService.getActivityLog(testTripId, {
      actionType: 'place_added',
      limit: 10
    });
    console.log('   Filtered activities:', filteredLog.activities.length);

    // Test 4: Get Activity Summary
    console.log('\n✅ Test 4: Get Activity Summary');
    const summary = await activityLogService.getActivitySummary(testTripId);
    console.log('   Total activities:', summary.totalActivities);
    console.log('   By action type:', summary.byActionType);
    console.log('   By user:', summary.byUser);
    console.log('   Recent activity count:', summary.recentActivity.length);

    // Test 5: Log Multiple Activities
    console.log('\n✅ Test 5: Log Multiple Activities');
    const actionTypes = ['day_added', 'place_updated', 'trip_updated'];
    for (const actionType of actionTypes) {
      await activityLogService.logActivity({
        tripId: testTripId,
        userId: testUserId,
        actionType: actionType as any,
        entityType: 'test',
        entityId: uuidv4(),
        entityName: `Test ${actionType}`
      });
    }
    console.log('   Logged 3 more activities');

    // Test 6: Verify Total Count
    console.log('\n✅ Test 6: Verify Total Count');
    const finalLog = await activityLogService.getActivityLog(testTripId);
    console.log('   Final activity count:', finalLog.total);

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM activity_log WHERE trip_id = $1', [testTripId]);
      await client.query('DELETE FROM trips WHERE id = $1', [testTripId]);
      await client.query('DELETE FROM users WHERE id = $1', [testUserId]);
      console.log('   Cleanup complete');
    } finally {
      client.release();
    }

    await pool.end();
  }
}

// Run tests
testActivityLogService()
  .then(() => {
    console.log('\n✨ Test suite completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });
