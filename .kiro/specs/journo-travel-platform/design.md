# Design Document

## Overview

Journo is a comprehensive travel planning and sharing platform built with a modern responsive web architecture. The system employs a React-based frontend with TypeScript for type safety, and a self-hosted backend using PostgreSQL and Node.js/Express. The architecture prioritizes offline-first functionality through Progressive Web App capabilities, real-time collaboration, and responsive design that works seamlessly across all device sizes.

The platform consists of a responsive web application with Progressive Web App capabilities and one administrative portal, sharing a common codebase and design system. The system integrates with external services including Google Maps for location services, OpenWeather for forecasts, and Frankfurter for currency exchange rates.

## Architecture

### High-Level Architecture


```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        PWA[PWA Install]
        MOBILE[Mobile Browser]
        TABLET[Tablet Browser]
        ADMIN[Admin Portal]
    end
    
    subgraph "Application Layer"
        REACT[React + TypeScript + Vite]
        ZUSTAND[Zustand State]
        STORAGE[localStorage]
        SW[Service Worker]
    end
    
    subgraph "Backend Services"
        API[Express API Server]
        AUTH[JWT Auth Service]
        DB[(PostgreSQL)]
        WS[Socket.IO WebSocket]
        STORE[MinIO/File Storage]
    end
    
    subgraph "External APIs"
        GMAPS[Google Maps API]
        GPLACES[Google Places API]
        GDIR[Google Directions API]
        WEATHER[OpenWeather API]
        CURRENCY[Frankfurter API]
    end
    
    WEB --> REACT
    PWA --> REACT
    MOBILE --> REACT
    TABLET --> REACT
    ADMIN --> REACT
    
    REACT --> ZUSTAND
    REACT --> STORAGE
    REACT --> SW
    
    REACT --> API
    API --> AUTH
    API --> DB
    API --> STORE
    REACT --> WS
    
    REACT --> GMAPS
    REACT --> GPLACES
    REACT --> GDIR
    REACT --> WEATHER
    REACT --> CURRENCY
```

### Architecture Principles


1. **Offline-First**: All core functionality works without internet connectivity using local storage and background sync
2. **Progressive Enhancement**: Start with responsive web design, enhance to PWA with offline capabilities
3. **Real-Time Collaboration**: Changes sync instantly across all connected clients using Supabase Realtime
4. **Security by Default**: Row-level security policies enforce data access at the database level
5. **API-First**: External integrations are abstracted behind service layers with fallback strategies
6. **Component-Driven**: Reusable UI components built with Tailwind CSS and Headless UI
7. **Type Safety**: TypeScript throughout for compile-time error detection
8. **Performance**: Lazy loading, code splitting, and optimistic UI updates

### Technology Stack Rationale

**Frontend Framework - React 18 + TypeScript + Vite**
- React provides component reusability and large ecosystem
- TypeScript ensures type safety and better developer experience
- Vite offers fast development builds and optimized production bundles
- Hooks-based architecture aligns with modern React patterns

**State Management - Zustand**
- Lightweight alternative to Redux with simpler API
- Built-in TypeScript support
- Minimal boilerplate for global state
- Easy integration with React hooks

**Backend - PostgreSQL + Node.js/Express**
- PostgreSQL provides robust relational database with ACID guarantees
- Self-hosted for full control and no vendor lock-in
- JWT-based authentication with bcrypt password hashing
- WebSocket server for real-time subscriptions
- Database-level row security with PostgreSQL policies
- Local file storage or S3-compatible object storage (MinIO)
- Express API for RESTful endpoints and business logic
- Docker Compose for easy deployment and scaling

**Responsive Design - CSS Grid + Flexbox + Tailwind**
- Mobile-first responsive design approach
- Touch-optimized interactions for mobile devices
- Adaptive layouts for all screen sizes from 320px to 1920px
- Progressive Web App capabilities for app-like experience

**Styling - Tailwind CSS + Headless UI + ShadCN**
- Utility-first CSS for rapid development
- Headless UI for accessible components
- ShadCN for pre-built component patterns
- Dark mode support built-in

**Maps - Google Maps Platform**
- Comprehensive mapping features
- Places Autocomplete for location search
- Directions API for travel time calculation
- Offline map support via SDK

## Components and Interfaces

### Frontend Component Architecture


```
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── ProgressBar.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── trip/
│   │   ├── TripCard.tsx
│   │   ├── TripEditor.tsx
│   │   ├── TripList.tsx
│   │   ├── DayEditor.tsx
│   │   └── PlaceEditor.tsx
│   ├── map/
│   │   ├── MapView.tsx
│   │   ├── PlaceMarker.tsx
│   │   └── RoutePolyline.tsx
│   ├── story/
│   │   ├── StoryFeed.tsx
│   │   ├── StoryItem.tsx
│   │   ├── PhotoUpload.tsx
│   │   └── YouTubeEmbed.tsx
│   ├── community/
│   │   ├── CommunityFeed.tsx
│   │   ├── CommunityCard.tsx
│   │   └── LikeButton.tsx
│   ├── budget/
│   │   ├── BudgetCard.tsx
│   │   ├── BudgetProgress.tsx
│   │   ├── CategoryChart.tsx
│   │   └── DailyBudgetRing.tsx
│   ├── packing/
│   │   ├── PackingList.tsx
│   │   ├── PackingCategory.tsx
│   │   ├── PackingItem.tsx
│   │   └── PackingProgress.tsx
│   ├── sharing/
│   │   ├── ShareModal.tsx
│   │   ├── QRCode.tsx
│   │   └── ShareButtons.tsx
│   └── admin/
│       ├── Dashboard.tsx
│       ├── UserManagement.tsx
│       ├── TripModeration.tsx
│       └── Analytics.tsx
├── pages/
│   ├── Home.tsx
│   ├── TripDetail.tsx
│   ├── SharedTrip.tsx
│   ├── Community.tsx
│   ├── Profile.tsx
│   ├── Settings.tsx
│   └── Admin.tsx
├── stores/
│   ├── authStore.ts
│   ├── tripStore.ts
│   ├── offlineStore.ts
│   └── uiStore.ts
├── services/
│   ├── supabase.ts
│   ├── maps.ts
│   ├── weather.ts
│   ├── currency.ts
│   ├── analytics.ts
│   └── offline.ts
├── hooks/
│   ├── useTrip.ts
│   ├── useRealtime.ts
│   ├── useOffline.ts
│   └── useBudget.ts
├── types/
│   ├── trip.ts
│   ├── place.ts
│   ├── story.ts
│   └── user.ts
└── utils/
    ├── date.ts
    ├── currency.ts
    └── validation.ts
```

### Key Component Interfaces


**TripEditor Component**
```typescript
interface TripEditorProps {
  tripId?: string;
  mode: 'create' | 'edit';
  onSave: (trip: Trip) => void;
  onCancel: () => void;
}

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: Date;
  end_date: Date;
  cover_image_url?: string;
  theme: 'default' | 'adventure' | 'romantic' | 'foodie' | 'chill';
  owner_id: string;
  is_public: boolean;
  is_community: boolean;
  share_token: string;
  total_budget?: number;
  currency_code: string;
  likes_count: number;
  views_count: number;
  created_at: Date;
}
```

**MapView Component**
```typescript
interface MapViewProps {
  places: Place[];
  center?: { lat: number; lng: number };
  zoom?: number;
  showRoutes?: boolean;
  onPlaceClick?: (place: Place) => void;
  offlineMode?: boolean;
}

interface Place {
  id: string;
  trip_day_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  time_start?: string;
  time_end?: string;
  notes?: string;
  image_url?: string;
  place_type: 'attraction' | 'food' | 'hotel' | 'transport' | 'other';
  sticker?: string;
  cost?: number;
  cost_currency?: string;
  budget_category?: string;
  transport_mode?: 'driving' | 'walking' | 'transit' | 'flight';
  created_at: Date;
}
```

**BudgetCard Component**
```typescript
interface BudgetCardProps {
  tripId: string;
  totalBudget: number;
  totalSpent: number;
  currency: string;
  daysRemaining: number;
  categoryBreakdown: CategorySpending[];
  onEdit: () => void;
}

interface CategorySpending {
  category: 'accommodation' | 'food' | 'transport' | 'activities' | 'shopping' | 'misc';
  amount: number;
  percentage: number;
}
```

**PackingList Component**
```typescript
interface PackingListProps {
  tripId: string;
  items: PackingItem[];
  onItemToggle: (itemId: string) => void;
  onItemAdd: (item: Omit<PackingItem, 'id'>) => void;
  onExport: () => void;
}

interface PackingItem {
  id: string;
  trip_id: string;
  item: string;
  category: 'essentials' | 'clothing' | 'toiletries' | 'electronics' | 'documents' | 'health' | 'activities' | 'misc';
  is_checked: boolean;
  added_by: string;
  is_custom: boolean;
  created_at: Date;
}
```

## Data Models

### Database Schema


**Core Tables**

```sql
-- Users (managed by Supabase Auth)
-- auth.users table with additional profile data

-- Trips
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  cover_image_url TEXT,
  theme TEXT DEFAULT 'default' CHECK (theme IN ('default', 'adventure', 'romantic', 'foodie', 'chill')),
  owner_id UUID REFERENCES auth.users NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  is_community BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  total_budget DECIMAL(12,2),
  currency_code TEXT DEFAULT 'USD',
  weather_data JSONB,
  likes_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trips_owner ON trips(owner_id);
CREATE INDEX idx_trips_share_token ON trips(share_token);
CREATE INDEX idx_trips_community ON trips(is_community) WHERE is_community = TRUE;

-- Trip Days
CREATE TABLE trip_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips ON DELETE CASCADE NOT NULL,
  day_number INT NOT NULL,
  date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

CREATE INDEX idx_trip_days_trip ON trip_days(trip_id);

-- Places
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_day_id UUID REFERENCES trip_days ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  time_start TIME,
  time_end TIME,
  notes TEXT,
  image_url TEXT,
  place_type TEXT CHECK (place_type IN ('attraction', 'food', 'hotel', 'transport', 'other')),
  sticker TEXT,
  cost DECIMAL(10,2),
  cost_currency TEXT DEFAULT 'USD',
  budget_category TEXT CHECK (budget_category IN ('accommodation', 'food', 'transport', 'activities', 'shopping', 'misc')),
  transport_mode TEXT CHECK (transport_mode IN ('driving', 'walking', 'transit', 'flight')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_places_trip_day ON places(trip_day_id);

-- Story Items
CREATE TABLE story_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT CHECK (type IN ('photo', 'youtube', 'note')) NOT NULL,
  content_url TEXT,
  caption TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_story_items_trip ON story_items(trip_id);
CREATE INDEX idx_story_items_created ON story_items(created_at DESC);

-- Trip Likes
CREATE TABLE trip_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

CREATE INDEX idx_trip_likes_trip ON trip_likes(trip_id);
CREATE INDEX idx_trip_likes_user ON trip_likes(user_id);
```

