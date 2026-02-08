import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { socketService } from '../socketService';
import { io, Socket } from 'socket.io-client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

describe('SocketService', () => {
  let mockSocket: Partial<Socket>;
  let eventHandlers: Record<string, Function>;

  beforeEach(() => {
    // Reset event handlers
    eventHandlers = {};

    // Create mock socket
    mockSocket = {
      id: 'test-socket-id',
      connected: true,
      on: vi.fn((event: string, handler: Function) => {
        eventHandlers[event] = handler;
      }),
      emit: vi.fn(),
      disconnect: vi.fn(),
      connect: vi.fn(),
    };

    // Mock io to return our mock socket
    (io as any).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.clearAllMocks();
    socketService.disconnect();
  });

  describe('Connection', () => {
    it('should connect to socket server with token', () => {
      const token = 'test-token';
      socketService.connect(token);

      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: { token },
          reconnection: true,
        })
      );
    });

    it('should not reconnect if already connected', () => {
      socketService.connect('token1');
      const firstCallCount = (io as any).mock.calls.length;

      socketService.connect('token2');
      const secondCallCount = (io as any).mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount);
    });

    it('should setup event listeners on connect', () => {
      socketService.connect('test-token');

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });

    it('should return connection state', () => {
      socketService.connect('test-token');
      
      // Trigger connect event
      eventHandlers['connect']();
      
      expect(socketService.getConnectionState()).toBe('connected');
    });

    it('should return socket ID', () => {
      socketService.connect('test-token');
      expect(socketService.getSocketId()).toBe('test-socket-id');
    });

    it('should check if connected', () => {
      socketService.connect('test-token');
      expect(socketService.isConnected()).toBe(true);
    });
  });

  describe('Trip Room Management', () => {
    beforeEach(() => {
      socketService.connect('test-token');
    });

    it('should join trip room', () => {
      const tripId = 'trip-123';
      socketService.joinTrip(tripId);

      expect(mockSocket.emit).toHaveBeenCalledWith('trip:join', tripId);
    });

    it('should leave trip room', () => {
      const tripId = 'trip-123';
      socketService.leaveTrip(tripId);

      expect(mockSocket.emit).toHaveBeenCalledWith('trip:leave', tripId);
    });

    it('should not join trip if not connected', () => {
      mockSocket.connected = false;
      const tripId = 'trip-123';
      
      socketService.joinTrip(tripId);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should rejoin trip room on reconnect', () => {
      const tripId = 'trip-123';
      socketService.joinTrip(tripId);

      // Clear previous calls
      vi.clearAllMocks();

      // Trigger reconnect
      eventHandlers['connect']();

      expect(mockSocket.emit).toHaveBeenCalledWith('trip:join', tripId);
    });
  });

  describe('Event Handlers', () => {
    beforeEach(() => {
      socketService.connect('test-token');
    });

    it('should register custom event handlers', () => {
      const onTripUpdated = vi.fn();
      const onActivityNew = vi.fn();

      socketService.on({
        onTripUpdated,
        onActivityNew,
      });

      // Trigger events
      const tripData = { tripId: 'trip-123', data: {} };
      eventHandlers['trip:updated'](tripData);
      expect(onTripUpdated).toHaveBeenCalledWith(tripData);

      const activityData = { tripId: 'trip-123', activity: {} };
      eventHandlers['activity:new'](activityData);
      expect(onActivityNew).toHaveBeenCalledWith(activityData);
    });

    it('should remove event handlers', () => {
      const onTripUpdated = vi.fn();
      socketService.on({ onTripUpdated });

      socketService.off(['onTripUpdated']);

      // Trigger event
      eventHandlers['trip:updated']({ tripId: 'trip-123' });
      expect(onTripUpdated).not.toHaveBeenCalled();
    });

    it('should remove all event handlers', () => {
      const onTripUpdated = vi.fn();
      const onActivityNew = vi.fn();
      
      socketService.on({ onTripUpdated, onActivityNew });
      socketService.off();

      // Trigger events
      eventHandlers['trip:updated']({ tripId: 'trip-123' });
      eventHandlers['activity:new']({ tripId: 'trip-123' });
      
      expect(onTripUpdated).not.toHaveBeenCalled();
      expect(onActivityNew).not.toHaveBeenCalled();
    });
  });

  describe('Activity Events', () => {
    beforeEach(() => {
      socketService.connect('test-token');
    });

    it('should handle activity:new event', () => {
      const onActivityNew = vi.fn();
      socketService.on({ onActivityNew });

      const activityData = {
        tripId: 'trip-123',
        activity: {
          id: 'activity-1',
          userId: 'user-1',
          userName: 'John Doe',
          actionType: 'place_added',
          entityName: 'Tokyo Tower',
        },
        timestamp: new Date().toISOString(),
      };

      eventHandlers['activity:new'](activityData);
      expect(onActivityNew).toHaveBeenCalledWith(activityData);
    });
  });

  describe('Notification Events', () => {
    beforeEach(() => {
      socketService.connect('test-token');
    });

    it('should handle notification:new event', () => {
      const onNotificationNew = vi.fn();
      socketService.on({ onNotificationNew });

      const notificationData = {
        notification: {
          id: 'notif-1',
          userId: 'user-1',
          title: 'New Activity',
          message: 'John added a place',
          category: 'activity',
          priority: 'normal',
        },
        timestamp: new Date().toISOString(),
      };

      eventHandlers['notification:new'](notificationData);
      expect(onNotificationNew).toHaveBeenCalledWith(notificationData);
    });
  });

  describe('Collaborator Events', () => {
    beforeEach(() => {
      socketService.connect('test-token');
    });

    it('should handle collaborator:joined event', () => {
      const onCollaboratorJoined = vi.fn();
      socketService.on({ onCollaboratorJoined });

      const collaboratorData = {
        tripId: 'trip-123',
        collaborator: {
          id: 'collab-1',
          user_id: 'user-2',
          role: 'editor',
          user: {
            id: 'user-2',
            name: 'Jane Doe',
            email: 'jane@example.com',
          },
        },
        timestamp: new Date().toISOString(),
      };

      eventHandlers['collaborator:joined'](collaboratorData);
      expect(onCollaboratorJoined).toHaveBeenCalledWith(collaboratorData);
    });

    it('should handle collaborator:left event', () => {
      const onCollaboratorLeft = vi.fn();
      socketService.on({ onCollaboratorLeft });

      const leftData = {
        tripId: 'trip-123',
        userId: 'user-2',
        userName: 'Jane Doe',
        timestamp: new Date().toISOString(),
      };

      eventHandlers['collaborator:left'](leftData);
      expect(onCollaboratorLeft).toHaveBeenCalledWith(leftData);
    });

    it('should handle collaborator:role_changed event', () => {
      const onCollaboratorRoleChanged = vi.fn();
      socketService.on({ onCollaboratorRoleChanged });

      const roleChangeData = {
        tripId: 'trip-123',
        userId: 'user-2',
        newRole: 'viewer',
        userName: 'Jane Doe',
        timestamp: new Date().toISOString(),
      };

      eventHandlers['collaborator:role_changed'](roleChangeData);
      expect(onCollaboratorRoleChanged).toHaveBeenCalledWith(roleChangeData);
    });
  });

  describe('Presence Events', () => {
    beforeEach(() => {
      socketService.connect('test-token');
    });

    it('should handle presence:update event', () => {
      const onPresenceUpdate = vi.fn();
      socketService.on({ onPresenceUpdate });

      const presenceData = {
        tripId: 'trip-123',
        userId: 'user-1',
        isOnline: true,
        editingEntity: 'day',
        editingEntityId: 'day-1',
        timestamp: new Date().toISOString(),
      };

      eventHandlers['presence:update'](presenceData);
      expect(onPresenceUpdate).toHaveBeenCalledWith(presenceData);
    });

    it('should emit presence update', () => {
      const tripId = 'trip-123';
      const editingEntity = 'place';
      const editingEntityId = 'place-456';

      socketService.emitPresenceUpdate(tripId, editingEntity, editingEntityId);

      expect(mockSocket.emit).toHaveBeenCalledWith('presence:update', {
        tripId,
        editingEntity,
        editingEntityId,
      });
    });

    it('should emit presence update without editing info', () => {
      const tripId = 'trip-123';

      socketService.emitPresenceUpdate(tripId);

      expect(mockSocket.emit).toHaveBeenCalledWith('presence:update', {
        tripId,
        editingEntity: undefined,
        editingEntityId: undefined,
      });
    });

    it('should not emit presence update if not connected', () => {
      mockSocket.connected = false;
      
      socketService.emitPresenceUpdate('trip-123', 'day', 'day-1');

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('Editing Events', () => {
    beforeEach(() => {
      socketService.connect('test-token');
    });

    it('should emit editing start', () => {
      const tripId = 'trip-123';
      const itemId = 'item-456';
      const itemType = 'place';

      socketService.emitEditingStart(tripId, itemId, itemType);

      expect(mockSocket.emit).toHaveBeenCalledWith('item:editing:start', {
        tripId,
        itemId,
        itemType,
      });
    });

    it('should emit editing stop', () => {
      const tripId = 'trip-123';
      const itemId = 'item-456';

      socketService.emitEditingStop(tripId, itemId);

      expect(mockSocket.emit).toHaveBeenCalledWith('item:editing:stop', {
        tripId,
        itemId,
      });
    });

    it('should not emit editing events if not connected', () => {
      mockSocket.connected = false;

      socketService.emitEditingStart('trip-123', 'item-456', 'place');
      socketService.emitEditingStop('trip-123', 'item-456');

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('Reconnection', () => {
    beforeEach(() => {
      socketService.connect('test-token');
    });

    it('should handle disconnect event', () => {
      const onDisconnect = vi.fn();
      socketService.on({ onDisconnect });

      eventHandlers['disconnect']('transport close');

      expect(onDisconnect).toHaveBeenCalled();
      expect(socketService.getConnectionState()).toBe('disconnected');
    });

    it('should handle connect_error event', () => {
      const error = new Error('Connection failed');
      
      eventHandlers['connect_error'](error);

      expect(socketService.getConnectionState()).toBe('reconnecting');
    });

    it('should manually reconnect', () => {
      mockSocket.connected = false;
      
      socketService.reconnect();

      expect(mockSocket.connect).toHaveBeenCalled();
      expect(socketService.getConnectionState()).toBe('reconnecting');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      socketService.connect('test-token');
    });

    it('should handle socket errors', () => {
      const onError = vi.fn();
      socketService.on({ onError });

      const error = new Error('Socket error');
      eventHandlers['error'](error);

      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('Disconnect', () => {
    it('should disconnect socket', () => {
      socketService.connect('test-token');
      socketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(socketService.isConnected()).toBe(false);
    });
  });

  describe('Multiple Event Handlers', () => {
    beforeEach(() => {
      socketService.connect('test-token');
    });

    it('should handle multiple handlers for different events', () => {
      const onActivityNew = vi.fn();
      const onNotificationNew = vi.fn();
      const onCollaboratorJoined = vi.fn();

      socketService.on({
        onActivityNew,
        onNotificationNew,
        onCollaboratorJoined,
      });

      // Trigger all events
      eventHandlers['activity:new']({ tripId: 'trip-123', activity: {} });
      eventHandlers['notification:new']({ notification: {} });
      eventHandlers['collaborator:joined']({ tripId: 'trip-123', collaborator: {} });

      expect(onActivityNew).toHaveBeenCalled();
      expect(onNotificationNew).toHaveBeenCalled();
      expect(onCollaboratorJoined).toHaveBeenCalled();
    });

    it('should merge new handlers with existing ones', () => {
      const onActivityNew = vi.fn();
      const onNotificationNew = vi.fn();

      socketService.on({ onActivityNew });
      socketService.on({ onNotificationNew });

      // Both handlers should work
      eventHandlers['activity:new']({ tripId: 'trip-123', activity: {} });
      eventHandlers['notification:new']({ notification: {} });

      expect(onActivityNew).toHaveBeenCalled();
      expect(onNotificationNew).toHaveBeenCalled();
    });
  });

  describe('Place Events', () => {
    beforeEach(() => {
      socketService.connect('test-token');
    });

    it('should handle place:added event', () => {
      const onPlaceAdded = vi.fn();
      socketService.on({ onPlaceAdded });

      const placeData = { tripId: 'trip-123', place: { id: 'place-1', name: 'Tokyo Tower' } };
      eventHandlers['place:added'](placeData);

      expect(onPlaceAdded).toHaveBeenCalledWith(placeData);
    });

    it('should handle place:updated event', () => {
      const onPlaceUpdated = vi.fn();
      socketService.on({ onPlaceUpdated });

      const placeData = { tripId: 'trip-123', place: { id: 'place-1', name: 'Tokyo Tower Updated' } };
      eventHandlers['place:updated'](placeData);

      expect(onPlaceUpdated).toHaveBeenCalledWith(placeData);
    });

    it('should handle place:deleted event', () => {
      const onPlaceDeleted = vi.fn();
      socketService.on({ onPlaceDeleted });

      const placeData = { tripId: 'trip-123', placeId: 'place-1' };
      eventHandlers['place:deleted'](placeData);

      expect(onPlaceDeleted).toHaveBeenCalledWith(placeData);
    });
  });
});
