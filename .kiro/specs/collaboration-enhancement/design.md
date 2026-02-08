# Collaboration Enhancement Design Document

## Overview

This document describes the design for enhancing the existing collaboration features in the trip planning application. The current implementation provides basic collaboration with invite-by-email, role-based permissions (Owner/Editor/Viewer), and real-time presence via Socket.io. This enhancement adds activity logging, shareable invitation links, enhanced notifications, improved UI/UX, offline support, and performance optimizations.

### Current State

**Backend:**
- `trip_collaborators` table with roles (owner/editor/viewer)
- Collaborator API endpoints (GET, POST, PATCH, DELETE)
- Permission checking functions in database
- Real-time presence via Socket.io
- Basic notification service for collaboration invites

**Frontend:**
- MembersScreen with member management UI
- Member cards with avatars, roles, online status
- Invite by email functionality
- Role management and member removal
- Real-time sync via Socket.io

### What's Being Added

1. **Activity Log System** - Track all changes to trip content
2. **Shareable Invitation Links** - Generate expiring links for easy invites
3. **Enhanced Notifications** - In-app toasts, push notifications, notification preferences
4. **Improved Member Management UI** - Better UX, pending invitations, last active timestamps
5. **Offline Support** - Queue changes, sync on reconnect
6. **Better Presence Indicators** - "Currently editing" status, user count
7. **Internationalization** - Complete translations for EN, zh-TW, zh-CN
8. **Performance Optimizations** - Pagination, caching, optimistic updates


## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  MembersScreen (Enhanced)                                    │
│  ├─ MemberCard (Enhanced with last active)                  │
│  ├─ InviteModal (Enhanced with link generation)             │
│  ├─ ActivityLog (NEW)                                       │
│  ├─ NotificationToast (NEW)                                 │
│  └─ PendingInvitations (NEW)                                │
│                                                              │
│  State Management                                            │
│  ├─ collaboratorStore (Enhanced with offline queue)         │
│  ├─ notificationStore (NEW)                                 │
│  └─ activityStore (NEW)                                     │
│                                                              │
│  Services                                                    │
│  ├─ collaboratorService (Enhanced)                          │
│  ├─ invitationLinkService (NEW)                             │
│  ├─ activityLogService (NEW)                                │
│  ├─ notificationService (Enhanced)                          │
│  └─ offlineQueueService (NEW)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API + WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Controllers                                                 │
│  ├─ collaboratorController (Enhanced)                       │
│  ├─ invitationLinkController (NEW)                          │
│  ├─ activityLogController (NEW)                             │
│  └─ notificationController (Enhanced)                       │
│                                                              │
│  Services                                                    │
│  ├─ socketService (Enhanced with editing status)            │
│  ├─ notificationService (Enhanced)                          │
│  ├─ activityLogService (NEW)                                │
│  └─ emailService (Enhanced)                                 │
│                                                              │
│  Middleware                                                  │
│  ├─ authMiddleware (Existing)                               │
│  ├─ permissionMiddleware (Enhanced)                         │
│  └─ activityLogMiddleware (NEW)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Database Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Existing Tables                                             │
│  ├─ users                                                    │
│  ├─ trips                                                    │
│  ├─ trip_collaborators (Enhanced)                           │
│  └─ notifications (Enhanced)                                │
│                                                              │
│  New Tables                                                  │
│  ├─ invitation_links                                        │
│  └─ activity_log                                            │
└─────────────────────────────────────────────────────────────┘
```


## Database Schema Changes

### New Tables

#### 1. invitation_links

Stores shareable invitation links with expiration.

```sql
CREATE TABLE invitation_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('editor', 'viewer')),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    max_uses INTEGER DEFAULT NULL,  -- NULL = unlimited
    use_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invitation_links_token ON invitation_links(token);
CREATE INDEX idx_invitation_links_trip_id ON invitation_links(trip_id);
CREATE INDEX idx_invitation_links_expires_at ON invitation_links(expires_at);
```

#### 2. activity_log

Tracks all changes to trip content for audit trail.

```sql
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'trip_created', 'trip_updated', 'trip_deleted',
        'day_added', 'day_updated', 'day_deleted',
        'place_added', 'place_updated', 'place_deleted', 'place_reordered',
        'packing_item_added', 'packing_item_updated', 'packing_item_deleted',
        'shopping_item_added', 'shopping_item_updated', 'shopping_item_deleted',
        'collaborator_added', 'collaborator_removed', 'collaborator_role_changed',
        'story_added', 'story_deleted'
    )),
    entity_type VARCHAR(50) NOT NULL,  -- 'trip', 'day', 'place', 'packing_item', etc.
    entity_id UUID,  -- ID of the affected entity
    entity_name TEXT,  -- Human-readable name (e.g., "Day 1 - Tokyo Tower")
    changes JSONB,  -- Detailed change data
    metadata JSONB,  -- Additional context
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_log_trip_id ON activity_log(trip_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_action_type ON activity_log(action_type);
```

### Enhanced Tables

#### trip_collaborators (Add columns)

```sql
ALTER TABLE trip_collaborators 
ADD COLUMN last_active_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN current_editing_entity VARCHAR(50),  -- 'day', 'place', 'packing', etc.
ADD COLUMN current_editing_entity_id UUID;

CREATE INDEX idx_trip_collaborators_last_active ON trip_collaborators(last_active_at DESC);
```

#### notifications (Add columns)

```sql
ALTER TABLE notifications
ADD COLUMN is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN read_at TIMESTAMP,
ADD COLUMN category VARCHAR(50) DEFAULT 'general' CHECK (category IN (
    'collaboration', 'activity', 'mention', 'system'
)),
ADD COLUMN priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN (
    'low', 'normal', 'high', 'urgent'
)),
ADD COLUMN action_url TEXT,
ADD COLUMN expires_at TIMESTAMP;

CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_category ON notifications(category);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```


## API Endpoints

### New Endpoints

#### Invitation Links

```typescript
// Generate a shareable invitation link
POST /api/trips/:tripId/invitation-links
Body: {
  role: 'editor' | 'viewer',
  expiresIn: number,  // hours, default 168 (7 days)
  maxUses?: number    // optional, null = unlimited
}
Response: {
  id: string,
  token: string,
  url: string,  // Full URL: https://app.com/invite/{token}
  role: string,
  expiresAt: string,
  maxUses: number | null,
  useCount: number
}

// Get all invitation links for a trip
GET /api/trips/:tripId/invitation-links
Response: InvitationLink[]

// Revoke an invitation link
DELETE /api/trips/:tripId/invitation-links/:linkId
Response: { message: 'Link revoked' }

// Accept invitation via link
POST /api/invitation-links/:token/accept
Response: {
  trip: Trip,
  collaborator: TripCollaboratorWithUser
}

// Get invitation link details (public, no auth required)
GET /api/invitation-links/:token
Response: {
  tripTitle: string,
  tripDestination: string,
  role: string,
  inviterName: string,
  expiresAt: string,
  isValid: boolean
}
```

#### Activity Log

```typescript
// Get activity log for a trip
GET /api/trips/:tripId/activity-log
Query: {
  limit?: number,      // default 50
  offset?: number,     // default 0
  actionType?: string, // filter by action type
  userId?: string,     // filter by user
  startDate?: string,  // filter by date range
  endDate?: string
}
Response: {
  activities: ActivityLogEntry[],
  total: number,
  hasMore: boolean
}

// Get activity log summary (counts by type)
GET /api/trips/:tripId/activity-log/summary
Response: {
  totalActivities: number,
  byActionType: { [key: string]: number },
  byUser: { [userId: string]: number },
  recentActivity: ActivityLogEntry[]
}
```

#### Notifications

```typescript
// Get user notifications
GET /api/notifications
Query: {
  limit?: number,
  offset?: number,
  category?: string,
  isRead?: boolean
}
Response: {
  notifications: Notification[],
  total: number,
  unreadCount: number
}

// Mark notification as read
PATCH /api/notifications/:notificationId/read
Response: Notification

// Mark all notifications as read
POST /api/notifications/mark-all-read
Response: { count: number }

// Delete notification
DELETE /api/notifications/:notificationId
Response: { message: 'Notification deleted' }

// Get notification preferences
GET /api/users/notification-preferences
Response: NotificationPreferences

// Update notification preferences
PATCH /api/users/notification-preferences
Body: NotificationPreferences
Response: NotificationPreferences
```

### Enhanced Endpoints

#### Collaborators

```typescript
// Enhanced: Get collaborators with last active and online status
GET /api/trips/:tripId/collaborators
Response: TripCollaboratorWithUser[] (includes last_active_at, is_online)

// Enhanced: Add collaborator with notification preferences
POST /api/trips/:tripId/collaborators
Body: {
  email?: string,
  user_id?: string,
  role: 'editor' | 'viewer',
  sendNotification?: boolean  // default true
}
Response: TripCollaboratorWithUser
```


## Components and Interfaces

### Frontend Components

#### 1. ActivityLog Component (NEW)

Displays chronological list of trip changes.

```typescript
interface ActivityLogProps {
  tripId: string;
  limit?: number;
  showFilters?: boolean;
}

interface ActivityLogEntry {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  actionType: string;
  entityType: string;
  entityId: string;
  entityName: string;
  changes: any;
  metadata: any;
  createdAt: string;
}

// Features:
// - Grouped by date (Today, Yesterday, Last Week, etc.)
// - Relative timestamps (2 mins ago, 1 hour ago)
// - User avatars
// - Action icons (add, edit, delete)
// - Filter by action type
// - Infinite scroll / pagination
// - Skeleton loading states
```

#### 2. InviteLinkModal Component (NEW)

Generate and manage shareable invitation links.

```typescript
interface InviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
}

interface InvitationLink {
  id: string;
  token: string;
  url: string;
  role: 'editor' | 'viewer';
  expiresAt: string;
  maxUses: number | null;
  useCount: number;
  isActive: boolean;
  createdAt: string;
}

