# Design Document

## Overview

This design document outlines the architecture and implementation approach for redesigning the Journo trip planner interface with Funliday-style features. The redesign focuses on creating a planning-first, collaborative canvas with seamless optimistic updates, automatic routing, real-time co-editing, AI-assisted planning, and inline editing capabilities. The interface prioritizes mobile-first design with one-hand reachability (≤1.5 taps to edit) and fully responsive layouts across all devices from iPhone SE to 32" ultrawide displays.

## Design Principles

1. **Planning-First**: The itinerary builder is the central canvas—fast, visual, and collaborative
2. **One-Hand Mobile**: All primary actions reachable with thumb on mobile (≤1.5 taps to edit)
3. **Real-Time Co-Editing**: Live cursors, instant sync, conflict resolution with zero data loss
4. **AI-Assisted Flow**: Smart defaults, auto-routing, gap-filling, and energy-balanced suggestions
5. **Fully Responsive**: Fluid from iPhone SE to 32" ultrawide, including foldables and split-view tablets

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Trip Planner UI Layer                    │
├──────────────────────┬──────────────────────────────────────┤
│  Itinerary Canvas    │    Map Panel (Collapsible)           │
│  - Day Headers       │    - Interactive Map                 │
│  - Time Ruler        │    - Route Polylines                 │
│  - Place Cards       │    - Place Markers                   │
│  - Transport Items   │    - Info Cards                      │
│  - Gap Indicators    │    - Pin Drop                        │
│  - Inline Editors    │    - Traffic Layer                   │
│  - FAB               │    - Zoom Controls                   │
│  - Live Cursors      │                                      │
│  - Presence Bar      │                                      │
└──────────────────────┴──────────────────────────────────────┘
           ↓                           ↓
┌─────────────────────────────────────────────────────────────┐
│              State Management Layer (Zustand)                │
│  - Trip State        - UI State        - Sync Queue         │
│  - Place State       - Drag State      - Route Cache        │
│  - Collab State      - AI State        - Locale State       │
└─────────────────────────────────────────────────────────────┘
           ↓                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  - Optimistic Update Service                                │
│  - Route Calculation Service                                │
│  - Time Calculation Service                                 │
│  - Sync Queue Service                                       │
│  - AI Suggestion Service                                    │
│  - Collaboration Service (Live Cursors, Presence)           │
│  - Localization Service                                     │
└─────────────────────────────────────────────────────────────┘
           ↓                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    API & Storage Layer                       │
│  - Supabase API      - IndexedDB       - Google Maps API    │
│  - Supabase Realtime - AI API          - Weather API        │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Range | Layout Mode | Canvas | Map | Day Tabs |
|------------|-------|-------------|--------|-----|----------|
| Mobile Portrait | 0-480px | Stack | 100% | Bottom sheet | Horizontal scroll |
| Mobile Landscape | 481-768px | Split | 60% | 40% | Vertical pills |
| Tablet Portrait | 769-1024px | Split | 65% | 35% | Vertical list |
| Tablet Landscape | 1025-1440px | Split | 70% | 30% | Top tabs |
| Desktop | >1440px | Flexible | 75% (resizable) | 25% (dockable) | Vertical sidebar |

### Spacing System

- **Baseline Grid**: 8px
- **Mobile Gutters**: 16dp
- **Tablet Gutters**: 24dp
- **Desktop Gutters**: 32dp
- **Max Content Width**: 1200px
- **Card Padding**: 12dp (mobile), 16dp (desktop)
- **Touch Targets**: Minimum 44x44px

## Design System

### Typography

| Role | iOS | Android | Web |
|------|-----|---------|-----|
| Display | SF Pro Display Bold 28-34 | Roboto Black 28-34 | Inter Bold 28-34 |
| Headline | SF Pro Text Semibold 20 | Roboto Medium 20 | Inter Semibold 20 |
| Body | SF Pro Text Regular 16 | Roboto Regular 16 | Inter Regular 16 |
| Caption | SF Pro Text Regular 13 | Roboto Regular 13 | Inter Regular 13 |

