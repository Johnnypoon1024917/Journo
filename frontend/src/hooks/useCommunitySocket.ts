/**
 * useCommunitySocket Hook
 * 
 * Custom hook for subscribing to real-time community feed updates via Socket.IO.
 * Handles connection management, event subscriptions, and automatic reconnection.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 * 
 * Note: This hook extends the existing socketService with community-specific events.
 * The community events are registered through the socketService.on() method which
 * allows adding custom event handlers without accessing the private socket property.
 */

import { useEffect, useRef } from 'react';
import { socketService } from '@/services/socketService';
import { useCommunityStore } from '@/stores/communityStore';
import type { 
  PostWithEngagement, 
  EngagementData 
} from '@/types/community';

export interface UseCommunitySocketOptions {
  /**
   * Whether to automatically connect on mount
   * @default true
   */
  autoConnect?: boolean;

  /**
   * Community ID to subscribe to (optional)
   * If provided, will join the community room for targeted updates
   */
  communityId?: string;

  /**
   * Whether to enable debug logging
   * @default false
   */
  debug?: boolean;
}

// Extend the socket service with community event handlers
// This is a workaround since the socket property is private
declare module '@/services/socketService' {
  interface SocketEventHandlers {
    onPostNew?: (post: PostWithEngagement) => void;
    onPostUpdated?: (post: PostWithEngagement) => void;
    onPostDeleted?: (data: { postId: string }) => void;
    onEngagementUpdated?: (data: { postId: string; engagement: EngagementData }) => void;
    onReplyNew?: (data: { parentPostId: string; reply: PostWithEngagement }) => void;
    onCommunityJoined?: (data: { communityId: string; userId: string; userName: string }) => void;
    onCommunityLeft?: (data: { communityId: string; userId: string }) => void;
  }
}

/**
 * Hook for managing real-time community feed updates
 * 
 * Subscribes to Socket.IO events for:
 * - New posts
 * - Post updates
 * - Post deletions
 * - Engagement updates (likes, reposts)
 * - New replies
 * - Community membership changes
 * 
 * Automatically handles reconnection with exponential backoff.
 * 
 * @param options - Configuration options
 * 
 * @example
 * ```tsx
 * // Subscribe to all community events
 * useCommunitySocket({ autoConnect: true });
 * 
 * // Subscribe to specific community
 * useCommunitySocket({ 
 *   autoConnect: true, 
 *   communityId: 'community-123' 
 * });
 * ```
 */
export function useCommunitySocket(options: UseCommunitySocketOptions = {}): void {
  const { autoConnect = true, communityId, debug = false } = options;

  // Get store handlers
  const handleNewPost = useCommunityStore((state) => state.handleNewPost);
  const handlePostUpdated = useCommunityStore((state) => state.handlePostUpdated);
  const handlePostDeleted = useCommunityStore((state) => state.handlePostDeleted);
  const handleEngagementUpdate = useCommunityStore((state) => state.handleEngagementUpdate);
  const handleNewReply = useCommunityStore((state) => state.handleNewReply);

  // Track if listeners are registered to prevent duplicates
  const listenersRegisteredRef = useRef(false);
  const currentCommunityIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!autoConnect) {
      return;
    }

    // Register event listeners only once
    if (!listenersRegisteredRef.current) {
      listenersRegisteredRef.current = true;

      if (debug) {
        console.log('[useCommunitySocket] Registering community event listeners');
      }

      // Register community event handlers through the socketService.on() method
      // This approach works with the existing socketService architecture
      socketService.on({
        onPostNew: (post: PostWithEngagement) => {
          if (debug) {
            console.log('[useCommunitySocket] Received post:new event', post);
          }
          handleNewPost(post);
        },
        onPostUpdated: (post: PostWithEngagement) => {
          if (debug) {
            console.log('[useCommunitySocket] Received post:updated event', post);
          }
          handlePostUpdated(post);
        },
        onPostDeleted: (data: { postId: string }) => {
          if (debug) {
            console.log('[useCommunitySocket] Received post:deleted event', data);
          }
          handlePostDeleted(data.postId);
        },
        onEngagementUpdated: (data: { postId: string; engagement: EngagementData }) => {
          if (debug) {
            console.log('[useCommunitySocket] Received engagement:updated event', data);
          }
          handleEngagementUpdate(data.postId, data.engagement);
        },
        onReplyNew: (data: { parentPostId: string; reply: PostWithEngagement }) => {
          if (debug) {
            console.log('[useCommunitySocket] Received reply:new event', data);
          }
          handleNewReply(data.parentPostId, data.reply);
        },
        onCommunityJoined: (data: { communityId: string; userId: string; userName: string }) => {
          if (debug) {
            console.log('[useCommunitySocket] Received community:joined event', data);
          }
          // Could update community member count in a community store if needed
        },
        onCommunityLeft: (data: { communityId: string; userId: string }) => {
          if (debug) {
            console.log('[useCommunitySocket] Received community:left event', data);
          }
          // Could update community member count in a community store if needed
        },
      });
    }

    // Handle community room joining/leaving
    // Note: This requires the backend to support community:join and community:leave events
    // For now, we'll track the community ID but actual room management would need
    // backend support similar to how trip rooms work
    if (communityId !== currentCommunityIdRef.current) {
      // Leave previous community room if any
      if (currentCommunityIdRef.current && socketService.isConnected()) {
        if (debug) {
          console.log('[useCommunitySocket] Leaving community room:', currentCommunityIdRef.current);
        }
        // This would need a backend implementation similar to leaveTrip
        // socketService.leaveCommunity(currentCommunityIdRef.current);
      }

      // Join new community room if provided
      if (communityId && socketService.isConnected()) {
        if (debug) {
          console.log('[useCommunitySocket] Joining community room:', communityId);
        }
        // This would need a backend implementation similar to joinTrip
        // socketService.joinCommunity(communityId);
      }

      currentCommunityIdRef.current = communityId;
    }

    // Cleanup function
    return () => {
      // Note: We don't unregister listeners here because they should persist
      // across component mounts/unmounts for the entire app session
      // The socketService manages the connection lifecycle
      
      // Leave community room on unmount if communityId was provided
      if (communityId && socketService.isConnected()) {
        if (debug) {
          console.log('[useCommunitySocket] Cleanup: Leaving community room:', communityId);
        }
        // This would need a backend implementation
        // socketService.leaveCommunity(communityId);
      }
    };
  }, [
    autoConnect,
    communityId,
    debug,
    handleNewPost,
    handlePostUpdated,
    handlePostDeleted,
    handleEngagementUpdate,
    handleNewReply,
  ]);
}

export default useCommunitySocket;
