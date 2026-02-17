# Sticker Value Control & Drag-to-Trash Delete System

Advanced sticker system for trip pages with value controls and intuitive drag-to-trash deletion.

## Overview

This system allows users to place, edit, and delete stickers on trip pages (packing list, budget dashboard, itinerary). Each sticker can have an adjustable value (e.g., "165%" for progress, discount, overrun, priority).

## Components

### Atoms

#### `ValueControl`
Slider with ± buttons for adjusting sticker values.

**Features:**
- Horizontal slider with cat paw handle (🐾)
- ± buttons for fine control (48px touch targets)
- Color-coded value display:
  - Green: < 100%
  - Orange: 100-150%
  - Red: > 150%
- Smooth animations with framer-motion
- Haptic feedback on button press

**Usage:**
```tsx
<ValueControl
  value={165}
  min={0}
  max={200}
  onChange={(value) => console.log(value)}
  position={{ x: 100, y: 200 }}
  visible={true}
/>
```

#### `RecycleBin`
Animated trash can for deleting stickers.

**Features:**
- Fixed bottom-right position (24px from edges)
- Opens lid when sticker is nearby (~100px)
- Glows pink when ready to accept drop
- "Eats" sticker with animation (shrink + zoom)
- Shows happy cat face (😋) after deletion
- Burps hearts/sparkles (💕✨)
- Fades in/out based on drag state

**Usage:**
```tsx
<RecycleBin
  isActive={isNearBin}
  onDrop={handleDelete}
  visible={isDragging}
/>
```

### Molecules

#### `DraggableSticker`
Individual sticker with drag, edit, and delete capabilities.

**Features:**
- Long-press (400ms) to enter edit mode
- Scale 1.15× + wobble animation when editing
- Drag to reposition (opacity 0.75 while dragging)
- Value control appears below sticker when editing
- Drag to recycle bin to delete
- Value display bubble above sticker
- Smooth spring animations

**Gestures:**
- **Long-press**: Enter edit mode (scale + wobble)
- **Drag**: Reposition sticker
- **Drag to bin**: Delete sticker
- **Tap ± buttons**: Adjust value

**Usage:**
```tsx
<DraggableSticker
  sticker={stickerData}
  placement={placementData}
  onDragEnd={(pos) => updatePosition(pos)}
  onDelete={() => deleteSticker()}
  onValueChange={(val) => updateValue(val)}
  editable={true}
  hasValue={true}
  binPosition={{ x: 100, y: 100 }}
/>
```

### Organisms

#### `StickerCanvas`
Main container for managing multiple draggable stickers.

**Features:**
- Manages multiple stickers per element
- Shows recycle bin only when dragging
- Undo toast (6 seconds) after deletion
- Integrates with `useStickerStore`
- Supports different element types (day, activity, booking, trip)

**Usage:**
```tsx
<StickerCanvas
  elementId="day-123"
  elementType="day"
  tripId="trip-456"
  editable={true}
  hasValues={true}
  onStickerDelete={(id) => console.log('Deleted:', id)}
/>
```

## Integration Example

### Budget Page with Progress Stickers

```tsx
import { StickerCanvas } from '@/components/stickers';

function BudgetDashboard({ tripId }) {
  return (
    <div className="relative min-h-screen">
      {/* Your budget content */}
      <div className="budget-cards">
        {/* ... */}
      </div>

      {/* Sticker Layer */}
      <StickerCanvas
        elementId={tripId}
        elementType="trip"
        tripId={tripId}
        editable={true}
        hasValues={true}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
}
```

### Itinerary with Activity Stickers

```tsx
import { StickerCanvas } from '@/components/stickers';

function DayCard({ day, tripId }) {
  return (
    <div className="relative day-card">
      {/* Day content */}
      <div className="activities">
        {day.activities.map(activity => (
          <div key={activity.id} className="relative">
            {/* Activity content */}
            
            {/* Stickers for this activity */}
            <StickerCanvas
              elementId={activity.id}
              elementType="activity"
              tripId={tripId}
              editable={true}
              hasValues={false}
              className="absolute inset-0 pointer-events-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Gesture Flow

1. **Place sticker**: Tap + button or drag from sticker picker → sticker appears at tap location
2. **Edit value**:
   - Long-press sticker (400ms) → scale + wobble → value bar fades in
   - Slide handle or tap ± → value updates live
   - Tap outside or lift finger → bar fades out after 2s idle
3. **Delete**:
   - Long-press sticker → enter drag mode
   - Drag toward bottom-right bin → bin activates (lid open, glow)
   - Drop inside bin bounds → delete animation:
     - Sticker shrinks to 20% → flies to bin center
     - Bin lid closes with shake animation
     - Small confetti + cat burp (😋💕)
   - Toast: "Deleted! UNDO" (tap UNDO → sticker reappears)
   - Drop outside bin → sticker bounces back to start position

## Animations

All animations use `framer-motion` for smooth, spring-based physics:

- **Drag**: Follow finger with 0.1s spring easing
- **Drop success**: Scale 0 + translate to bin + rotate 720°
- **Bin reaction**: Lid rotate 45° → close with overshoot bounce
- **Value change**: Number count-up animation + cat handle scale 1.2 → 1.0
- **Edit mode**: Scale 1.15 + wobble (rotate ±5°)

## Haptic Feedback

- Light impact: ± button tap
- Medium impact: Long-press enter edit mode
- Heavy impact: Delete sticker
- Success pattern: [50ms, 30ms, 50ms] on successful deletion

## Theme Integration

Uses BubbleQuest theme colors:
- Pink gradients: `from-pink-400 to-pink-500`
- Pastel backgrounds: `bg-gray-100` / `bg-gray-800` (dark mode)
- Soft shadows: `shadow-2xl`
- Rounded corners: `rounded-full`, `rounded-3xl`

## Mobile Optimization

- Large touch targets (48px minimum)
- Thumb-reach zones (bottom-right for bin)
- Touch-action: none for smooth dragging
- Responsive sizing (md: breakpoints)
- Haptic feedback for all interactions

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support (TODO)
- Screen reader announcements (TODO)
- High contrast mode support
- Focus indicators

## Future Enhancements

- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Undo/redo stack
- [ ] Multi-select for batch operations
- [ ] Sticker rotation gesture
- [ ] Custom value ranges per sticker type
- [ ] Backend support for value storage
- [ ] Sticker templates with preset values
- [ ] Animation preferences (reduced motion)

## Dependencies

- `framer-motion`: ^12.29.2
- `react`: ^18.2.0
- `zustand`: ^4.4.7 (via `useStickerStore`)

## Browser Support

- Chrome/Edge: ✅ Full support
- Safari: ✅ Full support
- Firefox: ✅ Full support
- Mobile Safari: ✅ Full support
- Mobile Chrome: ✅ Full support

## Performance

- Optimized for 60fps animations
- Lazy loading of value controls
- Efficient re-renders with React.memo (TODO)
- Debounced position updates (TODO)
