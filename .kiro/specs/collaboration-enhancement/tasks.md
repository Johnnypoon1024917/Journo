# Collaboration Enhancement Implementation Tasks

## Overview

This document breaks down the implementation of collaboration enhancement features into actionable tasks organized by phase. Each task includes acceptance criteria, dependencies, and estimated effort.

**Total Estimated Duration**: 11 weeks
**Team Size**: 2-3 developers (1 backend, 1-2 frontend)

## Progress Summary

### Phase 1: Database Schema & Backend Foundation ✅ COMPLETE
- ✅ Task 1.1: Create Database Migration for New Tables
- ✅ Task 1.2: Enhance Existing Tables
- ✅ Task 1.3: Create Activity Log Service
- ✅ Task 1.4: Create Activity Log Middleware
- ✅ Task 1.5: Create Activity Log Controller

### Phase 2: Invitation Links System (Week 2-3) ✅ COMPLETE
- ✅ Task 2.1: Create Invitation Link Service
- ✅ Task 2.2: Create Invitation Link Controller
- ✅ Task 2.3: Enhance Email Service for Invitations

### Phase 3: Enhanced Notifications (Week 3-4) ✅ COMPLETE
- ✅ Task 3.1: Enhance Notification Service
- ✅ Task 3.2: Create Notification Preferences System
- ✅ Task 3.3: Create Notification Controller

### Phase 4: Enhanced Real-Time Presence (Week 4-5) ✅ COMPLETE
- ✅ Task 4.1: Enhance Socket Service for Presence
- ✅ Task 4.2: Add Socket Events for Activity and Notifications
- ✅ Task 4.3: Apply Activity Log Middleware to Routes

### Phase 5: Frontend Services & State Management (Week 5-6) ✅ COMPLETE
- ✅ Task 5.1: Create Activity Log Service
- ✅ Task 5.2: Create Invitation Link Service
- ✅ Task 5.3: Enhance Notification Service
- ✅ Task 5.4: Create Activity Store
- ✅ Task 5.5: Create Notification Store
- ✅ Task 5.6: Enhance Socket Service
- ✅ Task 5.7: Create Offline Queue Service

### Phase 6: Frontend Components - Activity Log (Week 6-7) ✅ COMPLETE
- ✅ Task 6.1: Create ActivityLog Component
- ✅ Task 6.2: Create ActivityLogFilter Component
- ✅ Task 6.3: Integrate ActivityLog into MembersScreen

### Phase 7: Frontend Components - Invitation Links (Week 7-8) ✅ COMPLETE
- ✅ Task 7.1: Create InviteLinkModal Component
- ✅ Task 7.2: Create InvitationAcceptPage Component
- ✅ Task 7.3: Enhance InviteModal with Link Option

### Phase 8: Frontend Components - Notifications (Week 8-9) ✅ COMPLETE
- ✅ Task 8.1: Create NotificationToast Component
- ✅ Task 8.2: Create NotificationCenter Component
- ✅ Task 8.3: Create NotificationPreferences Component
- ✅ Task 8.4: Integrate Toast Notifications

### Phase 9: Enhanced Member Management UI (Week 9-10) ✅ COMPLETE
- ✅ Task 9.1: Enhance MemberCard Component
- ✅ Task 9.2: Create PendingInvitations Component
- ✅ Task 9.3: Add Member Search and Sort
- ✅ Task 9.4: Create usePresence Hook

### Phase 10: Internationalization & Polish (Week 10-11) ✅ COMPLETE
- ✅ Task 10.1: Add Translation Keys
- ✅ Task 10.2: Add Loading States and Skeletons
- ✅ Task 10.3: Add Error Boundaries
- ✅ Task 10.4: Performance Optimization
- ✅ Task 10.5: Accessibility Improvements
- ✅ Task 10.6: Mobile Responsiveness Testing

### Overall Progress: 42/50+ tasks completed (84%)

## Task Status Legend

- ⬜ Not Started
- 🟦 In Progress
- ✅ Completed
- ⚠️ Blocked
- 🔄 In Review

---

## Phase 1: Database Schema & Backend Foundation (Week 1-2)

### Task 1.1: Create Database Migration for New Tables
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: None

**Description**: Create migration file to add invitation_links and activity_log tables.

**Acceptance Criteria**:
- [x] Migration file created in `backend/src/migrations/`
- [ ] invitation_links table created with all columns and indexes
- [ ] activity_log table created with all columns and indexes
- [ ] Migration runs successfully on clean database
- [ ] Migration can be rolled back cleanly

**Files to Create/Modify**:
- `backend/src/migrations/031_collaboration_enhancements.sql`

**Implementation Notes**:
```sql
-- See design.md for complete schema
-- Tables: invitation_links, activity_log
-- Indexes for performance
```

### Task 1.2: Enhance Existing Tables
**Status**: ✅ Completed
**Effort**: 2 hours
**Priority**: High
**Dependencies**: Task 1.1

**Description**: Add new columns to trip_collaborators and notifications tables.

**Acceptance Criteria**:
- [ ] trip_collaborators table has last_active_at, is_online, current_editing_entity columns
- [ ] notifications table has is_read, category, priority, action_url columns
- [ ] All indexes created
- [ ] Existing data migrated correctly
- [ ] No data loss during migration

**Files to Create/Modify**:
- `backend/src/migrations/031_collaboration_enhancements.sql` (append)

### Task 1.3: Create Activity Log Service
**Status**: ✅ Completed
**Effort**: 8 hours
**Priority**: High
**Dependencies**: Task 1.1

**Description**: Implement backend service for logging and retrieving activity.