**Dynamic Type Support**: Scale with iOS Accessibility & Android SP settings (100-200%)

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-500` | `#0066FF` | Buttons, active states, day headers |
| `primary-100` | `#E6F0FF` | Card backgrounds, highlights |
| `success-500` | `#00C853` | Confirmed actions, route optimized |
| `warning-500` | `#FF9800` | Conflicts, time gaps >2h |
| `error-500` | `#F44336` | Overlaps, unsaved changes |
| `neutral-900` | `#1A1A1A` | Text (dark mode) |
| `neutral-100` | `#FFFFFF` | Background (light mode) |

**Dark Mode**: Auto-detect + manual toggle. Invert neutrals, reduce saturation by 20%.

## Components and Interfaces

### 1. TripPlannerLayout Component

**Purpose:** Main container managing the responsive layout system

**Props:**
```typescript
interface TripPlannerLayoutProps {
  tripId: string;
  initialView?: 'timeline' | 'map' | 'split';
  breakpoint?: 'mobile-portrait' | 'mobile-landscape' | 'tablet-portrait' | 'tablet-landscape' | 'desktop';
}
```

**Responsibilities:**
- Manage responsive layout switching based on breakpoints
- Handle panel resizing with drag handle (desktop)
- Coordinate between Itinerary Canvas and Map Panel
- Manage keyboard shortcuts (Ctrl+1 timeline, Ctrl+2 map)
- Persist layout preferences
- Apply spacing system (gutters, padding)

### 2. ItineraryCanvas Component

**Purpose:** Central planning area displaying the chronological itinerary with inline editing

**Props:**
```typescript
interface ItineraryCanvasProps {
  tripId: string;
  selectedDayId?: string;
  onDaySelect: (dayId: string) => void;
  onPlaceSelect: (placeId: string) => void;
  showTimeRuler?: boolean;
  enableAISuggestions?: boolean;
}
```

**Key Features:**
- Day grouping with collapsible sections
- Time ruler (6 AM - 10 PM)
- Drag-and-drop reordering
- Optimistic UI updates
- Loading state overlays
- Inline editing (time, transport, notes)
- Gap indicators with AI suggestions
- Quick action buttons between cards
- Virtual scrolling for 50+ items

**Visual Structure:**
```
[Day Header: "Day 1 – Mon, 25 Dec" + Weather + AI Tip]
├─ [Time Ruler – 6 AM to 10 PM]
│   ├─ [Attraction Card 1] ← Draggable
│   │   ├─ Thumbnail (80x80) | Title | Time Badge | Transport Icon
│   │   └─ [Inline Edit Handles: ✏️ ⏱️ 🗑️]
│   ├─ [Gap Indicator] ← "2h free – Add lunch?"
│   └─ [Attraction Card 2]
└─ [Add Activity Button] (inline, between cards)
```

### 3. DayGroup Component

**Purpose:** Group and display places for a single day with management controls

**Props:**
```typescript
interface DayGroupProps {
  day: Day;
  places: Place[];
  isExpanded: boolean;
  weather?: WeatherData;
  onToggle: () => void;
  onPlaceReorder: (placeId: string, newIndex: number) => void;
  onSplitDay: () => void;
  onDuplicateDay: () => void;
  onAIOptimize: () => void;
}
```

