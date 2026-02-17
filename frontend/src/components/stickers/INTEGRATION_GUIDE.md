# Sticker System Integration Guide

## Quick Start

### 1. Access the Demo

Visit the demo page to see all features in action:
```
http://localhost:5173/sticker-demo
```

### 2. Basic Integration

Add stickers to any page in 3 steps:

```tsx
import { StickerCanvas } from '@/components/stickers';

function YourPage() {
  return (
    <div className="relative min-h-screen">
      {/* Your page content */}
      <div className="your-content">
        {/* ... */}
      </div>

      {/* Sticker Layer - absolute positioned overlay */}
      <StickerCanvas
        elementId="your-element-id"
        elementType="trip" // or "day", "activity", "booking"
        tripId="your-trip-id"
        editable={true}
        hasValues={true} // Enable value controls
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
}
```

### 3. Add Sticker Picker Button

```tsx
import { useState } from 'react';
import { StickerCanvas } from '@/components/stickers';
import { StickerModal } from '@/components/kawaii/StickerModal';
import { useStickerStore } from '@/stores/stickerStore';

function YourPage() {
  const [showStickerModal, setShowStickerModal] = useState(false);
  const { attachSticker } = useStickerStore();

  const handleStickerSelect = async (stickerId: string) => {
    await attachSticker(
      tripId,
      stickerId,
      elementId,
      'trip',
      { x: 200, y: 150 } // Initial position
    );
    setShowStickerModal(false);
  };

  return (
    <>
      {/* Add Sticker Button */}
      <button
        onClick={() => setShowStickerModal(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-pink-500 rounded-full shadow-lg"
      >
        🎨
      </button>

      {/* Your content + StickerCanvas */}
      {/* ... */}

      {/* Sticker Picker Modal */}
      <StickerModal
        isOpen={showStickerModal}
        onClose={() => setShowStickerModal(false)}
        onSelect={handleStickerSelect}
        tripId={tripId}
      />
    </>
  );
}
```

## Real-World Examples

### Budget Page Integration

```tsx
// frontend/src/pages/BudgetPage.tsx
import { StickerCanvas } from '@/components/stickers';

export function BudgetPage() {
  const { id: tripId } = useParams();

  return (
    <div className="relative min-h-screen">
      {/* Budget Dashboard */}
      <BudgetDashboard tripId={tripId} />

      {/* Sticker Layer with Values */}
      <StickerCanvas
        elementId={tripId}
        elementType="trip"
        tripId={tripId}
        editable={true}
        hasValues={true} // Show percentage values
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
}
```

### Itinerary Day Card

```tsx
// frontend/src/components/kawaii/DayCard.tsx
import { StickerCanvas } from '@/components/stickers';

export function DayCard({ day, tripId }) {
  return (
    <div className="relative bg-white rounded-3xl p-6">
      {/* Day content */}
      <h3>{day.title}</h3>
      <div className="activities">
        {day.activities.map(activity => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>

      {/* Stickers for this day */}
      <StickerCanvas
        elementId={day.id}
        elementType="day"
        tripId={tripId}
        editable={true}
        hasValues={false}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
}
```

### Packing List Item

```tsx
// frontend/src/components/packing/PackingItem.tsx
import { StickerCanvas } from '@/components/stickers';

export function PackingItem({ item, tripId }) {
  return (
    <div className="relative bg-gray-100 rounded-2xl p-4">
      {/* Item content */}
      <span>{item.name}</span>

      {/* Small sticker overlay */}
      <StickerCanvas
        elementId={item.id}
        elementType="activity"
        tripId={tripId}
        editable={true}
        hasValues={false}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
}
```

## Props Reference

### StickerCanvas

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `elementId` | string | ✅ | Unique ID of the element to attach stickers to |
| `elementType` | 'day' \| 'activity' \| 'booking' \| 'trip' | ✅ | Type of element |
| `tripId` | string | ✅ | Trip ID for API calls |
| `editable` | boolean | ❌ | Enable drag/edit/delete (default: true) |
| `hasValues` | boolean | ❌ | Show value controls (default: false) |
| `className` | string | ❌ | Additional CSS classes |
| `onStickerDelete` | (id: string) => void | ❌ | Callback when sticker deleted |

## Styling Tips

### 1. Ensure Relative Positioning

The parent container must have `position: relative`:

```tsx
<div className="relative">
  {/* Content */}
  <StickerCanvas className="absolute inset-0" />
</div>
```

### 2. Pointer Events

Use `pointer-events-none` on the canvas and `pointer-events-auto` on stickers:

```tsx
<StickerCanvas className="absolute inset-0 pointer-events-none" />
```

This allows clicks to pass through to content below.

### 3. Z-Index Layering

```css
.your-content { z-index: 1; }
.sticker-canvas { z-index: 50; }
.recycle-bin { z-index: 60; }
.value-control { z-index: 50; }
.undo-toast { z-index: 70; }
```

## Troubleshooting

### Stickers not appearing?

1. Check that `useStickerStore` is initialized
2. Verify `elementId` matches the backend entity
3. Check browser console for API errors
4. Ensure parent has `position: relative`

### Drag not working?

1. Verify `editable={true}`
2. Check that parent doesn't have `pointer-events: none`
3. Ensure no conflicting drag handlers

### Value control not showing?

1. Set `hasValues={true}`
2. Long-press sticker for 400ms
3. Check that sticker has `value` property

## Performance Tips

1. **Lazy load stickers**: Only render StickerCanvas when needed
2. **Debounce updates**: Position updates are already optimized
3. **Limit stickers**: Recommend max 10-15 stickers per element
4. **Use React.memo**: Wrap StickerCanvas in memo for large lists

## Next Steps

1. ✅ Visit `/sticker-demo` to see it in action
2. Add StickerCanvas to your pages
3. Customize colors/animations to match your theme
4. Test on mobile devices
5. Add keyboard navigation (coming soon)

## Support

- 📖 Full docs: `frontend/src/components/stickers/README.md`
- 🎨 Demo: `http://localhost:5173/sticker-demo`
- 💬 Questions? Check the component source code
