# Sticker System

The sticker system allows users to decorate their trip elements (days, activities, bookings) with AI-generated or emoji stickers, recreating the nostalgic experience of decorating physical schedule books.

## Components

### StickerModal

Modal interface for browsing and selecting stickers.

**Features:**
- Grid layout with 4 columns (6 on desktop)
- Category tabs for filtering (all, characters, activities, transportation, food, landmarks, emotions, weather, seasonal)
- Selected sticker highlighting
- Close button and backdrop
- Loading and empty states

**Usage:**
```tsx
import { StickerModal } from '@/components/kawaii/StickerModal';

<StickerModal
  isOpen={isModalOpen}
  onClose={closeModal}
  onSelect={handleStickerSelect}
  tripId="trip-123"
/>
```

### StickerDisplay

Displays stickers attached to an element with drag-to-reposition and remove functionality.

**Features:**
- Displays all stickers for a specific element
- Drag-and-drop repositioning (when editable)
- Remove button on hover (when editable)
- Respects sticker position, rotation, and scale

**Usage:**
```tsx
import { StickerDisplay } from '@/components/kawaii/StickerDisplay';

<StickerDisplay
  elementId="day-123"
  elementType="day"
  tripId="trip-123"
  editable={true}
  className="absolute inset-0"
/>
```

## Hooks

### useStickerAttachment

Hook for managing sticker attachment to elements.

**Features:**
- Modal state management
- Sticker attachment logic
- Error handling
- Loading states

**Usage:**
```tsx
import { useStickerAttachment } from '@/hooks/useStickerAttachment';

const {
  isModalOpen,
  openModal,
  closeModal,
  handleStickerSelect,
  isAttaching,
  error,
} = useStickerAttachment({
  tripId: 'trip-123',
  elementId: 'day-123',
  elementType: 'day',
});
```

## Store

### useStickerStore

Zustand store for managing sticker state.

**State:**
- `stickers`: Array of available stickers
- `placements`: Array of sticker placements
- `selectedSticker`: Currently selected sticker ID
- `selectedCategory`: Currently selected category filter
- `isLoading`: Loading state
- `error`: Error message

**Actions:**
- `loadStickers(tripId)`: Load stickers for a trip
- `loadPlacements(tripId)`: Load sticker placements for a trip
- `selectSticker(stickerId)`: Select a sticker
- `setCategory(category)`: Set category filter
- `attachSticker(...)`: Attach a sticker to an element
- `updatePlacement(...)`: Update sticker placement position/rotation/scale
- `removePlacement(...)`: Remove a sticker placement
- `generateStickers(...)`: Generate AI stickers for a trip
- `getFilteredStickers()`: Get stickers filtered by category
- `getElementPlacements(elementId)`: Get placements for an element

**Usage:**
```tsx
import { useStickerStore } from '@/stores/stickerStore';

const { stickers, loadStickers, attachSticker } = useStickerStore();
```

## Service

### stickerService

Service for sticker API operations.

**Methods:**
- `getStickers(tripId)`: Get all stickers for a trip
- `getStickersByCategory(tripId, category)`: Get stickers by category
- `createSticker(tripId, data)`: Create a new sticker
- `deleteSticker(tripId, stickerId)`: Delete a sticker
- `generateStickers(tripId, request)`: Generate AI stickers
- `getSeasonalStickers(tripId, season)`: Get seasonal stickers
- `getStickerPlacements(tripId)`: Get all placements
- `getElementStickerPlacements(tripId, elementId, elementType)`: Get placements for element
- `createStickerPlacement(tripId, data)`: Create a placement
- `updateStickerPlacement(tripId, placementId, data)`: Update a placement
- `deleteStickerPlacement(tripId, placementId)`: Delete a placement
- `getSeasonFromDate(date)`: Determine season from date
- `getDefaultStickers()`: Get default emoji stickers (fallback)

## Types

### Sticker
```typescript
interface Sticker {
  id: string;
  image: string; // URL or emoji
  category: StickerCategory;
  tags: string[];
  aiGenerated: boolean;
  destination?: string;
  season?: Season;
  created_at: string;
}
```

