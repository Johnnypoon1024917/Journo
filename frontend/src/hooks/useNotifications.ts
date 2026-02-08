/**
 * useNotifications Hook
 * Manages notification state and real-time updates via Socket.IO
 */

import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../stores/notificationStore';
import { socketService } from '../services/socketService';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';

export const useNotifications = () => {
  const { addNotification, fetchNotifications } = useNotificationStore();
  const isAuthenticated = useEnhancedAuthStore((state) => state.isAuthenticated);
  const accessToken = useEnhancedAuthStore((state) => state.accessToken);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Only fetch if authenticated AND token exists
    if (!isAuthenticated || !accessToken) {
      console.debug('⏭️ Skipping notification fetch - isAuthenticated:', isAuthenticated, 'hasToken:', !!accessToken);
      hasFetchedRef.current = false; // Reset flag when not authenticated
      return;
    }

    // Prevent multiple fetches
    if (hasFetchedRef.current) {
      console.debug('⏭️ Skipping notification fetch - already fetched');
      return;
    }

    console.log('✅ Auth ready for notifications, token preview:', accessToken.substring(0, 20) + '...');
    
    // Mark as fetched before making the request
    hasFetchedRef.current = true;
    
    // Fetch notifications immediately when auth is ready
    fetchNotifications().catch((err) => {
      // Silently catch any errors - they're already handled in the store
      console.debug('Notification fetch error (handled):', err);
      // Reset flag on error so it can retry
      hasFetchedRef.current = false;
    });

    // Setup socket listener for new notifications
    const handleNewNotification = (data: any) => {
      console.log('📬 Received new notification:', data);
      
      // Add notification to store
      if (data.notification) {
        addNotification(data.notification);
      }
    };

    // Register socket event handler
    socketService.on({
      onNotificationNew: handleNewNotification,
    });

    // Cleanup
    return () => {
      socketService.off(['onNotificationNew']);
    };
  }, [isAuthenticated, accessToken]); // Remove fetchNotifications and addNotification from dependencies

  return useNotificationStore();
};
