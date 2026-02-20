# Image Optimization Guide

This document explains the image optimization setup for the BubbleQuest/Journo frontend application.

## Overview

The application uses a comprehensive image optimization strategy to improve performance and Core Web Vitals:

- **Modern formats**: WebP and AVIF with automatic fallbacks
- **Responsive images**: Multiple sizes for different screen resolutions
- **Lazy loading**: Images load only when needed
- **Blur-up placeholders**: Smooth loading experience with color placeholders
- **Preloading**: Critical images are preloaded for faster LCP

## Components

### OptimizedImage Component

Located at: `src/components/common/OptimizedImage.tsx`

A high-performance image component that automatically handles:
- Format selection (AVIF → WebP → Original)
- Responsive srcset generation
- Lazy loading with intersection observer
- Blur-up placeholder effect
- Error handling with fallback UI

#### Usage Example

```tsx
import { OptimizedImage } from '@/components/common/OptimizedImage';

function MyComponent() {
  return (
    <OptimizedImage
      src="https://images.unsplash.com/photo-123?w=1200&q=80"
      alt="Beautiful destination"
      priority="high"  // Use for above-the-fold images
      sizes="(max-width: 768px) 100vw, 50vw"
      objectFit="cover"
      blurColor="rgb(139, 92, 246)"
      className="w-full h-64"
    />
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | string | required | Image URL |
| `alt` | string | required | Alt text for accessibility |
| `width` | number | optional | Image width for aspect ratio |
| `height` | number | optional | Image height for aspect ratio |
| `priority` | 'high' \| 'low' | 'low' | Loading priority (high = preload + eager) |
| `sizes` | string | '100vw' | Responsive sizes attribute |
| `objectFit` | string | 'cover' | CSS object-fit value |
| `blurColor` | string | 'rgb(229, 231, 235)' | Placeholder color |
| `className` | string | optional | Additional CSS classes |
| `onLoad` | function | optional | Callback when image loads |
| `onError` | function | optional | Callback on error |

## Image Optimization Script

Located at: `scripts/optimize-images.js`

Converts existing images in the `public` directory to WebP and AVIF formats.

### Running the Script

```bash
npm run optimize-images
```

### What It Does

1. Scans the `public` directory for JPG/PNG images
2. Generates WebP versions (80% quality)
3. Generates AVIF versions (70% quality, best compression)
4. Creates responsive sizes (640w, 750w, 828w, 1080w, 1200w, 1920w)
5. Preserves original images as fallbacks

### Output Example

For `hero-image.jpg`, the script generates:
- `hero-image.webp` (full size)
- `hero-image.avif` (full size)
- `hero-image-640w.webp`
- `hero-image-640w.avif`
- `hero-image-750w.webp`
- `hero-image-750w.avif`
- ... (and so on for each size)

## Vite Configuration

The `vite.config.ts` includes:

```typescript
{
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation-vendor': ['framer-motion'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  assetsInclude: ['**/*.webp', '**/*.avif'],
}
```

This ensures:
- WebP and AVIF files are recognized as assets
- Vendor code is split for better caching
- Chunk sizes are optimized

## Integration with Existing Components

### HeroBackground Component

Updated to use `OptimizedImage` with:
- High priority loading (above the fold)
- Full viewport width sizing
- Custom blur color matching brand

### DestinationResultCard Component

Updated to use `OptimizedImage` with:
- Low priority loading (lazy)
- Responsive sizing for mobile/desktop
- Smooth hover transitions

## Best Practices

### 1. Choose the Right Priority

```tsx
// Above-the-fold hero images
<OptimizedImage priority="high" ... />

// Below-the-fold content
<OptimizedImage priority="low" ... />
```

### 2. Specify Accurate Sizes

```tsx
// Full width on mobile, half width on desktop
sizes="(max-width: 768px) 100vw, 50vw"

// Fixed width card
sizes="320px"

// Responsive card
sizes="(max-width: 768px) 320px, 360px"
```

### 3. Use Appropriate Blur Colors

Match the blur color to the dominant color of your image for a smoother loading experience:

```tsx
// Purple-tinted image
blurColor="rgb(139, 92, 246)"

// Blue ocean image
blurColor="rgb(59, 130, 246)"

// Neutral gray
blurColor="rgb(229, 231, 235)"
```

### 4. Provide Meaningful Alt Text

```tsx
// ✅ Good
alt="Sunset over Santorini, Greece with white buildings"

// ❌ Bad
alt="Image"
alt="destination"
```

## Performance Metrics

### Expected Improvements

- **LCP (Largest Contentful Paint)**: 20-40% improvement
- **Bundle Size**: No increase (images loaded separately)
- **Image Size**: 30-50% reduction with WebP, 50-70% with AVIF
- **CLS (Cumulative Layout Shift)**: Eliminated with aspect ratio placeholders

### Monitoring

Use Lighthouse to track improvements:

```bash
npm run build
npm run preview
# Then run Lighthouse in Chrome DevTools
```

Target scores:
- Performance: >90
- LCP: <2.5s
- CLS: <0.1

## Browser Support

| Format | Support |
|--------|---------|
| AVIF | Chrome 85+, Firefox 93+, Safari 16+ |
| WebP | Chrome 23+, Firefox 65+, Safari 14+ |
| JPG/PNG | All browsers (fallback) |

The `OptimizedImage` component automatically serves the best format supported by the user's browser.

## Troubleshooting

### Images Not Loading

1. Check browser console for errors
2. Verify image URLs are accessible
3. Check network tab for failed requests
4. Ensure CORS headers are set for external images

### Poor Performance

1. Verify images are using `OptimizedImage` component
2. Check that `priority="high"` is only used for above-the-fold images
3. Run the optimization script on local images
4. Ensure CDN is serving WebP/AVIF formats

### Layout Shift Issues

1. Provide `width` and `height` props for aspect ratio
2. Use CSS to reserve space for images
3. Test on slow network connections

## Future Enhancements

- [ ] Automatic image optimization during build
- [ ] Integration with image CDN (Cloudinary, Imgix)
- [ ] Progressive image loading
- [ ] Art direction with different crops per breakpoint
- [ ] Automatic blur hash generation

## Resources

- [Web.dev Image Optimization](https://web.dev/fast/#optimize-your-images)
- [AVIF vs WebP](https://jakearchibald.com/2020/avif-has-landed/)
- [Responsive Images Guide](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
