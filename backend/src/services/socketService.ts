import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../middleware/socketAuth.js';
import { pool } from '../config/database.js';

interface TripRoom {
  tripId: string;
  viewers: Set<string>;
}

interface PresenceData {
  socketId: string;
  userId?: string;
  userEmail?: string;
  joinedAt: Date;
}

interface UserPresence {
  userId: string;
  socketId: string;
  tripId: string;
  isOnline: boolean;
  editingEntity?: string;
  editingEntityId?: string;
  lastUpdate: Date;
}

class SocketService {
  private io: Server | null = null;
  private tripRooms: Map<string, TripRoom> = new Map();
  private presenceMap: Map<string, UserPresence> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize Socket.IO service with server instance
   */
  initialize(io: Server) {
    this.io = io;
    console.log('✅ SocketService initialized');
    
    // Start cleanup interval for stale presence
    this.startCleanupInterval();
  }

  /**
   * Get Socket.IO server instance
   */
  getIO(): Server {
    if (!this.io) {
      throw new Error('Socket.IO not initialized. Call initialize() first.');
    }
    return this.io;
  }

  /**
   * Join a trip room for real-time updates
   */
  joinTripRoom(socket: AuthenticatedSocket, tripId: string) {
    const roomName = `trip:${tripId}`;
    socket.join(roomName);

    // Track room membership
    if (!this.tripRooms.has(tripId)) {
      this.tripRooms.set(tripId, {
        tripId,
        viewers: new Set(),
      });
    }

    const room = this.tripRooms.get(tripId)!;
    room.viewers.add(socket.id);

    console.log(`Socket ${socket.id} joined trip room: ${tripId}`);

    // Emit presence update to room
    this.emitPresenceUpdate(tripId);

    return roomName;
  }

  /**
   * Leave a trip room
   */
  leaveTripRoom(socket: AuthenticatedSocket, tripId: string) {
    const roomName = `trip:${tripId}`;
    socket.leave(roomName);

    // Update room tracking
    const room = this.tripRooms.get(tripId);
    if (room) {
      room.viewers.delete(socket.id);
      
      // Clean up empty rooms
      if (room.viewers.size === 0) {
        this.tripRooms.delete(tripId);
      }
    }

    console.log(`Socket ${socket.id} left trip room: ${tripId}`);

    // Emit presence update to room
    this.emitPresenceUpdate(tripId);
  }