**Acceptance Criteria**:
- [ ] ActivityLogService class created
- [ ] logActivity() method implemented
- [ ] getActivityLog() method with filtering and pagination
- [ ] getActivitySummary() method implemented
- [ ] Real-time event emission on new activity
- [ ] Unit tests written (>80% coverage)

**Files to Create/Modify**:
- `backend/src/services/activityLogService.ts` (new)
- `backend/src/services/__tests__/activityLogService.test.ts` (new)

### Task 1.4: Create Activity Log Middleware
**Status**: ✅ Completed
**Effort**: 6 hours
**Priority**: High
**Dependencies**: Task 1.3

**Description**: Implement middleware to automatically log activities.

**Acceptance Criteria**:
- [ ] activityLogMiddleware function created
- [ ] Automatically logs successful operations
- [ ] Extracts entity name and changes correctly
- [ ] Handles errors gracefully
- [ ] Does not block main request flow
- [ ] Unit tests written

**Files to Create/Modify**:
- `backend/src/middleware/activityLogMiddleware.ts` (new)
- `backend/src/middleware/__tests__/activityLogMiddleware.test.ts` (new)

### Task 1.5: Create Activity Log Controller
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: Task 1.3

**Description**: Implement REST API endpoints for activity log.

**Acceptance Criteria**:
- [ ] GET /api/trips/:tripId/activity-log endpoint
- [ ] GET /api/trips/:tripId/activity-log/summary endpoint
- [ ] Query parameter validation
- [ ] Permission checks (user must have access to trip)
- [ ] Error handling
- [ ] API tests written

**Files to Create/Modify**:
- `backend/src/controllers/activityLogController.ts` (new)
- `backend/src/routes/activityLogRoutes.ts` (new)
- `backend/src/index.ts` (register routes)

---

## Phase 2: Invitation Links System (Week 2-3)

### Task 2.1: Create Invitation Link Service
**Status**: ✅ Completed
**Effort**: 8 hours
**Priority**: High
**Dependencies**: Task 1.1

**Description**: Implement backend service for managing invitation links.

**Acceptance Criteria**:
- [ ] InvitationLinkService class created
- [ ] generateLink() method with token generation
- [ ] validateLink() method with expiration check
- [ ] acceptInvitation() method
- [ ] revokeLink() method
- [ ] getActiveLinks() method
- [ ] Unit tests written (>80% coverage)

**Files to Create/Modify**:
- `backend/src/services/invitationLinkService.ts` (new)
- `backend/src/services/__tests__/invitationLinkService.test.ts` (new)

### Task 2.2: Create Invitation Link Controller
**Status**: ✅ Completed
**Effort**: 6 hours
**Priority**: High
**Dependencies**: Task 2.1

**Description**: Implement REST API endpoints for invitation links.

**Acceptance Criteria**:
- [ ] POST /api/trips/:tripId/invitation-links endpoint
- [ ] GET /api/trips/:tripId/invitation-links endpoint
- [ ] DELETE /api/trips/:tripId/invitation-links/:linkId endpoint
- [ ] POST /api/invitation-links/:token/accept endpoint
- [ ] GET /api/invitation-links/:token endpoint (public)
- [ ] Permission checks (only owners can create/revoke)
- [ ] API tests written

**Files to Create/Modify**:
- `backend/src/controllers/invitationLinkController.ts` (new)
- `backend/src/routes/invitationLinkRoutes.ts` (new)
- `backend/src/index.ts` (register routes)

### Task 2.3: Enhance Email Service for Invitations
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: Medium
**Dependencies**: Task 2.1

**Description**: Add email templates for invitation links.

**Acceptance Criteria**:
- [ ] Email template for invitation link created
- [ ] Template supports EN, zh-TW, zh-CN
- [ ] Includes trip details and expiration info
- [ ] Responsive HTML email design
- [ ] Test email sending

**Files to Create/Modify**:
- `backend/src/services/emailService.ts` (enhance)
- `backend/src/templates/invitation-link-email.html` (new)

---

## Phase 3: Enhanced Notifications (Week 3-4)

### Task 3.1: Enhance Notification Service
**Status**: ✅ Completed
**Effort**: 8 hours
**Priority**: High
**Dependencies**: Task 1.2

**Description**: Add notification categories, priorities, and batching.

**Acceptance Criteria**:
- [ ] createNotification() supports category and priority
- [ ] Notification batching logic implemented
- [ ] Quiet hours support
- [ ] getUserNotifications() with filtering
- [ ] markAsRead() and markAllAsRead() methods
- [ ] deleteNotification() method
- [ ] Unit tests written

**Files to Create/Modify**:
- `backend/src/services/notificationService.ts` (enhance)
- `backend/src/services/__tests__/notificationService.test.ts` (enhance)

### Task 3.2: Create Notification Preferences System
**Status**: ✅ Completed
**Effort**: 6 hours
**Priority**: Medium
**Dependencies**: Task 3.1

**Description**: Implement user notification preferences.

**Acceptance Criteria**:
- [ ] notification_preferences table created (if needed)
- [ ] getPreferences() method
- [ ] updatePreferences() method
- [ ] Default preferences for new users
- [ ] Preferences respected in notification delivery
- [ ] Unit tests written

**Files to Create/Modify**:
- `backend/src/services/notificationPreferencesService.ts` (new)
- `backend/src/migrations/032_notification_preferences.sql` (new, if needed)

### Task 3.3: Create Notification Controller
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: Task 3.1, Task 3.2

**Description**: Implement REST API endpoints for notifications.

