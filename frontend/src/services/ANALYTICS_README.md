# Analytics Service

## Overview

The analytics service provides privacy-first event tracking for the Journo platform using PostHog. It implements batch event sending, opt-out functionality, and tracks key user interactions.

## Features

- **Privacy-First**: No IP logging, no tracking cookies, respects DNT
- **Batch Processing**: Events are batched (10 events or 30 seconds) before sending
- **Opt-Out Support**: Users can disable analytics from settings
- **Automatic Tracking**: Page views, user actions, and system events
- **Offline Support**: Events are queued when offline and sent when connection is restored

## Configuration

Add the following environment variables to your `.env` file:

```bash
VITE_POSTHOG_KEY=your_posthog_project_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
```

## Tracked Events

### User Events
- `user_signup` - When a user creates an account
- `user_login` - When a user logs in
- `page_view` - When a user navigates to a new page

### Trip Events
- `trip_created` - When a trip is created
- `trip_shared` - When a trip is shared (with share method)
- `community_posted` - When a trip is posted to community
- `budget_updated` - When trip budget is updated

### Place Events
- `place_added` - When a place is added to a trip (with place type)
- `photo_uploaded` - When a photo is uploaded (with source)

### Packing Events
- `packing_item_checked` - When a packing item is checked off (with category)

### Offline Events
- `offline_sync_started` - When offline sync begins
- `offline_sync_completed` - When offline sync completes (with sync count)

## Usage

### Basic Tracking

```typescript
import { analyticsService } from '../services/analyticsService';

// Track a custom event
analyticsService.track('custom_event', { 
  property1: 'value1',
  property2: 'value2'
}, userId, tripId);
```

### Using the Hook

```typescript
import { useAnalytics } from '../hooks/useAnalytics';

function MyComponent() {
  const { trackTripCreated, trackPlaceAdded } = useAnalytics();

  const handleCreateTrip = async (tripData) => {
    const trip = await createTrip(tripData);
    trackTripCreated(trip.id, { destination: tripData.destination });
  };

  return <div>...</div>;
}
```

### Automatic Page Tracking

```typescript
import { usePageTracking } from '../hooks/useAnalytics';

function MyPage() {
  usePageTracking('/my-page');
  return <div>...</div>;
}
```

## Opt-Out

Users can opt out of analytics from the Settings page. When opted out:
- No events are sent to PostHog
- No events are stored in the backend database
- The preference is saved in localStorage
- PostHog capturing is disabled

## Backend API

### POST /api/analytics/events

Receives batched analytics events from the frontend.

**Request Body:**
```json
{
  "events": [
    {
      "event_name": "trip_created",
      "user_id": "uuid",
      "trip_id": "uuid",
      "metadata": {
        "destination": "Tokyo",
        "theme": "adventure"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "5 events recorded successfully"
}
```

### GET /api/analytics/summary

Get analytics summary (admin only).

**Query Parameters:**
- `startDate` - Start date for filtering
- `endDate` - End date for filtering
- `eventName` - Filter by specific event name

### GET /api/analytics/top-events

Get top events (admin only).

**Query Parameters:**
- `limit` - Number of events to return (default: 10)
- `days` - Number of days to look back (default: 7)

### GET /api/analytics/user/:userId

Get user activity (admin only).

**Query Parameters:**
- `limit` - Number of events to return (default: 50)

## Database Schema

Events are stored in the `analytics_events` table:

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  trip_id UUID REFERENCES trips(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Privacy Compliance

The analytics system is designed to be GDPR compliant:

1. **No Personal Data**: We don't collect names, emails, or other PII
2. **No IP Logging**: IP addresses are not logged or stored
3. **No Cookies**: No tracking cookies are used
4. **Opt-Out**: Users can opt out at any time
5. **Data Minimization**: Only essential usage data is collected
6. **Transparency**: Users are informed about what data is collected

## Testing

To test analytics in development:

1. Set up PostHog project (or use test key)
2. Add environment variables
3. Open browser console to see events being tracked
4. Check PostHog dashboard for received events
5. Test opt-out functionality in Settings

## Notes

- Events are batched to reduce network requests
- Failed events are not retried (to avoid duplicate tracking)
- PostHog is initialized with privacy-first settings
- The service automatically flushes events before page unload
