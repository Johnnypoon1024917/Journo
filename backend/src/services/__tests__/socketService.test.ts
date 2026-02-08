import { Server } from 'socket.io';
import { socketService } from '../socketService';
import { AuthenticatedSocket } from '../../middleware/socketAuth';
import { pool } from '../../config/database';
import { randomUUID } from 'crypto';

describe('SocketService - Presence Enhancement', () => {
  let mockIO: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<AuthenticatedSocket>;
  let mockRoom: Map<string, Set<string>>;
  let testTripId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test data in database
    testTripId = randomUUID();
    testUserId = randomUUID();

    const client = await pool.connect();
    try {
      // Clean up any existing test data first
      await client.query('DELETE FROM trip_collaborators WHERE user_id = $1', [testUserId]);
      await client.query('DELETE FROM trips WHERE id = $1', [testTripId]);
      await client.query('DELETE FROM users WHERE email = $1', ['test-socket@example.com']);
      
      // Create test user
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
         VALUES ($1, 'Test User', 'test-socket@example.com', 'password_hash', NOW(), NOW())`,
        [testUserId]
      );

      // Create test trip
      await client.query(
        `INSERT INTO trips (id, title, destination, start_date, end_date, owner_id, created_at, updated_at)
         VALUES ($1, 'Test Trip', 'Tokyo', '2024-01-01', '2024-01-05', $2, NOW(), NOW())`,
        [testTripId, testUserId]
      );

      // Create test collaborator
      await client.query(
        `INSERT INTO trip_collaborators (trip_id, user_id, role, created_at, updated_at)
         VALUES ($1, $2, 'owner', NOW(), NOW())`,
        [testTripId, testUserId]
      );
    } finally {
      client.release();
    }
  });

  afterAll(async () => {
    // Clean up test data
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM trip_collaborators WHERE trip_id = $1', [testTripId]);
      await client.query('DELETE FROM trips WHERE id = $1', [testTripId]);
      await client.query('DELETE FROM users WHERE id = $1', [testUserId]);
    } finally {
      client.release();
    }
    
    await pool.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock Socket.IO server
    mockRoom = new Map();
    mockIO = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: {
        adapter: {
          rooms: mockRoom,
        },
        sockets: new Map(),
      },
    } as any;

    // Mock authenticated socket
    mockSocket = {
      id: 'socket-123',
      userId: testUserId,
      userEmail: 'test-socket@example.com',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
    } as any;

    // Initialize socket service
    socketService.initialize(mockIO);
  });

  afterEach(() => {
    jest.useRealTimers();
    socketService.stopCleanupInterval();
  });

  describe('updatePresence', () => {
    it('should update presence with editing entity', async () => {
      const editingEntityId = randomUUID();
      const data = {
        tripId: testTripId,
        editingEntity: 'day',
        editingEntityId,
      };

      socketService.updatePresence(mockSocket, data);

      // Wait for async database update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify database was updated
      const result = await pool.query(
        'SELECT is_online, current_editing_entity, current_editing_entity_id FROM trip_collaborators WHERE user_id = $1 AND trip_id = $2',
        [testUserId, testTripId]
      );

      expect(result.rows[0].is_online).toBe(true);
      expect(result.rows[0].current_editing_entity).toBe('day');
      expect(result.rows[0].current_editing_entity_id).toBe(editingEntityId);
    });

    it('should update presence without editing entity', async () => {
      const data = {
        tripId: testTripId,
      };

      socketService.updatePresence(mockSocket, data);

      // Wait for async database update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify database was updated
      const result = await pool.query(
        'SELECT is_online, current_editing_entity, current_editing_entity_id FROM trip_collaborators WHERE user_id = $1 AND trip_id = $2',
        [testUserId, testTripId]
      );

      expect(result.rows[0].is_online).toBe(true);
      expect(result.rows[0].current_editing_entity).toBeNull();
      expect(result.rows[0].current_editing_entity_id).toBeNull();
    });

    it('should not update presence if socket has no userId', async () => {
      const socketWithoutUser = {
        ...mockSocket,
        userId: undefined,
      } as any;

      const data = {
        tripId: testTripId,
        editingEntity: 'day',
      };

      socketService.updatePresence(socketWithoutUser, data);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify database was NOT updated (should still be null from initial state)
      const result = await pool.query(
        'SELECT current_editing_entity FROM trip_collaborators WHERE user_id = $1 AND trip_id = $2',
        [testUserId, testTripId]
      );

      // Should not have been updated
      expect(result.rows[0].current_editing_entity).toBeNull();
    });
  });

  describe('updateDatabasePresence', () => {
    it('should update trip_collaborators with presence data', async () => {
      const editingEntityId = randomUUID();
      const presence = {
        userId: testUserId,
        socketId: 'socket-123',
        tripId: testTripId,
        isOnline: true,
        editingEntity: 'packing',
        editingEntityId,
        lastUpdate: new Date(),
      };

      await socketService.updateDatabasePresence(testUserId, testTripId, presence);

      // Verify database was updated
      const result = await pool.query(
        'SELECT is_online, current_editing_entity, current_editing_entity_id FROM trip_collaborators WHERE user_id = $1 AND trip_id = $2',
        [testUserId, testTripId]
      );

      expect(result.rows[0].is_online).toBe(true);
      expect(result.rows[0].current_editing_entity).toBe('packing');
      expect(result.rows[0].current_editing_entity_id).toBe(editingEntityId);
    });

    it('should update with offline status', async () => {
      const presence = {
        userId: testUserId,
        socketId: 'socket-123',
        tripId: testTripId,
        isOnline: false,
        editingEntity: undefined,
        editingEntityId: undefined,
        lastUpdate: new Date(),
      };

      await socketService.updateDatabasePresence(testUserId, testTripId, presence);

      // Verify database was updated
      const result = await pool.query(
        'SELECT is_online, current_editing_entity, current_editing_entity_id FROM trip_collaborators WHERE user_id = $1 AND trip_id = $2',
        [testUserId, testTripId]
      );

      expect(result.rows[0].is_online).toBe(false);
      expect(result.rows[0].current_editing_entity).toBeNull();
      expect(result.rows[0].current_editing_entity_id).toBeNull();
    });
  });

  describe('cleanupStalePresence', () => {
    it('should remove stale presence after 1 minute', async () => {
      // Add presence
      socketService.updatePresence(mockSocket, {
        tripId: testTripId,
        editingEntity: 'day',
      });

      // Wait for initial update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Advance time by 61 seconds (past stale threshold)
      jest.advanceTimersByTime(61000);

      // Run cleanup
      socketService.cleanupStalePresence();

      // Wait for async database update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify database was updated to mark as offline
      const result = await pool.query(
        'SELECT is_online FROM trip_collaborators WHERE user_id = $1 AND trip_id = $2',
        [testUserId, testTripId]
      );

      expect(result.rows[0].is_online).toBe(false);
    });

    it('should not remove fresh presence', async () => {
      // Add presence
      socketService.updatePresence(mockSocket, {
        tripId: testTripId,
        editingEntity: 'day',
      });

      // Wait for initial update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Advance time by only 30 seconds (within threshold)
      jest.advanceTimersByTime(30000);

      // Run cleanup
      socketService.cleanupStalePresence();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify still online
      const result = await pool.query(
        'SELECT is_online FROM trip_collaborators WHERE user_id = $1 AND trip_id = $2',
        [testUserId, testTripId]
      );

      expect(result.rows[0].is_online).toBe(true);
    });
  });

  describe('cleanup interval', () => {
    it('should start cleanup interval on initialization', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      // Re-initialize to test interval creation
      socketService.initialize(mockIO);

      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        30000 // 30 seconds
      );
    });

    it('should run cleanup every 30 seconds', async () => {
      const cleanupSpy = jest.spyOn(socketService, 'cleanupStalePresence');

      // Advance time by 30 seconds
      jest.advanceTimersByTime(30000);
      expect(cleanupSpy).toHaveBeenCalledTimes(1);

      // Advance another 30 seconds
      jest.advanceTimersByTime(30000);
      expect(cleanupSpy).toHaveBeenCalledTimes(2);

      // Advance another 30 seconds
      jest.advanceTimersByTime(30000);
      expect(cleanupSpy).toHaveBeenCalledTimes(3);
    });

    it('should stop cleanup interval when requested', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      socketService.stopCleanupInterval();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should clean up presence on disconnect', async () => {
      // Setup: join room and set presence
      socketService.joinTripRoom(mockSocket, testTripId);
      socketService.updatePresence(mockSocket, {
        tripId: testTripId,
        editingEntity: 'day',
      });

      // Wait for initial update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Disconnect
      socketService.handleDisconnect(mockSocket);

      // Wait for async database update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify presence was marked as offline
      const result = await pool.query(
        'SELECT is_online, current_editing_entity FROM trip_collaborators WHERE user_id = $1 AND trip_id = $2',
        [testUserId, testTripId]
      );

      expect(result.rows[0].is_online).toBe(false);
      expect(result.rows[0].current_editing_entity).toBeNull();
    });

    it('should handle disconnect without presence', () => {
      // Setup: only join room, no presence
      socketService.joinTripRoom(mockSocket, testTripId);

      // Should not throw error
      expect(() => {
        socketService.handleDisconnect(mockSocket);
      }).not.toThrow();
    });

    it('should handle disconnect without userId', () => {
      const socketWithoutUser = {
        ...mockSocket,
        userId: undefined,
      } as any;

      // Should not throw error
      expect(() => {
        socketService.handleDisconnect(socketWithoutUser);
      }).not.toThrow();
    });
  });

  describe('emitPresenceUpdate', () => {
    it('should emit presence update to trip room', () => {
      socketService.emitPresenceUpdate(testTripId);

      expect(mockIO.to).toHaveBeenCalledWith(`trip:${testTripId}`);
      expect(mockIO.emit).toHaveBeenCalledWith(
        'presence:update',
        expect.objectContaining({
          tripId: testTripId,
          viewerCount: expect.any(Number),
          viewers: expect.any(Array),
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete user editing flow', async () => {
      const dayId = randomUUID();
      const placeId = randomUUID();
      
      // User joins trip
      socketService.joinTripRoom(mockSocket, testTripId);
      
      // User starts editing a day
      socketService.updatePresence(mockSocket, {
        tripId: testTripId,
        editingEntity: 'day',
        editingEntityId: dayId,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      let result = await pool.query(
        'SELECT current_editing_entity, current_editing_entity_id FROM trip_collaborators WHERE user_id = $1 AND trip_id = $2',
        [testUserId, testTripId]
      );

      expect(result.rows[0].current_editing_entity).toBe('day');
      expect(result.rows[0].current_editing_entity_id).toBe(dayId);

      // User switches to editing a place
      socketService.updatePresence(mockSocket, {
        tripId: testTripId,
        editingEntity: 'place',
        editingEntityId: placeId,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      result = await pool.query(
        'SELECT current_editing_entity, current_editing_entity_id FROM trip_collaborators WHERE user_id = $1 AND trip_id = $2',
        [testUserId, testTripId]
      );

      expect(result.rows[0].current_editing_entity).toBe('place');
      expect(result.rows[0].current_editing_entity_id).toBe(placeId);

      // User stops editing
      socketService.updatePresence(mockSocket, {
        tripId: testTripId,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      result = await pool.query(
        'SELECT current_editing_entity, current_editing_entity_id FROM trip_collaborators WHERE user_id = $1 AND trip_id = $2',
        [testUserId, testTripId]
      );

      expect(result.rows[0].current_editing_entity).toBeNull();
      expect(result.rows[0].current_editing_entity_id).toBeNull();

      // User disconnects
      socketService.handleDisconnect(mockSocket);

      await new Promise(resolve => setTimeout(resolve, 100));

      result = await pool.query(
        'SELECT is_online FROM trip_collaborators WHERE user_id = $1 AND trip_id = $2',
        [testUserId, testTripId]
      );

      expect(result.rows[0].is_online).toBe(false);
    });
  });
});

describe('SocketService - Activity and Notification Events', () => {
  let mockIO: jest.Mocked<Server>;
  let testTripId: string;
  let testUserId: string;

  beforeAll(async () => {
    testTripId = randomUUID();
    testUserId = randomUUID();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Socket.IO server
    mockIO = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: {
        sockets: new Map(),
      },
    } as any;

    // Initialize socket service
    socketService.initialize(mockIO);
  });

  describe('emitActivityLog', () => {
    it('should emit activity:new event to trip room', () => {
      const activity = {
        id: randomUUID(),
        tripId: testTripId,
        userId: testUserId,
        userName: 'Test User',
        actionType: 'place_added',
        entityType: 'place',
        entityId: randomUUID(),
        entityName: 'Tokyo Tower',
        changes: {},
        metadata: {},
        createdAt: new Date().toISOString(),
      };

      socketService.emitActivityLog(testTripId, activity);

      expect(mockIO.to).toHaveBeenCalledWith(`trip:${testTripId}`);
      expect(mockIO.emit).toHaveBeenCalledWith(
        'activity:new',
        expect.objectContaining({
          tripId: testTripId,
          activity,
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('emitNotification', () => {
    it('should emit notification:new event to user sockets', () => {
      const notification = {
        id: randomUUID(),
        userId: testUserId,
        type: 'collaboration_invite',
        category: 'collaboration',
        priority: 'high',
        title: 'Trip collaboration invite',
        message: 'You have been invited to collaborate',
        data: {},
        isRead: false,
        createdAt: new Date(),
      };

      // Mock user socket
      const mockUserSocket = {
        id: 'socket-123',
        userId: testUserId,
        emit: jest.fn(),
      } as any;

      mockIO.sockets.sockets.set('socket-123', mockUserSocket);

      socketService.emitNotification(testUserId, notification);

      expect(mockUserSocket.emit).toHaveBeenCalledWith(
        'notification:new',
        expect.objectContaining({
          notification,
          timestamp: expect.any(String),
        })
      );
    });

    it('should emit to multiple sockets for the same user', () => {
      const notification = {
        id: randomUUID(),
        userId: testUserId,
        type: 'activity_update',
        category: 'activity',
        priority: 'normal',
        title: 'Activity Update',
        message: 'New activity on your trip',
        data: {},
        isRead: false,
        createdAt: new Date(),
      };

      // Mock multiple user sockets (e.g., user on phone and desktop)
      const mockSocket1 = {
        id: 'socket-123',
        userId: testUserId,
        emit: jest.fn(),
      } as any;

      const mockSocket2 = {
        id: 'socket-456',
        userId: testUserId,
        emit: jest.fn(),
      } as any;

      mockIO.sockets.sockets.set('socket-123', mockSocket1);
      mockIO.sockets.sockets.set('socket-456', mockSocket2);

      socketService.emitNotification(testUserId, notification);

      expect(mockSocket1.emit).toHaveBeenCalledWith(
        'notification:new',
        expect.objectContaining({
          notification,
          timestamp: expect.any(String),
        })
      );

      expect(mockSocket2.emit).toHaveBeenCalledWith(
        'notification:new',
        expect.objectContaining({
          notification,
          timestamp: expect.any(String),
        })
      );
    });

    it('should not emit if user has no connected sockets', () => {
      const notification = {
        id: randomUUID(),
        userId: testUserId,
        type: 'activity_update',
        category: 'activity',
        priority: 'normal',
        title: 'Activity Update',
        message: 'New activity on your trip',
        data: {},
        isRead: false,
        createdAt: new Date(),
      };

      // No sockets for this user
      socketService.emitNotification(testUserId, notification);

      // Should not throw error, just log
      expect(mockIO.emit).not.toHaveBeenCalled();
    });
  });

  describe('emitCollaboratorJoined', () => {
    it('should emit collaborator:joined event to trip room', () => {
      const collaborator = {
        id: randomUUID(),
        trip_id: testTripId,
        user_id: testUserId,
        role: 'editor',
        user: {
          id: testUserId,
          name: 'New Collaborator',
          email: 'new@example.com',
        },
      };

      socketService.emitCollaboratorJoined(testTripId, collaborator);

      expect(mockIO.to).toHaveBeenCalledWith(`trip:${testTripId}`);
      expect(mockIO.emit).toHaveBeenCalledWith(
        'collaborator:joined',
        expect.objectContaining({
          tripId: testTripId,
          collaborator,
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('emitCollaboratorLeft', () => {
    it('should emit collaborator:left event to trip room', () => {
      const userName = 'Leaving User';

      socketService.emitCollaboratorLeft(testTripId, testUserId, userName);

      expect(mockIO.to).toHaveBeenCalledWith(`trip:${testTripId}`);
      expect(mockIO.emit).toHaveBeenCalledWith(
        'collaborator:left',
        expect.objectContaining({
          tripId: testTripId,
          userId: testUserId,
          userName,
          timestamp: expect.any(String),
        })
      );
    });

    it('should emit without userName if not provided', () => {
      socketService.emitCollaboratorLeft(testTripId, testUserId);

      expect(mockIO.to).toHaveBeenCalledWith(`trip:${testTripId}`);
      expect(mockIO.emit).toHaveBeenCalledWith(
        'collaborator:left',
        expect.objectContaining({
          tripId: testTripId,
          userId: testUserId,
          userName: undefined,
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('emitCollaboratorRoleChanged', () => {
    it('should emit collaborator:role_changed event to trip room', () => {
      const userName = 'Test User';
      const newRole = 'viewer';

      socketService.emitCollaboratorRoleChanged(testTripId, testUserId, newRole, userName);

      expect(mockIO.to).toHaveBeenCalledWith(`trip:${testTripId}`);
      expect(mockIO.emit).toHaveBeenCalledWith(
        'collaborator:role_changed',
        expect.objectContaining({
          tripId: testTripId,
          userId: testUserId,
          newRole,
          userName,
          timestamp: expect.any(String),
        })
      );
    });

    it('should emit without userName if not provided', () => {
      const newRole = 'editor';

      socketService.emitCollaboratorRoleChanged(testTripId, testUserId, newRole);

      expect(mockIO.to).toHaveBeenCalledWith(`trip:${testTripId}`);
      expect(mockIO.emit).toHaveBeenCalledWith(
        'collaborator:role_changed',
        expect.objectContaining({
          tripId: testTripId,
          userId: testUserId,
          newRole,
          userName: undefined,
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('event data structure validation', () => {
    it('should include proper timestamp format in all events', () => {
      const activity = {
        id: randomUUID(),
        tripId: testTripId,
        userId: testUserId,
        userName: 'Test User',
        actionType: 'place_added',
        entityType: 'place',
        entityId: randomUUID(),
        entityName: 'Tokyo Tower',
        changes: {},
        metadata: {},
        createdAt: new Date().toISOString(),
      };

      socketService.emitActivityLog(testTripId, activity);

      const emitCall = (mockIO.emit as jest.Mock).mock.calls[0];
      const eventData = emitCall[1];
      
      expect(eventData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include tripId in all trip-related events', () => {
      const collaborator = {
        id: randomUUID(),
        trip_id: testTripId,
        user_id: testUserId,
        role: 'editor',
        user: {
          id: testUserId,
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      socketService.emitCollaboratorJoined(testTripId, collaborator);

      const emitCall = (mockIO.emit as jest.Mock).mock.calls[0];
      const eventData = emitCall[1];
      
      expect(eventData.tripId).toBe(testTripId);
    });
  });
});