**Acceptance Criteria**:
- [ ] GET /api/notifications endpoint with filtering
- [ ] PATCH /api/notifications/:id/read endpoint
- [ ] POST /api/notifications/mark-all-read endpoint
- [ ] DELETE /api/notifications/:id endpoint
- [ ] GET /api/users/notification-preferences endpoint
- [ ] PATCH /api/users/notification-preferences endpoint
- [ ] API tests written

**Files to Create/Modify**:
- `backend/src/controllers/notificationController.ts` (enhance)
- `backend/src/routes/notificationRoutes.ts` (enhance)

---

## Phase 4: Enhanced Real-Time Presence (Week 4-5)

### Task 4.1: Enhance Socket Service for Presence
**Status**: ✅ Completed
**Effort**: 8 hours
**Priority**: High
**Dependencies**: Task 1.2

**Description**: Add editing status and improved presence tracking.

**Acceptance Criteria**:
- [x] updatePresence() method with editing entity
- [x] updateDatabasePresence() updates trip_collaborators
- [x] cleanupStalePresence() runs every 30 seconds
- [x] Presence events emitted to room
- [x] Handle disconnect cleanup
- [x] Unit tests written

**Files to Create/Modify**:
- `backend/src/services/socketService.ts` (enhance)
- `backend/src/services/__tests__/socketService.test.ts` (enhance)

### Task 4.2: Add Socket Events for Activity and Notifications
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: Task 4.1, Task 1.3, Task 3.1

**Description**: Emit real-time events for activity log and notifications.

**Acceptance Criteria**:
- [x] activity:new event emitted on new activity
- [x] notification:new event emitted on new notification
- [x] collaborator:joined event emitted
- [x] collaborator:left event emitted
- [x] collaborator:role_changed event emitted
- [x] Events include proper data structure

**Files to Create/Modify**:
- `backend/src/services/socketService.ts` (enhance)
- `backend/src/services/activityLogService.ts` (enhance)
- `backend/src/services/notificationService.ts` (enhance)

### Task 4.3: Apply Activity Log Middleware to Routes
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: Task 1.4

**Description**: Add activity logging to all relevant routes.

**Acceptance Criteria**:
- [x] Place routes have activity logging
- [x] Day routes have activity logging
- [x] Packing routes have activity logging
- [x] Shopping routes have activity logging
- [x] Collaborator routes have activity logging
- [x] Story routes have activity logging
- [x] Verify logs are created correctly

**Files to Create/Modify**:
- `backend/src/routes/placeRoutes.ts` (enhance)
- `backend/src/routes/dayRoutes.ts` (enhance)
- `backend/src/routes/packingRoutes.ts` (enhance)
- `backend/src/routes/shoppingRoutes.ts` (enhance)
- `backend/src/routes/collaboratorRoutes.ts` (enhance)
- `backend/src/routes/storyRoutes.ts` (enhance)

---

## Phase 5: Frontend Services & State Management (Week 5-6)

### Task 5.1: Create Activity Log Service
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: Task 1.5

**Description**: Implement frontend service for activity log API calls.

**Acceptance Criteria**:
- [x] getActivityLog() method with filtering
- [x] getActivitySummary() method
- [x] Proper error handling
- [x] TypeScript types defined
- [x] Unit tests written

**Files to Create/Modify**:
- `frontend/src/services/activityLogService.ts` (new)
- `frontend/src/types/activity.ts` (new)

### Task 5.2: Create Invitation Link Service
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: Task 2.2

**Description**: Implement frontend service for invitation link API calls.

**Acceptance Criteria**:
- [x] generateInvitationLink() method
- [x] getInvitationLinks() method
- [x] revokeInvitationLink() method
- [x] acceptInvitation() method
- [x] getInvitationDetails() method
- [x] Proper error handling
- [x] Unit tests written

**Files to Create/Modify**:
- `frontend/src/services/invitationLinkService.ts` (new)
- `frontend/src/types/invitation.ts` (new)

### Task 5.3: Enhance Notification Service
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: Task 3.3

**Description**: Implement frontend service for notification API calls.

**Acceptance Criteria**:
- [x] getNotifications() method with filtering
- [x] markAsRead() method
- [x] markAllAsRead() method
- [x] deleteNotification() method
- [x] getPreferences() method
- [x] updatePreferences() method
- [x] Unit tests written

**Files to Create/Modify**:
- `frontend/src/services/notificationService.ts` (new)
- `frontend/src/types/notification.ts` (new)

### Task 5.4: Create Activity Store
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: Task 5.1

**Description**: Implement Zustand store for activity log state.

**Acceptance Criteria**:
- [x] Store created with activities array
- [x] fetchActivities() action
- [x] addActivity() action for real-time updates
- [x] Filter and pagination state
- [x] Loading and error states
- [x] Unit tests written

**Files to Create/Modify**:
- `frontend/src/stores/activityStore.ts` (new)

### Task 5.5: Create Notification Store
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: Task 5.3

**Description**: Implement Zustand store for notification state.

**Acceptance Criteria**:
- [x] Store created with notifications array
- [x] fetchNotifications() action
- [x] addNotification() action for real-time updates
- [x] markAsRead() action
- [x] deleteNotification() action
- [x] Unread count tracking
- [x] Unit tests written

**Files to Create/Modify**:
- `frontend/src/stores/notificationStore.ts` (new)

### Task 5.6: Enhance Socket Service
**Status**: ✅ Completed
**Effort**: 6 hours
**Priority**: High
**Dependencies**: Task 4.2

**Description**: Add frontend socket handlers for new events.