**Day Header Controls:**
- Date and day of week display
- Weather icon and temperature
- Summary statistics (place count, total cost, total duration)
- Three-dot menu (Split Day, Duplicate Day, Delete Day)
- AI Optimize button
- Expand/collapse toggle

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Day Header: "Day 1 – Mon, 25 Dec" ☀️ 22°C              │
│ 3 places • HK$450 • 6h total        [⋮] [AI Optimize]  │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 08:00 → 09:00  [⋮⋮ Drag Handle]                    │ │
│ │ [Image 80x80] Star Ferry                            │ │
│ │ 💰 HK$15 • ⏱️ 1h  [✏️] [⏱️] [🗑️]                   │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🚗 3 min • 0.5 km  [Tap to change mode]            │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Gap Indicator: 2h free – Add lunch? 🍽️]          │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 11:10 → 13:10  [⋮⋮ Drag Handle]                    │ │
│ │ [Image 80x80] Victoria Harbor                       │ │
│ │ 💰 Free • ⏱️ 2h  [✏️] [⏱️] [🗑️]                    │ │
│ └─────────────────────────────────────────────────────┘ │
│ [+ Add Activity]                                        │
└─────────────────────────────────────────────────────────┘
```

### 4. PlaceCard Component

**Purpose:** Display individual place information with drag handle

**Props:**
```typescript
interface PlaceCardProps {
  place: Place;
  isLoading?: boolean;
  isDragging?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}
```

**Visual States:**
- Default: Normal card display
- Dragging: Semi-transparent with shadow
- Loading: Spinner overlay
- Error: Red border with retry button

### 5. TransportSegment Component

**Purpose:** Display transport information between places

**Props:**
```typescript
interface TransportSegmentProps {
  from: Place;
  to: Place;
  mode: TransportMode;
  duration: number;
  distance: number;
  isCalculating?: boolean;
  onModeChange: (mode: TransportMode) => void;
}
```

**Display:**
```
┌─────────────────────────────────────┐
│ 🚗 15 min • 5.2 km                  │
│ [Click to change transport mode]    │
└─────────────────────────────────────┘
```

### 6. MapPanel Component

**Purpose:** Interactive collapsible map with markers and routes

**Props:**
```typescript
interface MapPanelProps {
  places: Place[];
  routes: Route[];
  selectedPlaceId?: string;
  panelState: 'closed' | 'peek' | 'full';
  onPlaceSelect: (placeId: string) => void;
  onMapClick: (lat: number, lng: number) => void;
  onPanelStateChange: (state: 'closed' | 'peek' | 'full') => void;
  showTrafficLayer?: boolean;
  showCommuteToggle?: boolean;
}
```

**Features:**
- Custom markers with place icons
- Route polylines with transport colors (color-coded per day)
- Auto-zoom to fit markers
- Hover info cards
- Click to add place with "Add to itinerary?" modal
- Collapsible states: closed (FAB only), peek (30% height), full (100% or docked)
- Traffic layer toggle
- Commute paths toggle
- Pinch-to-zoom support (mobile)

### 7. ContextualFAB Component

**Purpose:** Floating action button that adapts to current context

**Props:**
```typescript
interface ContextualFABProps {
  context: 'empty' | 'itinerary' | 'gap' | 'map';
  onAction: () => void;
  extended?: boolean; // Show label on desktop hover
}
```

**Context-Based Behavior:**
| Context | Icon | Label | Action |
|---------|------|-------|--------|
| Empty Canvas | ➕ | "Start New Trip" | Open trip wizard |
| In Itinerary | ➕ | "Add Attraction" | Open search |
| In Gap | 🍽️ | "Quick Add: Meal / Rest" | Quick add menu |
| Map Open | 📍 | "Drop Pin Here" | Pin drop mode |

**Positioning:**
- Bottom-right corner
- 16dp margin (mobile), 24dp margin (desktop)
- Extended FAB shows label on hover (desktop only)

### 8. InlineTimeEditor Component

**Purpose:** Direct time editing without modal dialogs

**Props:**
```typescript
interface InlineTimeEditorProps {
  startTime: string;
  endTime: string;
  onTimeChange: (start: string, end: string) => void;
  snapInterval?: number; // Default: 15 minutes
  enableHaptic?: boolean;
}
```

**Features:**
- Dual slider thumbs for start/end time
- 15-minute snap intervals
- Haptic feedback on snap (mobile)
- Auto-recalculate subsequent times
- Inline display (no modal)
- Visual time range indicator

**Display:**
```
[ 9:00 AM ] ━━━━━━━━━━━━━ [ 9:30 AM ]
     ↑                          ↑
  Drag thumb              Drag thumb
