# Activity Store Integration Guide

## Overview
This guide explains how to integrate the Activity Store into your React components for displaying and managing activity logs.

## Quick Start

### Basic Usage

```typescript
import { useActivityStore } from '../stores/activityStore';
import { useEffect } from 'react';

function ActivityLog({ tripId }: { tripId: string }) {
  const {
    activities,
    isLoading,
    error,
    fetchActivities,
  } = useActivityStore();

  useEffect(() => {
    fetchActivities(tripId);
  }, [tripId]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {activities.map(activity => (
        <div key={activity.id}>
          {activity.userName} {activity.actionType} {activity.entityName}
        </div>
      ))}
    </div>
  );
}
```

## Advanced Usage

### 1. Filtering Activities

```typescript
function ActivityLogWithFilter({ tripId }: { tripId: string }) {
  const {
    activities,
    filter,
    setFilter,
    clearFilter,
    fetchActivities,
  } = useActivityStore();

  const handleFilterChange = async (actionType: string) => {
    setFilter({ actionType });
    await fetchActivities(tripId);
  };

  const handleClearFilter = async () => {
    clearFilter();
    await fetchActivities(tripId);
  };

  return (
    <div>
      <select onChange={(e) => handleFilterChange(e.target.value)}>
        <option value="">All Activities</option>
        <option value="place_added">Places Added</option>
        <option value="packing_item_added">Packing Items</option>
        <option value="collaborator_added">Collaborators</option>
      </select>
      <button onClick={handleClearFilter}>Clear Filter</button>
      
      {/* Activity list */}
    </div>
  );
}
```

### 2. Pagination (Load More)

```typescript
function ActivityLogWithPagination({ tripId }: { tripId: string }) {
  const {
    activities,
    pagination,
    isLoading,
    fetchActivities,
    fetchMoreActivities,
  } = useActivityStore();

  useEffect(() => {
    fetchActivities(tripId);
  }, [tripId]);

  const handleLoadMore = () => {
    if (pagination.hasMore && !isLoading) {
      fetchMoreActivities(tripId);
    }
  };

  return (
    <div>
      <div className="activity-list">
        {activities.map(activity => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
      
      {pagination.hasMore && (
        <button 
          onClick={handleLoadMore} 
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}
      
      <div className="pagination-info">
        Showing {activities.length} of {pagination.total} activities
      </div>
    </div>
  );
}
```

### 3. Real-Time Updates (WebSocket)

```typescript
import { useEffect } from 'react';
import { useActivityStore } from '../stores/activityStore';
import { socketService } from '../services/socketService';

function ActivityLogWithRealtime({ tripId }: { tripId: string }) {
  const {
    activities,
    fetchActivities,
    addActivity,
  } = useActivityStore();

  useEffect(() => {
    // Fetch initial activities
    fetchActivities(tripId);

    // Subscribe to real-time updates
    const handleNewActivity = (data: { activity: ActivityLogEntry }) => {
      if (data.activity.tripId === tripId) {
        addActivity(data.activity);
      }
    };

    socketService.on('activity:new', handleNewActivity);

    // Cleanup
    return () => {
      socketService.off('activity:new', handleNewActivity);
    };
  }, [tripId, fetchActivities, addActivity]);

  return (
    <div>
      {activities.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
```

### 4. Multiple Filters

```typescript
function ActivityLogWithAdvancedFilters({ tripId }: { tripId: string }) {
  const {
    activities,
    filter,
    setFilter,
    fetchActivities,
  } = useActivityStore();

  const [localFilter, setLocalFilter] = useState({
    actionType: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  const handleApplyFilter = async () => {
    setFilter(localFilter);
    await fetchActivities(tripId);
  };

  return (
    <div>
      <div className="filters">
        <select 
          value={localFilter.actionType}
          onChange={(e) => setLocalFilter({ ...localFilter, actionType: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="place_added">Places</option>
          <option value="packing_item_added">Packing</option>
        </select>

        <input
          type="date"
          value={localFilter.startDate}
          onChange={(e) => setLocalFilter({ ...localFilter, startDate: e.target.value })}
          placeholder="Start Date"
        />

        <input
          type="date"
          value={localFilter.endDate}
          onChange={(e) => setLocalFilter({ ...localFilter, endDate: e.target.value })}
          placeholder="End Date"
        />

        <button onClick={handleApplyFilter}>Apply Filters</button>
      </div>

      {/* Activity list */}
    </div>
  );
}
```

### 5. Client-Side Filtering

```typescript
function ActivityLogWithClientFilter({ tripId }: { tripId: string }) {
  const {
    getFilteredActivities,
    setFilter,
    fetchActivities,
  } = useActivityStore();

  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    fetchActivities(tripId);
  }, [tripId]);

  // Get filtered activities (client-side)
  const filteredActivities = getFilteredActivities(tripId);

  const handleTypeChange = (actionType: string) => {
    setSelectedType(actionType);
    setFilter({ actionType });
  };

  return (
    <div>
      <select value={selectedType} onChange={(e) => handleTypeChange(e.target.value)}>
        <option value="">All</option>
        <option value="place_added">Places</option>
        <option value="packing_item_added">Packing</option>
      </select>

      {filteredActivities.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
```

### 6. Grouped by Date