**Budget and Packing Tables**


```sql
-- Packing Lists
CREATE TABLE packing_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips ON DELETE CASCADE NOT NULL,
  item TEXT NOT NULL,
  category TEXT CHECK (category IN ('essentials', 'clothing', 'toiletries', 'electronics', 'documents', 'health', 'activities', 'misc')),
  is_checked BOOLEAN DEFAULT FALSE,
  added_by UUID REFERENCES auth.users NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_packing_lists_trip ON packing_lists(trip_id);

-- Packing Templates (for auto-suggestions)
CREATE TABLE packing_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  destination_type TEXT,
  weather_condition TEXT,
  trip_duration_days INT,
  item TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE INDEX idx_packing_templates_lookup ON packing_templates(destination_type, weather_condition);

-- Trip Versions (for undo/redo)
CREATE TABLE trip_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips ON DELETE CASCADE NOT NULL,
  version_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trip_versions_trip ON trip_versions(trip_id, created_at DESC);
```

**Collaboration Tables**

```sql
-- Trip Collaborators
CREATE TABLE trip_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  role TEXT CHECK (role IN ('owner', 'editor', 'viewer')) NOT NULL,
  invited_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

CREATE INDEX idx_trip_collaborators_trip ON trip_collaborators(trip_id);
CREATE INDEX idx_trip_collaborators_user ON trip_collaborators(user_id);
```

**Analytics and Admin Tables**

```sql
-- User Badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  trip_id UUID REFERENCES trips,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- Analytics Events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users,
  trip_id UUID REFERENCES trips,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);

-- Currency Exchange Rates Cache
CREATE TABLE currency_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate DECIMAL(12,6) NOT NULL,
  cached_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(base_currency, target_currency)
);

CREATE INDEX idx_currency_rates_lookup ON currency_rates(base_currency, target_currency);
```

### Data Relationships


```mermaid
erDiagram
    USERS ||--o{ TRIPS : owns
    USERS ||--o{ TRIP_COLLABORATORS : participates
    USERS ||--o{ STORY_ITEMS : creates
    USERS ||--o{ TRIP_LIKES : likes
    USERS ||--o{ USER_BADGES : earns
    
    TRIPS ||--o{ TRIP_DAYS : contains
    TRIPS ||--o{ STORY_ITEMS : has
    TRIPS ||--o{ TRIP_LIKES : receives
    TRIPS ||--o{ PACKING_LISTS : has
    TRIPS ||--o{ TRIP_VERSIONS : versioned
    TRIPS ||--o{ TRIP_COLLABORATORS : shared_with
    
    TRIP_DAYS ||--o{ PLACES : contains
    
    USERS {
        uuid id PK
        string email
        string name
        timestamp created_at
    }
    
    TRIPS {
        uuid id PK
        string title
        string destination
        date start_date
        date end_date
        string theme
        uuid owner_id FK
        boolean is_public
        boolean is_community
        string share_token
        decimal total_budget
        string currency_code
        int likes_count
        int views_count
    }
    
    TRIP_DAYS {
        uuid id PK
        uuid trip_id FK
        int day_number
        date date
    }
    
    PLACES {
        uuid id PK
        uuid trip_day_id FK
        string name
        float lat
        float lng
        time time_start
        decimal cost
        string budget_category
        string transport_mode
    }
    
    STORY_ITEMS {
        uuid id PK
        uuid trip_id FK
        uuid user_id FK
        string type
        string content_url
        string caption
    }
    
    PACKING_LISTS {
        uuid id PK
        uuid trip_id FK
        string item
        string category
        boolean is_checked
        boolean is_custom
    }
```

## Error Handling

### Error Categories and Strategies


**Network Errors**
- Strategy: Offline-first architecture with local storage fallback
- User Experience: Display "Offline" badge, queue operations for sync
- Recovery: Automatic retry with exponential backoff when connection restored
- Example: User edits trip while offline → changes saved to localStorage → synced when online

**Authentication Errors**
- Strategy: Token refresh with Supabase Auth
- User Experience: Seamless re-authentication, redirect to login only if refresh fails
- Recovery: Clear local session, preserve unsaved work in temporary storage
- Example: Session expires → attempt refresh → if fails, show login modal with "Your session expired" message

**API Rate Limiting**
- Strategy: Implement caching and request throttling
- User Experience: Use cached data when available, show loading state for fresh data
- Recovery: Exponential backoff for retries, fallback to cached data
- Example: Google Maps API limit reached → use cached map tiles → show "Using cached maps" message

**Data Validation Errors**
- Strategy: Client-side validation before submission
- User Experience: Inline error messages with specific guidance
- Recovery: Highlight invalid fields, prevent submission until corrected
- Example: Budget amount is negative → show "Budget must be positive" error → disable save button

**File Upload Errors**
- Strategy: Chunked uploads with resume capability
- User Experience: Progress indicator, retry button on failure
- Recovery: Resume from last successful chunk, compress images if too large
- Example: Photo upload fails at 80% → show "Upload failed. Retry?" → resume from 80%

**Database Constraint Violations**
- Strategy: Optimistic UI updates with rollback on error
- User Experience: Immediate feedback, revert on server rejection
- Recovery: Show error toast, restore previous state
- Example: User tries to like trip twice → optimistic increment → server rejects → decrement and show "Already liked"

**External API Failures**
- Strategy: Graceful degradation with fallback options
- User Experience: Core functionality continues, optional features disabled
- Recovery: Retry with exponential backoff, use cached data
- Example: Weather API down → show "Weather unavailable" → use last cached forecast if available

### Error Handling Implementation


**Global Error Boundary**
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to analytics service
    logError(error, errorInfo);
    
    // Show user-friendly error page
    this.setState({ hasError: true });
    
    // Attempt to save user's work
    saveToLocalStorage(this.props.currentState);
  }
}
```

**API Error Handler**
```typescript
async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  options: {
    retries?: number;
    fallback?: T;
    cache?: boolean;
  }
): Promise<T> {
  try {
    const result = await apiCall();
    if (options.cache) {
      cacheResult(result);
    }
    return result;
  } catch (error) {
    if (isNetworkError(error) && options.retries > 0) {
      await delay(exponentialBackoff(options.retries));
      return handleApiCall(apiCall, { ...options, retries: options.retries - 1 });
    }
    
    if (options.fallback) {
      return options.fallback;
    }
    
    throw error;
  }
}
```

**Offline Sync Error Handling**
```typescript
async function syncOfflineChanges() {
  const pendingChanges = await getOfflineQueue();
  
  for (const change of pendingChanges) {
    try {
      await applyChange(change);
      await removeFromQueue(change.id);
    } catch (error) {
      if (isConflictError(error)) {
        // Resolve conflict using last-write-wins
        const serverVersion = await fetchServerVersion(change.resourceId);
        const resolution = resolveConflict(change, serverVersion);
        await applyChange(resolution);
      } else if (isRetryableError(error)) {
        // Keep in queue for next sync
        await updateRetryCount(change.id);
      } else {
        // Permanent failure, notify user
        await markAsFailed(change.id);
        notifyUser(`Failed to sync: ${change.description}`);
      }
    }
  }
}
```

## Testing Strategy

### Testing Pyramid


```mermaid
graph TB
    E2E[End-to-End Tests - 10%]
    INT[Integration Tests - 30%]
    UNIT[Unit Tests - 60%]
    
    E2E --> INT
    INT --> UNIT
    
    style E2E fill:#ff6b6b
    style INT fill:#ffd93d
    style UNIT fill:#6bcf7f
```

### Unit Tests (60% of test suite)

**Focus Areas:**
- Utility functions (date formatting, currency conversion, validation)
- State management logic (Zustand stores)
- Data transformation functions
- Business logic (budget calculations, packing suggestions)

**Tools:**
- Vitest for test runner
- React Testing Library for component tests
- MSW (Mock Service Worker) for API mocking

**Example Test Cases:**
```typescript
describe('Budget Calculations', () => {
  test('calculates total spent correctly', () => {
    const places = [
      { cost: 100, cost_currency: 'USD' },
      { cost: 50, cost_currency: 'USD' }
    ];
    expect(calculateTotalSpent(places)).toBe(150);
  });
  
  test('converts currency correctly', async () => {
    const result = await convertCurrency(100, 'EUR', 'USD', 1.1);
    expect(result).toBe(110);
  });
  
  test('warns when budget exceeds 80%', () => {
    const status = getBudgetStatus(800, 1000);
    expect(status).toBe('warning');
  });
});

describe('Packing Suggestions', () => {
  test('suggests sunscreen for hot weather', () => {
    const weather = { maxTemp: 35 };
    const suggestions = generatePackingSuggestions({ weather });
    expect(suggestions).toContainEqual(
      expect.objectContaining({ item: 'Sunscreen SPF50' })
    );
  });
  
  test('suggests adapter for Japan', () => {
    const suggestions = generatePackingSuggestions({ destination: 'Tokyo' });
    expect(suggestions).toContainEqual(
      expect.objectContaining({ item: 'Travel adapter (Type A/B)' })
    );
  });
});
```

### Integration Tests (30% of test suite)

**Focus Areas:**
- API integration with Supabase
- Real-time subscription handling
- Offline sync mechanisms
- External API integrations (Google Maps, Weather)

**Tools:**
- Vitest with Supabase test client
- Playwright for browser integration tests

**Example Test Cases:**
```typescript
describe('Trip CRUD Operations', () => {
  test('creates trip and syncs to database', async () => {
    const trip = await createTrip({
      title: 'Tokyo Adventure',
      destination: 'Tokyo',
      start_date: '2025-06-01'
    });
    
    const fetched = await fetchTrip(trip.id);
    expect(fetched.title).toBe('Tokyo Adventure');
  });
  
  test('updates trip in real-time for collaborators', async () => {
    const trip = await createTrip({ title: 'Original' });
    const subscription = subscribeToTrip(trip.id);
    
    await updateTrip(trip.id, { title: 'Updated' });
    
    await waitFor(() => {
      expect(subscription.data.title).toBe('Updated');
    });
  });
});

describe('Offline Sync', () => {
  test('queues changes when offline', async () => {
    setNetworkStatus('offline');
    
    await createPlace({ name: 'Test Place' });
    
    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(1);
  });
  
  test('syncs queued changes when online', async () => {
    setNetworkStatus('offline');
    await createPlace({ name: 'Test Place' });
    
    setNetworkStatus('online');
    await syncOfflineChanges();
    
    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(0);
  });
});
```

### End-to-End Tests (10% of test suite)

**Focus Areas:**
- Critical user journeys
- Cross-browser compatibility
- Mobile app functionality
- Payment flows (if applicable)

**Tools:**
- Playwright for web and mobile testing
- Responsive design testing across device sizes

**Example Test Cases:**
```typescript
describe('Trip Creation Flow', () => {
  test('user can create and share a trip', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Create Trip');
    
    await page.fill('[name="title"]', 'My Tokyo Trip');
    await page.fill('[name="destination"]', 'Tokyo');
    await page.click('text=Save');
    
    await page.click('text=Share');
    const shareLink = await page.locator('[data-testid="share-link"]').textContent();
    
    expect(shareLink).toContain('/t/');
  });
  
  test('shared trip is viewable by others', async ({ page, context }) => {
    // Create trip as user 1
    const shareLink = await createAndShareTrip(page);
    
    // Open in new context as user 2
    const page2 = await context.newPage();
    await page2.goto(shareLink);
    
    await expect(page2.locator('h1')).toContainText('My Tokyo Trip');
  });
});