```

### 9. GapIndicator Component

**Purpose:** Show time gaps with AI suggestions

**Props:**
```typescript
interface GapIndicatorProps {
  gapDuration: number; // minutes
  suggestions: AISuggestion[];
  onAcceptSuggestion: (suggestion: AISuggestion) => void;
  onDismiss: () => void;
}
```

**Display:**
```
┌─────────────────────────────────────────────────────────┐
│ ⏰ 2h free – Add lunch?                                 │
│ [🍽️ Nearby Restaurants] [☕ Coffee Break] [Dismiss]    │
└─────────────────────────────────────────────────────────┘
```

**Behavior:**
- Only shown for gaps > 1.5 hours
- AI-suggested activities based on time and location
- One-tap to accept suggestion
- Dismissible

### 10. CollaborationOverlay Component

**Purpose:** Real-time collaboration indicators

**Props:**
```typescript
interface CollaborationOverlayProps {
  users: CollaboratingUser[];
  changes: RecentChange[];
  onResolveConflict: (resolution: ConflictResolution) => void;
}
```

**Features:**
- Live cursors with colored dots and user names
- Presence bar showing active users
- Change toasts in top-right corner
- Conflict resolution modal with side-by-side diff
- Comment bubbles on place cards
- @mention support in comments

**Live Cursor Display:**
```
┌─────────────────────────────────────┐
│ [Place Card]                        │
│ 🔵 Sarah is editing...              │
└─────────────────────────────────────┘
```

**Conflict Modal:**
```
┌─────────────────────────────────────────────────────────┐
│ Conflict Detected                                       │
├──────────────────────┬──────────────────────────────────┤
│ Your Version         │ Sarah's Version                  │
│ Time: 9:00 AM        │ Time: 10:00 AM                   │
├──────────────────────┴──────────────────────────────────┤
│ [Keep Mine] [Keep Theirs] [Merge]                       │
└─────────────────────────────────────────────────────────┘
```

### 11. AISuggestionService

**Purpose:** Provide intelligent planning suggestions

**Interface:**
```typescript
interface AISuggestionService {
  suggestGapFillers(gap: TimeGap, location: Location): Promise<AISuggestion[]>;
  analyzeEnergyBalance(day: Day): EnergyAnalysis;
  optimizeDay(day: Day): OptimizedDay;
  rankSearchResults(query: string, context: PlanningContext): Place[];
  explainSuggestion(suggestionId: string): string;
}
```

**AI Features:**
1. **Auto-Fill Gaps**: Suggests meals, coffee, scenic stops for gaps > 1.5h
2. **Energy Balancer**: Warns about high activity after 6 PM, suggests swaps
3. **Budget Tracker**: Live total with "Over by HK$200" alerts
4. **Smart Search**: AI-ranked results (e.g., "romantic dinner")
5. **Day Optimizer**: Reorders for min travel + energy balance
6. **Explainability**: "Why?" tooltip on every suggestion

### 12. LocalizationService

**Purpose:** Handle multi-language support and regional settings

**Interface:**
```typescript
interface LocalizationService {
  getCurrentLocale(): 'en' | 'zh-HK' | 'zh-CN';
  setLocale(locale: 'en' | 'zh-HK' | 'zh-CN'): void;
  translate(key: string): string;
  formatCurrency(amount: number): string; // HKD default
  formatDistance(meters: number): string; // km
  formatTemperature(celsius: number): string; // °C
  formatTime(time: string): string; // 24-hour
}
```

**Hong Kong Defaults:**
- Language: Traditional Chinese (繁體中文) auto-detected
- Currency: HKD
- Distance: Kilometers
- Temperature: Celsius
- Time: 24-hour clock

### 13. OptimisticUpdateManager

**Purpose:** Handle optimistic UI updates with rollback capability

**Interface:**
```typescript
interface OptimisticUpdateManager {
  applyUpdate<T>(
    optimisticData: T,
    updateFn: () => Promise<T>,
    rollbackFn: (error: Error) => void
  ): Promise<void>;
  
