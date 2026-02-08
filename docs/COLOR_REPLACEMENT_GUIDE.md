# Color Replacement Guide

## Summary

Found **1130 hardcoded color values** across components that need to be replaced with CSS variables.

## Priority Components (Most Hardcoded Colors)

Based on the scan, these components have the most hardcoded colors and should be updated first:

1. **ItineraryView.tsx** - 175 matches
2. **TripSidebar.tsx** - Many rgba() values
3. **AddActivityModal.tsx** - Multiple rgb(255, 248, 240) instances
4. **KawaiiModal.tsx** - Multiple rgb(255, 248, 240) instances
5. **EditActivityModal.tsx** - Multiple rgb(255, 248, 240) instances

## Common Replacements

### Kawaii Colors

```typescript
// Cream background
'rgb(255, 248, 240)' → 'var(--kawaii-cream)'
'#FFF8F0' → 'var(--kawaii-cream)'

// Primary pink
'#FFB3BA' → 'var(--kawaii-primary-500)'
'rgb(255, 179, 186)' → 'var(--kawaii-primary-500)'

// Primary variants
'#ff6b7f' → 'var(--kawaii-primary-600)'
'#ff4d63' → 'var(--kawaii-primary-700)'
'#e91e63' → 'var(--kawaii-primary-700)' // Close match

// Neutral colors
'#fafaf9' → 'var(--kawaii-neutral-50)'
'#f5f5f4' → 'var(--kawaii-neutral-100)'
'#e7e5e4' → 'var(--kawaii-neutral-200)'
'#d6d3d1' → 'var(--kawaii-neutral-300)'
'#a8a29e' → 'var(--kawaii-neutral-400)'
'#78716c' → 'var(--kawaii-neutral-500)'
'#57534e' → 'var(--kawaii-neutral-600)'
'#44403c' → 'var(--kawaii-neutral-700)'
'#292524' → 'var(--kawaii-neutral-800)'
'#1c1917' → 'var(--kawaii-neutral-900)'
```

### Generic Grays (Map to Kawaii Neutrals)

```typescript
'#f5f5f5' → 'var(--kawaii-neutral-100)'
'#e0e0e0' → 'var(--kawaii-neutral-200)'
'#9CA3AF' → 'var(--kawaii-neutral-400)'
'#6b7280' → 'var(--kawaii-neutral-500)'
'#374151' → 'var(--kawaii-neutral-700)'
'#1a1a1a' → 'var(--kawaii-neutral-900)'
```

### RGBA Values

For rgba() values, convert to CSS variables with opacity:

```typescript
// Shadow colors
'rgba(0, 0, 0, 0.1)' → 'rgba(0, 0, 0, 0.1)' // Keep for shadows
'rgba(0, 0, 0, 0.25)' → 'rgba(0, 0, 0, 0.25)' // Keep for shadows

// Primary with opacity
'rgba(233, 30, 99, 0.3)' → Use primary color with opacity utility class
'rgba(255, 179, 186, 0.5)' → Use primary color with opacity utility class

// Background overlays
'rgba(255, 255, 255, 0.9)' → 'rgba(255, 255, 255, 0.9)' // Keep for overlays
'rgba(0, 0, 0, 0.5)' → 'rgba(0, 0, 0, 0.5)' // Keep for overlays
```

## Automated Replacement Script

You can use find-and-replace in your IDE with these patterns:

### VS Code Find & Replace (Regex)

1. Find: `rgb\(255, 248, 240\)`
   Replace: `var(--kawaii-cream)`

2. Find: `#FFF8F0`
   Replace: `var(--kawaii-cream)`

3. Find: `#FFB3BA`
   Replace: `var(--kawaii-primary-500)`

4. Find: `#ff6b7f`
   Replace: `var(--kawaii-primary-600)`

5. Find: `#f5f5f5`
   Replace: `var(--kawaii-neutral-100)`

## Manual Review Required

Some colors need manual review:

1. **Chart/Graph Colors** - May need specific color schemes
2. **Status Colors** - Success/Error/Warning should use semantic colors
3. **Brand Colors** - External brand colors should remain unchanged
4. **Shadow Colors** - Black rgba() for shadows can stay
5. **Overlay Colors** - White/Black rgba() for overlays can stay

## Testing After Replacement

After replacing colors:

1. ✅ Visual inspection of all pages
2. ✅ Check contrast ratios (WCAG AA)
3. ✅ Test theme switching (system/trip)
4. ✅ Verify no broken styles
5. ✅ Check dark mode (if enabled)

## Progress Tracking

- [ ] ItineraryView.tsx (175 colors)
- [ ] TripSidebar.tsx
- [ ] AddActivityModal.tsx
- [ ] KawaiiModal.tsx
- [ ] EditActivityModal.tsx
- [ ] StickerModal.tsx
- [ ] TimelinePanel.tsx
- [ ] InfoWindow.tsx
- [ ] CategoryChart.tsx
- [ ] All other components

## Notes

- Keep shadow rgba() values as-is (they're not theme colors)
- Keep overlay rgba() values as-is (they're for transparency effects)
- Map generic grays to closest Kawaii neutral shade
- When in doubt, use neutral-500 for mid-tone grays
