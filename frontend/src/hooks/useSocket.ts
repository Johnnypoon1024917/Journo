import { useEffect, useState } from 'react';
import { socketService } from '../services/socketService';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';

interface UseSocketOptions {
  autoConnect?: boolean;
  tripId?: string;
  onTripUpdated?: (data: any) => void;
  onStoryAdded?: (data: any) => void;
  onPackingUpdated?: (data: any) => void;
  onPlaceAdded?: (data: any) => void;
  onPlaceUpdated?: (data: any) => void;
  onPlaceDeleted?: (data: any) => void;
  onPresenceUpdate?: (data: any) => void;
}

/**
 * React hook for Socket.IO integration
 * Handles connection, room management, and event subscriptions
 */
export const useSocket = (options: UseSocketOptions = {}) => {
  const {
    autoConnect = true,
    tripId,
    onTripUpdated,
    onStoryAdded,
    onPackingUpdated,
    onPlaceAdded,
    onPlaceUpdated,
    onPlaceDeleted,
    onPresenceUpdate,
  } = options;

  const { accessToken } = useEnhancedAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    // Connect to socket
    socketService.connect(accessToken || undefined);

    // Register event handlers
    socketService.on({
      onConnect: () => {
        setIsConnected(true);
        setConnectionState('connected');
        setError(null);
      },
      onDisconnect: () => {
        setIsConnected(false);
        setConnectionState('disconnected');
      },
      onError: (err) => {
        setError(err);
        setConnectionState('disconnected');
      },
      onTripUpdated,
      onStoryAdded,
      onPackingUpdated,
      onPlaceAdded,
      onPlaceUpdated,
      onPlaceDeleted,
      onPresenceUpdate,
    });

    // Poll connection state
    const stateInterval = setInterval(() => {
      const state = socketService.getConnectionState();
      setConnectionState(state);
      setIsConnected(state === 'connected');
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(stateInterval);
      socketService.off();
    };
  }, [
    autoConnect,
    accessToken,
    onTripUpdated,
    onStoryAdded,
    onPackingUpdated,
    onPlaceAdded,
    onPlaceUpdated,
    onPlaceDeleted,
    onPresenceUpdate,
  ]);

  // Handle trip room joining/leaving
  useEffect(() => {
    if (!tripId || !isConnected) return;

    socketService.joinTrip(tripId);

    return () => {
      socketService.leaveTrip(tripId);
    };
  }, [tripId, isConnected]);

  return {
    isConnected,
    connectionState,
    error,
    connect: () => socketService.connect(accessToken || undefined),
    disconnect: () => socketService.disconnect(),
    reconnect: () => socketService.reconnect(),
    joinTrip: (id: string) => socketService.joinTrip(id),
    leaveTrip: (id: string) => socketService.leaveTrip(id),
  };
};
