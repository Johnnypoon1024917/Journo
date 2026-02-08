import { activityLogService, ActivityActionType, LogActivityData } from '../activityLogService';
import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

describe('ActivityLogService', () => {
  let testTripId: string;
  let testUserId: string;
  let testDayId: string;
  let testPlaceId: string;

  beforeEach(async () => {
    // Create test data
    testTripId = uuidv4();
    testUserId = uuidv4();
    testDayId = uuidv4();
    testPlaceId = uuidv4();

    const client = await pool.connect();
    try {
      // Create test user
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
         VALUES ($1, 'Test User', 'test@example.com', 'password_hash', NOW(), NOW())`,
        [testUserId]
      );

      // Create test trip
      await client.query(
        `INSERT INTO trips (id, title, destination, start_date, end_date, owner_id, created_at, updated_at)
         VALUES ($1, 'Test Trip', 'Tokyo', '2024-01-01', '2024-01-05', $2, NOW(), NOW())`,
        [testTripId, testUserId]
      );

      // Create test day
      await client.query(
        `INSERT INTO trip_days (id, trip_id, day_number, date, created_at)
         VALUES ($1, $2, 1, '2024-01-01', NOW())`,
        [testDayId, testTripId]
      );

      // Create test place
      await client.query(
        `INSERT INTO places (id, trip_day_id, name, display_order, created_at, updated_at)
         VALUES ($1, $2, 'Tokyo Tower', 1, NOW(), NOW())`,
        [testPlaceId, testDayId]
      );
    } finally {
      client.release();
    }
  });

  afterEach(async () => {
    // Clean up test data
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM activity_log WHERE trip_id = $1', [testTripId]);
      await client.query('DELETE FROM places WHERE id = $1', [testPlaceId]);
      await client.query('DELETE FROM trip_days WHERE id = $1', [testDayId]);
      await client.query('DELETE FROM trips WHERE id = $1', [testTripId]);
      await client.query('DELETE FROM users WHERE id = $1', [testUserId]);
    } finally {
      client.release();
    }
  });

  describe('logActivity', () => {
    it('should log activity successfully', async () => {
      // Arrange
      const activityData: LogActivityData = {
        tripId: testTripId,
        userId: testUserId,
        actionType: 'place_added',
        entityType: 'place',
        entityId: testPlaceId,
        entityName: 'Tokyo Tower',
        changes: { name: 'Tokyo Tower' },
        metadata: { ip: '127.0.0.1' }
      };

      // Act
      const result = await activityLogService.logActivity(activityData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.tripId).toBe(testTripId);
      expect(result.userId).toBe(testUserId);
      expect(result.userName).toBe('Test User');
      expect(result.actionType).toBe('place_added');
      expect(result.entityType).toBe('place');
      expect(result.entityId).toBe(testPlaceId);
      expect(result.entityName).toBe('Tokyo Tower');
      expect(result.changes).toEqual({ name: 'Tokyo Tower' });
      expect(result.metadata).toEqual({ ip: '127.0.0.1' });
      expect(result.createdAt).toBeDefined();

      // Verify it was saved to database
      const client = await pool.connect();
      try {
        const dbResult = await client.query(
          'SELECT * FROM activity_log WHERE id = $1',
          [result.id]
        );
        expect(dbResult.rows).toHaveLength(1);
        expect(dbResult.rows[0].action_type).toBe('place_added');
      } finally {
        client.release();
      }
    });

    it('should handle missing changes and metadata', async () => {
      // Arrange
      const activityData: LogActivityData = {
        tripId: testTripId,
        userId: testUserId,
        actionType: 'trip_updated',
        entityType: 'trip',
        entityId: testTripId,
        entityName: 'Test Trip'
      };

      // Act
      const result = await activityLogService.logActivity(activityData);

      // Assert
      expect(result.changes).toEqual({});
      expect(result.metadata).toEqual({});
    });

    it('should log different action types', async () => {
      // Test multiple action types
      const actionTypes: ActivityActionType[] = [
        'day_added',
        'place_updated',
        'packing_item_added',
        'shopping_item_deleted',
        'collaborator_added'
      ];

      for (const actionType of actionTypes) {
        const activityData: LogActivityData = {
          tripId: testTripId,
          userId: testUserId,
          actionType,
          entityType: 'test',
          entityId: uuidv4(),
          entityName: `Test ${actionType}`
        };

        const result = await activityLogService.logActivity(activityData);
        expect(result.actionType).toBe(actionType);
      }
    });
  });

  describe('getActivityLog', () => {
    beforeEach(async () => {
      // Create some test activities
      const activities = [
        {
          actionType: 'place_added' as ActivityActionType,
          entityName: 'Place 1',
          createdAt: new Date('2024-01-01T10:00:00Z')
        },
        {
          actionType: 'day_added' as ActivityActionType,
          entityName: 'Day 2',
          createdAt: new Date('2024-01-01T11:00:00Z')
        },
        {
          actionType: 'place_updated' as ActivityActionType,
          entityName: 'Place 1 Updated',
          createdAt: new Date('2024-01-01T12:00:00Z')
        }
      ];

      for (const activity of activities) {
        await activityLogService.logActivity({
          tripId: testTripId,
          userId: testUserId,
          actionType: activity.actionType,
          entityType: 'test',
          entityId: uuidv4(),
          entityName: activity.entityName
        });
      }
    });

    it('should retrieve activity log with default options', async () => {
      // Act
      const result = await activityLogService.getActivityLog(testTripId);

      // Assert
      expect(result.activities).toBeDefined();
      expect(result.activities.length).toBeGreaterThanOrEqual(3);
      expect(result.total).toBeGreaterThanOrEqual(3);
      expect(result.hasMore).toBe(false);
      
      // Verify activities are ordered by created_at DESC
      for (let i = 0; i < result.activities.length - 1; i++) {
        const current = new Date(result.activities[i].createdAt);
        const next = new Date(result.activities[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    it('should apply action type filter', async () => {
      // Act
      const result = await activityLogService.getActivityLog(testTripId, {
        actionType: 'place_added'
      });

      // Assert
      expect(result.activities.length).toBeGreaterThanOrEqual(1);
      result.activities.forEach(activity => {
        expect(activity.actionType).toBe('place_added');
      });
    });

    it('should apply user filter', async () => {
      // Act
      const result = await activityLogService.getActivityLog(testTripId, {
        userId: testUserId
      });

      // Assert
      expect(result.activities.length).toBeGreaterThanOrEqual(3);
      result.activities.forEach(activity => {
        expect(activity.userId).toBe(testUserId);
      });
    });

    it('should apply pagination', async () => {
      // Act
      const page1 = await activityLogService.getActivityLog(testTripId, {
        limit: 2,
        offset: 0
      });

      const page2 = await activityLogService.getActivityLog(testTripId, {
        limit: 2,
        offset: 2
      });

      // Assert
      expect(page1.activities.length).toBeLessThanOrEqual(2);
      expect(page1.hasMore).toBe(true);
      expect(page2.activities.length).toBeGreaterThanOrEqual(1);
      
      // Verify no overlap
      const page1Ids = page1.activities.map(a => a.id);
      const page2Ids = page2.activities.map(a => a.id);
      const overlap = page1Ids.filter(id => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it('should handle empty results', async () => {
      // Create a new trip with no activities
      const emptyTripId = uuidv4();
      const client = await pool.connect();
      try {
        await client.query(
          `INSERT INTO trips (id, title, owner_id, created_at, updated_at)
           VALUES ($1, 'Empty Trip', $2, NOW(), NOW())`,
          [emptyTripId, testUserId]
        );

        // Act
        const result = await activityLogService.getActivityLog(emptyTripId);

        // Assert
        expect(result.activities).toHaveLength(0);
        expect(result.total).toBe(0);
        expect(result.hasMore).toBe(false);

        // Cleanup
        await client.query('DELETE FROM trips WHERE id = $1', [emptyTripId]);
      } finally {
        client.release();
      }
    });
  });

  describe('getActivitySummary', () => {
    beforeEach(async () => {
      // Create diverse test activities
      const activities = [
        { actionType: 'place_added' as ActivityActionType, count: 5 },
        { actionType: 'day_added' as ActivityActionType, count: 3 },
        { actionType: 'trip_updated' as ActivityActionType, count: 2 }
      ];

      for (const { actionType, count } of activities) {
        for (let i = 0; i < count; i++) {
          await activityLogService.logActivity({
            tripId: testTripId,
            userId: testUserId,
            actionType,
            entityType: 'test',
            entityId: uuidv4(),
            entityName: `Test ${actionType} ${i}`
          });
        }
      }
    });

    it('should retrieve activity summary successfully', async () => {
      // Act
      const result = await activityLogService.getActivitySummary(testTripId);

      // Assert
      expect(result.totalActivities).toBeGreaterThanOrEqual(10);
      expect(result.byActionType).toBeDefined();
      expect(result.byActionType['place_added']).toBeGreaterThanOrEqual(5);
      expect(result.byActionType['day_added']).toBeGreaterThanOrEqual(3);
      expect(result.byActionType['trip_updated']).toBeGreaterThanOrEqual(2);
      expect(result.byUser).toBeDefined();
      expect(result.byUser[testUserId]).toBeGreaterThanOrEqual(10);
      expect(result.recentActivity).toBeDefined();
      expect(result.recentActivity.length).toBeLessThanOrEqual(10);
    });

    it('should handle empty activity log', async () => {
      // Create a new trip with no activities
      const emptyTripId = uuidv4();
      const client = await pool.connect();
      try {
        await client.query(
          `INSERT INTO trips (id, title, owner_id, created_at, updated_at)
           VALUES ($1, 'Empty Trip', $2, NOW(), NOW())`,
          [emptyTripId, testUserId]
        );

        // Act
        const result = await activityLogService.getActivitySummary(emptyTripId);

        // Assert
        expect(result.totalActivities).toBe(0);
        expect(result.byActionType).toEqual({});
        expect(result.byUser).toEqual({});
        expect(result.recentActivity).toEqual([]);

        // Cleanup
        await client.query('DELETE FROM trips WHERE id = $1', [emptyTripId]);
      } finally {
        client.release();
      }
    });
  });
});