describe('Offline Functionality', () => {
  test('user can edit trip while offline', async ({ page, context }) => {
    await page.goto('/trip/123');
    
    // Go offline
    await context.setOffline(true);
    
    await page.fill('[name="title"]', 'Updated Title');
    await page.click('text=Save');
    
    await expect(page.locator('[data-testid="offline-badge"]')).toBeVisible();
    
    // Go online
    await context.setOffline(false);
    
    await waitFor(() => 
      expect(page.locator('[data-testid="offline-badge"]')).not.toBeVisible()
    );
  });
});
```

### Performance Testing


**Metrics to Track:**
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Time to Interactive (TTI) < 3.5s
- Cumulative Layout Shift (CLS) < 0.1
- First Input Delay (FID) < 100ms

**Tools:**
- Lighthouse CI for automated performance audits
- WebPageTest for real-world performance testing
- Chrome DevTools Performance profiler

**Optimization Strategies:**
- Code splitting by route
- Lazy loading of images and components
- Service worker caching
- Database query optimization with indexes
- CDN for static assets

## Security Considerations

### Row-Level Security (RLS) Policies

**Trips Table**
```sql
-- Users can view their own trips
CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can view public trips
CREATE POLICY "Anyone can view public trips"
  ON trips FOR SELECT
  USING (is_public = true);

-- Users can view trips they collaborate on
CREATE POLICY "Collaborators can view trips"
  ON trips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_collaborators
      WHERE trip_id = trips.id
      AND user_id = auth.uid()
    )
  );

-- Users can update their own trips
CREATE POLICY "Owners can update trips"
  ON trips FOR UPDATE
  USING (auth.uid() = owner_id);

-- Editors can update trips
CREATE POLICY "Editors can update trips"
  ON trips FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trip_collaborators
      WHERE trip_id = trips.id
      AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
    )
  );

-- Users can delete their own trips
CREATE POLICY "Owners can delete trips"
  ON trips FOR DELETE
  USING (auth.uid() = owner_id);
```

**Places Table**
```sql
-- Users can view places in trips they have access to
CREATE POLICY "Users can view accessible places"
  ON places FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_days td
      JOIN trips t ON t.id = td.trip_id
      WHERE td.id = places.trip_day_id
      AND (
        t.owner_id = auth.uid()
        OR t.is_public = true
        OR EXISTS (
          SELECT 1 FROM trip_collaborators tc
          WHERE tc.trip_id = t.id
          AND tc.user_id = auth.uid()
        )
      )
    )
  );

-- Owners and editors can modify places
CREATE POLICY "Owners and editors can modify places"
  ON places FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trip_days td
      JOIN trips t ON t.id = td.trip_id
      LEFT JOIN trip_collaborators tc ON tc.trip_id = t.id
      WHERE td.id = places.trip_day_id
      AND (
        t.owner_id = auth.uid()
        OR (tc.user_id = auth.uid() AND tc.role IN ('owner', 'editor'))
      )
    )
  );
```

### Authentication and Authorization

**Authentication Flow**
1. User signs up/logs in via Supabase Auth
2. JWT token issued with user ID and role
3. Token stored in httpOnly cookie (web) or secure storage (mobile)
4. Token automatically refreshed before expiration
5. All API requests include token in Authorization header

**Authorization Levels**
- **Anonymous**: View public trips, browse community feed
- **Authenticated User**: Create trips, like posts, copy itineraries
- **Trip Owner**: Full control over trip, manage collaborators
- **Trip Editor**: Edit trip details, add places, upload photos
- **Trip Viewer**: Read-only access to trip
- **Admin**: Access admin portal, moderate content, view analytics
- **Moderator**: Moderate content, flag inappropriate posts

### Data Protection

**Sensitive Data Handling**
- Passwords: Hashed with bcrypt by Supabase Auth
- API Keys: Stored in environment variables, never in code
- User PII: Encrypted at rest in PostgreSQL
- File Uploads: Scanned for malware, size limits enforced
- Payment Data: Not stored (if payment features added, use Stripe)

**Input Validation**
- Client-side validation for UX
- Server-side validation for security
- SQL injection prevention via parameterized queries
- XSS prevention via React's built-in escaping
- CSRF protection via SameSite cookies

**Rate Limiting**
- API endpoints: 100 requests per minute per user
- File uploads: 10 per minute per user
- Authentication attempts: 5 per minute per IP
- Implemented via Supabase Edge Functions

## Offline Architecture

### Offline-First Strategy


```mermaid
sequenceDiagram
    participant UI
    participant Store
    participant localStorage
    participant SyncQueue
    participant Supabase
    
    UI->>Store: User creates place
    Store->>localStorage: Save locally
    Store->>UI: Update UI immediately
    
    alt Online
        Store->>Supabase: Sync to server
        Supabase-->>Store: Confirm
        Store->>localStorage: Mark as synced
    else Offline
        Store->>SyncQueue: Add to queue
        SyncQueue->>localStorage: Persist queue
        Store->>UI: Show offline badge
    end
    
    Note over SyncQueue,Supabase: When connection restored
    
    SyncQueue->>Supabase: Process queue
    Supabase-->>SyncQueue: Confirm each item
    SyncQueue->>localStorage: Clear queue
    SyncQueue->>UI: Hide offline badge
```

### Local Storage Structure

**localStorage Schema**
```typescript
interface OfflineStorage {
  trips: Record<string, Trip>;
  tripDays: Record<string, TripDay[]>;
  places: Record<string, Place[]>;
  storyItems: Record<string, StoryItem[]>;
  packingLists: Record<string, PackingItem[]>;
  syncQueue: SyncOperation[];
  currencyRates: Record<string, CurrencyRate>;
  mapTiles: Record<string, MapTile>;
  lastSync: Record<string, Date>;
}

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: 'trip' | 'place' | 'story_item' | 'packing_item';
  resourceId: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}
```

### Conflict Resolution

**Strategy: Last-Write-Wins with Version Tracking**

```typescript
async function resolveConflict(
  localVersion: any,
  serverVersion: any
): Promise<any> {
  // Compare timestamps
  if (localVersion.updated_at > serverVersion.updated_at) {
    // Local is newer, push to server
    return localVersion;
  } else if (serverVersion.updated_at > localVersion.updated_at) {
    // Server is newer, pull from server
    return serverVersion;
  } else {
    // Same timestamp, merge changes
    return mergeChanges(localVersion, serverVersion);
  }
}

function mergeChanges(local: any, server: any): any {
  // Field-level merge for non-conflicting changes
  const merged = { ...server };
  
  for (const key in local) {
    if (local[key] !== server[key]) {
      // If both changed same field, prefer local
      merged[key] = local[key];
    }
  }
  
  return merged;
}
```

### Sync Queue Processing

```typescript
class SyncManager {
  private queue: SyncOperation[] = [];
  private isProcessing = false;
  
  async addToQueue(operation: SyncOperation) {
    this.queue.push(operation);
    await this.persistQueue();
    
    if (navigator.onLine && !this.isProcessing) {
      await this.processQueue();
    }
  }
  
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const operation = this.queue[0];
      
