# Sticker System

## Overview

Custom sticker system allowing users to add, position, resize, and customize stickers on activities and schedule views.

## Features

- Upload custom stickers (images)
- Pre-defined sticker library
- Drag and drop positioning
- Resize with corner handles
- Rotation support
- Persistence across sessions
- Real-time sync with collaborators

## Architecture

### Frontend Components

**StickerCanvas** (`frontend/src/components/stickers/StickerCanvas.tsx`)
- Main container for sticker interaction
- Handles drag, resize, rotate
- Manages sticker state

**StickerPicker** (`frontend/src/components/stickers/StickerPicker.tsx`)
- Sticker selection UI
- Upload interface
- Library browser

**Sticker** (`frontend/src/components/stickers/Sticker.tsx`)
- Individual sticker component
- Interaction handlers
- Visual rendering

### Backend

**Database Schema**
```sql
CREATE TABLE sticker_attachments (
  id UUID PRIMARY KEY,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  sticker_url TEXT NOT NULL,
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  scale FLOAT DEFAULT 1.0,
  rotation FLOAT DEFAULT 0,
  z_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints**
- POST /api/stickers/upload - Upload custom sticker
- POST /api/activities/:id/stickers - Attach sticker to activity
- PUT /api/stickers/:id - Update sticker properties
- DELETE /api/stickers/:id - Remove sticker

## Usage

### Adding a Sticker

```typescript
import { StickerCanvas, StickerPicker } from '@/components/stickers';

function ActivityView() {
  const [stickers, setStickers] = useState([]);
  
  const handleAddSticker = async (stickerUrl: string) => {
    const newSticker = {
      id: uuid(),
      activityId: activity.id,
      stickerUrl,
      positionX: 50,
      positionY: 50,
      scale: 1.0,
      rotation: 0,
      zIndex: stickers.length
    };
    
    await api.post(`/activities/${activity.id}/stickers`, newSticker);
    setStickers([...stickers, newSticker]);
  };
  
  return (
    <>
      <StickerCanvas stickers={stickers} onUpdate={handleUpdate} />
      <StickerPicker onSelect={handleAddSticker} />
    </>
  );
}
```

### Updating Sticker Position

```typescript
const handleStickerUpdate = async (stickerId: string, updates: Partial<Sticker>) => {
  await api.put(`/stickers/${stickerId}`, updates);
  
  setStickers(prev => 
    prev.map(s => s.id === stickerId ? { ...s, ...updates } : s)
  );
};
```

### Uploading Custom Sticker

```typescript
const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('sticker', file);
  
  const response = await api.post('/stickers/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return response.data.url;
};
```

## Interaction Patterns

### Drag and Drop

1. User long-presses sticker (mobile) or clicks (desktop)
2. Sticker enters drag mode
3. User moves finger/mouse
4. Sticker position updates in real-time
5. On release, position saved to backend

### Resize

1. User taps/clicks corner handle
2. Drag handle to resize
3. Maintain aspect ratio
4. Update scale property
5. Save to backend

### Rotation

1. User taps/clicks rotation handle
2. Drag in circular motion
3. Calculate angle from center
4. Update rotation property
5. Save to backend

## Real-Time Sync

### Socket Events

```typescript
// Sticker added
socket.on('sticker:added', (sticker) => {
  setStickers(prev => [...prev, sticker]);
});

// Sticker updated
socket.on('sticker:updated', ({ id, updates }) => {
  setStickers(prev => 
    prev.map(s => s.id === id ? { ...s, ...updates } : s)
  );
});

// Sticker removed
socket.on('sticker:removed', (stickerId) => {
  setStickers(prev => prev.filter(s => s.id !== stickerId));
});
```

## File Upload

### Constraints

- Max file size: 5MB
- Allowed formats: PNG, JPG, GIF, WebP
- Recommended size: 512x512px
- Transparent backgrounds supported

### Processing

1. Client validates file
2. Upload to backend
3. Backend validates and processes
4. Store in cloud storage (S3/similar)
5. Return public URL
6. Save URL in database

## Performance Optimization

### Image Optimization

- Compress uploaded images
- Generate thumbnails
- Use WebP format when supported
- Lazy load stickers

### Rendering

- Use CSS transforms for positioning
- Hardware acceleration with `will-change`
- Debounce position updates
- Batch database updates

### Caching

- Cache sticker library
- Store recent stickers locally
- Prefetch common stickers

## Accessibility

- Keyboard navigation support
- Screen reader announcements
- Focus management
- Alternative text for stickers

## Troubleshooting

### Stickers Not Appearing

1. Check database foreign key constraints
2. Verify activity_id exists
3. Check sticker URL is accessible
4. Verify z-index ordering

### Position Not Saving

1. Check API endpoint response
2. Verify authentication
3. Check database constraints
4. Review error logs

### Upload Failing

1. Check file size limit
2. Verify file format
3. Check storage permissions
4. Review backend logs

## Future Enhancements

- Sticker categories and tags
- Animated stickers (GIF support)
- Sticker packs
- Collaborative sticker editing
- Sticker templates
- AI-generated stickers