```typescript
import { useMemo } from 'react';

function ActivityLogGrouped({ tripId }: { tripId: string }) {
  const { activities, fetchActivities } = useActivityStore();

  useEffect(() => {
    fetchActivities(tripId);
  }, [tripId]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, ActivityLogEntry[]> = {};

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
    <div>
      {Object.entries(groupedActivities).map(([date, items]) => (
        <div key={date} className="activity-group">
          <h3>{date}</h3>
          {items.map(activity => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      ))}
    </div>
  );
}

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

## Store API Reference

### State

```typescript
interface ActivityStore {
  // Data
  activities: ActivityLogEntry[];              // Current activities list
  activitiesByTrip: Record<string, ActivityLogEntry[]>; // Activities by trip
  
  // Pagination
  pagination: {
    limit: number;      // Items per page (default: 50)
    offset: number;     // Current offset
    hasMore: boolean;   // More items available
    total: number;      // Total count
  };
  
  // Filters
  filter: {
    actionType?: string;  // Filter by action type
    userId?: string;      // Filter by user
    startDate?: string;   // Filter by start date
    endDate?: string;     // Filter by end date
  };
  
  // Loading and error
  isLoading: boolean;   // Loading indicator
  error: string | null; // Error message
}
```

### Actions

```typescript
// Fetch activities (replaces existing)
fetchActivities(tripId: string, options?: GetActivityLogOptions): Promise<void>

// Fetch more activities (appends)
fetchMoreActivities(tripId: string): Promise<void>

// Add activity (real-time)
addActivity(activity: ActivityLogEntry): void

// Set filter
setFilter(filter: ActivityFilter): void

// Clear filter
clearFilter(): void

// Reset activities
resetActivities(tripId?: string): void
```

### Getters

```typescript
// Get activities for a trip
getActivitiesByTrip(tripId: string): ActivityLogEntry[]

// Get filtered activities (client-side)
getFilteredActivities(tripId: string): ActivityLogEntry[]
```

## Best Practices

### 1. Fetch on Mount
Always fetch activities when component mounts:
```typescript
useEffect(() => {
  fetchActivities(tripId);
}, [tripId]);
```

### 2. Handle Loading States
Show loading indicators during fetch:
```typescript
if (isLoading && activities.length === 0) {
  return <LoadingSkeleton />;
}
```

### 3. Handle Errors
Display error messages gracefully:
```typescript
if (error) {
  return <ErrorMessage message={error} />;
}
```

### 4. Prevent Duplicate Fetches
Check loading state before fetching more:
```typescript
if (pagination.hasMore && !isLoading) {
  fetchMoreActivities(tripId);
}
```

### 5. Clean Up Subscriptions
Always clean up WebSocket subscriptions:
```typescript
useEffect(() => {
  socketService.on('activity:new', handleNewActivity);
  return () => {
    socketService.off('activity:new', handleNewActivity);
  };
}, []);
```

### 6. Reset on Unmount
Reset activities when leaving the page:
```typescript
useEffect(() => {
  return () => {
    resetActivities(tripId);
  };
}, [tripId]);
```

## Common Patterns

### Infinite Scroll

```typescript
import { useInView } from 'react-intersection-observer';

function ActivityLogInfiniteScroll({ tripId }: { tripId: string }) {
  const { activities, pagination, isLoading, fetchActivities, fetchMoreActivities } = useActivityStore();
  const { ref, inView } = useInView();

  useEffect(() => {
    fetchActivities(tripId);
  }, [tripId]);

  useEffect(() => {
    if (inView && pagination.hasMore && !isLoading) {
      fetchMoreActivities(tripId);
    }
  }, [inView, pagination.hasMore, isLoading]);

  return (
    <div>
      {activities.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
      {pagination.hasMore && <div ref={ref}>Loading...</div>}
    </div>
  );
}
```

### Pull to Refresh

```typescript
function ActivityLogPullToRefresh({ tripId }: { tripId: string }) {
  const { fetchActivities } = useActivityStore();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivities(tripId);
    setRefreshing(false);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} refreshing={refreshing}>
      <ActivityList tripId={tripId} />
    </PullToRefresh>
  );
}
```

### Search Activities

```typescript
function ActivityLogWithSearch({ tripId }: { tripId: string }) {
  const { activities } = useActivityStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredActivities = useMemo(() => {
    if (!searchTerm) return activities;
    
    return activities.filter(activity =>
      activity.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.userName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activities, searchTerm]);

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search activities..."
      />
      {filteredActivities.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
```

## Troubleshooting

### Activities not loading
- Check if `fetchActivities()` is called in `useEffect`
- Verify `tripId` is valid
- Check network tab for API errors
- Verify authentication token is valid

### Duplicate activities
- The store automatically prevents duplicates in `addActivity()`
- If seeing duplicates, check if multiple components are calling `addActivity()`

### Filter not working
- Remember to call `fetchActivities()` after `setFilter()`
- For client-side filtering, use `getFilteredActivities()`

### Real-time updates not working
- Verify WebSocket connection is established
- Check if `addActivity()` is called in socket event handler
- Ensure `tripId` matches in socket event

## Next Steps

1. **Create ActivityLog Component** (Task 6.1)
   - Use this store for state management
   - Implement UI for displaying activities
   - Add filtering and pagination UI

2. **Integrate WebSocket** (Task 5.6)
   - Connect socket events to `addActivity()`
   - Handle real-time updates

3. **Add to MembersScreen** (Task 6.3)
   - Display activity log in members screen
   - Show recent activities

## Related Documentation

- [Activity Log Service](../services/ACTIVITY_LOG_SERVICE_IMPLEMENTATION.md)
- [Activity Types](../types/activity.ts)
- [Task 5.4 Completion Summary](./TASK_5.4_COMPLETION_SUMMARY.md)