// Features:
// - Generate new link with role selection
// - Set expiration (1 day, 7 days, 30 days, custom)
// - Set max uses (optional)
// - Copy link to clipboard
// - View existing links
// - Revoke links
// - Show use count
```

#### 3. PendingInvitations Component (NEW)

Display pending invitations in members list.

```typescript
interface PendingInvitationsProps {
  tripId: string;
  onCancel: (invitationId: string) => void;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: 'editor' | 'viewer';
  invitedBy: string;
  invitedAt: string;
  status: 'pending' | 'accepted' | 'expired';
}

// Features:
// - Show pending email invitations
// - Show pending link invitations (if tracked)
// - Cancel invitation button
// - Resend invitation button
// - Status badges
```

#### 4. NotificationToast Component (NEW)

In-app toast notifications for real-time updates.

```typescript
interface NotificationToastProps {
  notification: ToastNotification;
  onDismiss: () => void;
}

interface ToastNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;  // ms, default 5000
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Features:
// - Auto-dismiss after duration
// - Slide-in animation
// - Stack multiple toasts
// - Action button (optional)
// - Dismiss button
// - Different styles per type
```

#### 5. NotificationCenter Component (NEW)

Notification history and preferences.

```typescript
interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  category: 'collaboration' | 'activity' | 'mention' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string;
  data: any;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// Features:
// - List all notifications
// - Filter by category
// - Mark as read/unread
// - Delete notifications
// - Clear all
// - Notification preferences
```

#### 6. Enhanced MemberCard Component

Add last active timestamp and editing status.

```typescript
interface MemberCardProps {
  member: TripCollaboratorWithUser;
  isOnline: boolean;
  isOwner: boolean;
  canManage: boolean;
  lastActiveAt?: string;  // NEW
  currentlyEditing?: string;  // NEW - "Day 1", "Packing List", etc.
  onRoleChange?: (memberId: string, newRole: CollaboratorRole) => void;
  onRemove?: (memberId: string) => void;
}

// New features:
// - Show "Last active: 2 hours ago"
// - Show "Currently editing: Day 1" badge
// - Pulse animation when editing
```


## Data Models

### TypeScript Interfaces

```typescript
// Activity Log
export interface ActivityLogEntry {
  id: string;
  tripId: string;
  userId: string | null;
  userName: string;
  userAvatar?: string;
  actionType: ActivityActionType;
  entityType: string;
  entityId: string;
  entityName: string;
  changes: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: string;
}

export type ActivityActionType =
  | 'trip_created' | 'trip_updated' | 'trip_deleted'
  | 'day_added' | 'day_updated' | 'day_deleted'
  | 'place_added' | 'place_updated' | 'place_deleted' | 'place_reordered'
  | 'packing_item_added' | 'packing_item_updated' | 'packing_item_deleted'
  | 'shopping_item_added' | 'shopping_item_updated' | 'shopping_item_deleted'
  | 'collaborator_added' | 'collaborator_removed' | 'collaborator_role_changed'
  | 'story_added' | 'story_deleted';

// Invitation Links
export interface InvitationLink {
  id: string;
  tripId: string;
  token: string;
  url: string;
  role: 'editor' | 'viewer';
  createdBy: string;
  createdByName: string;
  expiresAt: string;
  maxUses: number | null;
  useCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationLinkDto {
  role: 'editor' | 'viewer';
  expiresIn?: number;  // hours
  maxUses?: number | null;
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: Record<string, any>;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export type NotificationCategory = 'collaboration' | 'activity' | 'mention' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  notifyOnCollaboratorJoined: boolean;
  notifyOnItemAdded: boolean;
  notifyOnItemEdited: boolean;
  notifyOnItemDeleted: boolean;
  notifyOnScheduleChanged: boolean;
  notifyOnMention: boolean;
  batchNotifications: boolean;
  batchInterval: number;  // minutes
  quietHoursEnabled: boolean;
  quietHoursStart?: string;  // HH:mm
  quietHoursEnd?: string;    // HH:mm
}

// Enhanced Collaborator
export interface TripCollaboratorWithUser extends TripCollaborator {
  user: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  inviter?: {
    id: string;
    name: string;
  };
  lastActiveAt?: string;  // NEW
  isOnline: boolean;      // NEW
  currentEditingEntity?: string;     // NEW
  currentEditingEntityId?: string;   // NEW
}

// Offline Queue
export interface OfflineQueueItem {
  id: string;
  tripId: string;
  action: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data: any;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

// Presence
export interface PresenceUpdate {
  userId: string;
  tripId: string;
  isOnline: boolean;
  editingEntity?: string;
  editingEntityId?: string;
  timestamp: string;
}
```


## Real-Time Sync Implementation

### WebSocket Events

#### Enhanced Socket Events

```typescript
// Client → Server
socket.emit('presence:update', {
  tripId: string,
  editingEntity?: string,  // 'day', 'place', 'packing', etc.
  editingEntityId?: string
});

socket.emit('activity:subscribe', {
  tripId: string
});

socket.emit('activity:unsubscribe', {
  tripId: string
});

// Server → Client
socket.on('presence:update', (data: {
  tripId: string,
  userId: string,
  isOnline: boolean,
  editingEntity?: string,
  editingEntityId?: string,
  timestamp: string
}) => {
  // Update presence state
});

socket.on('activity:new', (data: {
  tripId: string,
  activity: ActivityLogEntry,
  timestamp: string
}) => {
  // Add to activity log
  // Show toast notification
});

socket.on('collaborator:joined', (data: {
  tripId: string,
  collaborator: TripCollaboratorWithUser,
  timestamp: string
}) => {
  // Add to members list
  // Show toast notification
});

socket.on('collaborator:left', (data: {
  tripId: string,
  userId: string,
  timestamp: string
}) => {
  // Remove from members list
  // Show toast notification
});

socket.on('collaborator:role_changed', (data: {
  tripId: string,
  userId: string,
  newRole: string,
  timestamp: string
}) => {
  // Update member role
  // Show toast notification
});

socket.on('notification:new', (data: {
  notification: Notification,
  timestamp: string
}) => {
  // Show toast notification
  // Update notification center
});
```

### Presence Tracking

#### Backend Implementation

```typescript
// socketService.ts enhancements

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
  private presenceMap: Map<string, UserPresence> = new Map();
  
  // Update presence when user starts editing
  updatePresence(socket: AuthenticatedSocket, data: {
    tripId: string;
    editingEntity?: string;
    editingEntityId?: string;
  }) {
    const presence: UserPresence = {
      userId: socket.userId!,
      socketId: socket.id,
      tripId: data.tripId,
      isOnline: true,
      editingEntity: data.editingEntity,
      editingEntityId: data.editingEntityId,
      lastUpdate: new Date()
    };
    
    this.presenceMap.set(socket.userId!, presence);
    
    // Update database
    this.updateDatabasePresence(socket.userId!, data.tripId, presence);
    
    // Broadcast to room
    this.emitPresenceUpdate(data.tripId);
  }
  
  // Update database with presence info
  async updateDatabasePresence(userId: string, tripId: string, presence: UserPresence) {
    await pool.query(
      `UPDATE trip_collaborators 
       SET last_active_at = NOW(),
           is_online = $1,
           current_editing_entity = $2,
           current_editing_entity_id = $3
       WHERE user_id = $4 AND trip_id = $5`,
      [presence.isOnline, presence.editingEntity, presence.editingEntityId, userId, tripId]
    );
  }
  