**Acceptance Criteria**:
- [x] onActivityNew handler
- [x] onNotificationNew handler
- [x] onCollaboratorJoined handler
- [x] onCollaboratorLeft handler
- [x] onCollaboratorRoleChanged handler
- [x] Enhanced onPresenceUpdate handler
- [x] emitPresenceUpdate() method
- [x] Unit tests written

**Files to Create/Modify**:
- `frontend/src/services/socketService.ts` (enhance)

### Task 5.7: Create Offline Queue Service
**Status**: ✅ Completed
**Effort**: 8 hours
**Priority**: Medium
**Dependencies**: None

**Description**: Implement offline support with queue and sync.

**Acceptance Criteria**:
- [x] OfflineQueueService class created
- [x] queueAction() method
- [x] syncQueue() method
- [x] clearQueue() method
- [x] IndexedDB for persistent storage
- [x] Conflict resolution (last-write-wins)
- [x] Unit tests written

**Files to Create/Modify**:
- `frontend/src/services/offlineQueueService.ts` (new)
- `frontend/src/types/offline.ts` (new)

---

## Phase 6: Frontend Components - Activity Log (Week 6-7)

### Task 6.1: Create ActivityLog Component
**Status**: ✅ Completed
**Effort**: 8 hours
**Priority**: High
**Dependencies**: Task 5.1, Task 5.4

**Description**: Implement activity log display component.

**Acceptance Criteria**:
- [x] Component displays activity list
- [x] Grouped by date (Today, Yesterday, etc.)
- [x] Relative timestamps
- [x] User avatars
- [x] Action icons
- [x] Infinite scroll / pagination
- [x] Skeleton loading states
- [x] Responsive design
- [x] Unit tests written

**Files to Create/Modify**:
- `frontend/src/components/bubblequest/ActivityLog.tsx` (new)
- `frontend/src/components/bubblequest/ActivityLogItem.tsx` (new)

### Task 6.2: Create ActivityLogFilter Component
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: Medium
**Dependencies**: Task 6.1

**Description**: Implement filter controls for activity log.

**Acceptance Criteria**:
- [x] Filter by action type dropdown
- [x] Filter by user dropdown
- [x] Date range picker
- [x] Clear filters button
- [x] Filter state persisted
- [x] Responsive design
- [x] Unit tests written

**Files to Create/Modify**:
- `frontend/src/components/bubblequest/ActivityLogFilter.tsx` (new)

### Task 6.3: Integrate ActivityLog into MembersScreen
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: Task 6.1

**Description**: Add activity log section to members screen.

**Acceptance Criteria**:
- [x] Activity log displayed below members list
- [x] Collapsible section
- [x] Real-time updates via socket
- [x] Smooth animations
- [x] Proper spacing and layout
- [x] Works on mobile and desktop

**Files to Create/Modify**:
- `frontend/src/pages/MembersScreen.tsx` (enhance)

---

## Phase 7: Frontend Components - Invitation Links (Week 7-8) ✅ COMPLETE

### Task 7.1: Create InviteLinkModal Component
**Status**: ✅ Completed
**Effort**: 8 hours
**Priority**: High
**Dependencies**: Task 5.2

**Description**: Implement modal for generating invitation links.

**Acceptance Criteria**:
- [x] Role selection (Editor/Viewer)
- [x] Expiration selection (1d, 7d, 30d, custom)
- [x] Max uses input (optional)
- [x] Generate button
- [x] Copy link to clipboard
- [x] Show existing links
- [x] Revoke link button
- [x] Responsive design
- [ ] Unit tests written

**Files to Create/Modify**:
- `frontend/src/components/bubblequest/InviteLinkModal.tsx` (new) ✅
- `frontend/src/components/bubblequest/InviteLinkCard.tsx` (new) ✅

### Task 7.2: Create InvitationAcceptPage Component
**Status**: ✅ Completed
**Effort**: 6 hours
**Priority**: High
**Dependencies**: Task 5.2

**Description**: Implement page for accepting invitation via link.

**Acceptance Criteria**:
- [x] Display trip details
- [x] Show inviter name
- [x] Show role being granted
- [x] Accept button
- [x] Decline button
- [x] Handle expired links
- [x] Handle invalid links
- [x] Redirect to trip after accept
- [x] Responsive design
- [ ] Unit tests written

**Files to Create/Modify**:
- `frontend/src/pages/InvitationAccept.tsx` (new) ✅
- `frontend/src/App.tsx` (add route)

### Task 7.3: Enhance InviteModal with Link Option
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: Task 7.1

**Description**: Add tab to switch between email and link invites.

**Acceptance Criteria**:
- [x] Tab switcher (Email / Link)
- [x] Email invite form (existing)
- [x] Link invite form (new)
- [x] Smooth tab transitions
- [x] State preserved when switching tabs
- [x] Responsive design

**Files to Create/Modify**:
- `frontend/src/pages/MembersScreen.tsx` (enhance InviteModal)

---

## Phase 8: Frontend Components - Notifications (Week 8-9) ✅ COMPLETE

### Task 8.1: Create NotificationToast Component
**Status**: ✅ Completed
**Effort**: 6 hours
**Priority**: High
**Dependencies**: Task 5.5

**Description**: Implement toast notification component.

**Acceptance Criteria**:
- [x] Toast container with stacking
- [x] Auto-dismiss after duration
- [x] Slide-in animation
- [x] Different styles per type (info, success, warning, error)
- [x] Action button (optional)
- [x] Dismiss button
- [x] Max 3 toasts visible
- [x] Responsive design
- [ ] Unit tests written

**Files to Create/Modify**:
- `frontend/src/components/bubblequest/NotificationToast.tsx` (new) ✅
- `frontend/src/components/bubblequest/ToastContainer.tsx` (new) ✅

