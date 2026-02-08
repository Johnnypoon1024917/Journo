# Per-Trip Theme Colors - Complete Guide

## Feature Overview

Each trip can now have its own unique color theme! 🎨

- **Trip to Japan** → Yellow theme 🟡
- **Trip to Sydney** → Green theme 🟢  
- **Trip to Paris** → Pink theme 🩷
- **Trip to New York** → Blue theme 🔵

Each trip's color is independent and only affects that specific trip.

---

## How to Set a Trip's Color Theme

### Step 1: Navigate to Trip Settings
1. Go to your trip detail page: `http://localhost:3000/trip/[trip-id]`
2. Click the **Settings** button/icon
3. You'll be at: `http://localhost:3000/trips/[trip-id]/settings`

### Step 2: Choose a Color

You have **3 options**:

#### Option A: Use a Preset Color (8 colors available)
- Pink, Orange, Blue, Teal, Purple, Yellow, Green, Red
- Click any colored circle
- Theme applies immediately to this trip

#### Option B: Use Custom Color Picker
1. Click the square button with the paint brush icon
2. A color picker will appear
3. Choose any color you want
4. Type a hex code (e.g., `#FF5733`) or use the visual picker
5. Click **"Apply"** button to save

#### Option C: Reset to Default
- Click **"Reset to Default"** button
- Trip will use the system default theme

---

## What You'll See

### On Trip Settings Page:

**Status Badge:**
- 🟢 "Custom Trip Theme" - This trip has a unique color
- 🔵 "Using Default Theme" - This trip uses the default color

**Preset Colors:**
- 8 colored circles in a grid
- Selected color has a checkmark ✓
- Hover to see color name

**Custom Color Picker:**
- Square button with paint brush icon
- Click to expand full color picker
- Hex input field for precise colors
- "Apply" button to save custom color

**Info Message:**
- Blue info box explaining that the color only affects this trip

---

## How It Works

### Per-Trip Independence:
- Each trip stores its own theme color in the database
- Changing one trip's color doesn't affect other trips
- You can have unlimited trips with different colors

### Visual Changes:
When you set a trip's color, these elements change:
- Header gradient background
- Primary buttons
- Active states
- Highlights and accents
- Navigation elements

### Persistence:
- Trip colors are saved to the database
- Colors persist across sessions
- Colors sync across all devices
- Only trip owner can change trip colors

---

## Examples

### Example 1: Japan Trip (Yellow)
```
1. Go to: /trips/abc123/settings
2. Click the Yellow circle
3. Trip header turns yellow
4. All buttons and accents are now yellow
5. Navigate back to trip - everything is yellow!
```

### Example 2: Sydney Trip (Custom Green)
```
1. Go to: /trips/def456/settings
2. Click the paint brush button
3. Choose green: #90EE90
4. Click "Apply"
5. Trip is now green!
```

### Example 3: Reset to Default
```
1. Go to: /trips/ghi789/settings
2. Click "Reset to Default"
3. Trip returns to default pink theme
```

---

## Troubleshooting

### "I don't see the color picker"
- Make sure you're on `/trips/[trip-id]/settings` (not `/settings`)
- Make sure you're the trip owner
- Click the square button with paint brush icon to expand

### "Colors aren't changing"
- Check browser console for errors
- Make sure you clicked "Apply" for custom colors
- Try refreshing the page
- Verify you're logged in

### "I see 'Only the trip owner can customize'"
- Only the person who created the trip can change its theme
- Ask the trip owner to change it
- Or create your own trip to customize

### "Theme resets when I leave the page"
- Check browser console for save errors
- Verify you're logged in
- Check network tab for API errors
- Make sure backend is running

---

## Technical Details

### Database Storage:
- Trip themes stored in `trip_color_theme` table
- Only `primary_500` color is required
- Other color shades generated automatically

### API Endpoints:
- `GET /api/theme/trip/:tripId` - Get trip theme
- `PUT /api/theme/trip/:tripId` - Update trip theme
- `DELETE /api/theme/trip/:tripId` - Reset to default

### Frontend Components:
- `TripThemeSettings.tsx` - The color picker UI
- `TripSettingsScreen.tsx` - The settings page
- `centralizedThemeStore.ts` - Theme state management

---

## Quick Reference

| Action | Location | Result |
|--------|----------|--------|
| Set trip color | `/trips/:id/settings` | Trip gets unique color |
| Use preset | Click colored circle | Instant color change |
| Custom color | Click paint brush → Pick → Apply | Any color you want |
| Reset | Click "Reset to Default" | Back to default theme |

---

## Benefits

✅ Each trip has its own identity
✅ Easy to distinguish trips at a glance
✅ Personalize your travel planning
✅ Colors persist across devices
✅ Simple and intuitive interface
✅ 8 presets + unlimited custom colors

---

## Next Steps

1. Go to any trip's settings page
2. Try different colors
3. See how each trip can have its own theme
4. Create multiple trips with different colors!

Enjoy your colorful trips! 🎨✈️
