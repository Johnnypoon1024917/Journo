import { useEffect, useState } from 'react';
import { socketService } from '../services/socketService';

export interface PresenceInfo {
  userId: string;
  isOnline: boolean;
  lastActiveAt: string;
  currentEditingEntity?: {
    type: 'place' | 'day' | 'packing' | 'shopping';
    id: string;
    name: string;
  };
}

export interface UsePresenceReturn {
  presenceMap: Map<string, PresenceInfo>;
  updatePresence: (entityType?: string, entityId?: string, entityName?: string) => void;
  isUserOnline: (userId: string) => boolean;
  getUserEditingStatus: (userId: string) => PresenceInfo['currentEditingEntity'] | undefined;
}

export const usePresence = (tripId: string): UsePresenceReturn => {
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceInfo>>(new Map());

  useEffect(() => {
    if (!tripId) return;

    // Subscribe to presence updates
    const handlePresenceUpdate = (data: {
      userId: string;
      isOnline: boolean;
      lastActiveAt: string;
      currentEditingEntity?: PresenceInfo['currentEditingEntity'];
    }) => {
      setPresenceMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(data.userId, {
          userId: data.userId,
          isOnline: data.isOnline,
          lastActiveAt: data.lastActiveAt,
          currentEditingEntity: data.currentEditingEntity,
        });
        return newMap;
      });
    };

    // Subscribe to socket events
    socketService.on('presence:update', handlePresenceUpdate);

    // Request initial presence data
    socketService.emit('presence:request', { tripId });

    // Cleanup
    return () => {
      socketService.off('presence:update', handlePresenceUpdate);
    };
  }, [tripId]);

  const updatePresence = (
    entityType?: string,
    entityId?: string,
    entityName?: string
  ) => {
    const currentEditingEntity = entityType && entityId && entityName
      ? {
          type: entityType as PresenceInfo['currentEditingEntity']['type'],
          id: entityId,
          name: entityName,
        }
      : undefined;

    socketService.emitPresenceUpdate(tripId, currentEditingEntity);
  };

  const isUserOnline = (userId: string): boolean => {
    const presence = presenceMap.get(userId);
    if (!presence) return false;

    // Consider user online if last active within 5 minutes
    const lastActive = new Date(presence.lastActiveAt);
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = diffMs / 60000;

    return presence.isOnline && diffMins < 5;
  };

  const getUserEditingStatus = (userId: string): PresenceInfo['currentEditingEntity'] | undefined => {
    const presence = presenceMap.get(userId);
    return presence?.currentEditingEntity;
  };

  return {
    presenceMap,
    updatePresence,
    isUserOnline,
    getUserEditingStatus,
  };
};