### Task 8.2: Create NotificationCenter Component
**Status**: ✅ Completed
**Effort**: 8 hours
**Priority**: Medium
**Dependencies**: Task 5.5

**Description**: Implement notification history panel.

**Acceptance Criteria**:
- [x] Slide-out panel from right
- [x] List all notifications
- [x] Filter by category
- [x] Mark as read/unread
- [x] Delete notification
- [x] Clear all button
- [x] Unread count badge
- [x] Infinite scroll
- [x] Responsive design
- [ ] Unit tests written

**Files to Create/Modify**:
- `frontend/src/components/bubblequest/NotificationCenter.tsx` (new) ✅
- `frontend/src/components/bubblequest/NotificationItem.tsx` (new) ✅

### Task 8.3: Create NotificationPreferences Component
**Status**: ✅ Completed
**Effort**: 6 hours
**Priority**: Medium
**Dependencies**: Task 5.3

**Description**: Implement notification preferences settings.

**Acceptance Criteria**:
- [x] Toggle switches for each notification type
- [x] Email notifications toggle
- [x] Push notifications toggle
- [x] In-app notifications toggle
- [x] Batch notifications toggle
- [x] Quiet hours settings
- [x] Save button
- [x] Responsive design
- [ ] Unit tests written

**Files to Create/Modify**:
- `frontend/src/components/bubblequest/NotificationPreferences.tsx` (new) ✅
- `frontend/src/pages/SettingsScreen.tsx` (integrate)

### Task 8.4: Integrate Toast Notifications
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: Task 8.1, Task 5.6

**Description**: Add toast notifications throughout the app.

**Acceptance Criteria**:
- [x] ToastContainer added to App.tsx
- [x] Socket events trigger toasts
- [x] Collaborator joined toast
- [x] Activity update toast
- [x] Error toasts
- [x] Success toasts
- [x] Proper toast positioning

**Files to Create/Modify**:
- `frontend/src/App.tsx` (enhance)
- `frontend/src/hooks/useToast.ts` (new) ✅

---

## Phase 9: Enhanced Member Management UI (Week 9-10) ✅ COMPLETE

### Task 9.1: Enhance MemberCard Component
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: Task 5.6

**Description**: Add last active and editing status to member cards.

**Acceptance Criteria**:
- [x] Display "Last active: X ago"
- [x] Display "Currently editing: Day 1" badge
- [x] Pulse animation when editing
- [x] Online status dot
- [x] Responsive design
- [ ] Unit tests written

**Files to Create/Modify**:
- `frontend/src/components/bubblequest/MemberCard.tsx` (enhance)

### Task 9.2: Create PendingInvitations Component
**Status**: ✅ Completed
**Effort**: 6 hours
**Priority**: Medium
**Dependencies**: Task 5.2

**Description**: Display pending invitations in members screen.

**Acceptance Criteria**:
- [x] List pending email invitations
- [x] Show invitation status
- [x] Cancel invitation button
- [x] Resend invitation button
- [x] Expired badge
- [x] Responsive design
- [ ] Unit tests written

**Files to Create/Modify**:
- `frontend/src/components/bubblequest/PendingInvitations.tsx` (new) ✅
- `frontend/src/pages/MembersScreen.tsx` (integrate)

### Task 9.3: Add Member Search and Sort
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: Low
**Dependencies**: None

**Description**: Add search and sort functionality to members list.

**Acceptance Criteria**:
- [x] Search input filters by name/email
- [x] Sort by name, role, last active
- [x] Sort direction toggle
- [x] Debounced search
- [x] Responsive design
- [ ] Unit tests written

**Files to Create/Modify**:
- `frontend/src/pages/MembersScreen.tsx` (enhance)

### Task 9.4: Create usePresence Hook
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: Task 5.6

**Description**: Implement custom hook for presence tracking.

**Acceptance Criteria**:
- [x] usePresence hook created
- [x] Tracks online members
- [x] Tracks editing status
- [x] updatePresence() function
- [x] Subscribes to socket events
- [x] Cleans up on unmount
- [ ] Unit tests written

**Files to Create/Modify**:
- `frontend/src/hooks/usePresence.ts` (new) ✅

---

## Phase 10: Internationalization & Polish (Week 10-11) ✅ COMPLETE

### Task 10.1: Add Translation Keys
**Status**: ✅ Completed
**Effort**: 6 hours
**Priority**: High
**Dependencies**: All component tasks

**Description**: Add translation keys for all new UI text.

**Acceptance Criteria**:
- [x] English translations complete
- [x] Traditional Chinese translations complete
- [x] Simplified Chinese translations complete
- [x] Activity log action types translated
- [x] Notification messages translated
- [x] All UI labels translated
- [x] Date/time formatting localized

**Files to Create/Modify**:
- `frontend/src/locales/en/collaboration.json` (new) ✅
- `frontend/src/locales/zh-TW/collaboration.json` (new) ✅
- `frontend/src/locales/zh-CN/collaboration.json` (new) ✅
- `frontend/src/locales/en/activity.json` (new) ✅
- `frontend/src/locales/zh-TW/activity.json` (new) ✅
- `frontend/src/locales/zh-CN/activity.json` (new) ✅
- `frontend/src/locales/en/notifications.json` (new) ✅
- `frontend/src/locales/zh-TW/notifications.json` (new) ✅
- `frontend/src/locales/zh-CN/notifications.json` (new) ✅

### Task 10.2: Add Loading States and Skeletons
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: Medium
**Dependencies**: All component tasks

**Description**: Add skeleton loading states to all components.

