# Notification Service Usage Guide

## Overview
The enhanced notification service provides a comprehensive API for managing user notifications with filtering, preferences, and real-time updates.

## Quick Start

```typescript
import { notificationService } from '../services/notificationService';
import { NotificationFilters } from '../types/notification';

// Fetch all notifications
const response = await notificationService.getNotifications();
console.log(response.notifications); // Array of notifications
console.log(response.unreadCount);   // Number of unread notifications
console.log(response.total);         // Total count
console.log(response.hasMore);       // Whether more notifications exist
```

## API Methods

### 1. Get Notifications

Fetch notifications with optional filtering and pagination.

```typescript
// Basic usage - get all notifications
const response = await notificationService.getNotifications();

// With filters
const filters: NotificationFilters = {
  limit: 20,           // Number of notifications to fetch
  offset: 0,           // Pagination offset
  category: 'activity', // Filter by category
  isRead: false,       // Only unread notifications
  startDate: '2024-01-01',
  endDate: '2024-01-31'
};

const response = await notificationService.getNotifications(filters);
```

**Response:**
```typescript
{
  notifications: Notification[],
  total: number,
  unreadCount: number,
  hasMore: boolean
}
```

### 2. Mark Notification as Read

Mark a single notification as read.

```typescript
const notificationId = 'notif-123';
const updatedNotification = await notificationService.markAsRead(notificationId);

console.log(updatedNotification.isRead); // true
console.log(updatedNotification.readAt); // ISO timestamp
```

### 3. Mark All Notifications as Read

Mark all user notifications as read.

```typescript
const result = await notificationService.markAllAsRead();
console.log(result.message); // "All notifications marked as read"
console.log(result.count);   // Number of notifications marked
```

### 4. Delete Notification

Delete a specific notification.

```typescript
const notificationId = 'notif-123';
const result = await notificationService.deleteNotification(notificationId);
console.log(result.message); // "Notification deleted"
```

### 5. Get Notification Preferences

Fetch user's notification preferences.

```typescript
const preferences = await notificationService.getPreferences();

console.log(preferences.emailNotifications);      // boolean
console.log(preferences.pushNotifications);       // boolean
console.log(preferences.inAppNotifications);      // boolean
console.log(preferences.notifyOnItemAdded);       // boolean
console.log(preferences.batchNotifications);      // boolean
console.log(preferences.batchInterval);           // number (minutes)
console.log(preferences.quietHoursEnabled);       // boolean
console.log(preferences.quietHoursStart);         // "HH:mm" or undefined
console.log(preferences.quietHoursEnd);           // "HH:mm" or undefined
```

### 6. Update Notification Preferences

Update user's notification preferences (partial updates supported).

```typescript
// Update specific preferences
const updates = {
  emailNotifications: false,
  batchNotifications: true,
  batchInterval: 5
};

const updatedPreferences = await notificationService.updatePreferences(updates);

// Enable quiet hours
const quietHoursUpdate = {
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00'
};

await notificationService.updatePreferences(quietHoursUpdate);
```

### 7. Reset Preferences to Defaults

Reset all preferences to default values.

```typescript
const result = await notificationService.resetPreferences();
console.log(result.message);      // "Notification preferences reset to defaults"
console.log(result.preferences);  // Default preferences object
```

## Notification Types

### Notification Object

```typescript
interface Notification {
  id: string;
  userId: string;
  type: string;
  category: 'collaboration' | 'activity' | 'mention' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string;
  data: Record<string, any>;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
}
```

### Notification Categories

- **collaboration**: Invites, member joins, role changes
- **activity**: Item added/edited/deleted, schedule changes
- **mention**: User mentions in comments
- **system**: System announcements, maintenance notices

### Notification Priorities

- **low**: Non-urgent updates
- **normal**: Standard notifications (default)
- **high**: Important updates requiring attention
- **urgent**: Critical notifications requiring immediate action

## Usage Examples

### Example 1: Notification List Component

```typescript
import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types/notification';

function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications({
        limit: 50,
        offset: 0
      });
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  return (
    <div>
      <h2>Notifications ({unreadCount} unread)</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {notifications.map(notification => (
            <li key={notification.id}>
              <div className={notification.isRead ? 'read' : 'unread'}>
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                {!notification.isRead && (
                  <button onClick={() => handleMarkAsRead(notification.id)}>
                    Mark as read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Example 2: Notification Preferences Component

```typescript
import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { NotificationPreferences } from '../types/notification';