  queueUpdate(update: PendingUpdate): void;
  processQueue(): Promise<void>;
  getQueueStatus(): QueueStatus;
}
```

**Update Flow:**
```
User Action → Optimistic Update → Show Spinner
    ↓
API Call → Success → Remove Spinner
    ↓
  Failure → Rollback → Show Error
```

### 7. OptimisticUpdateManager

**Purpose:** Handle optimistic UI updates with rollback capability

**Interface:**
```typescript
interface OptimisticUpdateManager {
  applyUpdate<T>(
    optimisticData: T,
    updateFn: () => Promise<T>,
    rollbackFn: (error: Error) => void
  ): Promise<void>;
  
  queueUpdate(update: PendingUpdate): void;
  processQueue(): Promise<void>;
  getQueueStatus(): QueueStatus;
}
```

**Update Flow:**
```
User Action → Optimistic Update → Show Spinner
    ↓
API Call → Success → Remove Spinner
    ↓
  Failure → Rollback → Show Error
```

## Data Models

### Enhanced Place Model

```typescript
interface Place {
  id: string;
  tripId: string;
  dayId: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  timeStart?: string;
  timeEnd?: string;
  cost?: number;
  type: PlaceType;
  imageUrl?: string;
  notes?: string;
  order: number;
  
  // New fields for redesign
  calculatedArrivalTime?: string;
  travelTimeFromPrevious?: number;
  distanceFromPrevious?: number;
  transportMode?: TransportMode;
  isSyncing?: boolean;
  syncError?: string;
}
```

### Transport Route Model

```typescript
interface TransportRoute {
  id: string;
  fromPlaceId: string;
  toPlaceId: string;
  mode: TransportMode;
  duration: number; // minutes
  distance: number; // meters
  polyline: string; // encoded polyline
  steps?: RouteStep[];
  calculatedAt: Date;
  expiresAt: Date;
}

type TransportMode = 'driving' | 'walking' | 'transit' | 'flight';

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  polyline: string;
}
```

### Sync Queue Model

```typescript
interface SyncQueueItem {
  id: string;
  type: 'place_reorder' | 'place_update' | 'place_delete' | 'place_create';
  data: any;
  timestamp: Date;
  retryCount: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  error?: string;
}
```

## Error Handling

### Optimistic Update Failures

**Strategy:** Rollback with user notification

```typescript
async function handlePlaceReorder(placeId: string, newIndex: number) {
  const originalOrder = getCurrentOrder();
  
  // Optimistic update
  updateUIOrder(placeId, newIndex);
  setLoading(placeId, true);
  
  try {
    await api.updatePlaceOrder(placeId, newIndex);
    setLoading(placeId, false);
  } catch (error) {
    // Rollback
    restoreOrder(originalOrder);
    setLoading(placeId, false);
    showError('Failed to update order. Please try again.');
  }
}
```

### Route Calculation Failures

**Strategy:** Fallback to straight line with warning

```typescript
async function calculateRoute(from: Place, to: Place): Promise<TransportRoute> {
  try {
    return await routingService.calculate(from, to);
  } catch (error) {
    // Fallback to straight line
    return {
      mode: 'driving',
      duration: estimateDuration(from, to),
      distance: calculateStraightLineDistance(from, to),
      polyline: createStraightLine(from, to),
      isEstimate: true,
      error: 'Route calculation unavailable'
    };
  }
}
```

### Offline Handling

**Strategy:** Queue operations and sync when online

```typescript
async function handleOfflineUpdate(update: Update) {
  // Apply optimistic update
  applyLocalUpdate(update);
  
  // Queue for sync
  await syncQueue.add(update);
  
  // Show offline indicator
  showOfflineIndicator(update.id);
  
  // Listen for online event
  window.addEventListener('online', () => {
    syncQueue.processAll();
  });
}
```

## Testing Strategy

### Unit Tests

**Components to Test:**
- PlaceCard rendering and interactions
- TransportSegment calculations
- DayGroup expand/collapse
- OptimisticUpdateManager rollback logic

**Example Test:**
```typescript
describe('PlaceCard', () => {
  it('should show loading spinner during sync', () => {
    const { getByTestId } = render(
      <PlaceCard place={mockPlace} isLoading={true} />
    );
    expect(getByTestId('loading-spinner')).toBeInTheDocument();
  });
  
  it('should handle drag start', () => {
    const onDragStart = jest.fn();
    const { getByTestId } = render(
      <PlaceCard place={mockPlace} onDragStart={onDragStart} />
    );
    fireEvent.dragStart(getByTestId('drag-handle'));
    expect(onDragStart).toHaveBeenCalled();
  });
});
```

### Integration Tests

**Scenarios to Test:**
- Drag-and-drop with database sync
- Route recalculation on place reorder
- Time updates cascading through day
- Offline queue processing

### E2E Tests

**User Flows:**
1. Create trip → Add places → Reorder → Verify sync
2. Drag place → See loading → Verify new order
3. Change transport mode → See route update
4. Go offline → Make changes → Come online → Verify sync

## Performance Considerations

### Debouncing and Throttling

```typescript
// Debounce route calculations
const debouncedCalculateRoute = debounce(calculateRoute, 500);