      try {
        await this.syncOperation(operation);
        this.queue.shift();
        await this.persistQueue();
      } catch (error) {
        if (this.isRetryable(error)) {
          operation.retryCount++;
          if (operation.retryCount > 3) {
            operation.status = 'failed';
            this.notifyUser(`Failed to sync: ${operation.resource}`);
          }
          break; // Stop processing, will retry later
        } else {
          // Permanent error, remove from queue
          this.queue.shift();
          this.notifyUser(`Cannot sync: ${error.message}`);
        }
      }
    }
    
    this.isProcessing = false;
  }
  
  private async syncOperation(operation: SyncOperation) {
    switch (operation.type) {
      case 'create':
        return await supabase.from(operation.resource).insert(operation.data);
      case 'update':
        return await supabase.from(operation.resource)
          .update(operation.data)
          .eq('id', operation.resourceId);
      case 'delete':
        return await supabase.from(operation.resource)
          .delete()
          .eq('id', operation.resourceId);
    }
  }
}
```

## Real-Time Features

### Supabase Realtime Integration


**Real-Time Subscriptions**

```typescript
// Subscribe to trip changes
function useRealtimeTrip(tripId: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  
  useEffect(() => {
    // Initial fetch
    fetchTrip(tripId).then(setTrip);
    
    // Subscribe to changes
    const subscription = supabase
      .channel(`trip:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setTrip(payload.new as Trip);
          } else if (payload.eventType === 'DELETE') {
            setTrip(null);
          }
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [tripId]);
  
  return trip;
}

// Subscribe to story items
function useRealtimeStoryFeed(tripId: string) {
  const [items, setItems] = useState<StoryItem[]>([]);
  
  useEffect(() => {
    // Initial fetch
    fetchStoryItems(tripId).then(setItems);
    
    // Subscribe to new items
    const subscription = supabase
      .channel(`story:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'story_items',
          filter: `trip_id=eq.${tripId}`
        },
        (payload) => {
          setItems(prev => [payload.new as StoryItem, ...prev]);
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [tripId]);
  
  return items;
}

// Subscribe to packing list changes
function useRealtimePackingList(tripId: string) {
  const [items, setItems] = useState<PackingItem[]>([]);
  
  useEffect(() => {
    fetchPackingList(tripId).then(setItems);
    
    const subscription = supabase
      .channel(`packing:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'packing_lists',
          filter: `trip_id=eq.${tripId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems(prev => [...prev, payload.new as PackingItem]);
          } else if (payload.eventType === 'UPDATE') {
            setItems(prev => 
              prev.map(item => 
                item.id === payload.new.id ? payload.new as PackingItem : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [tripId]);
  
  return items;
}
```

### Presence Tracking

```typescript
// Track who's viewing a trip
function useTripPresence(tripId: string) {
  const [viewers, setViewers] = useState<User[]>([]);
  const currentUser = useAuthStore(state => state.user);
  
  useEffect(() => {
    const channel = supabase.channel(`presence:${tripId}`);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat() as User[];
        setViewers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUser.id,
            name: currentUser.name,
            online_at: new Date().toISOString()
          });
        }
      });
    
    return () => {
      channel.unsubscribe();
    };
  }, [tripId, currentUser]);
  
  return viewers;
}
```

## External API Integration

### Google Maps Integration


**Maps Service**

```typescript
class MapsService {
  private map: google.maps.Map | null = null;
  private markers: Map<string, google.maps.Marker> = new Map();
  private directionsService: google.maps.DirectionsService;
  private directionsRenderer: google.maps.DirectionsRenderer;
  
  async initialize(container: HTMLElement, center: LatLng) {
    const { Map } = await google.maps.importLibrary("maps");
    
    this.map = new Map(container, {
      center,
      zoom: 12,
      mapId: process.env.VITE_GOOGLE_MAPS_ID,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false
    });
    
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      map: this.map,
      suppressMarkers: true
    });
  }
  
  addMarker(place: Place) {
    const marker = new google.maps.Marker({
      position: { lat: place.lat, lng: place.lng },
      map: this.map,
      title: place.name,
      icon: this.getMarkerIcon(place.place_type)
    });
    
    marker.addListener('click', () => {
      this.showInfoWindow(place, marker);
    });
    
    this.markers.set(place.id, marker);
  }
  
  async calculateRoute(places: Place[]) {
    if (places.length < 2) return;
    
    const waypoints = places.slice(1, -1).map(place => ({
      location: { lat: place.lat, lng: place.lng },
      stopover: true
    }));
    
    const request: google.maps.DirectionsRequest = {
      origin: { lat: places[0].lat, lng: places[0].lng },
      destination: { lat: places[places.length - 1].lat, lng: places[places.length - 1].lng },
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false
    };
    
    const result = await this.directionsService.route(request);
    this.directionsRenderer.setDirections(result);
    
    return result;
  }
  
  async downloadOfflineMap(bounds: google.maps.LatLngBounds) {
    // Use Google Maps SDK offline capabilities
    // Cache map tiles for the specified bounds
    const tiles = await this.getTilesInBounds(bounds);
    await localStorage.setItem(`map_tiles_${bounds.toString()}`, JSON.stringify(tiles));
  }
  
  private getMarkerIcon(type: string): google.maps.Icon {
    const icons = {
      attraction: '/icons/attraction.png',
      food: '/icons/food.png',
      hotel: '/icons/hotel.png',
      transport: '/icons/transport.png',
      other: '/icons/other.png'
    };
    
    return {
      url: icons[type] || icons.other,
      scaledSize: new google.maps.Size(32, 32)
    };
  }
}
```

**Places Autocomplete**

```typescript
function usePlacesAutocomplete() {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const autocompleteService = useRef<google.maps.places.AutocompleteService>();
  
  useEffect(() => {
    autocompleteService.current = new google.maps.places.AutocompleteService();
  }, []);
  
  const search = useCallback(async (input: string) => {
    if (!input || !autocompleteService.current) {
      setPredictions([]);
      return;
    }
    
    const result = await autocompleteService.current.getPlacePredictions({
      input,
      types: ['establishment', 'geocode']
    });
    
    setPredictions(result.predictions);
  }, []);
  
  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails> => {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    return new Promise((resolve, reject) => {
      service.getDetails({ placeId }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve({
            name: place.name,
            address: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            types: place.types
          });
        } else {
          reject(new Error('Place details not found'));
        }
      });
    });
  }, []);
  
  return { predictions, search, getPlaceDetails };
}
```

### Weather API Integration


**Weather Service**

```typescript
interface WeatherData {
  date: string;
  temp_max: number;
  temp_min: number;
  condition: string;
  icon: string;
  precipitation_prob: number;
}

class WeatherService {
  private apiKey = process.env.VITE_OPENWEATHER_API_KEY;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';
  
  async getForecast(lat: number, lng: number): Promise<WeatherData[]> {
    // Check cache first
    const cached = await this.getCachedForecast(lat, lng);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    
    // Fetch fresh data
    const response = await fetch(
      `${this.baseUrl}/forecast?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error('Weather API request failed');
    }
    
    const data = await response.json();
    const forecast = this.parseForecast(data);
    
    // Cache for 6 hours
    await this.cacheForecast(lat, lng, forecast);
    
    return forecast;
  }
  
  private parseForecast(data: any): WeatherData[] {
    const dailyForecasts = new Map<string, any[]>();
    
    // Group by date
    data.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, []);
      }
      dailyForecasts.get(date)!.push(item);
    });
    
    // Aggregate daily data
    return Array.from(dailyForecasts.entries()).map(([date, items]) => ({
      date,
      temp_max: Math.max(...items.map(i => i.main.temp_max)),
      temp_min: Math.min(...items.map(i => i.main.temp_min)),
      condition: items[0].weather[0].main,
      icon: items[0].weather[0].icon,
      precipitation_prob: Math.max(...items.map(i => i.pop || 0))
    }));
  }
  
  private async cacheForecast(lat: number, lng: number, data: WeatherData[]) {
    const key = `weather_${lat}_${lng}`;
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  }
  
  private async getCachedForecast(lat: number, lng: number) {
    const key = `weather_${lat}_${lng}`;
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  private isCacheValid(timestamp: number): boolean {
    const sixHours = 6 * 60 * 60 * 1000;
    return Date.now() - timestamp < sixHours;
  }
}
```

### Currency Exchange Integration

```typescript
interface ExchangeRate {
  base: string;
  target: string;
  rate: number;
  cached_at: Date;
}

class CurrencyService {
  private apiUrl = 'https://api.frankfurter.app';
  
  async convert(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;
    
    const rate = await this.getRate(from, to);
    return amount * rate;
  }
  
  async getRate(from: string, to: string): Promise<number> {
    // Check database cache first
    const cached = await this.getCachedRate(from, to);
    if (cached && this.isCacheValid(cached.cached_at)) {
      return cached.rate;
    }
    
    // Fetch fresh rate
    try {
      const response = await fetch(
        `${this.apiUrl}/latest?from=${from}&to=${to}`
      );
      
      if (!response.ok) {
        throw new Error('Currency API request failed');
      }
      
      const data = await response.json();
      const rate = data.rates[to];
      
      // Cache for 24 hours
      await this.cacheRate(from, to, rate);
      
      return rate;
    } catch (error) {
      // Fallback to cached rate if available
      if (cached) {
        console.warn('Using stale currency rate due to API error');
        return cached.rate;
      }
      throw error;
    }
  }
  
  private async getCachedRate(from: string, to: string): Promise<ExchangeRate | null> {
    const { data, error } = await supabase
      .from('currency_rates')
      .select('*')
      .eq('base_currency', from)
      .eq('target_currency', to)
      .single();
    
    return error ? null : data;
  }
  
  private async cacheRate(from: string, to: string, rate: number) {
    await supabase
      .from('currency_rates')
      .upsert({
        base_currency: from,
        target_currency: to,
        rate,
        cached_at: new Date()
      });
  }
  
  private isCacheValid(cachedAt: Date): boolean {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return Date.now() - new Date(cachedAt).getTime() < twentyFourHours;
  }
}
```

## Admin Portal Design

### Admin Dashboard Architecture


**Admin Routes**

```typescript
// Admin-only routes with role check
const adminRoutes = [
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'users', element: <UserManagement /> },
      { path: 'trips', element: <TripModeration /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'system', element: <SystemHealth /> },
      { path: 'features', element: <FeatureFlags /> }
    ]
  }
];

// Route guard
function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(state => state.user);
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
}
```

**Dashboard Metrics**

```typescript
interface DashboardMetrics {
  dau: number;
  mau: number;
  tripsCreated: number;
  communityPosts: number;
  offlineSyncs: number;
  storageUsed: number;
  apiErrors: number;
  activeUsers: User[];
}

async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  // Use Supabase Edge Function for aggregation
  const { data } = await supabase.functions.invoke('admin-metrics', {
    body: { timeRange: '24h' }
  });
  
  return data;
}

// Real-time metrics updates
function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  
  useEffect(() => {
    // Initial fetch
    fetchDashboardMetrics().then(setMetrics);
    
    // Subscribe to updates every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardMetrics().then(setMetrics);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return metrics;
}
```

**Content Moderation**

```typescript
interface ModerationAction {
  type: 'flag' | 'hide' | 'delete' | 'warn';
  resourceType: 'trip' | 'story_item' | 'user';
  resourceId: string;
  reason: string;
  moderatorId: string;
}

async function moderateContent(action: ModerationAction) {
  switch (action.type) {
    case 'flag':
      await supabase
        .from('moderation_flags')
        .insert({
          resource_type: action.resourceType,
          resource_id: action.resourceId,
          reason: action.reason,
          moderator_id: action.moderatorId
        });
      break;
      
    case 'hide':
      if (action.resourceType === 'trip') {
        await supabase
          .from('trips')
          .update({ is_community: false, is_public: false })
          .eq('id', action.resourceId);
      }
      break;
      
    case 'delete':
      await supabase
        .from(action.resourceType + 's')
        .delete()
        .eq('id', action.resourceId);
      break;
      
    case 'warn':
      // Send warning email to user
      await supabase.functions.invoke('send-warning', {
        body: {
          userId: action.resourceId,
          reason: action.reason
        }
      });
      break;
  }
  
  // Log action
  await supabase
    .from('moderation_log')
    .insert({
      action: action.type,
      resource_type: action.resourceType,
      resource_id: action.resourceId,
      reason: action.reason,
      moderator_id: action.moderatorId
    });
}
```

**Feature Flags**

```typescript
interface FeatureFlag {
  name: string;
  enabled: boolean;
  rollout_percentage: number;
  description: string;
}

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  
  async initialize() {
    const { data } = await supabase
      .from('feature_flags')
      .select('*');
    
    data?.forEach(flag => {
      this.flags.set(flag.name, flag);
    });
  }
  
  isEnabled(flagName: string, userId?: string): boolean {
    const flag = this.flags.get(flagName);
    if (!flag) return false;
    if (!flag.enabled) return false;
    
    // Gradual rollout based on user ID hash
    if (flag.rollout_percentage < 100 && userId) {
      const hash = this.hashUserId(userId);
      return hash % 100 < flag.rollout_percentage;
    }
    
    return true;
  }
  
  async toggleFlag(flagName: string, enabled: boolean) {
    await supabase
      .from('feature_flags')
      .update({ enabled })
      .eq('name', flagName);
    
    this.flags.get(flagName)!.enabled = enabled;
  }
  
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
```

## PWA and Responsive Design

### Progressive Web App Configuration


**Web App Manifest**

```json
{
  "name": "Journo - Travel Planning & Sharing",
  "short_name": "Journo",
  "description": "Plan together. Share the journey.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1280x720",
      "type": "image/png"
    },
    {
      "src": "/screenshots/trip-editor.png",
      "sizes": "1280x720",
      "type": "image/png"
    }
  ],
  "categories": ["travel", "lifestyle", "productivity"],
  "shortcuts": [
    {
      "name": "Create Trip",
      "url": "/create",
      "icons": [{ "src": "/icons/create.png", "sizes": "96x96" }]
    },
    {
      "name": "Community",
      "url": "/community",
      "icons": [{ "src": "/icons/community.png", "sizes": "96x96" }]
    }
  ]
}
```

**Service Worker Strategy**

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        // manifest config above
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              }
            }
          },
          {
            urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-maps',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          }
        ]
      }
    })
  ]
});
```

### Responsive Design Implementation

**Mobile-First CSS Architecture**

```css
/* Base styles for mobile (320px+) */
.trip-card {
  padding: 1rem;
  margin-bottom: 1rem;
}