  // Clean up stale presence (run every 30 seconds)
  cleanupStalePresence() {
    const staleThreshold = 60000; // 1 minute
    const now = Date.now();
    
    for (const [userId, presence] of this.presenceMap.entries()) {
      if (now - presence.lastUpdate.getTime() > staleThreshold) {
        this.presenceMap.delete(userId);
        this.updateDatabasePresence(userId, presence.tripId, {
          ...presence,
          isOnline: false,
          editingEntity: undefined,
          editingEntityId: undefined
        });
      }
    }
  }
}
```

#### Frontend Implementation

```typescript
// usePresence hook

export function usePresence(tripId: string) {
  const [presenceMap, setPresenceMap] = useState<Map<string, UserPresence>>(new Map());
  
  useEffect(() => {
    if (!tripId) return;
    
    // Subscribe to presence updates
    socketService.on({
      onPresenceUpdate: (data: PresenceUpdate) => {
        setPresenceMap(prev => {
          const updated = new Map(prev);
          if (data.isOnline) {
            updated.set(data.userId, {
              userId: data.userId,
              isOnline: true,
              editingEntity: data.editingEntity,
              editingEntityId: data.editingEntityId,
              lastUpdate: new Date(data.timestamp)
            });
          } else {
            updated.delete(data.userId);
          }
          return updated;
        });
      }
    });
    
    return () => {
      socketService.off(['onPresenceUpdate']);
    };
  }, [tripId]);
  
  // Send presence update when user starts editing
  const updatePresence = useCallback((editingEntity?: string, editingEntityId?: string) => {
    socketService.emit('presence:update', {
      tripId,
      editingEntity,
      editingEntityId
    });
  }, [tripId]);
  
  return { presenceMap, updatePresence };
}
```


## Activity Log System

### Activity Logging Middleware

Automatically log all changes to trip content.

```typescript
// activityLogMiddleware.ts

export const activityLogMiddleware = (
  actionType: ActivityActionType,
  entityType: string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data: any) {
      // Log activity after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.userId;
        const tripId = req.params.tripId || data.trip_id;
        
        if (userId && tripId) {
          activityLogService.logActivity({
            tripId,
            userId,
            actionType,
            entityType,
            entityId: data.id || req.params.id,
            entityName: extractEntityName(data, entityType),
            changes: extractChanges(req.body, data),
            metadata: {
              ip: req.ip,
              userAgent: req.get('user-agent')
            }
          }).catch(err => {
            console.error('Failed to log activity:', err);
          });
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

// Helper functions
function extractEntityName(data: any, entityType: string): string {
  switch (entityType) {
    case 'place':
      return data.name || 'Unnamed place';
    case 'day':
      return data.title || `Day ${data.day_number}`;
    case 'packing_item':
      return data.item_name || 'Unnamed item';
    case 'shopping_item':
      return data.name || 'Unnamed item';
    default:
      return data.title || data.name || 'Unnamed';
  }
}

function extractChanges(requestBody: any, responseData: any): Record<string, any> {
  // Compare request body with response to extract what changed
  const changes: Record<string, any> = {};
  
  for (const key in requestBody) {
    if (requestBody[key] !== responseData[key]) {
      changes[key] = {
        from: responseData[key],
        to: requestBody[key]
      };
    }
  }
  
  return changes;
}
```

### Activity Log Service

```typescript
// activityLogService.ts

export class ActivityLogService {
  async logActivity(data: {
    tripId: string;
    userId: string;
    actionType: ActivityActionType;
    entityType: string;
    entityId: string;
    entityName: string;
    changes: Record<string, any>;
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO activity_log 
         (trip_id, user_id, action_type, entity_type, entity_id, entity_name, changes, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          data.tripId,
          data.userId,
          data.actionType,
          data.entityType,
          data.entityId,
          data.entityName,
          JSON.stringify(data.changes),
          JSON.stringify(data.metadata)
        ]
      );
      
      // Emit real-time event
      socketService.emitActivityLog(data.tripId, {
        ...data,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      throw error;
    }
  }
  
  async getActivityLog(
    tripId: string,
    options: {
      limit?: number;
      offset?: number;
      actionType?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ activities: ActivityLogEntry[]; total: number; hasMore: boolean }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    
    let query = `
      SELECT 
        al.*,
        u.name as user_name,
        u.profile_picture as user_avatar
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.trip_id = $1
    `;
    
    const params: any[] = [tripId];
    let paramIndex = 2;
    
    if (options.actionType) {
      query += ` AND al.action_type = $${paramIndex}`;
      params.push(options.actionType);
      paramIndex++;
    }
    
    if (options.userId) {
      query += ` AND al.user_id = $${paramIndex}`;
      params.push(options.userId);
      paramIndex++;
    }
    
    if (options.startDate) {
      query += ` AND al.created_at >= $${paramIndex}`;
      params.push(options.startDate);
      paramIndex++;
    }
    
    if (options.endDate) {
      query += ` AND al.created_at <= $${paramIndex}`;
      params.push(options.endDate);
      paramIndex++;
    }
    
    query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM activity_log WHERE trip_id = $1',
      [tripId]
    );
    const total = parseInt(countResult.rows[0].count);
    
    return {
      activities: result.rows.map(row => ({
        id: row.id,
        tripId: row.trip_id,
        userId: row.user_id,
        userName: row.user_name,
        userAvatar: row.user_avatar,
        actionType: row.action_type,
        entityType: row.entity_type,
        entityId: row.entity_id,
        entityName: row.entity_name,
        changes: row.changes,
        metadata: row.metadata,
        createdAt: row.created_at
      })),
      total,
      hasMore: offset + limit < total
    };
  }
}

export const activityLogService = new ActivityLogService();
```

### Frontend Activity Log Component

```typescript
// ActivityLog.tsx

export const ActivityLog: React.FC<ActivityLogProps> = ({ tripId, limit = 50 }) => {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  
  // Fetch initial activities
  useEffect(() => {
    fetchActivities();
  }, [tripId, filter]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    socketService.on({
      onActivityNew: (data: { activity: ActivityLogEntry }) => {
        setActivities(prev => [data.activity, ...prev]);
      }
    });
    
    return () => {
      socketService.off(['onActivityNew']);
    };
  }, []);
  
  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const response = await activityLogService.getActivityLog(tripId, {
        limit,
        actionType: filter || undefined
      });
      setActivities(response.activities);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: { [key: string]: ActivityLogEntry[] } = {};
    
    activities.forEach(activity => {
      const date = formatDateGroup(activity.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });
    
    return groups;
  }, [activities]);
  
  return (
    <div className="activity-log">
      {/* Filter buttons */}
      <div className="filters">
        <button onClick={() => setFilter(null)}>All</button>
        <button onClick={() => setFilter('place_added')}>Places</button>
        <button onClick={() => setFilter('packing_item_added')}>Packing</button>
        <button onClick={() => setFilter('collaborator_added')}>Members</button>
      </div>
      
      {/* Activity list */}
      {Object.entries(groupedActivities).map(([date, items]) => (
        <div key={date} className="activity-group">
          <h3>{date}</h3>
          {items.map(activity => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      ))}
      
      {/* Load more */}
      {hasMore && (
        <button onClick={() => fetchActivities()}>Load More</button>
      )}
    </div>
  );
};

function formatDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This Week';
  if (diffDays < 30) return 'This Month';
  return date.toLocaleDateString();
}
```


## Notification System

### Enhanced Notification Service

```typescript
// notificationService.ts (Enhanced)

export class NotificationService {
  // Create notification with category and priority
  static async createNotification(data: {
    userId: string;
    type: string;
    category: NotificationCategory;
    priority: NotificationPriority;
    title: string;
    message: string;
    actionUrl?: string;
    data?: any;
    expiresAt?: Date;
  }): Promise<Notification> {
    const result = await pool.query(
      `INSERT INTO notifications 
       (user_id, type, category, priority, title, message, action_url, data, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.userId,
        data.type,
        data.category,
        data.priority,
        data.title,
        data.message,
        data.actionUrl,
        JSON.stringify(data.data || {}),
        data.expiresAt
      ]
    );
    
    const notification = result.rows[0];
    
    // Emit real-time notification
    socketService.emitNotification(data.userId, notification);
    
    return notification;
  }
  
  // Batch notifications (group similar notifications)
  static async batchNotifications(
    userId: string,
    notifications: Array<{ type: string; data: any }>
  ): Promise<void> {
    // Group by type
    const grouped = notifications.reduce((acc, notif) => {
      if (!acc[notif.type]) {
        acc[notif.type] = [];
      }
      acc[notif.type].push(notif.data);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Create batched notifications
    for (const [type, items] of Object.entries(grouped)) {
      const message = this.formatBatchMessage(type, items);
      await this.createNotification({
        userId,
        type,
        category: 'activity',
        priority: 'normal',
        title: 'Activity Update',
        message,
        data: { items }
      });
    }
  }
  
  private static formatBatchMessage(type: string, items: any[]): string {
    const count = items.length;
    switch (type) {
      case 'place_added':
        return `${count} new ${count === 1 ? 'place' : 'places'} added`;
      case 'packing_item_added':
        return `${count} new packing ${count === 1 ? 'item' : 'items'} added`;
      default:
        return `${count} new ${count === 1 ? 'update' : 'updates'}`;
    }
  }
  
  // Activity-specific notifications
  static async notifyActivityChange(
    tripId: string,
    activity: ActivityLogEntry,
    excludeUserId?: string
  ): Promise<void> {
    // Get all collaborators except the one who made the change
    const collaborators = await pool.query(
      `SELECT user_id FROM trip_collaborators 
       WHERE trip_id = $1 AND user_id != $2`,
      [tripId, excludeUserId]
    );
    
    // Get notification preferences for each user
    for (const collab of collaborators.rows) {
      const prefs = await this.getNotificationPreferences(collab.user_id);
      
      // Check if user wants this type of notification
      if (this.shouldNotify(prefs, activity.actionType)) {
        await this.createNotification({
          userId: collab.user_id,
          type: activity.actionType,
          category: 'activity',
          priority: this.getPriority(activity.actionType),
          title: this.formatActivityTitle(activity),
          message: this.formatActivityMessage(activity),
          actionUrl: `/trips/${tripId}`,
          data: { activity }
        });
      }
    }
  }
  
  private static shouldNotify(
    prefs: NotificationPreferences,
    actionType: string
  ): boolean {
    if (!prefs.inAppNotifications) return false;
    
    switch (actionType) {
      case 'place_added':
      case 'packing_item_added':
      case 'shopping_item_added':
        return prefs.notifyOnItemAdded;
      case 'place_updated':
      case 'packing_item_updated':
      case 'shopping_item_updated':
        return prefs.notifyOnItemEdited;
      case 'place_deleted':
      case 'packing_item_deleted':
      case 'shopping_item_deleted':
        return prefs.notifyOnItemDeleted;
      case 'collaborator_added':
        return prefs.notifyOnCollaboratorJoined;
      default:
        return true;
    }
  }
  
  private static getPriority(actionType: string): NotificationPriority {
    const highPriority = [
      'trip_deleted',
      'collaborator_removed',
      'collaborator_role_changed'
    ];
    
    return highPriority.includes(actionType) ? 'high' : 'normal';
  }
  
  private static formatActivityTitle(activity: ActivityLogEntry): string {
    const action = activity.actionType.split('_')[1]; // 'added', 'updated', 'deleted'
    return `${activity.userName} ${action} ${activity.entityName}`;
  }
  
  private static formatActivityMessage(activity: ActivityLogEntry): string {
    return `${activity.userName} ${activity.actionType.replace('_', ' ')} "${activity.entityName}"`;
  }
  
  // Get notification preferences
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Return defaults
      return {
        userId,
        emailNotifications: true,
        pushNotifications: true,
        inAppNotifications: true,
        notifyOnCollaboratorJoined: true,
        notifyOnItemAdded: true,
        notifyOnItemEdited: false,
        notifyOnItemDeleted: true,
        notifyOnScheduleChanged: true,
        notifyOnMention: true,
        batchNotifications: true,
        batchInterval: 5,
        quietHoursEnabled: false
      };
    }
    
    return result.rows[0];
  }
}
```

### Frontend Notification System

```typescript
// useNotifications hook

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  
  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  // Subscribe to real-time notifications
  useEffect(() => {
    socketService.on({
      onNotificationNew: (data: { notification: Notification }) => {
        setNotifications(prev => [data.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast
        showToast({
          id: data.notification.id,
          type: 'info',
          title: data.notification.title,
          message: data.notification.message,
          duration: 5000,
          action: data.notification.actionUrl ? {
            label: 'View',
            onClick: () => {
              window.location.href = data.notification.actionUrl!;
            }
          } : undefined
        });
      }
    });
    
    return () => {
      socketService.off(['onNotificationNew']);
    };
  }, []);
  
  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications({
        limit: 50
      });
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };
  
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };
  
  const showToast = (toast: ToastNotification) => {
    setToasts(prev => [...prev, toast]);
    
    // Auto-dismiss after duration
    setTimeout(() => {
      dismissToast(toast.id);
    }, toast.duration || 5000);
  };
  
  const dismissToast = (toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };
  
  return {
    notifications,
    unreadCount,
    toasts,
    markAsRead,
    markAllAsRead,
    showToast,
    dismissToast
  };
}
```


## Offline Support

### Offline Queue System

```typescript
// offlineQueueService.ts

export class OfflineQueueService {
  private queue: OfflineQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  
  constructor() {
    // Load queue from localStorage
    this.loadQueue();
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }
  
  // Add item to queue
  enqueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>) {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending'
    };
    
    this.queue.push(queueItem);
    this.saveQueue();
    
    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncQueue();
    }
  }
  
  // Sync queue when back online
  private async syncQueue() {
    if (this.isSyncing || !this.isOnline || this.queue.length === 0) {
      return;
    }
    
    this.isSyncing = true;
    
    // Process queue items in order
    for (const item of this.queue) {
      if (item.status === 'synced') continue;
      
      try {
        item.status = 'syncing';
        this.saveQueue();
        
        // Execute the queued request
        await this.executeRequest(item);
        
        item.status = 'synced';
        this.saveQueue();
      } catch (error) {
        console.error('Failed to sync queue item:', error);
        item.retryCount++;
        
        if (item.retryCount >= 3) {
          item.status = 'failed';
        } else {
          item.status = 'pending';
        }
        
        this.saveQueue();
      }
    }
    
    // Remove synced items
    this.queue = this.queue.filter(item => item.status !== 'synced');
    this.saveQueue();
    
    this.isSyncing = false;
  }
  
  private async executeRequest(item: OfflineQueueItem): Promise<void> {
    const token = useAuthStore.getState().accessToken;
    
    switch (item.method) {
      case 'POST':
        await api.post(item.endpoint, item.data, { token });
        break;
      case 'PATCH':
        await api.patch(item.endpoint, item.data, { token });
        break;
      case 'DELETE':
        await api.delete(item.endpoint, { token });
        break;
      default:
        throw new Error(`Unsupported method: ${item.method}`);
    }
  }
  
  private handleOnline() {
    this.isOnline = true;
    console.log('Back online, syncing queue...');
    this.syncQueue();
  }
  
  private handleOffline() {
    this.isOnline = false;
    console.log('Offline mode activated');
  }
  
  private loadQueue() {
    try {
      const stored = localStorage.getItem('offline_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }
  
  private saveQueue() {
    try {
      localStorage.setItem('offline_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }
  
  // Get queue status
  getQueueStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.queue.filter(i => i.status === 'pending').length,
      failedCount: this.queue.filter(i => i.status === 'failed').length
    };
  }
}

export const offlineQueueService = new OfflineQueueService();
```

### Offline-Aware API Wrapper

```typescript
// api.ts (Enhanced)

export const api = {
  async post<T>(endpoint: string, data: any, options?: RequestOptions): Promise<T> {
    // Check if online
    if (!navigator.onLine) {
      // Queue for later
      offlineQueueService.enqueue({
        tripId: data.trip_id || data.tripId,
        action: 'create',
        endpoint,
        method: 'POST',
        data
      });
      
      // Return optimistic response
      return {
        ...data,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        _offline: true
      } as T;
    }
    
    // Normal online request
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  },
  
  async patch<T>(endpoint: string, data: any, options?: RequestOptions): Promise<T> {
    if (!navigator.onLine) {
      offlineQueueService.enqueue({
        tripId: data.trip_id || data.tripId,
        action: 'update',
        endpoint,
        method: 'PATCH',
        data
      });
      
      return {
        ...data,
        updated_at: new Date().toISOString(),
        _offline: true
      } as T;
    }
    
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options
    });
  },
  
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    if (!navigator.onLine) {
      offlineQueueService.enqueue({
        tripId: extractTripId(endpoint),
        action: 'delete',
        endpoint,
        method: 'DELETE',
        data: {}
      });
      
      return { success: true, _offline: true } as T;
    }
    
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options
    });
  }
};
```

### Offline Banner Component

```typescript
// OfflineBanner.tsx

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueStatus, setQueueStatus] = useState(offlineQueueService.getQueueStatus());
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Update queue status every second
    const interval = setInterval(() => {
      setQueueStatus(offlineQueueService.getQueueStatus());
    }, 1000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  
  if (isOnline && queueStatus.pendingCount === 0) {
    return null;
  }
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      exit={{ y: -100 }}
    >
      {!isOnline ? (
        <div className="flex items-center justify-center gap-2">
          <WifiOffIcon className="w-5 h-5" />
          <span>You're offline. Changes will sync when you reconnect.</span>
        </div>
      ) : queueStatus.isSyncing ? (
        <div className="flex items-center justify-center gap-2">
          <LoadingSpinner className="w-5 h-5" />
          <span>Syncing {queueStatus.pendingCount} changes...</span>
        </div>
      ) : queueStatus.failedCount > 0 ? (
        <div className="flex items-center justify-center gap-2">
          <ExclamationIcon className="w-5 h-5" />
          <span>{queueStatus.failedCount} changes failed to sync. Please try again.</span>
        </div>
      ) : null}
    </motion.div>
  );
};
```


## Invitation Link System

### Backend Implementation

```typescript
// invitationLinkController.ts

export const generateInvitationLink = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { role, expiresIn = 168, maxUses = null } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if user is owner
    const ownerCheck = await pool.query(
      'SELECT user_owns_trip($1, $2) as is_owner',
      [userId, tripId]
    );
    
    if (!ownerCheck.rows[0].is_owner) {
      return res.status(403).json({ error: 'Only trip owners can generate invitation links' });
    }
    
    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresIn);
    
    // Create invitation link
    const result = await pool.query(
      `INSERT INTO invitation_links 
       (trip_id, token, role, created_by, expires_at, max_uses)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tripId, token, role, userId, expiresAt, maxUses]
    );
    
    const link = result.rows[0];
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    res.json({
      ...link,
      url: `${baseUrl}/invite/${token}`
    });
  } catch (error) {
    console.error('Error generating invitation link:', error);
    res.status(500).json({ error: 'Failed to generate invitation link' });
  }
};

export const getInvitationLinks = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if user is owner
    const ownerCheck = await pool.query(
      'SELECT user_owns_trip($1, $2) as is_owner',
      [userId, tripId]
    );
    