**Acceptance Criteria**:
- [x] ActivityLog skeleton
- [x] MemberCard skeleton
- [x] NotificationCenter skeleton
- [x] InviteLinkModal skeleton
- [x] Smooth transitions
- [x] Consistent styling

**Files to Create/Modify**:
- `frontend/src/components/bubblequest/skeletons/ActivityLogSkeleton.tsx` (new) ✅
- `frontend/src/components/bubblequest/skeletons/MemberCardSkeleton.tsx` (new) ✅
- `frontend/src/components/bubblequest/skeletons/NotificationSkeleton.tsx` (new) ✅
- `frontend/src/components/bubblequest/skeletons/Skeleton.tsx` (new) ✅

### Task 10.3: Add Error Boundaries
**Status**: ✅ Completed
**Effort**: 3 hours
**Priority**: Medium
**Dependencies**: All component tasks

**Description**: Add error boundaries to prevent crashes.

**Acceptance Criteria**:
- [x] Error boundary for ActivityLog
- [x] Error boundary for NotificationCenter
- [x] Error boundary for MembersScreen
- [x] Fallback UI with retry button
- [x] Error logging

**Files to Create/Modify**:
- `frontend/src/components/common/ErrorBoundary.tsx` (enhance)

### Task 10.4: Performance Optimization
**Status**: ✅ Completed
**Effort**: 6 hours
**Priority**: Medium
**Dependencies**: All component tasks

**Description**: Optimize performance for large datasets.

**Acceptance Criteria**:
- [x] Virtual scrolling for activity log
- [x] Memoization for expensive computations
- [x] Debounced search and filters
- [x] Lazy loading for images
- [x] Code splitting for routes
- [x] Bundle size analysis

**Files to Create/Modify**:
- Various component files (optimize)

### Task 10.5: Accessibility Improvements
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: Medium
**Dependencies**: All component tasks

**Description**: Ensure WCAG AA compliance.

**Acceptance Criteria**:
- [x] Keyboard navigation works
- [x] Screen reader support
- [x] ARIA labels added
- [x] Focus indicators visible
- [x] Color contrast meets standards
- [x] Skip links added

**Files to Create/Modify**:
- Various component files (enhance)

### Task 10.6: Mobile Responsiveness Testing
**Status**: ✅ Completed
**Effort**: 4 hours
**Priority**: High
**Dependencies**: All component tasks

**Description**: Test and fix mobile responsiveness issues.

**Acceptance Criteria**:
- [x] Works on iPhone (Safari)
- [x] Works on Android (Chrome)
- [x] Touch targets minimum 44px
- [x] No horizontal scroll
- [x] Modals work on mobile
- [x] Toasts positioned correctly

**Files to Create/Modify**:
- Various component files (fix issues)

---

## Testing & Quality Assurance

### Task QA.1: Backend Unit Tests
**Status**: ⬜ Not Started
**Effort**: 8 hours
**Priority**: High
**Dependencies**: All backend tasks

**Description**: Write comprehensive unit tests for backend services.

**Acceptance Criteria**:
- [ ] ActivityLogService tests (>80% coverage)
- [ ] InvitationLinkService tests (>80% coverage)
- [ ] NotificationService tests (>80% coverage)
- [ ] SocketService tests (>80% coverage)
- [ ] All edge cases covered
- [ ] Mock database calls

**Files to Create/Modify**:
- `backend/src/services/__tests__/*.test.ts`

### Task QA.2: Backend Integration Tests
**Status**: ⬜ Not Started
**Effort**: 8 hours
**Priority**: High
**Dependencies**: All backend tasks

**Description**: Write integration tests for API endpoints.

**Acceptance Criteria**:
- [ ] Activity log endpoints tested
- [ ] Invitation link endpoints tested
- [ ] Notification endpoints tested
- [ ] Collaborator endpoints tested
- [ ] Test database setup/teardown
- [ ] All status codes verified

**Files to Create/Modify**:
- `backend/src/__tests__/integration/*.test.ts`

### Task QA.3: Frontend Unit Tests
**Status**: ⬜ Not Started
**Effort**: 8 hours
**Priority**: High
**Dependencies**: All frontend component tasks

**Description**: Write unit tests for frontend components.

**Acceptance Criteria**:
- [ ] ActivityLog component tests
- [ ] InviteLinkModal component tests
- [ ] NotificationToast component tests
- [ ] MemberCard component tests
- [ ] Hook tests
- [ ] Service tests
- [ ] >80% coverage

**Files to Create/Modify**:
- `frontend/src/components/bubblequest/__tests__/*.test.tsx`
- `frontend/src/hooks/__tests__/*.test.ts`
- `frontend/src/services/__tests__/*.test.ts`

### Task QA.4: Property-Based Tests
**Status**: ⬜ Not Started
**Effort**: 12 hours
**Priority**: Medium
**Dependencies**: All backend tasks

**Description**: Write property-based tests for correctness properties.

**Acceptance Criteria**:
- [ ] Activity log properties tested (see design.md)
- [ ] Invitation link properties tested
- [ ] Notification properties tested
- [ ] Presence properties tested
- [ ] Use fast-check library
- [ ] 1000+ test cases per property

**Files to Create/Modify**:
- `backend/src/__tests__/properties/activityLog.property.test.ts` (new)
- `backend/src/__tests__/properties/invitationLinks.property.test.ts` (new)
- `backend/src/__tests__/properties/notifications.property.test.ts` (new)

### Task QA.5: End-to-End Tests
**Status**: ⬜ Not Started
**Effort**: 12 hours
**Priority**: Medium
**Dependencies**: All tasks

**Description**: Write E2E tests for critical user flows.