/* Tablet styles (768px+) */
@media (min-width: 768px) {
  .trip-card {
    padding: 1.5rem;
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 1rem;
  }
}

/* Desktop styles (1024px+) */
@media (min-width: 1024px) {
  .trip-card {
    padding: 2rem;
    grid-template-columns: 1fr 3fr 1fr;
  }
}
```

**Touch-Optimized Interactions**

```typescript
// Touch-friendly button sizing
const TouchButton = ({ children, ...props }) => (
  <button
    className="min-h-[44px] min-w-[44px] px-4 py-2 touch-manipulation"
    {...props}
  >
    {children}
  </button>
);

// Swipe gestures for mobile
function useSwipeGesture(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) onSwipeLeft();
    if (isRightSwipe) onSwipeRight();
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}
```

**Browser Storage Integration**

```typescript
// Browser storage for offline functionality
class BrowserStorageService {
  async saveOfflineData(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      // Handle storage quota exceeded
      await this.clearOldData();
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  async getOfflineData(key: string) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  async clearOldData() {
    const keys = Object.keys(localStorage);
    const oldKeys = keys.filter(key => {
      const item = localStorage.getItem(key);
      if (!item) return false;
      
      try {
        const parsed = JSON.parse(item);
        const age = Date.now() - (parsed.timestamp || 0);
        return age > 7 * 24 * 60 * 60 * 1000; // 7 days
      } catch {
        return true; // Remove invalid data
      }
    });

    oldKeys.forEach(key => localStorage.removeItem(key));
  }
}

// Web APIs for device features
async function getCurrentLocation() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    });
  });
}

async function shareTrip(tripUrl: string, title: string) {
  if (navigator.share) {
    // Use native Web Share API if available
    await navigator.share({
      title: `Check out my trip: ${title}`,
      text: 'I planned this trip on Journo!',
      url: tripUrl
    });
  } else {
    // Fallback to clipboard
    await navigator.clipboard.writeText(tripUrl);
    // Show toast notification
  }
}
```

## Performance Optimization

### Code Splitting Strategy


**Route-Based Code Splitting**

```typescript
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load route components
const Home = lazy(() => import('./pages/Home'));
const TripDetail = lazy(() => import('./pages/TripDetail'));
const SharedTrip = lazy(() => import('./pages/SharedTrip'));
const Community = lazy(() => import('./pages/Community'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trip/:id" element={<TripDetail />} />
        <Route path="/t/:token" element={<SharedTrip />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </Suspense>
  );
}
```

**Component-Level Code Splitting**

```typescript
// Heavy components loaded on demand
const MapView = lazy(() => import('./components/map/MapView'));
const BudgetChart = lazy(() => import('./components/budget/CategoryChart'));
const PDFExporter = lazy(() => import('./components/export/PDFExporter'));

function TripDetail() {
  const [showMap, setShowMap] = useState(false);
  
  return (
    <div>
      <TripHeader />
      
      {showMap && (
        <Suspense fallback={<MapSkeleton />}>
          <MapView places={places} />
        </Suspense>
      )}
      
      <TripItinerary />
    </div>
  );
}
```

### Image Optimization

```typescript
// Lazy loading images with intersection observer
function LazyImage({ src, alt, ...props }: ImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div className="relative">
      {!isLoaded && <ImageSkeleton />}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={isLoaded ? 'opacity-100' : 'opacity-0'}
          {...props}
        />
      )}
    </div>
  );
}

// Image compression before upload
async function compressImage(file: File): Promise<Blob> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };
  
  return await imageCompression(file, options);
}
```

### Database Query Optimization

```typescript
// Efficient pagination with cursor-based approach
async function fetchTrips(cursor?: string, limit = 20) {
  let query = supabase
    .from('trips')
    .select('*, trip_days(count)')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (cursor) {
    query = query.lt('created_at', cursor);
  }
  
  const { data, error } = await query;
  return data;
}

// Batch loading related data
async function fetchTripWithDetails(tripId: string) {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      trip_days (
        *,
        places (*)
      ),
      story_items (*),
      packing_lists (*)
    `)
    .eq('id', tripId)
    .single();
  
  return data;
}

// Use materialized views for expensive aggregations
CREATE MATERIALIZED VIEW trip_stats AS
SELECT 
  t.id,
  COUNT(DISTINCT td.id) as day_count,
  COUNT(DISTINCT p.id) as place_count,
  COUNT(DISTINCT si.id) as story_count,
  COALESCE(SUM(p.cost), 0) as total_spent
FROM trips t
LEFT JOIN trip_days td ON td.trip_id = t.id
LEFT JOIN places p ON p.trip_day_id = td.id
LEFT JOIN story_items si ON si.trip_id = t.id
GROUP BY t.id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY trip_stats;
```

## Analytics Implementation

### Event Tracking


**Analytics Service**

```typescript
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: Date;
}

class AnalyticsService {
  private enabled = true;
  private queue: AnalyticsEvent[] = [];
  
  constructor() {
    // Check user opt-out preference
    this.enabled = localStorage.getItem('analytics_enabled') !== 'false';
  }
  
  track(event: AnalyticsEvent) {
    if (!this.enabled) return;
    
    // Add to queue
    this.queue.push({
      ...event,
      timestamp: event.timestamp || new Date()
    });
    
    // Batch send every 10 events or 30 seconds
    if (this.queue.length >= 10) {
      this.flush();
    }
  }
  
  async flush() {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    try {
      // Send to Supabase Edge Function
      await supabase.functions.invoke('track-events', {
        body: { events }
      });
    } catch (error) {
      // Re-queue on failure
      this.queue.unshift(...events);
    }
  }
  
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('analytics_enabled', String(enabled));
  }
}

// Global analytics instance
export const analytics = new AnalyticsService();

// Convenience methods
export const trackEvent = {
  tripCreated: (tripId: string, destination: string) => {
    analytics.track({
      name: 'trip_created',
      properties: { tripId, destination }
    });
  },
  
  tripShared: (tripId: string, method: 'link' | 'qr' | 'whatsapp' | 'email') => {
    analytics.track({
      name: 'trip_shared',
      properties: { tripId, method }
    });
  },
  
  placeAdded: (tripId: string, placeType: string) => {
    analytics.track({
      name: 'place_added',
      properties: { tripId, placeType }
    });
  },
  
  photoUploaded: (tripId: string, fileSize: number) => {
    analytics.track({
      name: 'photo_uploaded',
      properties: { tripId, fileSize }
    });
  },
  
  budgetUpdated: (tripId: string, amount: number, currency: string) => {
    analytics.track({
      name: 'budget_updated',
      properties: { tripId, amount, currency }
    });
  },
  
  packingItemChecked: (tripId: string, category: string) => {
    analytics.track({
      name: 'packing_item_checked',
      properties: { tripId, category }
    });
  },
  
  offlineSyncStarted: (queueSize: number) => {
    analytics.track({
      name: 'offline_sync_started',
      properties: { queueSize }
    });
  },
  
  offlineSyncCompleted: (syncedCount: number, failedCount: number) => {
    analytics.track({
      name: 'offline_sync_completed',
      properties: { syncedCount, failedCount }
    });
  }
};
```

**Supabase Edge Function for Analytics**

```typescript
// supabase/functions/track-events/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { events } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Insert events into analytics_events table
  const { error } = await supabase
    .from('analytics_events')
    .insert(
      events.map((event: any) => ({
        event_name: event.name,
        user_id: event.userId,
        trip_id: event.properties?.tripId,
        metadata: event.properties,
        created_at: event.timestamp
      }))
    );
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

## Design System

### Color Palette


**Tailwind Configuration**

```typescript
// tailwind.config.js
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Main brand color
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        success: {
          500: '#10b981',
          600: '#059669'
        },
        warning: {
          500: '#f59e0b',
          600: '#d97706'
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626'
        },
        // Theme-specific colors
        adventure: {
          500: '#f97316',
          600: '#ea580c'
        },
        romantic: {
          500: '#ec4899',
          600: '#db2777'
        },
        foodie: {
          500: '#eab308',
          600: '#ca8a04'
        },
        chill: {
          500: '#06b6d4',
          600: '#0891b2'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif']
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio')
  ]
};
```

### Typography System

```typescript
// Typography components
const Typography = {
  H1: ({ children, className = '' }: TypographyProps) => (
    <h1 className={`text-4xl font-bold font-display ${className}`}>
      {children}
    </h1>
  ),
  
  H2: ({ children, className = '' }: TypographyProps) => (
    <h2 className={`text-3xl font-semibold font-display ${className}`}>
      {children}
    </h2>
  ),
  
  H3: ({ children, className = '' }: TypographyProps) => (
    <h3 className={`text-2xl font-semibold ${className}`}>
      {children}
    </h3>
  ),
  
  Body: ({ children, className = '' }: TypographyProps) => (
    <p className={`text-base ${className}`}>
      {children}
    </p>
  ),
  
  Caption: ({ children, className = '' }: TypographyProps) => (
    <span className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      {children}
    </span>
  )
};
```

### Component Library

```typescript
// Button component with variants
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  children,
  onClick 
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',
    danger: 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <Spinner size={size} /> : children}
    </button>
  );
}
```

## Docker Deployment Architecture

### Docker Compose Setup

The application uses Docker Compose to orchestrate multiple services for easy local development and production deployment.

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: journo-db
    environment:
      POSTGRES_DB: journo
      POSTGRES_USER: journo_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U journo_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MinIO Object Storage (S3-compatible)
  minio:
    image: minio/minio:latest
    container_name: journo-storage
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # Redis for caching and sessions
  redis:
    image: redis:7-alpine
    container_name: journo-cache
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API Server
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: journo-api
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://journo_user:${DB_PASSWORD}@postgres:5432/journo
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
      GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY}
      OPENWEATHER_API_KEY: ${OPENWEATHER_API_KEY}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run start:prod

  # Frontend Web App
  web:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: journo-web
    environment:
      VITE_API_URL: http://localhost:3001
      VITE_WS_URL: ws://localhost:3001
      VITE_GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - api
    volumes:
      - ./frontend:/app
      - /app/node_modules

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: journo-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - web
      - api

volumes:
  postgres_data:
  minio_data:
  redis_data:
```

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/server.js"]
```

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

## Deployment Strategy

### Environment Configuration


**Environment Variables**

```bash
# .env.example

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your-maps-api-key
VITE_GOOGLE_MAPS_ID=your-map-id

# OpenWeather
VITE_OPENWEATHER_API_KEY=your-weather-api-key

