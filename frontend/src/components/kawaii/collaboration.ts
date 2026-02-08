/**
 * Real-Time Collaboration Components and Hooks
 * 
 * This module exports all collaboration-related components, hooks, and utilities
 * for implementing real-time collaborative features in the Kawaii UI.
 */

// Components
export { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
export { PresenceIndicator } from './PresenceIndicator';
export { EditingIndicator } from './EditingIndicator';
export { EditingConflictModal } from './EditingConflictModal';
export { CollaborationNotification } from './CollaborationNotification';
export { CollaborationNotificationContainer } from './CollaborationNotificationContainer';
export { CollaborativeItemExample } from './CollaborativeItemExample';

// Hooks
export { useEditingState } from '../../hooks/useEditingState';
export { useItemLock } from '../../hooks/useItemLock';

// Types
export type { CollaborationNotificationData } from './CollaborationNotification';
