# Media Handling Components

This document describes the media handling components for the Community Threads Feed feature.

## Components

### MediaCarousel

A swipeable carousel component for displaying multiple media items within a post.

**Features:**
- Swipe gestures for mobile navigation
- Click navigation buttons for desktop
- Keyboard navigation (arrow keys)
- Pagination dots showing current position
- Image counter overlay
- Click to open in lightbox
- Graceful error handling for failed image loads
- Accessibility compliant (ARIA labels, keyboard support)

**Props:**
```typescript
interface MediaCarouselProps {
  mediaUrls: string[];           // Array of media URLs to display
  onMediaClick?: (index: number) => void;  // Callback when media is clicked
}
```

**Usage:**
```tsx
import { MediaCarousel } from '@/components/community/MediaCarousel';

<MediaCarousel 
  mediaUrls={post.mediaUrls} 
  onMediaClick={(index) => openLightbox(index)}
/>
```

**Behavior:**
- Single image: Displays without carousel controls
- Multiple images: Shows carousel with navigation buttons and pagination dots
- Touch support: Swipe left/right to navigate on mobile
- Keyboard support: Arrow keys to navigate
- Error handling: Shows placeholder image if load fails

**Requirements Validated:**
- 19.1: Media carousel rendering for multiple items
- 19.2: Pagination dots indicating position
- 19.3: Click to open lightbox

---

### MediaLightbox

A fullscreen lightbox component for viewing media in detail.

**Features:**
- Fullscreen overlay with dark backdrop
- Close button and ESC key support
- Navigation between multiple images
- Swipe gestures for mobile
- Keyboard navigation (arrow keys, ESC)
- Pagination dots
- Image counter
- Prevents body scroll when open
- Click backdrop to close
- Accessibility compliant

**Props:**
```typescript
interface MediaLightboxProps {
  mediaUrls: string[];           // Array of media URLs to display
  initialIndex?: number;         // Starting index (default: 0)
  onClose: () => void;           // Callback when lightbox is closed
}
```

**Usage:**
```tsx
import { MediaLightbox } from '@/components/community/MediaLightbox';

{lightboxOpen && (
  <MediaLightbox
    mediaUrls={post.mediaUrls}
    initialIndex={selectedIndex}
    onClose={() => setLightboxOpen(false)}
  />
)}
```

**Behavior:**
- Opens in fullscreen overlay
- Prevents body scroll while open
- Close via: X button, ESC key, or clicking backdrop
- Navigate via: Arrow buttons, arrow keys, or swipe gestures
- Wraps around at start/end of media array
- Renders in portal to ensure proper z-index

**Requirements Validated:**
- 19.3: Fullscreen lightbox view
- 19.4: Close with X button and ESC key

---

## Integration Example

Here's how the components work together in the ThreadCard:

```tsx
import { MediaCarousel } from './MediaCarousel';
import { MediaLightbox } from './MediaLightbox';

function ThreadCard({ post }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleMediaClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <article>
      {/* Post content */}
      
      {/* Media Carousel */}
      {post.mediaUrls.length > 0 && (
        <MediaCarousel 
          mediaUrls={post.mediaUrls} 
          onMediaClick={handleMediaClick} 
        />
      )}

      {/* Media Lightbox */}
      {lightboxOpen && (
        <MediaLightbox
          mediaUrls={post.mediaUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </article>
  );
}
```

---

## Accessibility Features

Both components are fully accessible:

### Keyboard Navigation
- **Tab**: Focus interactive elements
- **Arrow Left/Right**: Navigate between images
- **Enter/Space**: Activate focused element
- **ESC**: Close lightbox

### Screen Reader Support
- Proper ARIA labels on all interactive elements
- ARIA roles for carousel and dialog
- Live regions for dynamic content updates
- Descriptive alt text for images

### Focus Management
- Visible focus indicators on all interactive elements
- Focus trap in lightbox (prevents tabbing to background)
- Focus restoration when lightbox closes

---

## Testing

Both components have comprehensive unit tests:

### MediaCarousel Tests
- Renders single image without controls
- Renders carousel with navigation for multiple images
- Navigation buttons work correctly
- Pagination dots work correctly
- Keyboard navigation works
- Touch gestures work
- Error handling for failed image loads
- Accessibility attributes present

### MediaLightbox Tests
- Opens in fullscreen
- Prevents body scroll
- Close button works
- ESC key closes lightbox
- Backdrop click closes lightbox
- Navigation buttons work
- Keyboard navigation works
- Touch gestures work
- Starts at correct initial index
- Error handling for failed image loads

Run tests:
```bash
npm test -- MediaCarousel.test.tsx MediaLightbox.test.tsx
```

---

## Performance Considerations

### Image Loading
- Images are loaded on-demand
- Error handling prevents broken image display
- Placeholder shown for failed loads

### Touch Gestures
- Minimum swipe distance prevents accidental navigation
- Touch state properly cleaned up after gesture

### Body Scroll Lock
- Prevents background scrolling when lightbox open
- Properly restored when lightbox closes

### Portal Rendering
- Lightbox rendered in portal for proper z-index
- Ensures lightbox appears above all other content

---

## Browser Support

Both components support:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Touch and mouse input
- Keyboard navigation
- Screen readers

---

## Future Enhancements

Potential improvements for future iterations:

1. **Video Support**: Add support for video media
2. **Zoom**: Pinch-to-zoom in lightbox
3. **Download**: Option to download media
4. **Share**: Share individual media items
5. **Captions**: Support for image captions
6. **Thumbnails**: Thumbnail strip in lightbox
7. **Lazy Loading**: Lazy load images outside viewport
8. **Preloading**: Preload adjacent images in carousel

---

## Related Components

- **ThreadCard**: Uses MediaCarousel to display post media
- **CommunityComposer**: Allows uploading media for posts
- **TripEmbed**: May include media from trip itineraries