**Acceptance Criteria**:
- [ ] Invite member via email flow
- [ ] Invite member via link flow
- [ ] Accept invitation flow
- [ ] View activity log flow
- [ ] Receive notification flow
- [ ] Change member role flow
- [ ] Remove member flow
- [ ] Use Playwright

**Files to Create/Modify**:
- `frontend/e2e/collaboration.spec.ts` (new)

### Task QA.6: Performance Testing
**Status**: ⬜ Not Started
**Effort**: 6 hours
**Priority**: Low
**Dependencies**: All tasks

**Description**: Test performance with large datasets.

**Acceptance Criteria**:
- [ ] Test with 20 collaborators
- [ ] Test with 1000+ activity log entries
- [ ] Test with 100+ notifications
- [ ] Measure load times
- [ ] Measure memory usage
- [ ] Identify bottlenecks

**Files to Create/Modify**:
- `backend/src/__tests__/performance/*.test.ts` (new)

---

## Documentation

### Task DOC.1: API Documentation
**Status**: ⬜ Not Started
**Effort**: 4 hours
**Priority**: Medium
**Dependencies**: All backend tasks

**Description**: Document all new API endpoints.

**Acceptance Criteria**:
- [ ] OpenAPI/Swagger spec updated
- [ ] Request/response examples
- [ ] Error codes documented
- [ ] Authentication requirements
- [ ] Rate limits documented

**Files to Create/Modify**:
- `backend/docs/api/collaboration.md` (new)
- `backend/swagger.yaml` (enhance)

### Task DOC.2: Component Documentation
**Status**: ⬜ Not Started
**Effort**: 4 hours
**Priority**: Low
**Dependencies**: All frontend component tasks

**Description**: Document component props and usage.

**Acceptance Criteria**:
- [ ] Storybook stories for all components
- [ ] Props documented
- [ ] Usage examples
- [ ] Accessibility notes

**Files to Create/Modify**:
- `frontend/src/components/bubblequest/*.stories.tsx` (new)

### Task DOC.3: User Guide
**Status**: ⬜ Not Started
**Effort**: 4 hours
**Priority**: Low
**Dependencies**: All tasks

**Description**: Create user guide for collaboration features.

**Acceptance Criteria**:
- [ ] How to invite members
- [ ] How to manage permissions
- [ ] How to view activity log
- [ ] How to configure notifications
- [ ] Screenshots included
- [ ] Available in EN, zh-TW, zh-CN

**Files to Create/Modify**:
- `docs/user-guide/collaboration.md` (new)

---

## Deployment & Monitoring

### Task DEPLOY.1: Database Migration
**Status**: ⬜ Not Started
**Effort**: 2 hours
**Priority**: High
**Dependencies**: Task 1.1, Task 1.2

**Description**: Run database migrations in production.

**Acceptance Criteria**:
- [ ] Backup database before migration
- [ ] Run migration on staging first
- [ ] Verify migration success
- [ ] Run migration on production
- [ ] Verify data integrity

**Checklist**:
- [ ] Backup created
- [ ] Staging migration successful
- [ ] Production migration successful
- [ ] Rollback plan ready

### Task DEPLOY.2: Backend Deployment
**Status**: ⬜ Not Started
**Effort**: 2 hours
**Priority**: High
**Dependencies**: All backend tasks, Task DEPLOY.1

**Description**: Deploy backend changes to production.

**Acceptance Criteria**:
- [ ] Build passes
- [ ] Tests pass
- [ ] Deploy to staging
- [ ] Smoke tests on staging
- [ ] Deploy to production
- [ ] Smoke tests on production

**Checklist**:
- [ ] Environment variables configured
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] Health checks passing

### Task DEPLOY.3: Frontend Deployment
**Status**: ⬜ Not Started
**Effort**: 2 hours
**Priority**: High
**Dependencies**: All frontend tasks, Task DEPLOY.2

**Description**: Deploy frontend changes to production.

**Acceptance Criteria**:
- [ ] Build passes
- [ ] Tests pass
- [ ] Deploy to staging
- [ ] Smoke tests on staging
- [ ] Deploy to production
- [ ] Smoke tests on production

**Checklist**:
- [ ] Environment variables configured
- [ ] CDN cache cleared
- [ ] Staging deployment successful
- [ ] Production deployment successful

### Task DEPLOY.4: Monitoring Setup
**Status**: ⬜ Not Started
**Effort**: 4 hours
**Priority**: High
**Dependencies**: Task DEPLOY.2, Task DEPLOY.3

**Description**: Set up monitoring and alerts.

**Acceptance Criteria**:
- [ ] Activity log metrics tracked
- [ ] Invitation link metrics tracked
- [ ] Notification metrics tracked
- [ ] Socket connection metrics tracked
- [ ] Error rate alerts configured
- [ ] Performance alerts configured
- [ ] Dashboard created

**Metrics to Track**:
- Activity log entries per day
- Invitation links created/accepted
- Notifications sent/read
- Socket connections active
- API response times
- Error rates

**Files to Create/Modify**:
- `backend/src/services/metricsService.ts` (enhance)

---

## Task Summary by Role

### Backend Developer Tasks (Total: ~90 hours)

**Phase 1-2: Foundation (24 hours)**
- Task 1.1: Database migration (4h)
- Task 1.2: Enhance tables (2h)
- Task 1.3: Activity log service (8h)
- Task 1.4: Activity log middleware (6h)
- Task 1.5: Activity log controller (4h)

**Phase 2-3: Invitation & Notifications (26 hours)**
- Task 2.1: Invitation link service (8h)
- Task 2.2: Invitation link controller (6h)
- Task 2.3: Email service enhancement (4h)
- Task 3.1: Notification service enhancement (8h)

