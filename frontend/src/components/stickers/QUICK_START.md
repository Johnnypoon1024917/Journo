# 🎨 Sticker System - Quick Start

## 🚀 Access the Demo

**URL:** `http://localhost:5173/sticker-demo`

Just start your dev server and visit the URL above!

```bash
cd frontend
npm run dev
```

## 📱 What You'll See

### Demo Features:
- **Budget Progress Card** - Stickers with value controls (0-200%)
- **Activity List Card** - Stickers without values
- **Interactive Instructions** - Learn by doing
- **Feature Checklist** - See all capabilities

### Try These Gestures:

1. **Add Sticker**
   - Click "Add Sticker" button
   - Select from picker
   - Sticker appears on card

2. **Edit Value** (Budget card only)
   - Long-press sticker (hold for 400ms)
   - Sticker scales up + wobbles
   - Slider appears below
   - Drag slider or tap ± buttons
   - Value changes color: 🟢 <100% | 🟠 100-150% | 🔴 >150%

3. **Move Sticker**
   - Drag sticker anywhere
   - Sticker becomes semi-transparent
   - Release to drop

4. **Delete Sticker**
   - Start dragging any sticker
   - Recycle bin appears bottom-right
   - Drag sticker near bin (it opens + glows pink)
   - Drop on bin
   - Watch the "eating" animation 😋
   - Undo toast appears for 6 seconds

## 🎯 Quick Integration

### Step 1: Import
```tsx
import { StickerCanvas } from '@/components/stickers';
```

### Step 2: Add to Your Page
```tsx
<div className="relative">
  {/* Your content */}
  
  <StickerCanvas
    elementId="my-element"
    elementType="trip"
    tripId="trip-123"
    editable={true}
    hasValues={true}
  />
</div>
```

### Step 3: Done! 🎉

## 📚 Full Documentation

- **Integration Guide**: `INTEGRATION_GUIDE.md`
- **Component Docs**: `README.md`
- **Implementation**: `../../docs/STICKER_VALUE_CONTROL_IMPLEMENTATION.md`

## 🎨 Customization

All components use your Kawaii theme colors automatically:
- Pink gradients: `from-pink-400 to-pink-500`
- Pastel backgrounds
- Soft shadows
- Rounded corners

## 🐛 Troubleshooting

**Stickers not showing?**
- Check browser console for errors
- Verify parent has `position: relative`
- Ensure `useStickerStore` is initialized

**Can't drag?**
- Set `editable={true}`
- Check parent doesn't block pointer events

**Value control not appearing?**
- Set `hasValues={true}`
- Long-press for 400ms (not just tap)

## 📱 Mobile Testing

Works great on:
- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Desktop browsers

Features:
- Large touch targets (48px minimum)
- Haptic feedback
- Smooth animations
- Thumb-reach zones

## 🎬 Animation Details

- **Long-press**: Scale 1.15× + wobble
- **Drag**: Opacity 0.75 + follow finger
- **Delete**: Shrink + fly to bin + rotate 720°
- **Bin**: Lid opens + glows + shakes
- **Value change**: Count-up animation + cat paw bounce

## 🔥 Pro Tips

1. **Multiple stickers**: Place 5-10 per element for best UX
2. **Value ranges**: Use 0-200% for progress/budget tracking
3. **Mobile first**: Test gestures on touch devices
4. **Performance**: Canvas is optimized for 60fps

## 🎉 Have Fun!

The demo is fully interactive - play around and see what you can create!