# Analytics
VITE_PLAUSIBLE_DOMAIN=journo.app
VITE_POSTHOG_KEY=your-posthog-key

# App Config
VITE_APP_URL=https://journo.app
VITE_APP_ENV=production
```

### Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_GOOGLE_MAPS_API_KEY: ${{ secrets.VITE_GOOGLE_MAPS_API_KEY }}
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy-web:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: dist
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Database Migrations

```typescript
// Migration strategy using Supabase CLI
// migrations/001_initial_schema.sql
-- Create initial tables
-- (SQL from Data Models section)

// migrations/002_add_budget_fields.sql
ALTER TABLE trips ADD COLUMN IF NOT EXISTS total_budget DECIMAL(12,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD';
ALTER TABLE places ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2);

// migrations/003_add_packing_lists.sql
CREATE TABLE IF NOT EXISTS packing_lists (
  -- Schema from Data Models section
);

// Run migrations
// supabase db push
```

### Monitoring and Logging

```typescript
// Error tracking with Sentry (optional)
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.VITE_APP_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});

// Performance monitoring
function logPerformance(metric: string, value: number) {
  if (process.env.VITE_APP_ENV === 'production') {
    analytics.track({
      name: 'performance_metric',
      properties: { metric, value }
    });
  }
}

// Log Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(metric => logPerformance('CLS', metric.value));
getFID(metric => logPerformance('FID', metric.value));
getFCP(metric => logPerformance('FCP', metric.value));
getLCP(metric => logPerformance('LCP', metric.value));
getTTFB(metric => logPerformance('TTFB', metric.value));
```

## Summary

This design document provides a comprehensive blueprint for building Journo, a modern travel planning and sharing platform. The architecture emphasizes:

1. **Offline-First Approach**: Full functionality without internet using localStorage and sync queues
2. **Real-Time Collaboration**: Instant updates across devices using real-time WebSocket connections
3. **Responsive Design**: Single codebase that works seamlessly across all device sizes and browsers
4. **Scalable Backend**: Self-hosted PostgreSQL with Node.js/Express for full control and flexibility
5. **External Integrations**: Google Maps for location services, OpenWeather for forecasts, Frankfurter for currency
6. **Security**: Row-level security policies, input validation, and rate limiting
7. **Performance**: Code splitting, lazy loading, caching, and optimized queries
8. **Analytics**: Privacy-first event tracking with Plausible/PostHog
9. **Admin Portal**: Comprehensive dashboard for monitoring and moderation
10. **Design System**: Consistent UI with Tailwind CSS and reusable components

The design supports all 27 requirements including trip planning, budget tracking, smart packing lists, weather integration, offline maps, collaboration, version history, community features, multi-language support, and more. The implementation follows modern best practices for responsive web development with a focus on user experience, performance, and maintainability across all devices.


## Multi-Language Support

### Overview

The multi-language support feature enables users to switch between English, Traditional Chinese (繁體中文), and Simplified Chinese (简体中文) throughout the application. The system uses i18next for internationalization, with automatic browser language detection, persistent user preferences, and locale-specific formatting for dates, times, numbers, and currencies.

### Architecture

```mermaid
graph TB
    USER[User]
    SETTINGS[Settings Page]
    I18N[i18next Service]
    STORAGE[localStorage]
    DETECTOR[Language Detector]
    BROWSER[Browser Locale]
    TRANS[Translation Files]
    FORMATTER[Locale Formatter]
    
    USER --> SETTINGS
    SETTINGS --> I18N
    I18N --> STORAGE
    I18N --> DETECTOR
    DETECTOR --> BROWSER
    I18N --> TRANS
    I18N --> FORMATTER
```

### Technology Stack

**i18next** - Industry-standard internationalization framework
- React integration via react-i18next
- Automatic language detection
- Namespace support for code splitting
- Interpolation and pluralization
- Type-safe translations with TypeScript

**date-fns** - Locale-aware date formatting
- Supports all target locales
- Lightweight alternative to moment.js
- Tree-shakeable for optimal bundle size

### Translation File Structure

```
frontend/src/locales/
├── en/
│   ├── common.json
│   ├── trip.json
│   ├── place.json
│   ├── budget.json
│   ├── packing.json
│   ├── community.json
│   ├── settings.json
│   └── errors.json
├── zh-TW/
│   ├── common.json
│   ├── trip.json
│   ├── place.json
│   ├── budget.json
│   ├── packing.json
│   ├── community.json
│   ├── settings.json
│   └── errors.json
└── zh-CN/
    ├── common.json
    ├── trip.json
    ├── place.json
    ├── budget.json
    ├── packing.json
    ├── community.json
    ├── settings.json
    └── errors.json
```

### i18n Configuration

```typescript
// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../locales/en/common.json';
import enTrip from '../locales/en/trip.json';
import enPlace from '../locales/en/place.json';
import enBudget from '../locales/en/budget.json';
import enPacking from '../locales/en/packing.json';
import enCommunity from '../locales/en/community.json';
import enSettings from '../locales/en/settings.json';
import enErrors from '../locales/en/errors.json';

import zhTWCommon from '../locales/zh-TW/common.json';
import zhTWTrip from '../locales/zh-TW/trip.json';
// ... other zh-TW imports

import zhCNCommon from '../locales/zh-CN/common.json';
import zhCNTrip from '../locales/zh-CN/trip.json';
// ... other zh-CN imports

const resources = {
  en: {
    common: enCommon,
    trip: enTrip,
    place: enPlace,
    budget: enBudget,
    packing: enPacking,
    community: enCommunity,
    settings: enSettings,
    errors: enErrors
  },
  'zh-TW': {
    common: zhTWCommon,
    trip: zhTWTrip,
    place: zhTWPlace,
    budget: zhTWBudget,
    packing: zhTWPacking,
    community: zhTWCommunity,
    settings: zhTWSettings,
    errors: zhTWErrors
  },
  'zh-CN': {
    common: zhCNCommon,
    trip: zhCNTrip,
    place: zhCNPlace,
    budget: zhCNBudget,
    packing: zhCNPacking,
    community: zhCNCommunity,
    settings: zhCNSettings,
    errors: zhCNErrors
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh-TW', 'zh-CN'],
    defaultNS: 'common',
    ns: ['common', 'trip', 'place', 'budget', 'packing', 'community', 'settings', 'errors'],
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },
    
    interpolation: {
      escapeValue: false // React already escapes
    },
    
    react: {
      useSuspense: true
    }
  });

export default i18n;
```

### Translation Hook

```typescript
// src/hooks/useTranslation.ts
import { useTranslation as useI18nTranslation } from 'react-i18next';

export function useTranslation(namespace?: string) {
  const { t, i18n } = useI18nTranslation(namespace);
  
  const changeLanguage = async (lng: 'en' | 'zh-TW' | 'zh-CN') => {
    await i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };
  
  const currentLanguage = i18n.language;
  
  return {
    t,
    changeLanguage,
    currentLanguage,
    isRTL: false // None of our languages are RTL
  };
}
```

### Language Selector Component

```typescript
// src/components/settings/LanguageSelector.tsx
import { useTranslation } from '../../hooks/useTranslation';

interface Language {
  code: 'en' | 'zh-TW' | 'zh-CN';
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文' },
  { code: 'zh-CN', name: 'Simplified Chinese', nativeName: '简体中文' }
];

export function LanguageSelector() {
  const { t, changeLanguage, currentLanguage } = useTranslation('settings');
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('language')}
      </label>
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value as any)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Locale-Aware Formatting

```typescript
// src/utils/formatters.ts
import { format, formatDistance, formatRelative } from 'date-fns';
import { enUS, zhTW, zhCN } from 'date-fns/locale';

const localeMap = {
  'en': enUS,
  'zh-TW': zhTW,
  'zh-CN': zhCN
};

export function formatDate(date: Date, formatStr: string, locale: string): string {
  return format(date, formatStr, { locale: localeMap[locale] || enUS });
}

export function formatRelativeTime(date: Date, baseDate: Date, locale: string): string {
  return formatRelative(date, baseDate, { locale: localeMap[locale] || enUS });
}

export function formatTimeAgo(date: Date, locale: string): string {
  return formatDistance(date, new Date(), { 
    addSuffix: true,
    locale: localeMap[locale] || enUS 
  });
}

export function formatCurrency(amount: number, currency: string, locale: string): string {
  const localeCode = locale === 'zh-TW' ? 'zh-TW' : locale === 'zh-CN' ? 'zh-CN' : 'en-US';
  
  return new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function formatNumber(num: number, locale: string): string {
  const localeCode = locale === 'zh-TW' ? 'zh-TW' : locale === 'zh-CN' ? 'zh-CN' : 'en-US';
  
  return new Intl.NumberFormat(localeCode).format(num);
}
```

### Example Translation Files

```json
// locales/en/common.json
{
  "app_name": "Journo",
  "tagline": "Plan together. Share the journey.",
  "loading": "Loading...",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "edit": "Edit",
  "create": "Create",
  "search": "Search",
  "filter": "Filter",
  "sort": "Sort",
  "back": "Back",
  "next": "Next",
  "previous": "Previous",
  "close": "Close",
  "confirm": "Confirm",
  "yes": "Yes",
  "no": "No"
}

// locales/zh-TW/common.json
{
  "app_name": "Journo",
  "tagline": "一起規劃。分享旅程。",
  "loading": "載入中...",
  "save": "儲存",
  "cancel": "取消",
  "delete": "刪除",
  "edit": "編輯",
  "create": "建立",
  "search": "搜尋",
  "filter": "篩選",
  "sort": "排序",
  "back": "返回",
  "next": "下一步",
  "previous": "上一步",
  "close": "關閉",
  "confirm": "確認",
  "yes": "是",
  "no": "否"
}

// locales/zh-CN/common.json
{
  "app_name": "Journo",
  "tagline": "一起规划。分享旅程。",
  "loading": "加载中...",
  "save": "保存",
  "cancel": "取消",
  "delete": "删除",
  "edit": "编辑",
  "create": "创建",
  "search": "搜索",
  "filter": "筛选",
  "sort": "排序",
  "back": "返回",
  "next": "下一步",
  "previous": "上一步",
  "close": "关闭",
  "confirm": "确认",
  "yes": "是",
  "no": "否"
}
```

```json
// locales/en/trip.json
{
  "title": "Trip Title",
  "destination": "Destination",
  "start_date": "Start Date",
  "end_date": "End Date",
  "create_trip": "Create Trip",
  "edit_trip": "Edit Trip",
  "delete_trip": "Delete Trip",
  "my_trips": "My Trips",
  "trip_details": "Trip Details",
  "days": "{{count}} day",
  "days_plural": "{{count}} days",
  "places": "{{count}} place",
  "places_plural": "{{count}} places",
  "theme": "Theme",
  "themes": {
    "default": "Default",
    "adventure": "Adventure",
    "romantic": "Romantic",
    "foodie": "Foodie",
    "chill": "Chill"
  }
}

// locales/zh-TW/trip.json
{
  "title": "行程標題",
  "destination": "目的地",
  "start_date": "開始日期",
  "end_date": "結束日期",
  "create_trip": "建立行程",
  "edit_trip": "編輯行程",
  "delete_trip": "刪除行程",
  "my_trips": "我的行程",
  "trip_details": "行程詳情",
  "days": "{{count}} 天",
  "days_plural": "{{count}} 天",
  "places": "{{count}} 個地點",
  "places_plural": "{{count}} 個地點",
  "theme": "主題",
  "themes": {
    "default": "預設",
    "adventure": "冒險",
    "romantic": "浪漫",
    "foodie": "美食",
    "chill": "悠閒"
  }
}
```