    if (!ownerCheck.rows[0].is_owner) {
      return res.status(403).json({ error: 'Only trip owners can view invitation links' });
    }
    
    // Get all active links
    const result = await pool.query(
      `SELECT 
        il.*,
        u.name as created_by_name
       FROM invitation_links il
       JOIN users u ON il.created_by = u.id
       WHERE il.trip_id = $1 AND il.is_active = true
       ORDER BY il.created_at DESC`,
      [tripId]
    );
    
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    res.json(result.rows.map(link => ({
      ...link,
      url: `${baseUrl}/invite/${link.token}`
    })));
  } catch (error) {
    console.error('Error fetching invitation links:', error);
    res.status(500).json({ error: 'Failed to fetch invitation links' });
  }
};

export const revokeInvitationLink = async (req: Request, res: Response) => {
  try {
    const { tripId, linkId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if user is owner
    const ownerCheck = await pool.query(
      'SELECT user_owns_trip($1, $2) as is_owner',
      [userId, tripId]
    );
    
    if (!ownerCheck.rows[0].is_owner) {
      return res.status(403).json({ error: 'Only trip owners can revoke invitation links' });
    }
    
    // Revoke link
    await pool.query(
      'UPDATE invitation_links SET is_active = false WHERE id = $1 AND trip_id = $2',
      [linkId, tripId]
    );
    
    res.json({ message: 'Link revoked successfully' });
  } catch (error) {
    console.error('Error revoking invitation link:', error);
    res.status(500).json({ error: 'Failed to revoke invitation link' });
  }
};

export const getInvitationLinkDetails = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    // Get link details (public endpoint, no auth required)
    const result = await pool.query(
      `SELECT 
        il.*,
        t.title as trip_title,
        t.destination as trip_destination,
        u.name as inviter_name
       FROM invitation_links il
       JOIN trips t ON il.trip_id = t.id
       JOIN users u ON il.created_by = u.id
       WHERE il.token = $1`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation link not found' });
    }
    
    const link = result.rows[0];
    
    // Check if link is valid
    const isValid = 
      link.is_active &&
      new Date(link.expires_at) > new Date() &&
      (link.max_uses === null || link.use_count < link.max_uses);
    
    res.json({
      tripTitle: link.trip_title,
      tripDestination: link.trip_destination,
      role: link.role,
      inviterName: link.inviter_name,
      expiresAt: link.expires_at,
      isValid
    });
  } catch (error) {
    console.error('Error fetching invitation link details:', error);
    res.status(500).json({ error: 'Failed to fetch invitation link details' });
  }
};

