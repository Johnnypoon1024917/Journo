import { io, Socket } from 'socket.io-client';

interface SocketEventHandlers {
  onTripUpdated?: (data: any) => void;
  onStoryAdded?: (data: any) => void;
  onPackingUpdated?: (data: any) => void;
  onPlaceAdded?: (data: any) => void;
  onPlaceUpdated?: (data: any) => void;
  onPlaceDeleted?: (data: any) => void;
  onPresenceUpdate?: (data: any) => void;
  onEditingStart?: (data: any) => void;
  onEditingStop?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  // New collaboration enhancement handlers
  onActivityNew?: (data: any) => void;
  onNotificationNew?: (data: any) => void;
  onCollaboratorJoined?: (data: any) => void;
  onCollaboratorLeft?: (data: any) => void;
  onCollaboratorRoleChanged?: (data: any) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: SocketEventHandlers = {};
  private currentTripId: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';

  /**
   * Initialize socket connection
   */
  connect(token?: string) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.connectionState = 'connecting';

    // Get base URL without /api suffix for Socket.IO
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketUrl = apiUrl.replace(/\/api$/, '');

    // Create socket connection with auth token
    this.socket = io(socketUrl, {
      auth: {
        token: token || '',
      },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
    console.log('Socket connection initiated to:', socketUrl);
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      
      // Clear any pending reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      // Rejoin trip room if we were in one
      if (this.currentTripId) {
        this.joinTrip(this.currentTripId);
      }

      this.eventHandlers.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connectionState = 'disconnected';
      this.eventHandlers.onDisconnect?.();
      
      // Attempt manual reconnection for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connectionState = 'reconnecting';
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.connectionState = 'disconnected';
        this.eventHandlers.onError?.(new Error('Failed to connect to server'));
      } else {
        this.scheduleReconnect();
      }
    });

    // Trip events
    this.socket.on('trip:updated', (data) => {
      console.log('Trip updated:', data);
      this.eventHandlers.onTripUpdated?.(data);
    });

    this.socket.on('trip:joined', (data) => {
      console.log('Joined trip room:', data);
    });

    this.socket.on('trip:left', (data) => {
      console.log('Left trip room:', data);
    });

    // Story events
    this.socket.on('story:added', (data) => {
      console.log('Story item added:', data);
      this.eventHandlers.onStoryAdded?.(data);
    });

    // Packing list events
    this.socket.on('packing:updated', (data) => {
      console.log('Packing list updated:', data);
      this.eventHandlers.onPackingUpdated?.(data);
    });

    // Place events
    this.socket.on('place:added', (data) => {
      console.log('Place added:', data);
      this.eventHandlers.onPlaceAdded?.(data);
    });

    this.socket.on('place:updated', (data) => {
      console.log('Place updated:', data);
      this.eventHandlers.onPlaceUpdated?.(data);
    });

    this.socket.on('place:deleted', (data) => {
      console.log('Place deleted:', data);
      this.eventHandlers.onPlaceDeleted?.(data);
    });

    // Presence events
    this.socket.on('presence:update', (data) => {
      console.log('Presence update:', data);
      this.eventHandlers.onPresenceUpdate?.(data);
    });

    // Editing events
    this.socket.on('item:editing:start', (data) => {
      console.log('User started editing:', data);
      this.eventHandlers.onEditingStart?.(data);
    });

    this.socket.on('item:editing:stop', (data) => {
      console.log('User stopped editing:', data);
      this.eventHandlers.onEditingStop?.(data);
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.eventHandlers.onError?.(error);
    });

    // Collaboration enhancement events
    this.socket.on('activity:new', (data) => {
      console.log('Activity new:', data);
      this.eventHandlers.onActivityNew?.(data);
    });

    this.socket.on('notification:new', (data) => {
      console.log('Notification new:', data);
      this.eventHandlers.onNotificationNew?.(data);
    });

    this.socket.on('collaborator:joined', (data) => {
      console.log('Collaborator joined:', data);
      this.eventHandlers.onCollaboratorJoined?.(data);
    });

    this.socket.on('collaborator:left', (data) => {
      console.log('Collaborator left:', data);
      this.eventHandlers.onCollaboratorLeft?.(data);
    });

    this.socket.on('collaborator:role_changed', (data) => {
      console.log('Collaborator role changed:', data);
      this.eventHandlers.onCollaboratorRoleChanged?.(data);
    });
  }

  /**
   * Register event handlers
   */
  on(handlers: SocketEventHandlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Remove event handlers
   */
  off(eventNames?: string[]) {
    if (!eventNames) {
      this.eventHandlers = {};
      return;
    }

    eventNames.forEach((name) => {
      delete this.eventHandlers[name as keyof SocketEventHandlers];
    });
  }

  /**
   * Join a trip room for real-time updates
   */
  joinTrip(tripId: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot join trip room');
      return;
    }

    this.currentTripId = tripId;
    this.socket.emit('trip:join', tripId);
    console.log('Joining trip room:', tripId);
  }

  /**
   * Leave a trip room
   */
  leaveTrip(tripId: string) {
    if (!this.socket?.connected) {
      return;
    }

    if (this.currentTripId === tripId) {
      this.currentTripId = null;
    }

    this.socket.emit('trip:leave', tripId);
    console.log('Leaving trip room:', tripId);
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentTripId = null;
      console.log('Socket disconnected');
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Manually reconnect
   */
  reconnect() {
    if (this.socket && !this.socket.connected) {
      this.reconnectAttempts = 0;
      this.connectionState = 'reconnecting';
      this.socket.connect();
      console.log('Manual reconnection initiated');
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      5000
    );

    console.log(`Scheduling reconnection in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.socket?.connected && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnect();
      }
    }, delay);
  }

  /**
   * Get current connection state
   */
  getConnectionState(): 'disconnected' | 'connecting' | 'connected' | 'reconnecting' {
    return this.connectionState;
  }

  /**
   * Emit editing start event
   */
  emitEditingStart(tripId: string, itemId: string, itemType: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot emit editing start');
      return;
    }

    this.socket.emit('item:editing:start', {
      tripId,
      itemId,
      itemType,
    });
  }

  /**
   * Emit editing stop event
   */
  emitEditingStop(tripId: string, itemId: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot emit editing stop');
      return;
    }

    this.socket.emit('item:editing:stop', {
      tripId,
      itemId,
    });
  }

  /**
   * Emit presence update event
   * Used to update user's presence status including editing entity
   */
  emitPresenceUpdate(tripId: string, editingEntity?: string, editingEntityId?: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot emit presence update');
      return;
    }

    this.socket.emit('presence:update', {
      tripId,
      editingEntity,
      editingEntityId,
    });
    
    console.log('Emitting presence update:', { tripId, editingEntity, editingEntityId });
  }
}

// Export singleton instance
export const socketService = new SocketService();