function NotificationPreferencesForm() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const handleToggle = async (field: keyof NotificationPreferences) => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      const updated = await notificationService.updatePreferences({
        [field]: !preferences[field]
      });
      setPreferences(updated);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!preferences) return <p>Loading...</p>;

  return (
    <div>
      <h2>Notification Preferences</h2>
      
      <label>
        <input
          type="checkbox"
          checked={preferences.emailNotifications}
          onChange={() => handleToggle('emailNotifications')}
          disabled={isSaving}
        />
        Email Notifications
      </label>

      <label>
        <input
          type="checkbox"
          checked={preferences.pushNotifications}
          onChange={() => handleToggle('pushNotifications')}
          disabled={isSaving}
        />
        Push Notifications
      </label>

      <label>
        <input
          type="checkbox"
          checked={preferences.notifyOnItemAdded}
          onChange={() => handleToggle('notifyOnItemAdded')}
          disabled={isSaving}
        />
        Notify when items are added
      </label>

      {/* Add more preference toggles as needed */}
    </div>
  );
}
```

### Example 3: Filtered Notification View

```typescript
import { useState } from 'react';
import { notificationService } from '../services/notificationService';
import { NotificationCategory } from '../types/notification';

function FilteredNotifications() {
  const [category, setCategory] = useState<NotificationCategory | undefined>();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const loadNotifications = async () => {
    const response = await notificationService.getNotifications({
      category,
      isRead: showUnreadOnly ? false : undefined,
      limit: 20
    });
    return response.notifications;
  };

  return (
    <div>
      <select onChange={(e) => setCategory(e.target.value as NotificationCategory)}>
        <option value="">All Categories</option>
        <option value="collaboration">Collaboration</option>
        <option value="activity">Activity</option>
        <option value="mention">Mentions</option>
        <option value="system">System</option>
      </select>

      <label>
        <input
          type="checkbox"
          checked={showUnreadOnly}
          onChange={(e) => setShowUnreadOnly(e.target.checked)}
        />
        Show unread only
      </label>

      {/* Render notifications */}
    </div>
  );
}
```

## Best Practices

### 1. Use Optimistic Updates

Update UI immediately, then sync with server:

```typescript
// Optimistic update
setNotifications(prev =>
  prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
);

// Then sync with server
try {
  await notificationService.markAsRead(notificationId);
} catch (error) {
  // Revert on error
  setNotifications(prev =>
    prev.map(n => n.id === notificationId ? { ...n, isRead: false } : n)
  );
}
```

### 2. Handle Pagination

```typescript
const [notifications, setNotifications] = useState<Notification[]>([]);
const [offset, setOffset] = useState(0);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  const response = await notificationService.getNotifications({
    limit: 20,
    offset
  });
  
  setNotifications(prev => [...prev, ...response.notifications]);
  setOffset(prev => prev + 20);
  setHasMore(response.hasMore);
};
```

### 3. Use with Zustand Store

The notification store already integrates with this service:

```typescript
import { useNotificationStore } from '../stores/notificationStore';

function MyComponent() {
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications,
    markAsRead 
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Use store state and actions
}
```

### 4. Error Handling

Always handle errors gracefully:

```typescript
try {
  await notificationService.markAsRead(notificationId);
} catch (error) {
  if (error.message.includes('404')) {
    console.error('Notification not found');
  } else if (error.message.includes('401')) {
    console.error('Unauthorized');
  } else {
    console.error('Failed to mark as read:', error);
  }
}
```

## Integration with Real-Time Updates

When integrating with socket service for real-time notifications:

```typescript
import { socketService } from '../services/socketService';
import { notificationService } from '../services/notificationService';

// Listen for new notifications
socketService.on({
  onNotificationNew: async (data) => {
    // Refresh notifications
    const response = await notificationService.getNotifications();
    setNotifications(response.notifications);
    setUnreadCount(response.unreadCount);
  }
});
```

## Testing

The service includes comprehensive unit tests. To run tests:

```bash
npm test -- notificationService.test.ts
```

## Migration from Old API

If you're migrating from the old notification service:

### Breaking Changes
- `read` property → `isRead`
- `getNotifications()` now accepts optional filters parameter
- `markAllAsRead()` returns `{ message, count }` instead of `void`
- `deleteNotification()` returns `{ message }` instead of `void`

### Migration Example

**Old:**
```typescript
const response = await notificationService.getNotifications();
const isRead = notification.read;
await notificationService.markAllAsRead();
```

**New:**
```typescript
const response = await notificationService.getNotifications();
const isRead = notification.isRead;
const result = await notificationService.markAllAsRead();
console.log(`Marked ${result.count} notifications as read`);
```

## Support

For issues or questions:
1. Check the test file for usage examples
2. Review the type definitions in `types/notification.ts`
3. Consult the backend API documentation
4. Check the completion summary document