export const acceptInvitationLink = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get link details
    const linkResult = await pool.query(
      `SELECT * FROM invitation_links WHERE token = $1`,
      [token]
    );
    
    if (linkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation link not found' });
    }
    
    const link = linkResult.rows[0];
    
    // Validate link
    if (!link.is_active) {
      return res.status(400).json({ error: 'This invitation link has been revoked' });
    }
    
    if (new Date(link.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This invitation link has expired' });
    }
    
    if (link.max_uses !== null && link.use_count >= link.max_uses) {
      return res.status(400).json({ error: 'This invitation link has reached its maximum uses' });
    }
    
    // Check if user is already a collaborator
    const existingCheck = await pool.query(
      'SELECT id FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2',
      [link.trip_id, userId]
    );
    
    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ error: 'You are already a collaborator on this trip' });
    }
    
    // Add user as collaborator
    const collaboratorResult = await pool.query(
      `INSERT INTO trip_collaborators (trip_id, user_id, role, invited_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [link.trip_id, userId, link.role, link.created_by]
    );
    
    // Increment use count
    await pool.query(
      'UPDATE invitation_links SET use_count = use_count + 1 WHERE id = $1',
      [link.id]
    );
    
    // Get trip details
    const tripResult = await pool.query(
      'SELECT * FROM trips WHERE id = $1',
      [link.trip_id]
    );
    
    // Get user details
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [userId]
    );
    
    res.json({
      trip: tripResult.rows[0],
      collaborator: {
        ...collaboratorResult.rows[0],
        user: userResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Error accepting invitation link:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
};
```

### Frontend Invitation Link Components

```typescript
// InviteLinkModal.tsx

export const InviteLinkModal: React.FC<InviteLinkModalProps> = ({ isOpen, onClose, tripId }) => {
  const [links, setLinks] = useState<InvitationLink[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [expiresIn, setExpiresIn] = useState(168); // 7 days
  const { success: showSuccess, error: showError } = useToast();
  
  useEffect(() => {
    if (isOpen) {
      fetchLinks();
    }
  }, [isOpen]);
  
  const fetchLinks = async () => {
    try {
      const response = await invitationLinkService.getInvitationLinks(tripId);
      setLinks(response);
    } catch (error) {
      console.error('Failed to fetch links:', error);
    }
  };
  
  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const link = await invitationLinkService.generateInvitationLink(tripId, {
        role,
        expiresIn
      });
      setLinks(prev => [link, ...prev]);
      showSuccess('Invitation link generated!');
    } catch (error: any) {
      showError(error.message || 'Failed to generate link');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showSuccess('Link copied to clipboard!');
    } catch (error) {
      showError('Failed to copy link');
    }
  };
  
  const handleRevoke = async (linkId: string) => {
    try {
      await invitationLinkService.revokeInvitationLink(tripId, linkId);
      setLinks(prev => prev.filter(l => l.id !== linkId));
      showSuccess('Link revoked');
    } catch (error: any) {
      showError(error.message || 'Failed to revoke link');
    }
  };
  
  return (
    <KawaiiModal isOpen={isOpen} onClose={onClose} title="Shareable Invitation Links">
      {/* Generate new link section */}
      <div className="mb-6 p-4 bg-kawaii-primary-50 rounded-lg">
        <h3 className="font-semibold mb-3">Generate New Link</h3>
        
        {/* Role selection */}
        <div className="mb-3">
          <label className="block text-sm mb-2">Role</label>
          <div className="flex gap-2">
            <button
              onClick={() => setRole('editor')}
              className={cn(
                'flex-1 py-2 rounded-lg',
                role === 'editor' ? 'bg-kawaii-primary-500 text-white' : 'bg-white'
              )}
            >
              Editor
            </button>
            <button
              onClick={() => setRole('viewer')}
              className={cn(
                'flex-1 py-2 rounded-lg',
                role === 'viewer' ? 'bg-kawaii-primary-500 text-white' : 'bg-white'
              )}
            >
              Viewer
            </button>
          </div>
        </div>
        
        {/* Expiration selection */}
        <div className="mb-3">
          <label className="block text-sm mb-2">Expires In</label>
          <select
            value={expiresIn}
            onChange={(e) => setExpiresIn(Number(e.target.value))}
            className="w-full p-2 rounded-lg border"
          >
            <option value={24}>1 day</option>
            <option value={168}>7 days</option>
            <option value={720}>30 days</option>
          </select>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-2 bg-kawaii-primary-500 text-white rounded-lg"
        >
          {isGenerating ? 'Generating...' : 'Generate Link'}
        </button>
      </div>
      
      {/* Existing links */}
      <div>
        <h3 className="font-semibold mb-3">Active Links</h3>
        {links.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No active links</p>
        ) : (
          <div className="space-y-3">
            {links.map(link => (
              <div key={link.id} className="p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{link.role}</span>
                  <span className="text-xs text-gray-500">
                    Expires {formatDistanceToNow(new Date(link.expiresAt))}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={link.url}
                    readOnly
                    className="flex-1 p-2 text-sm bg-gray-50 rounded border"
                  />
                  <button
                    onClick={() => handleCopy(link.url)}
                    className="px-3 py-2 bg-kawaii-primary-500 text-white rounded"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => handleRevoke(link.id)}
                    className="px-3 py-2 bg-red-500 text-white rounded"
                  >
                    Revoke
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Used {link.useCount} {link.maxUses ? `/ ${link.maxUses}` : ''} times
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </KawaiiModal>
  );
};
```


## Error Handling

### Error Types and Responses

```typescript
// Common error responses

export class CollaborationError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'CollaborationError';
  }
}

// Error codes
export const ErrorCodes = {
  // Invitation errors
  INVALID_EMAIL: 'INVALID_EMAIL',
  DUPLICATE_INVITATION: 'DUPLICATE_INVITATION',
  INVITATION_NOT_FOUND: 'INVITATION_NOT_FOUND',
  INVITATION_EXPIRED: 'INVITATION_EXPIRED',
  INVITATION_REVOKED: 'INVITATION_REVOKED',
  MAX_USES_REACHED: 'MAX_USES_REACHED',
  
  // Permission errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Collaborator errors
  ALREADY_COLLABORATOR: 'ALREADY_COLLABORATOR',
  COLLABORATOR_NOT_FOUND: 'COLLABORATOR_NOT_FOUND',
  CANNOT_REMOVE_OWNER: 'CANNOT_REMOVE_OWNER',
  CANNOT_CHANGE_OWNER_ROLE: 'CANNOT_CHANGE_OWNER_ROLE',
  
  // Activity log errors
  ACTIVITY_LOG_FAILED: 'ACTIVITY_LOG_FAILED',
  
  // Notification errors
  NOTIFICATION_FAILED: 'NOTIFICATION_FAILED',
  
  // Offline errors
  SYNC_FAILED: 'SYNC_FAILED',
  QUEUE_FULL: 'QUEUE_FULL'
};
```

### Error Handling Strategies

#### Backend Error Handling

```typescript
// Global error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);
  
  if (err instanceof CollaborationError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message
    });
  }
  
  // Database errors
  if (err.message?.includes('duplicate key')) {
    return res.status(409).json({
      error: 'DUPLICATE_ENTRY',
      message: 'This entry already exists'
    });
  }
  
  if (err.message?.includes('foreign key')) {
    return res.status(400).json({
      error: 'INVALID_REFERENCE',
      message: 'Referenced entity does not exist'
    });
  }
  
  // Default error
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  });
};
```

#### Frontend Error Handling

```typescript
// API error handler
export async function handleApiError(error: any): Promise<never> {
  if (error.response) {
    // Server responded with error
    const { error: code, message } = error.response.data;
    
    switch (code) {
      case ErrorCodes.UNAUTHORIZED:
        // Redirect to login
        useAuthStore.getState().logout();
        window.location.href = '/login';
        break;
        
      case ErrorCodes.FORBIDDEN:
      case ErrorCodes.INSUFFICIENT_PERMISSIONS:
        showError('You don\'t have permission to perform this action');
        break;
        
      case ErrorCodes.DUPLICATE_INVITATION:
        showError('This user has already been invited');
        break;
        
      case ErrorCodes.INVITATION_EXPIRED:
        showError('This invitation link has expired');
        break;
        
      default:
        showError(message || 'An error occurred');
    }
    
    throw new Error(message);
  } else if (error.request) {
    // Request made but no response (network error)
    if (!navigator.onLine) {
      showError('You are offline. Changes will sync when you reconnect.');
    } else {
      showError('Network error. Please check your connection.');
    }
    throw new Error('Network error');
  } else {
    // Something else happened
    showError('An unexpected error occurred');
    throw error;
  }
}
```

### Retry Logic

```typescript
// Exponential backoff retry
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Wait before retrying
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Email Invitation Acceptance

*For any* valid email address and trip owner, inviting a user by email should successfully create a collaborator entry with the specified role.

**Validates: Requirements 1.1, 1.3**

### Property 2: Invitation Link Generation

*For any* trip and role (editor or viewer), generating an invitation link should produce a unique token with an expiration date in the future.

**Validates: Requirements 1.2**

### Property 3: Email Validation

*For any* string, the system should accept it as an email invitation only if it matches a valid email format (contains @ and domain).

**Validates: Requirements 1.7**

### Property 4: Duplicate Invitation Prevention

*For any* email address, attempting to invite the same email twice to the same trip should fail with a duplicate error.

**Validates: Requirements 1.8**

### Property 5: Invitation Cancellation

*For any* pending invitation, calling the cancel operation should remove it from the database and prevent the invitee from joining.

**Validates: Requirements 1.6**

### Property 6: Owner Permission Enforcement

*For any* user with owner role, they should be able to perform all operations: edit content, manage collaborators, delete trip, and change visibility.

**Validates: Requirements 2.1**

### Property 7: Editor Permission Enforcement

*For any* user with editor role, they should be able to edit trip content but not manage collaborators or delete the trip.

**Validates: Requirements 2.2**

### Property 8: Viewer Permission Enforcement

*For any* user with viewer role, they should only be able to read trip content and not perform any edit operations.

**Validates: Requirements 2.3**

### Property 9: Activity Log Creation

*For any* change operation (add, edit, delete) on trip content, an activity log entry should be created with the user ID, action type, entity details, and timestamp.

**Validates: Requirements 3.1**

### Property 10: Activity Log Pagination

*For any* activity log query, the system should return at most the specified limit of entries and indicate if more entries exist.

**Validates: Requirements 3.3, 3.8**

### Property 11: Activity Log Filtering

*For any* activity type filter, the returned activities should only include entries matching that specific action type.

**Validates: Requirements 3.7**

### Property 12: Relative Timestamp Formatting

*For any* timestamp, the relative time formatter should produce correct human-readable strings (e.g., "2 mins ago", "1 hour ago", "yesterday").

**Validates: Requirements 3.5**

### Property 13: Online Status Tracking

*For any* user who connects to a trip, their online status should be updated to true and broadcast to other collaborators.

**Validates: Requirements 4.1**

### Property 14: Editing Status Broadcast

*For any* user who starts editing an entity, their editing status should be updated with the entity type and ID, and broadcast to other collaborators.

**Validates: Requirements 4.3**

### Property 15: Online User Count

*For any* trip, the online user count should equal the number of collaborators with online status set to true.

**Validates: Requirements 4.5**

### Property 16: Offline Status Cleanup

*For any* user who disconnects, their online status should be set to false and their editing status should be cleared.

**Validates: Requirements 4.7**

### Property 17: Notification Creation

*For any* activity that triggers a notification, a notification entry should be created with the correct user ID, category, priority, title, and message.

**Validates: Requirements 5.1, 5.2**

### Property 18: Notification Batching

*For any* set of similar notifications within the batch interval, they should be grouped into a single batched notification.

**Validates: Requirements 5.4**

### Property 19: Member List Sorting

*For any* list of collaborators, they should be sorted with owners first, then editors, then viewers, and within each role by join date.

**Validates: Requirements 6.7**

### Property 20: Offline Queue Addition

*For any* change operation performed while offline, it should be added to the offline queue with pending status.

**Validates: Requirements 7.3**

### Property 21: Offline Queue Sync

*For any* queued item, when the system comes back online, it should be processed and marked as synced or failed.

**Validates: Requirements 7.4**

### Property 22: Last-Write-Wins Conflict Resolution

*For any* two conflicting edits to the same entity, the edit with the later timestamp should be the final state.

**Validates: Requirements 7.5**

### Property 23: Translation Key Coverage

*For any* UI text string in the application, a translation key should exist for all supported languages (EN, zh-TW, zh-CN).

**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 24: Invitation Link Expiration

*For any* invitation link, attempting to use it after the expiration date should fail with an expired error.

**Validates: Requirements 1.2**

### Property 25: Invitation Link Max Uses

*For any* invitation link with a max uses limit, attempting to use it after reaching the limit should fail with a max uses error.

**Validates: Requirements 1.2**

### Property 26: Local Storage Caching

*For any* trip data fetched from the API, it should be stored in localStorage for offline access.

**Validates: Requirements 7.1**

### Property 27: Optimistic Update Rollback

*For any* optimistic update that fails on the server, the local state should be rolled back to the previous value.

**Validates: Requirements 10.7**


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Unit Testing

Unit tests should focus on:

1. **Specific Examples**
   - Inviting a user with a specific email format
   - Generating an invitation link with specific expiration
   - Creating an activity log entry for a specific action
   - Formatting a specific timestamp

2. **Edge Cases**
   - Empty email addresses
   - Expired invitation links
   - Maximum uses reached on invitation links
   - Offline queue at capacity
   - Stale presence data cleanup

3. **Error Conditions**
   - Invalid email format
   - Duplicate invitation attempts
   - Unauthorized permission checks
   - Network failures during sync
   - Malformed activity log data

4. **Integration Points**
   - Socket.io event emission and reception
   - Database transaction rollbacks
   - Notification service integration
   - Email service integration

### Property-Based Testing

Property tests should verify universal properties using randomized inputs. Each property test must:

- Run minimum 100 iterations (due to randomization)
- Reference its design document property
- Use tag format: **Feature: collaboration-enhancement, Property {number}: {property_text}**

#### Property Test Configuration

```typescript
// Example property test configuration (using fast-check for TypeScript)

import fc from 'fast-check';

describe('Collaboration Enhancement Properties', () => {
  // Property 1: Email Invitation Acceptance
  it('should accept any valid email invitation', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        fc.constantFrom('editor', 'viewer'),
        async (email, role) => {
          const result = await inviteUserByEmail(tripId, email, role);
          expect(result.user.email).toBe(email);
          expect(result.role).toBe(role);
        }
      ),
      { numRuns: 100 }
    );
  });
  // Tag: Feature: collaboration-enhancement, Property 1: Email Invitation Acceptance
  
  // Property 3: Email Validation
  it('should validate email format correctly', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (str) => {
          const isValid = validateEmail(str);
          const hasAtAndDomain = str.includes('@') && str.split('@')[1]?.includes('.');
          expect(isValid).toBe(hasAtAndDomain);
        }
      ),
      { numRuns: 100 }
    );
  });
  // Tag: Feature: collaboration-enhancement, Property 3: Email Validation
  
  // Property 9: Activity Log Creation
  it('should create activity log for any change operation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('place_added', 'place_updated', 'place_deleted'),
        fc.record({
          id: fc.uuid(),
          name: fc.string(),
          tripId: fc.uuid()
        }),
        async (actionType, entity) => {
          await performAction(actionType, entity);
          const logs = await getActivityLog(entity.tripId);
          const log = logs.find(l => l.entityId === entity.id);
          expect(log).toBeDefined();
          expect(log.actionType).toBe(actionType);
        }
      ),
      { numRuns: 100 }
    );
  });
  // Tag: Feature: collaboration-enhancement, Property 9: Activity Log Creation
  
  // Property 12: Relative Timestamp Formatting
  it('should format any timestamp correctly', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          const formatted = formatRelativeTime(date);
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          
          if (diffMins < 1) {
            expect(formatted).toBe('just now');
          } else if (diffMins < 60) {
            expect(formatted).toContain('min');
          } else if (diffMins < 1440) {
            expect(formatted).toContain('hour');
          } else {
            expect(formatted).toContain('day');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  // Tag: Feature: collaboration-enhancement, Property 12: Relative Timestamp Formatting
  
  // Property 19: Member List Sorting
  it('should sort members correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            role: fc.constantFrom('owner', 'editor', 'viewer'),
            createdAt: fc.date()
          })
        ),
        (members) => {
          const sorted = sortMembers(members);
          
          // Check role order
          let lastRoleIndex = -1;
          const roleOrder = { owner: 0, editor: 1, viewer: 2 };
          
          for (const member of sorted) {
            const currentRoleIndex = roleOrder[member.role];
            expect(currentRoleIndex).toBeGreaterThanOrEqual(lastRoleIndex);
            lastRoleIndex = currentRoleIndex;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  // Tag: Feature: collaboration-enhancement, Property 19: Member List Sorting
});
```

### Test Coverage Goals

- **Backend**: 80% code coverage minimum
  - Controllers: 90%
  - Services: 85%
  - Middleware: 80%
  - Utilities: 90%

- **Frontend**: 75% code coverage minimum
  - Components: 70%
  - Services: 85%
  - Hooks: 80%
  - Utilities: 90%

### Testing Tools

**Backend:**
- Jest for unit tests
- fast-check for property-based tests
- Supertest for API integration tests
- Socket.io-client for WebSocket tests

**Frontend:**
- Vitest for unit tests
- React Testing Library for component tests
- fast-check for property-based tests
- MSW (Mock Service Worker) for API mocking

### Continuous Integration

All tests must pass before merging:
- Unit tests
- Property-based tests (100 iterations minimum)
- Integration tests
- E2E tests for critical flows


## Performance Considerations

### Database Optimization

#### Indexes

```sql
-- Activity log indexes for fast queries
CREATE INDEX idx_activity_log_trip_id ON activity_log(trip_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_action_type ON activity_log(action_type);

-- Invitation links indexes
CREATE INDEX idx_invitation_links_token ON invitation_links(token);
CREATE INDEX idx_invitation_links_trip_id ON invitation_links(trip_id);
CREATE INDEX idx_invitation_links_expires_at ON invitation_links(expires_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Collaborators indexes
CREATE INDEX idx_trip_collaborators_last_active ON trip_collaborators(last_active_at DESC);
```

#### Query Optimization

- Use pagination for activity log (limit 50 entries per page)
- Use cursor-based pagination for infinite scroll
- Cache frequently accessed data (member lists, permissions)
- Use database functions for permission checks (avoid N+1 queries)

### Caching Strategy

#### Frontend Caching

```typescript
// Cache member list for 5 minutes
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class CollaboratorCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  get(tripId: string): TripCollaboratorWithUser[] | null {
    const cached = this.cache.get(tripId);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > CACHE_TTL) {
      this.cache.delete(tripId);
      return null;
    }
    
    return cached.data;
  }
  
  set(tripId: string, data: TripCollaboratorWithUser[]) {
    this.cache.set(tripId, {
      data,
      timestamp: Date.now()
    });
  }
  
  invalidate(tripId: string) {
    this.cache.delete(tripId);
  }
}
```

#### Backend Caching

- Use Redis for session data and presence information
- Cache permission checks for 1 minute
- Cache trip collaborator lists for 30 seconds
- Invalidate cache on updates

### Real-Time Optimization

#### Debouncing and Throttling

```typescript
// Debounce presence updates (send at most once per 2 seconds)
const debouncedPresenceUpdate = debounce((data) => {
  socketService.emit('presence:update', data);
}, 2000);