### StickerPlacement
```typescript
interface StickerPlacement {
  id: string;
  stickerId: string;
  elementId: string;
  elementType: 'day' | 'activity' | 'booking';
  position: { x: number; y: number };
  rotation: number; // degrees
  scale: number; // 0.5 to 2.0
  created_at: string;
}
```

### StickerCategory
```typescript
type StickerCategory =
  | 'characters'
  | 'activities'
  | 'transportation'
  | 'food'
  | 'landmarks'
  | 'emotions'
  | 'weather'
  | 'seasonal';
```

## Integration Example

### Adding Stickers to DayCard

```tsx
import { DayCard } from '@/components/kawaii/DayCard';

<DayCard
  day={tripDay}
  tripId="trip-123"
  forecast={forecast}
  enableStickers={true}
  onActivityClick={handleActivityClick}
/>
```

The DayCard component now includes:
1. A sparkle button in the top-left to open the sticker modal
2. A StickerDisplay layer showing all attached stickers
3. Drag-and-drop repositioning for stickers
4. Remove buttons on hover

### Adding Stickers to Custom Components

```tsx
import { StickerDisplay } from '@/components/kawaii/StickerDisplay';
import { useStickerAttachment } from '@/hooks/useStickerAttachment';
import { StickerModal } from '@/components/kawaii/StickerModal';

function MyComponent({ elementId, tripId }) {
  const {
    isModalOpen,
    openModal,
    closeModal,
    handleStickerSelect,
  } = useStickerAttachment({
    tripId,
    elementId,
    elementType: 'activity',
  });

  return (
    <div className="relative">
      {/* Your content */}
      
      {/* Sticker display layer */}
      <StickerDisplay
        elementId={elementId}
        elementType="activity"
        tripId={tripId}
        editable={true}
      />
      
      {/* Add sticker button */}
      <button onClick={openModal}>
        Add Sticker
      </button>
      
      {/* Sticker modal */}
      <StickerModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSelect={handleStickerSelect}
        tripId={tripId}
      />
    </div>
  );
}
```

## AI Sticker Generation

The system supports AI-generated stickers based on trip destination and dates:

```tsx
import { useStickerStore } from '@/stores/stickerStore';

const { generateStickers } = useStickerStore();

// Generate stickers for a trip
await generateStickers(
  'trip-123',
  'Tokyo, Japan',
  '2024-03-15',
  '2024-03-22'
);
```

This will:
1. Analyze the destination and dates
2. Determine the season (spring in this case)
3. Generate themed stickers (cherry blossoms, temples, sushi, etc.)
4. Add them to the trip's sticker collection

## Seasonal Stickers

Stickers are automatically categorized by season based on trip dates:

- **Spring**: Cherry blossoms, flowers, butterflies
- **Summer**: Sun, beach, ice cream
- **Fall**: Leaves, pumpkins, harvest
- **Winter**: Snow, snowflakes, hot cocoa

## Default Stickers

When the API is unavailable or no stickers exist, the system falls back to emoji stickers:

- 🎒 Activities
- ✈️ Transportation
- 🍜 Food
- 🏨 Landmarks
- 😊 Emotions
- ☀️ Weather
- 🌸 Spring
- ❄️ Winter

## Persistence

All sticker placements are persisted to the backend and restored on page load:

1. User attaches sticker → Creates placement record
2. User drags sticker → Updates placement position
3. User removes sticker → Deletes placement record
4. Page reload → Loads all placements and displays stickers

## Performance Considerations

- Stickers use emoji by default for instant rendering
- AI-generated stickers are lazy-loaded
- Drag operations use requestAnimationFrame for smooth 60fps
- Sticker images are cached in the browser
- Only visible stickers are rendered (viewport optimization)

## Accessibility

- All sticker buttons have proper ARIA labels
- Keyboard navigation supported for modal
- Screen readers announce sticker categories
- Remove buttons are keyboard accessible
- Focus management in modal

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 14+
- Android Chrome 90+
- Drag-and-drop requires pointer events support
- Fallback to click-to-position on older browsers