### Usage in Components

```typescript
// Example: TripCard component with translations
import { useTranslation } from '../../hooks/useTranslation';
import { formatDate, formatNumber } from '../../utils/formatters';

export function TripCard({ trip }: { trip: Trip }) {
  const { t, currentLanguage } = useTranslation('trip');
  
  return (
    <div className="trip-card">
      <h3>{trip.title}</h3>
      <p>{trip.destination}</p>
      <p>
        {formatDate(trip.start_date, 'PPP', currentLanguage)} - 
        {formatDate(trip.end_date, 'PPP', currentLanguage)}
      </p>
      <p>
        {t('days', { count: trip.day_count })} • 
        {t('places', { count: trip.place_count })}
      </p>
      <p>{t(`themes.${trip.theme}`)}</p>
    </div>
  );
}

// Example: Budget component with currency formatting
export function BudgetCard({ budget }: { budget: Budget }) {
  const { t, currentLanguage } = useTranslation('budget');
  
  return (
    <div className="budget-card">
      <h3>{t('total_budget')}</h3>
      <p className="text-2xl font-bold">
        {formatCurrency(budget.total, budget.currency, currentLanguage)}
      </p>
      <p>
        {t('spent')}: {formatCurrency(budget.spent, budget.currency, currentLanguage)}
      </p>
      <p>
        {t('remaining')}: {formatCurrency(budget.remaining, budget.currency, currentLanguage)}
      </p>
    </div>
  );
}
```

### Type-Safe Translations

```typescript
// src/types/i18n.d.ts
import 'react-i18next';
import common from '../locales/en/common.json';
import trip from '../locales/en/trip.json';
import place from '../locales/en/place.json';
import budget from '../locales/en/budget.json';
import packing from '../locales/en/packing.json';
import community from '../locales/en/community.json';
import settings from '../locales/en/settings.json';
import errors from '../locales/en/errors.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      trip: typeof trip;
      place: typeof place;
      budget: typeof budget;
      packing: typeof packing;
      community: typeof community;
      settings: typeof settings;
      errors: typeof errors;
    };
  }
}
```

### Language Detection Logic

```typescript
// src/utils/languageDetector.ts
export function detectBrowserLanguage(): 'en' | 'zh-TW' | 'zh-CN' {
  const browserLang = navigator.language || navigator.languages?.[0];
  
  if (!browserLang) return 'en';
  
  // Match Traditional Chinese
  if (browserLang.startsWith('zh-TW') || browserLang.startsWith('zh-Hant')) {
    return 'zh-TW';
  }
  
  // Match Simplified Chinese
  if (browserLang.startsWith('zh-CN') || browserLang.startsWith('zh-Hans') || browserLang.startsWith('zh')) {
    return 'zh-CN';
  }
  
  // Default to English
  return 'en';
}

export function getStoredLanguage(): 'en' | 'zh-TW' | 'zh-CN' | null {
  return localStorage.getItem('i18nextLng') as any;
}

export function setStoredLanguage(lang: 'en' | 'zh-TW' | 'zh-CN') {
  localStorage.setItem('i18nextLng', lang);
}
```

### Testing Strategy

```typescript
// Test language switching
describe('Language Switching', () => {
  test('changes language when user selects from dropdown', async () => {
    render(<LanguageSelector />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'zh-TW' } });
    
    await waitFor(() => {
      expect(localStorage.getItem('i18nextLng')).toBe('zh-TW');
    });
  });
  
  test('persists language preference across sessions', () => {
    localStorage.setItem('i18nextLng', 'zh-CN');
    
    const { rerender } = render(<App />);
    
    expect(i18n.language).toBe('zh-CN');
  });
  
  test('detects browser language on first visit', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'zh-TW',
      configurable: true
    });
    
    const detected = detectBrowserLanguage();
    expect(detected).toBe('zh-TW');
  });
});

// Test translations
describe('Translations', () => {
  test('renders English text correctly', () => {
    i18n.changeLanguage('en');
    render(<TripCard trip={mockTrip} />);
    
    expect(screen.getByText('Create Trip')).toBeInTheDocument();
  });
  
  test('renders Traditional Chinese text correctly', () => {
    i18n.changeLanguage('zh-TW');
    render(<TripCard trip={mockTrip} />);
    
    expect(screen.getByText('建立行程')).toBeInTheDocument();
  });
  
  test('renders Simplified Chinese text correctly', () => {
    i18n.changeLanguage('zh-CN');
    render(<TripCard trip={mockTrip} />);
    
    expect(screen.getByText('创建行程')).toBeInTheDocument();
  });
});
```

### Performance Considerations

1. **Code Splitting**: Translation files are loaded on demand per namespace
2. **Caching**: Translations cached in memory after first load
3. **Bundle Size**: Each language adds ~50KB to bundle (gzipped)
4. **Lazy Loading**: Non-critical namespaces loaded asynchronously

### User Experience

1. **Automatic Detection**: Browser language detected on first visit
2. **Persistent Preference**: Language choice saved to localStorage
3. **Seamless Switching**: No page reload required when changing language
4. **Consistent Formatting**: Dates, numbers, and currencies formatted per locale
5. **Fallback**: Missing translations fall back to English

## Destination Suggestions Feature

### Overview

The destination suggestions feature provides personalized, month-aware travel recommendations on the main page to inspire users and accelerate trip planning. The system combines pre-curated data with dynamic scraping to suggest destinations based on current month, weather patterns, global trends, and user preferences.

### Architecture

```mermaid
graph TB
    USER[User on Main Page]
    CAROUSEL[Suggestion Carousel]
    CACHE[AsyncStorage Cache]
    EDGE[Supabase Edge Function]
    DB[(Destination Suggestions DB)]
    WEATHER[OpenWeather API]
    SCRAPER[Web Scraper]
    SOURCES[Data Sources: ALVA, Statista, TripAdvisor]
    
    USER --> CAROUSEL
    CAROUSEL --> CACHE
    CACHE --> EDGE
    EDGE --> DB
    EDGE --> WEATHER
    EDGE --> SCRAPER
    SCRAPER --> SOURCES
    SOURCES --> DB
```

### Data Model

```sql
-- Destination suggestions table
CREATE TABLE destination_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month INT CHECK (month BETWEEN 1 AND 12),
  destination TEXT NOT NULL,
  country TEXT NOT NULL,
  avg_temp_celsius DECIMAL(4,1),
  avg_temp_fahrenheit DECIMAL(4,1),
  weather_condition TEXT,
  why_now TEXT,
  key_draw TEXT,
  visitors_estimate INT,
  scraped_source TEXT,
  image_url TEXT,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_destination_suggestions_month ON destination_suggestions(month, priority DESC);
CREATE INDEX idx_destination_suggestions_active ON destination_suggestions(is_active) WHERE is_active = TRUE;

-- User suggestion interactions
CREATE TABLE suggestion_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users,
  suggestion_id UUID REFERENCES destination_suggestions,
  action TEXT CHECK (action IN ('view', 'click', 'quick_plan')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_suggestion_interactions_user ON suggestion_interactions(user_id);
CREATE INDEX idx_suggestion_interactions_suggestion ON suggestion_interactions(suggestion_id);
```

### Suggestion Service

```typescript
interface DestinationSuggestion {
  id: string;
  month: number;
  destination: string;
  country: string;
  avg_temp_celsius: number;
  avg_temp_fahrenheit: number;
  weather_condition: string;
  why_now: string;
  key_draw: string;
  visitors_estimate?: number;
  image_url?: string;
}

class SuggestionService {
  async getSuggestionsForMonth(month: number, userId?: string): Promise<DestinationSuggestion[]> {
    // Check cache first
    const cached = await this.getCachedSuggestions(month);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    
    // Fetch from database
    let query = supabase
      .from('destination_suggestions')
      .select('*')
      .eq('month', month)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(8);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Personalize if user is logged in
    if (userId) {
      return this.personalizesuggestions(data, userId);
    }
    
    // Cache for 24 hours
    await this.cacheSuggestions(month, data);
    
    return data;
  }
  
  private async personalizeSuggestions(
    suggestions: DestinationSuggestion[],
    userId: string
  ): Promise<DestinationSuggestion[]> {
    // Get user's past trips
    const { data: pastTrips } = await supabase
      .from('trips')
      .select('destination, theme')
      .eq('owner_id', userId)
      .limit(10);
    
    if (!pastTrips || pastTrips.length === 0) {
      return suggestions;
    }
    
    // Analyze preferences
    const preferences = this.analyzePreferences(pastTrips);
    
    // Re-rank suggestions based on preferences
    return suggestions.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, preferences);
      const scoreB = this.calculateRelevanceScore(b, preferences);
      return scoreB - scoreA;
    });
  }
  
  private analyzePreferences(trips: any[]): UserPreferences {
    const climatePreference = this.detectClimatePreference(trips);
    const activityPreference = this.detectActivityPreference(trips);
    
    return {
      preferredClimate: climatePreference,
      preferredActivities: activityPreference
    };
  }
  
  private calculateRelevanceScore(
    suggestion: DestinationSuggestion,
    preferences: UserPreferences
  ): number {
    let score = 0;
    
    // Climate match
    if (this.matchesClimate(suggestion, preferences.preferredClimate)) {
      score += 3;
    }
    
    // Activity match
    if (this.matchesActivities(suggestion, preferences.preferredActivities)) {
      score += 2;
    }
    
    // Visitor popularity
    if (suggestion.visitors_estimate) {
      score += Math.log10(suggestion.visitors_estimate) / 10;
    }
    
    return score;
  }
  
  async trackInteraction(
    userId: string | null,
    suggestionId: string,
    action: 'view' | 'click' | 'quick_plan'
  ) {
    if (!userId) return;
    
    await supabase
      .from('suggestion_interactions')
      .insert({
        user_id: userId,
        suggestion_id: suggestionId,
        action
      });
    
    // Track analytics
    analytics.track({
      name: 'destination_suggestion_' + action,
      properties: { suggestionId }
    });
  }
  
  async quickPlan(suggestion: DestinationSuggestion, userId: string): Promise<Trip> {
    // Create trip with pre-filled data
    const startDate = this.getNextMonthStart(suggestion.month);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // 7-day trip
    
    const { data: trip } = await supabase
      .from('trips')
      .insert({
        title: `Trip to ${suggestion.destination}`,
        destination: suggestion.destination,
        start_date: startDate,
        end_date: endDate,
        owner_id: userId,
        currency_code: this.getCurrencyForCountry(suggestion.country),
        weather_data: {
          avg_temp: suggestion.avg_temp_celsius,
          condition: suggestion.weather_condition
        }
      })
      .select()
      .single();
    
    // Generate packing list based on weather
    await this.generatePackingList(trip.id, suggestion);
    
    return trip;
  }
}
```