// Throttle activity log updates (send at most once per second)
const throttledActivityUpdate = throttle((activity) => {
  socketService.emit('activity:new', { activity });
}, 1000);
```

#### Batch Operations

```typescript
// Batch notification creation
export class NotificationBatcher {
  private queue: Array<{ userId: string; notification: any }> = [];
  private timer: NodeJS.Timeout | null = null;
  
  add(userId: string, notification: any) {
    this.queue.push({ userId, notification });
    
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 5000); // 5 seconds
    }
  }
  
  private async flush() {
    if (this.queue.length === 0) return;
    
    // Group by user
    const grouped = this.queue.reduce((acc, item) => {
      if (!acc[item.userId]) {
        acc[item.userId] = [];
      }
      acc[item.userId].push(item.notification);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Create batched notifications
    for (const [userId, notifications] of Object.entries(grouped)) {
      await NotificationService.batchNotifications(userId, notifications);
    }
    
    this.queue = [];
    this.timer = null;
  }
}
```

### Bundle Size Optimization

- Code splitting for activity log component (lazy load)
- Tree shaking for unused Socket.io features
- Compress images and assets
- Use dynamic imports for heavy libraries

```typescript
// Lazy load activity log
const ActivityLog = lazy(() => import('./components/ActivityLog'));

// Use in component
<Suspense fallback={<LoadingSpinner />}>
  <ActivityLog tripId={tripId} />
</Suspense>
```

### Network Optimization

- Use WebSocket for real-time updates (avoid polling)
- Compress API responses (gzip)
- Use HTTP/2 for multiplexing
- Implement request deduplication
- Use optimistic updates to reduce perceived latency

### Memory Management

- Limit activity log entries in memory (keep last 100)
- Clean up old notifications (delete after 30 days)
- Remove stale presence data (cleanup every 30 seconds)
- Unsubscribe from Socket.io events on component unmount

```typescript
// Cleanup old activity log entries
useEffect(() => {
  if (activities.length > 100) {
    setActivities(prev => prev.slice(0, 100));
  }
}, [activities]);

// Cleanup socket listeners
useEffect(() => {
  return () => {
    socketService.off(['onActivityNew', 'onPresenceUpdate']);
  };
}, []);
```


## Security Considerations

### Authentication and Authorization

#### JWT Token Validation

All API endpoints must validate JWT tokens:

```typescript
// authMiddleware.ts
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

#### Permission Checks

All operations must verify user permissions:

```typescript
// permissionMiddleware.ts
export const requireOwner = async (req: Request, res: Response, next: NextFunction) => {
  const { tripId } = req.params;
  const userId = req.user?.userId;
  
  const result = await pool.query(
    'SELECT user_owns_trip($1, $2) as is_owner',
    [userId, tripId]
  );
  
  if (!result.rows[0].is_owner) {
    return res.status(403).json({ error: 'Only trip owners can perform this action' });
  }
  
  next();
};

export const requireEditor = async (req: Request, res: Response, next: NextFunction) => {
  const { tripId } = req.params;
  const userId = req.user?.userId;
  
  const result = await pool.query(
    'SELECT user_can_edit_trip($1, $2) as can_edit',
    [userId, tripId]
  );
  
  if (!result.rows[0].can_edit) {
    return res.status(403).json({ error: 'You do not have edit permissions' });
  }
  
  next();
};
```

### Input Validation

#### Email Validation

```typescript
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
```

#### SQL Injection Prevention

Always use parameterized queries:

```typescript
// ✅ GOOD - Parameterized query
await pool.query(
  'SELECT * FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2',
  [tripId, userId]
);

// ❌ BAD - String concatenation (vulnerable to SQL injection)
await pool.query(
  `SELECT * FROM trip_collaborators WHERE trip_id = '${tripId}' AND user_id = '${userId}'`
);
```

#### XSS Prevention

Sanitize user input before storing and displaying:

```typescript
import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
}
```

### Rate Limiting

Prevent abuse with rate limiting:

```typescript
import rateLimit from 'express-rate-limit';

// Invitation rate limit (max 10 invites per hour)
export const invitationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many invitations sent. Please try again later.'
});

// Invitation link generation rate limit (max 5 links per hour)
export const linkGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many invitation links generated. Please try again later.'
});

// Apply to routes
app.post('/api/trips/:tripId/collaborators', invitationLimiter, addCollaborator);
app.post('/api/trips/:tripId/invitation-links', linkGenerationLimiter, generateInvitationLink);
```

### Data Privacy

#### Personal Information Protection

- Never log sensitive data (emails, tokens)
- Encrypt invitation tokens
- Use HTTPS for all API calls
- Implement GDPR compliance (data export, deletion)

```typescript
// Redact sensitive data from logs
export function redactSensitiveData(data: any): any {
  const redacted = { ...data };
  
  if (redacted.email) {
    redacted.email = redacted.email.replace(/(.{2}).*(@.*)/, '$1***$2');
  }
  
  if (redacted.token) {
    redacted.token = '***REDACTED***';
  }
  
  return redacted;
}

// Use in logging
console.log('User invited:', redactSensitiveData({ email: user.email, token: inviteToken }));
```

#### Invitation Link Security

- Generate cryptographically secure tokens
- Set reasonable expiration times (default 7 days)
- Allow owners to revoke links
- Track link usage

```typescript
import crypto from 'crypto';

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
```

### WebSocket Security

#### Socket Authentication

```typescript
// socketAuth.ts
export const socketAuth = async (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

// Apply to Socket.io
io.use(socketAuth);
```

#### Room Access Control

```typescript
// Verify user has access to trip before joining room
socket.on('trip:join', async (data: { tripId: string }) => {
  const hasAccess = await verifyTripAccess(socket.userId, data.tripId);
  
  if (!hasAccess) {
    socket.emit('error', { message: 'Access denied' });
    return;
  }
  
  socket.join(`trip:${data.tripId}`);
});
```

### CORS Configuration

```typescript
// cors.ts
export const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.API_URL]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```


## Internationalization (i18n)

### Translation Structure

```typescript
// en.json
{
  "members": {
    "title": "Members",
    "invite": "Invite Member",
    "inviteByEmail": "Invite by Email",
    "inviteByLink": "Invite by Link",
    "generateLink": "Generate Link",
    "copyLink": "Copy Link",
    "revokeLink": "Revoke Link",
    "pendingInvitations": "Pending Invitations",
    "noMembers": "No members yet",
    "memberCount": "{{count}} member",
    "memberCount_plural": "{{count}} members",
    "roles": {
      "owner": "Owner",
      "editor": "Editor",
      "viewer": "Viewer"
    },
    "permissions": {
      "canEdit": "Can edit trip content",
      "canView": "Can view trip content",
      "canManage": "Can manage members"
    },
    "status": {
      "online": "Online",
      "offline": "Offline",
      "editing": "Currently editing",
      "lastActive": "Last active {{time}}"
    },
    "actions": {
      "changeRole": "Change Role",
      "remove": "Remove Member",
      "cancel": "Cancel Invitation",
      "resend": "Resend Invitation"
    }
  },
  "activity": {
    "title": "Activity Log",
    "noActivity": "No activity yet",
    "filters": {
      "all": "All",
      "places": "Places",
      "packing": "Packing",
      "shopping": "Shopping",
      "members": "Members"
    },
    "actions": {
      "place_added": "added a place",
      "place_updated": "updated a place",
      "place_deleted": "deleted a place",
      "packing_item_added": "added a packing item",
      "packing_item_updated": "updated a packing item",
      "packing_item_deleted": "deleted a packing item",
      "collaborator_added": "invited a member",
      "collaborator_removed": "removed a member",
      "collaborator_role_changed": "changed member role"
    },
    "timeGroups": {
      "today": "Today",
      "yesterday": "Yesterday",
      "thisWeek": "This Week",
      "thisMonth": "This Month",
      "older": "Older"
    }
  },
  "notifications": {
    "title": "Notifications",
    "markAllRead": "Mark all as read",
    "noNotifications": "No notifications",
    "unreadCount": "{{count}} unread",
    "preferences": "Notification Preferences",
    "settings": {
      "emailNotifications": "Email notifications",
      "pushNotifications": "Push notifications",
      "inAppNotifications": "In-app notifications",
      "notifyOnCollaboratorJoined": "When someone joins",
      "notifyOnItemAdded": "When items are added",
      "notifyOnItemEdited": "When items are edited",
      "notifyOnItemDeleted": "When items are deleted",
      "batchNotifications": "Batch similar notifications",
      "quietHours": "Quiet hours"
    }
  },
  "offline": {
    "banner": "You're offline. Changes will sync when you reconnect.",
    "syncing": "Syncing {{count}} changes...",
    "syncFailed": "{{count}} changes failed to sync",
    "syncSuccess": "All changes synced successfully"
  },
  "invitations": {
    "linkExpired": "This invitation link has expired",
    "linkRevoked": "This invitation link has been revoked",
    "maxUsesReached": "This invitation link has reached its maximum uses",
    "alreadyMember": "You are already a member of this trip",
    "acceptInvitation": "Accept Invitation",
    "invitedBy": "Invited by {{name}}",
    "expiresIn": "Expires in {{time}}",
    "role": "You will join as {{role}}"
  }
}

// zh-TW.json (Traditional Chinese)
{
  "members": {
    "title": "成員",
    "invite": "邀請成員",
    "inviteByEmail": "透過電子郵件邀請",
    "inviteByLink": "透過連結邀請",
    "generateLink": "產生連結",
    "copyLink": "複製連結",
    "revokeLink": "撤銷連結",
    "pendingInvitations": "待處理邀請",
    "noMembers": "尚無成員",
    "memberCount": "{{count}} 位成員",
    "roles": {
      "owner": "擁有者",
      "editor": "編輯者",
      "viewer": "檢視者"
    },
    "permissions": {
      "canEdit": "可編輯行程內容",
      "canView": "可檢視行程內容",
      "canManage": "可管理成員"
    },
    "status": {
      "online": "線上",
      "offline": "離線",
      "editing": "正在編輯",
      "lastActive": "最後活動時間 {{time}}"
    }
  },
  "activity": {
    "title": "活動記錄",
    "noActivity": "尚無活動",
    "actions": {
      "place_added": "新增了地點",
      "place_updated": "更新了地點",
      "place_deleted": "刪除了地點",
      "packing_item_added": "新增了打包項目",
      "collaborator_added": "邀請了成員"
    }
  }
}

// zh-CN.json (Simplified Chinese)
{
  "members": {
    "title": "成员",
    "invite": "邀请成员",
    "inviteByEmail": "通过电子邮件邀请",
    "inviteByLink": "通过链接邀请",
    "generateLink": "生成链接",
    "copyLink": "复制链接",
    "revokeLink": "撤销链接",
    "pendingInvitations": "待处理邀请",
    "noMembers": "暂无成员",
    "memberCount": "{{count}} 位成员",
    "roles": {
      "owner": "拥有者",
      "editor": "编辑者",
      "viewer": "查看者"
    },
    "permissions": {
      "canEdit": "可编辑行程内容",
      "canView": "可查看行程内容",
      "canManage": "可管理成员"
    },
    "status": {
      "online": "在线",
      "offline": "离线",
      "editing": "正在编辑",
      "lastActive": "最后活动时间 {{time}}"
    }
  },
  "activity": {
    "title": "活动记录",
    "noActivity": "暂无活动",
    "actions": {
      "place_added": "添加了地点",
      "place_updated": "更新了地点",
      "place_deleted": "删除了地点",
      "packing_item_added": "添加了打包项目",
      "collaborator_added": "邀请了成员"
    }
  }
}
```

### Date/Time Localization

```typescript
// Use date-fns for locale-aware date formatting
import { formatDistanceToNow, format } from 'date-fns';
import { enUS, zhTW, zhCN } from 'date-fns/locale';

const locales = {
  en: enUS,
  'zh-TW': zhTW,
  'zh-CN': zhCN
};

export function formatRelativeTime(date: Date, locale: string): string {
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: locales[locale] || enUS
  });
}

export function formatDate(date: Date, locale: string): string {
  return format(date, 'PPP', {
    locale: locales[locale] || enUS
  });
}
```

### Number Localization

```typescript
// Format numbers according to locale
export function formatNumber(num: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(num);
}

// Format currency
export function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
}
```


## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Backend:**
- Create database migrations for new tables (invitation_links, activity_log)
- Enhance existing tables (trip_collaborators, notifications)
- Implement invitation link generation and validation
- Set up activity log middleware

**Frontend:**
- Create base components (ActivityLog, InviteLinkModal, NotificationToast)
- Set up state management stores
- Implement basic services (invitationLinkService, activityLogService)

**Testing:**
- Unit tests for database schema
- Unit tests for invitation link generation
- Property tests for email validation

### Phase 2: Activity Logging (Week 3)

**Backend:**
- Implement activity log service
- Add activity log middleware to all controllers
- Create activity log API endpoints
- Implement real-time activity broadcasting

**Frontend:**
- Complete ActivityLog component with filtering and pagination
- Integrate activity log into MembersScreen
- Add real-time activity updates via Socket.io

**Testing:**
- Property tests for activity log creation
- Unit tests for activity log filtering
- Integration tests for real-time updates

### Phase 3: Enhanced Notifications (Week 4)

**Backend:**
- Enhance notification service with categories and priorities
- Implement notification batching
- Create notification preferences API
- Add notification cleanup job

**Frontend:**
- Create NotificationCenter component
- Implement notification preferences UI
- Add toast notifications for real-time events
- Integrate with activity log

**Testing:**
- Property tests for notification creation
- Unit tests for notification batching
- Integration tests for notification delivery

### Phase 4: Presence & Real-Time (Week 5)

**Backend:**
- Enhance socket service with editing status
- Implement presence tracking with cleanup
- Add presence update endpoints
- Optimize WebSocket performance

**Frontend:**
- Enhance MemberCard with editing status
- Implement usePresence hook
- Add online user count display
- Optimize real-time updates

**Testing:**
- Property tests for presence tracking
- Unit tests for presence cleanup
- Integration tests for WebSocket events

### Phase 5: Offline Support (Week 6)

**Backend:**
- No backend changes needed

**Frontend:**
- Implement offline queue service
- Create offline-aware API wrapper
- Add OfflineBanner component
- Implement sync logic with conflict resolution

**Testing:**
- Property tests for offline queue
- Unit tests for sync logic
- Integration tests for conflict resolution

### Phase 6: UI/UX Polish (Week 7)

**Frontend:**
- Enhance MembersScreen UI
- Add pending invitations display
- Improve loading states and animations
- Add empty states
- Implement responsive design improvements

**Testing:**
- Visual regression tests
- Accessibility tests
- Responsive design tests

### Phase 7: Internationalization (Week 8)

**Frontend:**
- Add translation files for EN, zh-TW, zh-CN
- Implement date/time localization
- Add number/currency formatting
- Test all UI text for translation coverage

**Testing:**
- Property tests for translation key coverage
- Unit tests for date/time formatting
- Manual testing in all languages

### Phase 8: Performance & Security (Week 9)

**Backend:**
- Add database indexes
- Implement caching with Redis
- Add rate limiting
- Security audit and fixes

**Frontend:**
- Implement code splitting
- Add caching strategies
- Optimize bundle size
- Performance profiling and optimization

**Testing:**
- Performance tests
- Load tests
- Security tests
- Property tests for rate limiting

### Phase 9: Integration & E2E Testing (Week 10)

**Full Stack:**
- End-to-end tests for critical flows
- Integration tests for all features
- User acceptance testing
- Bug fixes and refinements

**Testing:**
- E2E tests with Playwright/Cypress
- Load testing with k6
- Security testing with OWASP ZAP

### Phase 10: Documentation & Deployment (Week 11)

**Documentation:**
- API documentation
- Component documentation
- User guides
- Developer guides

**Deployment:**
- Staging deployment
- Production deployment
- Monitoring setup
- Rollback plan


## Monitoring and Observability

### Metrics to Track

#### Backend Metrics

```typescript
// Prometheus metrics
import { Counter, Histogram, Gauge } from 'prom-client';

// Invitation metrics
export const invitationsSent = new Counter({
  name: 'invitations_sent_total',
  help: 'Total number of invitations sent',
  labelNames: ['method'] // 'email' or 'link'
});

export const invitationsAccepted = new Counter({
  name: 'invitations_accepted_total',
  help: 'Total number of invitations accepted',
  labelNames: ['method']
});

// Activity log metrics
export const activityLogEntries = new Counter({
  name: 'activity_log_entries_total',
  help: 'Total number of activity log entries created',
  labelNames: ['action_type']
});

// Notification metrics
export const notificationsSent = new Counter({
  name: 'notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['category', 'priority']
});

// WebSocket metrics
export const activeConnections = new Gauge({
  name: 'websocket_active_connections',
  help: 'Number of active WebSocket connections'
});

export const presenceUpdates = new Counter({
  name: 'presence_updates_total',
  help: 'Total number of presence updates'
});

// Performance metrics
export const apiResponseTime = new Histogram({
  name: 'api_response_time_seconds',
  help: 'API response time in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});
```

#### Frontend Metrics

```typescript
// Track user interactions
export function trackEvent(category: string, action: string, label?: string) {
  // Send to analytics service (e.g., Google Analytics, Mixpanel)
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label
    });
  }
}

// Track performance
export function trackPerformance(metric: string, value: number) {
  // Send to monitoring service (e.g., Datadog, New Relic)
  if (window.DD_RUM) {
    window.DD_RUM.addTiming(metric, value);
  }
}

// Usage
trackEvent('collaboration', 'invite_sent', 'email');
trackEvent('activity_log', 'filter_applied', 'place_added');
trackPerformance('activity_log_load_time', loadTime);
```

### Logging

#### Structured Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'collaboration-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log examples
logger.info('Invitation sent', {
  tripId,
  inviteeEmail: redactEmail(email),
  role,
  method: 'email'
});

logger.error('Failed to create activity log', {
  tripId,
  userId,
  actionType,
  error: error.message
});
```

### Error Tracking

```typescript
// Sentry integration
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

// Capture errors
try {
  await inviteUser(email, role);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'collaboration',
      action: 'invite_user'
    },
    extra: {
      email: redactEmail(email),
      role
    }
  });
  throw error;
}
```

### Health Checks

```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      websocket: checkWebSocket()
    }
  };
  
  const isHealthy = Object.values(health.checks).every(check => check.status === 'ok');
  
  res.status(isHealthy ? 200 : 503).json(health);
});