// Throttle map updates
const throttledUpdateMap = throttle(updateMapMarkers, 100);
```

### Caching Strategy

```typescript
interface RouteCache {
  get(from: string, to: string, mode: TransportMode): TransportRoute | null;
  set(from: string, to: string, mode: TransportMode, route: TransportRoute): void;
  clear(): void;
  prune(): void; // Remove expired entries
}

// Cache routes for 5 minutes
const ROUTE_CACHE_TTL = 5 * 60 * 1000;
```

### Virtual Scrolling

For timelines with many places:

```typescript
import { FixedSizeList } from 'react-window';

function TimelinePanel({ places }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={places.length}
      itemSize={120}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <PlaceCard place={places[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

## Migration Strategy

### Phase 1: Parallel Implementation
- Build new components alongside existing ones
- Use feature flag to toggle between old and new UI
- Test with beta users

### Phase 2: Data Migration
- Ensure all existing data works with new models
- Add new fields with default values
- Backfill transport routes for existing trips

### Phase 3: Gradual Rollout
- Enable for 10% of users
- Monitor performance and errors
- Gradually increase to 100%

### Phase 4: Cleanup
- Remove old components
- Remove feature flags
- Archive old code

## Accessibility Implementation

### Keyboard Navigation

```typescript
// Keyboard shortcuts
const shortcuts = {
  'ArrowUp': () => selectPreviousPlace(),
  'ArrowDown': () => selectNextPlace(),
  'Space': () => toggleDragMode(),
  'Enter': () => editSelectedPlace(),
  'Delete': () => deleteSelectedPlace(),
  'Escape': () => cancelDrag(),
};
```

### Screen Reader Announcements

```typescript
function announceUpdate(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

// Usage
announceUpdate('Place moved to position 3 of 5');
```

### Focus Management

```typescript
function handlePlaceReorder(placeId: string, newIndex: number) {
  const element = document.getElementById(`place-${placeId}`);
  
  // Perform reorder
  await reorderPlace(placeId, newIndex);
  
  // Restore focus
  element?.focus();
  
  // Announce change
  announceUpdate(`Place moved to position ${newIndex + 1}`);
}
```

## Security Considerations

### Input Validation

- Validate all place coordinates
- Sanitize user-entered place names and notes
- Validate time formats
- Check order indices are within bounds

### Rate Limiting

- Limit route calculation requests to 10 per minute per user
- Throttle drag-and-drop updates to prevent abuse
- Implement exponential backoff for failed syncs

### Data Privacy

- Don't send sensitive trip data in route calculation requests
- Cache routes locally when possible
- Clear cache on logout