### Suggestion Carousel Component

```typescript
function DestinationCarousel() {
  const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const user = useAuthStore(state => state.user);
  const currentMonth = new Date().getMonth() + 1;
  
  useEffect(() => {
    loadSuggestions();
  }, []);
  
  async function loadSuggestions() {
    const service = new SuggestionService();
    const data = await service.getSuggestionsForMonth(currentMonth, user?.id);
    setSuggestions(data);
  }
  
  async function handleQuickPlan(suggestion: DestinationSuggestion) {
    const service = new SuggestionService();
    await service.trackInteraction(user?.id, suggestion.id, 'quick_plan');
    
    const trip = await service.quickPlan(suggestion, user.id);
    navigate(`/trip/${trip.id}`);
  }
  
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white">
          {getMonthName(currentMonth)} Travel Gems
        </h2>
        <p className="text-primary-100">
          Escape the ordinary with these handpicked destinations
        </p>
      </div>
      
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex items-center gap-6"
          >
            <img
              src={suggestions[currentIndex]?.image_url}
              alt={suggestions[currentIndex]?.destination}
              className="w-48 h-32 object-cover rounded-lg"
            />
            
            <div className="flex-1 text-white">
              <h3 className="text-xl font-semibold">
                {suggestions[currentIndex]?.destination}
              </h3>
              <p className="text-sm text-primary-100 mb-2">
                {suggestions[currentIndex]?.why_now}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span>🌡️ {suggestions[currentIndex]?.avg_temp_celsius}°C</span>
                <span>☀️ {suggestions[currentIndex]?.weather_condition}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickPlan(suggestions[currentIndex])}
                >
                  Quick Plan
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => showDetails(suggestions[currentIndex])}
                >
                  Why Now?
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2">
          <button
            onClick={() => setCurrentIndex((i) => (i - 1 + suggestions.length) % suggestions.length)}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentIndex((i) => (i + 1) % suggestions.length)}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30"
          >
            →
          </button>
        </div>
      </div>
      
      <div className="mt-4 flex justify-center gap-2">
        {suggestions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
```

## Dynamic Location Scraping

### Overview

The dynamic location scraping feature enhances the place search experience by providing real-time suggestions of popular attractions, visitor statistics, and practical tips scraped from authoritative sources like TripAdvisor, ALVA, and Statista.

### Architecture

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant EdgeFunction
    participant Cache
    participant Scraper
    participant Sources
    
    User->>Frontend: Types "England"
    Frontend->>Frontend: Debounce 300ms
    Frontend->>Cache: Check cached results
    
    alt Cache Hit
        Cache-->>Frontend: Return cached data
    else Cache Miss
        Frontend->>EdgeFunction: Request scrape
        EdgeFunction->>Scraper: Scrape sources
        Scraper->>Sources: Fetch data
        Sources-->>Scraper: Return HTML/JSON
        Scraper->>Scraper: Parse & aggregate
        Scraper-->>EdgeFunction: Return results
        EdgeFunction->>Cache: Store for 7 days
        EdgeFunction-->>Frontend: Return results
    end
    
    Frontend->>User: Display suggestions
```

### Data Model

```sql
-- Scraped location data
CREATE TABLE scraped_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  name TEXT NOT NULL,
  country TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  visitors_annual INT,
  popularity_rank INT,
  description TEXT,
  tips TEXT,
  avg_cost DECIMAL(8,2),
  source TEXT,
  scraped_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_scraped_locations_query ON scraped_locations(query, scraped_at DESC);
CREATE INDEX idx_scraped_locations_expires ON scraped_locations(expires_at);

-- Search queries for analytics
CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users,
  query TEXT NOT NULL,
  results_count INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_search_queries_user ON search_queries(user_id);
CREATE INDEX idx_search_queries_query ON search_queries(query);
```

### Scraping Service

```typescript
interface ScrapedLocation {
  name: string;
  country: string;
  lat: number;
  lng: number;
  visitors_annual?: number;
  popularity_rank?: number;
  description: string;
  tips: string;
  avg_cost?: number;
  source: string;
}

class LocationScraperService {
  private cache: Map<string, ScrapedLocation[]> = new Map();
  
  async searchLocations(query: string, userId?: string): Promise<ScrapedLocation[]> {
    // Check cache first
    const cached = await this.getCachedResults(query);
    if (cached && !this.isExpired(cached)) {
      await this.trackSearch(query, userId, cached.length);
      return cached;
    }
    
    // Trigger scraping via Edge Function
    const { data, error } = await supabase.functions.invoke('scrape-locations', {
      body: { query }
    });
    
    if (error) {
      console.error('Scraping failed:', error);
      return cached || []; // Fallback to stale cache
    }
    
    // Cache results
    await this.cacheResults(query, data);
    await this.trackSearch(query, userId, data.length);
    
    return data;
  }
  
  private async getCachedResults(query: string): Promise<ScrapedLocation[] | null> {
    const { data } = await supabase
      .from('scraped_locations')
      .select('*')
      .eq('query', query.toLowerCase())
      .gt('expires_at', new Date().toISOString())
      .order('popularity_rank', { ascending: true });
    
    return data;
  }
  
  private async cacheResults(query: string, locations: ScrapedLocation[]) {
    const records = locations.map(loc => ({
      query: query.toLowerCase(),
      ...loc,
      scraped_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }));
    
    await supabase
      .from('scraped_locations')
      .upsert(records);
  }
  
  private async trackSearch(query: string, userId: string | null, resultsCount: number) {
    await supabase
      .from('search_queries')
      .insert({
        user_id: userId,
        query,
        results_count: resultsCount
      });
    
    analytics.track({
      name: 'search_scraped',
      properties: { query, results: resultsCount }
    });
  }
}
```

### Supabase Edge Function for Scraping

```typescript
// supabase/functions/scrape-locations/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

serve(async (req) => {
  const { query } = await req.json();
  
  try {
    const results = await scrapeMultipleSources(query);
    
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function scrapeMultipleSources(query: string) {
  const results: any[] = [];
  
  // Scrape ALVA (Association of Leading Visitor Attractions)
  if (query.toLowerCase().includes('england') || query.toLowerCase().includes('uk')) {
    const alvaData = await scrapeALVA(query);
    results.push(...alvaData);
  }
  
  // Scrape TripAdvisor (respect robots.txt and rate limits)
  const tripAdvisorData = await scrapeTripAdvisor(query);
  results.push(...tripAdvisorData);
  
  // Enrich with Google Places data
  const enrichedResults = await enrichWithGooglePlaces(results);
  
  return enrichedResults;
}

async function scrapeALVA(query: string) {
  // Example: Scrape ALVA visitor statistics
  const response = await fetch('https://www.alva.org.uk/details.cfm?p=607');
  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  const locations = [];
  const rows = doc.querySelectorAll('table tr');
  
  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 3) {
      locations.push({
        name: cells[0].textContent.trim(),
        visitors_annual: parseInt(cells[1].textContent.replace(/,/g, '')),
        source: 'ALVA 2024'
      });
    }
  }
  
  return locations;
}

async function scrapeTripAdvisor(query: string) {
  // Implement TripAdvisor scraping with rate limiting
  // Note: Respect robots.txt and terms of service
  // Consider using official APIs where available
  
  return [];
}

async function enrichWithGooglePlaces(locations: any[]) {
  const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  
  for (const location of locations) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(location.name)}&inputtype=textquery&fields=place_id,geometry,formatted_address&key=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        const place = data.candidates[0];
        location.lat = place.geometry.location.lat;
        location.lng = place.geometry.location.lng;
        location.address = place.formatted_address;
      }
    } catch (error) {
      console.error(`Failed to enrich ${location.name}:`, error);
    }
  }
  
  return locations;
}
```

### Search with Suggestions Component

```typescript
function PlaceSearchWithSuggestions({ onPlaceSelect }: { onPlaceSelect: (place: Place) => void }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ScrapedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scraperService = new LocationScraperService();
  const user = useAuthStore(state => state.user);
  
  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce(async (searchQuery: string) => {
        if (searchQuery.length < 3) {
          setSuggestions([]);
          return;
        }
        
        setIsLoading(true);
        try {
          const results = await scraperService.searchLocations(searchQuery, user?.id);
          setSuggestions(results);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setIsLoading(false);
        }
      }, 300),
    [user]
  );
  
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);
  
  function handleSelectSuggestion(suggestion: ScrapedLocation) {
    const place: Place = {
      name: suggestion.name,
      address: suggestion.address || '',
      lat: suggestion.lat,
      lng: suggestion.lng,
      notes: suggestion.tips,
      cost: suggestion.avg_cost,
      place_type: 'attraction'
    };
    
    onPlaceSelect(place);
    
    analytics.track({
      name: 'suggestion_added_to_trip',
      properties: { place: suggestion.name }
    });
  }
  
  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Search for a location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-3">
          <Spinner size="sm" />
        </div>
      )}
      
      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          <div className="p-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Top spots in {query}:
            </p>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🏛️</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{suggestion.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {suggestion.description}
                    </p>
                    {suggestion.visitors_annual && (
                      <p className="text-xs text-gray-500 mt-1">
                        {(suggestion.visitors_annual / 1000000).toFixed(1)}M visitors
                      </p>
                    )}
                    {suggestion.tips && (
                      <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                        💡 {suggestion.tips}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline">
                    Add to Trip
                  </Button>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Admin Analytics for Suggestions

```typescript
// Admin dashboard component for suggestion analytics
function SuggestionAnalytics() {
  const [metrics, setMetrics] = useState<any>(null);
  
  useEffect(() => {
    loadMetrics();
  }, []);
  
  async function loadMetrics() {
    const { data } = await supabase.functions.invoke('admin-suggestion-metrics');
    setMetrics(data);
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Suggestion Performance</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Metric
              label="Click Rate"
              value={`${metrics?.clickRate}%`}
              trend="+12%"
            />
            <Metric
              label="Quick Plans"
              value={metrics?.quickPlans}
              trend="+8%"
            />
            <Metric
              label="Top Destination"
              value={metrics?.topDestination}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Search Trends</h3>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr>
                <th>Query</th>
                <th>Searches</th>
                <th>Add Rate</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.searchTrends?.map((trend: any) => (
                <tr key={trend.query}>
                  <td>{trend.query}</td>
                  <td>{trend.count}</td>
                  <td>{trend.addRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
```

These new features enhance the user experience by providing intelligent destination suggestions and enriching the place search with real-world data, making trip planning faster and more informed.
