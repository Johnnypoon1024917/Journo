import React, { useState, useCallback, useEffect } from 'react';
import { CollaborationNotification, CollaborationNotificationData } from './CollaborationNotification';
import { useSocket } from '../../hooks/useSocket';

interface CollaborationNotificationContainerProps {
  tripId?: string;
}

/**
 * CollaborationNotificationContainer - Manages collaboration notifications
 * 
 * Listens for real-time collaboration events and displays notifications
 * in a fixed position on the screen.
 */
export const CollaborationNotificationContainer: React.FC<CollaborationNotificationContainerProps> = ({
  tripId,
}) => {
  const [notifications, setNotifications] = useState<CollaborationNotificationData[]>([]);

  const addNotification = useCallback((notification: Omit<CollaborationNotificationData, 'id' | 'timestamp'>) => {
    const newNotification: CollaborationNotificationData = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };

    setNotifications((prev) => [...prev, newNotification]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Listen for collaboration events
  useSocket({
    autoConnect: true,
    tripId,
    onPresenceUpdate: (data) => {
      // Handle user join/leave events
      if (data.viewerCount > (notifications.length || 0)) {
        // User joined
        const newViewer = data.viewers[data.viewers.length - 1];
        if (newViewer?.userEmail) {
          addNotification({
            type: 'user_joined',
            userName: newViewer.userEmail.split('@')[0],
          });
        }
      }
    },
    onTripUpdated: (data) => {
      // Generic trip update notification
      if (data.updatedBy) {
        addNotification({
          type: 'item_edited',
          userName: data.updatedBy,
          itemType: 'trip',
        });
      }
    },
    onPlaceAdded: (data) => {
      if (data.addedBy) {
        addNotification({
          type: 'item_added',
          userName: data.addedBy,
          itemType: 'activity',
          itemName: data.place?.name,
        });
      }
    },
    onPlaceUpdated: (data) => {
      if (data.updatedBy) {
        addNotification({
          type: 'item_edited',
          userName: data.updatedBy,
          itemType: 'activity',
          itemName: data.place?.name,
        });
      }
    },
    onPlaceDeleted: (data) => {
      if (data.deletedBy) {
        addNotification({
          type: 'item_deleted',
          userName: data.deletedBy,
          itemType: 'activity',
        });
      }
    },
  });

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <CollaborationNotification
            notification={notification}
            onDismiss={dismissNotification}
          />
        </div>
      ))}
    </div>
  );
};