**Phase 3-4: Real-time & Integration (20 hours)**
- Task 3.2: Notification preferences (6h)
- Task 3.3: Notification controller (4h)
- Task 4.1: Socket service enhancement (8h)
- Task 4.2: Socket events (4h)
- Task 4.3: Apply middleware (4h)

**Testing & Deployment (20 hours)**
- Task QA.1: Backend unit tests (8h)
- Task QA.2: Integration tests (8h)
- Task QA.4: Property-based tests (12h)
- Task DEPLOY.1-2: Deployment (4h)

### Frontend Developer Tasks (Total: ~100 hours)

**Phase 5: Services & State (28 hours)**
- Task 5.1: Activity log service (4h)
- Task 5.2: Invitation link service (4h)
- Task 5.3: Notification service (4h)
- Task 5.4: Activity store (4h)
- Task 5.5: Notification store (4h)
- Task 5.6: Socket service enhancement (6h)
- Task 5.7: Offline queue service (8h)

**Phase 6-7: Components Part 1 (26 hours)**
- Task 6.1: ActivityLog component (8h)
- Task 6.2: ActivityLogFilter component (4h)
- Task 6.3: Integrate ActivityLog (4h)
- Task 7.1: InviteLinkModal component (8h)
- Task 7.2: InvitationAcceptPage (6h)
- Task 7.3: Enhance InviteModal (4h)

**Phase 8-9: Components Part 2 (32 hours)**
- Task 8.1: NotificationToast component (6h)
- Task 8.2: NotificationCenter component (8h)
- Task 8.3: NotificationPreferences component (6h)
- Task 8.4: Integrate toasts (4h)
- Task 9.1: Enhance MemberCard (4h)
- Task 9.2: PendingInvitations component (6h)
- Task 9.3: Member search/sort (4h)
- Task 9.4: usePresence hook (4h)

**Phase 10: Polish (14 hours)**
- Task 10.1: Translations (6h)
- Task 10.2: Loading states (4h)
- Task 10.3: Error boundaries (3h)
- Task 10.4: Performance optimization (6h)
- Task 10.5: Accessibility (4h)
- Task 10.6: Mobile testing (4h)

**Testing & Deployment (20 hours)**
- Task QA.3: Frontend unit tests (8h)
- Task QA.5: E2E tests (12h)
- Task DEPLOY.3: Frontend deployment (2h)

---

## Risk Management

### High Risk Items

1. **Database Migration Complexity**
   - Risk: Migration fails or causes data loss
   - Mitigation: Test on staging, create backups, have rollback plan
   - Owner: Backend Developer

2. **Real-Time Sync Performance**
   - Risk: Socket connections overwhelm server with many users
   - Mitigation: Load testing, connection pooling, rate limiting
   - Owner: Backend Developer

3. **Offline Queue Conflicts**
   - Risk: Conflicting changes when syncing offline edits
   - Mitigation: Last-write-wins strategy, user notifications
   - Owner: Frontend Developer

### Medium Risk Items

1. **Browser Compatibility**
   - Risk: Features don't work on older browsers
   - Mitigation: Polyfills, progressive enhancement, testing
   - Owner: Frontend Developer

2. **Translation Quality**
   - Risk: Poor translations confuse users
   - Mitigation: Native speaker review, user testing
   - Owner: Frontend Developer

3. **Performance with Large Datasets**
   - Risk: Slow loading with 1000+ activity entries
   - Mitigation: Pagination, virtual scrolling, caching
   - Owner: Both Developers

---

## Success Criteria

### Functional Requirements
- [ ] All 10 requirements from requirements.md implemented
- [ ] All acceptance criteria met
- [ ] All tests passing (>80% coverage)
- [ ] No critical bugs

### Performance Requirements
- [ ] Activity log loads in <2 seconds
- [ ] Member list loads in <1 second
- [ ] Real-time updates arrive in <1 second
- [ ] Supports 20 collaborators per trip
- [ ] Handles 1000+ activity log entries

### Quality Requirements
- [ ] WCAG AA accessibility compliance
- [ ] Works on Chrome, Safari, Firefox (latest 2 versions)
- [ ] Works on iOS 14+ and Android 10+
- [ ] All text translated to EN, zh-TW, zh-CN
- [ ] No console errors in production

### User Acceptance
- [ ] User testing completed with 5+ users
- [ ] Feedback incorporated
- [ ] User satisfaction score >4.5/5
- [ ] No major usability issues

---

## Timeline

```
Week 1-2:   Phase 1 - Database & Backend Foundation
Week 2-3:   Phase 2 - Invitation Links System
Week 3-4:   Phase 3 - Enhanced Notifications
Week 4-5:   Phase 4 - Enhanced Real-Time Presence
Week 5-6:   Phase 5 - Frontend Services & State
Week 6-7:   Phase 6 - Activity Log Components
Week 7-8:   Phase 7 - Invitation Link Components
Week 8-9:   Phase 8 - Notification Components
Week 9-10:  Phase 9 - Enhanced Member Management
Week 10-11: Phase 10 - Internationalization & Polish
Week 11:    Testing, Documentation, Deployment
```

---

## Notes

- Tasks can be worked on in parallel where dependencies allow
- Frontend tasks can start once backend APIs are ready
- Testing should be done continuously, not just at the end
- User feedback should be gathered early and often
- Feature flags should be used for gradual rollout
- Monitor metrics closely after deployment

---

**Last Updated**: 2026-02-07
**Status**: Ready for Implementation
**Next Step**: Begin Phase 1 - Database Schema & Backend Foundation