  /**
   * Emit trip update event to all viewers in the room
   */
  emitTripUpdate(tripId: string, updateData: any) {
    const roomName = `trip:${tripId}`;
    this.getIO().to(roomName).emit('trip:updated', {
      tripId,
      data: updateData,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted trip update for trip: ${tripId}`);
  }

  /**
   * Emit story item added event
   */
  emitStoryItemAdded(tripId: string, storyItem: any) {
    const roomName = `trip:${tripId}`;
    this.getIO().to(roomName).emit('story:added', {
      tripId,
      storyItem,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted story item added for trip: ${tripId}`);
  }

  /**
   * Emit packing list update event
   */
  emitPackingListUpdate(tripId: string, packingData: any) {
    const roomName = `trip:${tripId}`;
    this.getIO().to(roomName).emit('packing:updated', {
      tripId,
      data: packingData,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted packing list update for trip: ${tripId}`);
  }

  /**
   * Emit place added event
   */
  emitPlaceAdded(tripId: string, place: any) {
    const roomName = `trip:${tripId}`;
    this.getIO().to(roomName).emit('place:added', {
      tripId,
      place,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted place added for trip: ${tripId}`);
  }

  /**
   * Emit place updated event
   */
  emitPlaceUpdated(tripId: string, place: any) {
    const roomName = `trip:${tripId}`;
    this.getIO().to(roomName).emit('place:updated', {
      tripId,
      place,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted place updated for trip: ${tripId}`);
  }

  /**
   * Emit place deleted event
   */
  emitPlaceDeleted(tripId: string, placeId: string) {
    const roomName = `trip:${tripId}`;
    this.getIO().to(roomName).emit('place:deleted', {
      tripId,
      placeId,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted place deleted for trip: ${tripId}`);
  }

  /**
   * Emit place reordered event
   */
  emitPlaceReordered(tripId: string, placeId: string, targetDayId: string, targetIndex: number) {
    const roomName = `trip:${tripId}`;
    this.getIO().to(roomName).emit('place:reordered', {
      tripId,
      placeId,
      targetDayId,
      targetIndex,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted place reordered for trip: ${tripId}`);
  }

  /**
   * Get active viewers for a trip
   */
  getActiveViewers(tripId: string): PresenceData[] {
    const roomName = `trip:${tripId}`;
    const room = this.getIO().sockets.adapter.rooms.get(roomName);
    
    if (!room) {
      return [];
    }

    const viewers: PresenceData[] = [];
    room.forEach((socketId) => {
      const socket = this.getIO().sockets.sockets.get(socketId) as AuthenticatedSocket;
      if (socket) {
        viewers.push({
          socketId,
          userId: socket.userId,
          userEmail: socket.userEmail,
          joinedAt: new Date(),
        });
      }
    });

    return viewers;
  }

  /**
   * Emit presence update to trip room
   */
  emitPresenceUpdate(tripId: string) {
    const viewers = this.getActiveViewers(tripId);
    const roomName = `trip:${tripId}`;
    
    this.getIO().to(roomName).emit('presence:update', {
      tripId,
      viewerCount: viewers.length,
      viewers: viewers.map(v => ({
        userId: v.userId,
        userEmail: v.userEmail,
      })),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit notification to a specific user
   */
  emitNotification(userId: string, notification: any) {
    // Emit to all sockets connected by this user
    const sockets = Array.from(this.getIO().sockets.sockets.values()) as AuthenticatedSocket[];
    const userSockets = sockets.filter(socket => socket.userId === userId);
    
    userSockets.forEach(socket => {
      socket.emit('notification:new', {
        notification,
        timestamp: new Date().toISOString(),
      });
    });

    console.log(`Emitted notification to user: ${userId}`);
  }

  /**
   * Emit activity log entry to trip room
   */
  emitActivityLog(tripId: string, activity: any) {
    const roomName = `trip:${tripId}`;
    this.getIO().to(roomName).emit('activity:new', {
      tripId,
      activity,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted activity log for trip: ${tripId}`);
  }

  /**
   * Emit collaborator joined event to trip room
   */
  emitCollaboratorJoined(tripId: string, collaborator: any) {
    const roomName = `trip:${tripId}`;
    this.getIO().to(roomName).emit('collaborator:joined', {
      tripId,
      collaborator,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted collaborator joined for trip: ${tripId}, user: ${collaborator.user?.name || collaborator.userId}`);
  }

  /**
   * Emit collaborator left event to trip room
   */
  emitCollaboratorLeft(tripId: string, userId: string, userName?: string) {
    const roomName = `trip:${tripId}`;
    this.getIO().to(roomName).emit('collaborator:left', {
      tripId,
      userId,
      userName,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted collaborator left for trip: ${tripId}, user: ${userName || userId}`);
  }

  /**
   * Emit collaborator role changed event to trip room
   */
  emitCollaboratorRoleChanged(tripId: string, userId: string, newRole: string, userName?: string) {
    const roomName = `trip:${tripId}`;
    this.getIO().to(roomName).emit('collaborator:role_changed', {
      tripId,
      userId,
      newRole,
      userName,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted collaborator role changed for trip: ${tripId}, user: ${userName || userId}, new role: ${newRole}`);
  }

  /**
   * Update presence when user starts editing
   */
  updatePresence(socket: AuthenticatedSocket, data: {
    tripId: string;
    editingEntity?: string;
    editingEntityId?: string;
  }) {
    if (!socket.userId) {
      console.warn('Cannot update presence: socket has no userId');
      return;
    }

    const presence: UserPresence = {
      userId: socket.userId,
      socketId: socket.id,
      tripId: data.tripId,
      isOnline: true,
      editingEntity: data.editingEntity,
      editingEntityId: data.editingEntityId,
      lastUpdate: new Date()
    };
    
    this.presenceMap.set(socket.userId, presence);
    
    // Update database
    this.updateDatabasePresence(socket.userId, data.tripId, presence).catch(err => {
      console.error('Failed to update database presence:', err);
    });
    
    // Broadcast to room
    this.emitPresenceUpdate(data.tripId);
  }

  /**
   * Update database with presence info
   */
  async updateDatabasePresence(userId: string, tripId: string, presence: UserPresence): Promise<void> {
    try {
      await pool.query(
        `UPDATE trip_collaborators 
         SET last_active_at = NOW(),
             is_online = $1,
             current_editing_entity = $2,
             current_editing_entity_id = $3
         WHERE user_id = $4 AND trip_id = $5`,
        [presence.isOnline, presence.editingEntity, presence.editingEntityId, userId, tripId]
      );
    } catch (error) {
      console.error('Error updating database presence:', error);
      throw error;
    }
  }

  /**
   * Clean up stale presence (run every 30 seconds)
   */
  cleanupStalePresence() {
    const staleThreshold = 60000; // 1 minute
    const now = Date.now();
    
    for (const [userId, presence] of this.presenceMap.entries()) {
      if (now - presence.lastUpdate.getTime() > staleThreshold) {
        this.presenceMap.delete(userId);
        
        // Update database to mark as offline
        this.updateDatabasePresence(userId, presence.tripId, {
          ...presence,
          isOnline: false,
          editingEntity: undefined,
          editingEntityId: undefined
        }).catch(err => {
          console.error('Failed to cleanup stale presence in database:', err);
        });
        
        // Emit presence update to the trip room
        this.emitPresenceUpdate(presence.tripId);
      }
    }
  }

  /**
   * Start the cleanup interval
   */
  private startCleanupInterval() {
    // Clear any existing interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Run cleanup every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupStalePresence();
    }, 30000);
    
    console.log('✅ Presence cleanup interval started (30s)');
  }

  /**
   * Stop the cleanup interval
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Presence cleanup interval stopped');
    }
  }

  /**
   * Handle socket disconnection cleanup
   */
  handleDisconnect(socket: AuthenticatedSocket) {
    // Clean up presence for this user
    if (socket.userId) {
      const presence = this.presenceMap.get(socket.userId);
      if (presence) {
        this.presenceMap.delete(socket.userId);
        
        // Update database to mark as offline
        this.updateDatabasePresence(socket.userId, presence.tripId, {
          ...presence,
          isOnline: false,
          editingEntity: undefined,
          editingEntityId: undefined
        }).catch(err => {
          console.error('Failed to update presence on disconnect:', err);
        });
        
        // Emit presence update
        this.emitPresenceUpdate(presence.tripId);
      }
    }
    
    // Clean up all room memberships
    this.tripRooms.forEach((room, tripId) => {
      if (room.viewers.has(socket.id)) {
        this.leaveTripRoom(socket, tripId);
      }
    });
  }
}

// Export singleton instance
export const socketService = new SocketService();