async function checkDatabase(): Promise<{ status: string; latency: number }> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    return { status: 'ok', latency: Date.now() - start };
  } catch (error) {
    return { status: 'error', latency: Date.now() - start };
  }
}
```

### Alerts

Configure alerts for:

- High error rate (> 5% of requests)
- Slow API responses (> 2 seconds)
- WebSocket connection failures
- Database connection pool exhaustion
- High memory usage (> 80%)
- Failed notification deliveries
- Offline queue backup (> 100 items)

## Rollback Plan

### Database Rollback

```sql
-- Rollback migration (if needed)
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS invitation_links;

ALTER TABLE trip_collaborators 
DROP COLUMN IF EXISTS last_active_at,
DROP COLUMN IF EXISTS is_online,
DROP COLUMN IF EXISTS current_editing_entity,
DROP COLUMN IF EXISTS current_editing_entity_id;

ALTER TABLE notifications
DROP COLUMN IF EXISTS is_read,
DROP COLUMN IF EXISTS read_at,
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS priority,
DROP COLUMN IF EXISTS action_url,
DROP COLUMN IF EXISTS expires_at;
```

### Feature Flags

Use feature flags to enable/disable features:

```typescript
// Feature flag service
export class FeatureFlags {
  static isEnabled(flag: string): boolean {
    const flags = {
      'activity-log': process.env.FEATURE_ACTIVITY_LOG === 'true',
      'invitation-links': process.env.FEATURE_INVITATION_LINKS === 'true',
      'offline-support': process.env.FEATURE_OFFLINE_SUPPORT === 'true',
      'enhanced-notifications': process.env.FEATURE_ENHANCED_NOTIFICATIONS === 'true'
    };
    
    return flags[flag] || false;
  }
}

