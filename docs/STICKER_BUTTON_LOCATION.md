# Sticker Button Location Guide

## Visual Layout

```
┌─────────────────────────────────────────────────────┐
│ DayCard                                             │
│                                                     │
│  Wed  3  Mar                          🐱🎌  ⋮      │
│  ────────────────────────────────────────────────  │
│                                                     │
│  Day 1 ♪                                           │
│                                                     │
│  📝 Checklist                                       │
│  ┌─────────────────────────────────────────────┐  │
│  │ ☐ Visit Osaka Castle                        │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  🛏️ Hotel                                          │
│  ┌─────────────────────────────────────────────┐  │
│  │ Hotel Granvia Osaka                         │  │
│  │ Check-in: 15:00 ~                           │  │
│  │ Check-out: ~11:00                           │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  活動安排                                           │
│  ┌─────────────────────────────────────────────┐  │
│  │ • 09:00  📍 Osaka Castle                    │  │
│  │ • 12:00  📍 Dotonbori                       │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│                                                     │
│                                  ┌──────────────┐  │
│                                  │ ✨ 貼上貼紙   │ ← STICKER BUTTON
│                                  └──────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Button Details

### Position
- **Location**: Bottom-right corner of DayCard
- **Coordinates**: `absolute bottom-4 right-4`
- **Z-index**: 20 (appears above card content)

### Appearance
- **Icon**: ✨ Sparkles (SparklesIcon from Heroicons)
- **Text**: "貼上貼紙" (visible on screens ≥ 640px)
- **Background**: Gradient from kawaii-500 to kawaii-600
- **Shape**: Rounded pill (rounded-full)
- **Shadow**: Large shadow with hover effect

### Styling
```css
.sticker-button {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  min-width: 44px;
  min-height: 44px;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: linear-gradient(to right, #ff6b9d, #ff8fab);
  color: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 20;
}

.sticker-button:hover {
  background: linear-gradient(to right, #ff8fab, #ffa5bb);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### Responsive Behavior
- **Mobile (< 640px)**: Shows only icon (✨)
- **Desktop (≥ 640px)**: Shows icon + text "貼上貼紙"

### Accessibility
- **Touch Target**: 44x44px minimum (meets WCAG standards)
- **ARIA Label**: "Attach sticker" (from translation)
- **Title**: Shows tooltip on hover
- **Keyboard**: Focusable and activatable with Enter/Space

## Button States

### Default
```
┌──────────────┐
│ ✨ 貼上貼紙   │
└──────────────┘
```

### Hover
```
┌──────────────┐
│ ✨ 貼上貼紙   │  ← Slightly darker gradient
└──────────────┘  ← Larger shadow
```

### Mobile
```
┌────┐
│ ✨ │
└────┘
```

## Interaction Flow

1. **User clicks sticker button**
   ```
   Click ✨ button
   ```

2. **Sticker modal opens**
   ```
   ┌─────────────────────────────────┐
   │ Select a Sticker                │
   ├─────────────────────────────────┤
   │ [My Stickers] [Public] [Default]│
   ├─────────────────────────────────┤
   │  🎌  🍜  📖  🎵  🌸            │
   │  ❤️  ⭐  📷  🍜  ✈️            │
   │  📍  ☀️  🌙  👍  🔥            │
   ├─────────────────────────────────┤
   │ [Upload Custom Sticker]         │
   └─────────────────────────────────┘
   ```

3. **User selects sticker**
   ```
   Click on sticker → Sticker appears on card
   ```

4. **Sticker appears on card**
   ```
   ┌─────────────────────────────────┐
   │ DayCard                         │
   │                                 │
   │  🌸 ← Sticker positioned here  │
   │                                 │
   │  Day 1 ♪                       │
   │  ...                           │
   └─────────────────────────────────┘
   ```

## Code Reference

### Button Component
```tsx
<button
  onClick={openModal}
  className="absolute bottom-4 right-4 min-w-[44px] min-h-[44px] px-4 py-2 rounded-full bg-gradient-to-r from-kawaii-500 to-kawaii-600 text-white hover:from-kawaii-600 hover:to-kawaii-700 transition-all shadow-lg hover:shadow-xl z-20 flex items-center justify-center gap-2 font-medium text-sm"
  aria-label={t('stickers.attach')}
  title={t('stickers.attach')}
>
  <SparklesIcon className="w-5 h-5" />
  <span className="hidden sm:inline">貼上貼紙</span>
</button>
```

### Location in Component Tree
```
ScheduleScreen
└── DayCard
    ├── DateIllustrationHeader
    ├── DayTitle
    ├── ChecklistItems
    ├── HotelInfo
    ├── ActivitySchedule
    ├── StickerDisplay (absolute, z-10)
    └── StickerButton (absolute, z-20) ← HERE
```

## Troubleshooting

### Button Not Visible
1. Check `enableStickers` prop is `true`
2. Verify DayCard has `position: relative`
3. Check z-index is higher than other elements
4. Verify button is not hidden by overflow

### Button Not Clickable
1. Check z-index is sufficient
2. Verify no overlay elements blocking clicks
3. Check `pointer-events` is not disabled
4. Verify button is within viewport

### Modal Not Opening
1. Check `openModal` function is defined
2. Verify `useStickerAttachment` hook is working
3. Check modal component is rendered
4. Verify no JavaScript errors in console

## Related Files

- `frontend/src/components/kawaii/DayCard.tsx` - Button implementation
- `frontend/src/components/kawaii/StickerModal.tsx` - Modal component
- `frontend/src/hooks/useStickerAttachment.ts` - Attachment logic
- `frontend/src/services/stickerService.ts` - API calls

## Testing Checklist

- [ ] Button is visible on DayCard
- [ ] Button is in bottom-right corner
- [ ] Button has sparkle icon
- [ ] Button text shows on desktop
- [ ] Button text hides on mobile
- [ ] Button has hover effect
- [ ] Button has proper shadow
- [ ] Button is touch-friendly (44x44px)
- [ ] Button opens modal on click
- [ ] Button has proper z-index
- [ ] Button doesn't overlap with content
- [ ] Button is accessible via keyboard
- [ ] Button has proper ARIA labels