// Usage
if (FeatureFlags.isEnabled('activity-log')) {
  await activityLogService.logActivity(data);
}
```

### Gradual Rollout

1. Deploy to staging environment
2. Test all features thoroughly
3. Deploy to production with feature flags disabled
4. Enable features for 10% of users
5. Monitor metrics and errors
6. Gradually increase to 50%, then 100%
7. If issues arise, disable feature flag immediately

## Success Criteria

### Functional Requirements

- ✅ All acceptance criteria from requirements document are met
- ✅ All property-based tests pass (100 iterations minimum)
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ All E2E tests pass

### Performance Requirements

- ✅ Member list loads within 1 second
- ✅ Activity log loads within 2 seconds
- ✅ Presence updates within 5 seconds
- ✅ API response time < 500ms (p95)
- ✅ WebSocket latency < 100ms

### Quality Requirements

- ✅ Code coverage > 80% (backend), > 75% (frontend)
- ✅ No critical security vulnerabilities
- ✅ Accessibility score > 90 (Lighthouse)
- ✅ Performance score > 85 (Lighthouse)
- ✅ Zero production errors in first week

### User Experience Requirements

- ✅ Positive user feedback (> 4.5/5 rating)
- ✅ Invitation acceptance rate > 90%
- ✅ Feature adoption rate > 70% within first month
- ✅ No increase in support tickets

