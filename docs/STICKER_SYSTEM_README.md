# Sticker System - Complete Implementation Guide

## 🎨 Overview

The sticker system allows users to:
- Upload custom stickers (images)
- Use predefined system stickers
- Attach stickers to places, days, or trips
- Position, rotate, and scale stickers
- Share public stickers with the community
- Manage their sticker collection

## 📁 Architecture

### Database Schema

```
stickers (user-uploaded custom stickers)
├── id (UUID)
├── user_id (UUID) → users.id
├── name (VARCHAR)
├── image_url (TEXT)
├── category (VARCHAR) - 'custom', 'emotions', 'activities', etc.
├── is_public (BOOLEAN)
├── usage_count (INTEGER)
├── file_size (INTEGER)
├── mime_type (VARCHAR)
└── timestamps

sticker_attachments (sticker placements)
├── id (UUID)
├── sticker_id (UUID) → stickers.id
├── user_id (UUID) → users.id
├── entity_type (VARCHAR) - 'place', 'trip_day', 'trip'
├── entity_id (UUID)
├── position_x (DECIMAL) - 0-100 percentage
├── position_y (DECIMAL) - 0-100 percentage
├── rotation (DECIMAL) - degrees
├── scale (DECIMAL) - 0.1-5.0
├── z_index (INTEGER)
└── timestamps

predefined_stickers (system stickers)
├── id (UUID)
├── name (VARCHAR)
├── image_url (TEXT)
├── category (VARCHAR)
├── tags (TEXT[])
├── is_active (BOOLEAN)
├── display_order (INTEGER)
└── timestamps
```

### API Endpoints

#### Sticker Management
```
POST   /api/stickers/upload              Upload custom sticker
GET    /api/stickers                     Get all stickers (custom + public + predefined)
GET    /api/stickers/predefined          Get system stickers only
GET    /api/stickers/:id                 Get single sticker
PUT    /api/stickers/:id                 Update sticker metadata
DELETE /api/stickers/:id                 Delete custom sticker
```

#### Sticker Attachments
```
POST   /api/stickers/attach              Attach sticker to entity
GET    /api/stickers/entity/:type/:id    Get stickers on entity
PUT    /api/stickers/attachment/:id      Update attachment position
DELETE /api/stickers/attachment/:id      Remove attachment
```

## 🚀 Quick Start

### 1. Upload a Custom Sticker

```typescript
import stickerService from '@/services/stickerService';

// From file input
const handleFileUpload = async (file: File) => {
  try {
    const sticker = await stickerService.uploadSticker(
      file,
      'My Cool Sticker',
      'custom',
      false // private
    );
    console.log('Uploaded:', sticker);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### 2. Get All Available Stickers

```typescript
const loadStickers = async () => {
  const { custom, public, predefined } = await stickerService.getStickers();
  
  // custom: User's own stickers
  // public: Other users' public stickers
  // predefined: System stickers (heart, star, etc.)
};
```

### 3. Attach Sticker to a Place

```typescript
const addStickerToPlace = async (stickerId: string, placeId: string) => {
  const attachment = await stickerService.attachSticker(
    stickerId,
    'place',
    placeId,
    {
      x: 75,        // 75% from left
      y: 25,        // 25% from top
      rotation: 15, // 15 degrees
      scale: 1.2,   // 120% size
      zIndex: 1     // Layer order
    }
  );
};
```

### 4. Display Stickers on an Entity

```typescript
const DisplayStickers = ({ dayId }: { dayId: string }) => {
  const [stickers, setStickers] = useState([]);

  useEffect(() => {
    stickerService.getEntityStickers('trip_day', dayId)
      .then(setStickers);
  }, [dayId]);

  return (
    <div className="relative">
      {stickers.map(attachment => (
        <img
          key={attachment.id}
          src={attachment.sticker_image_url}
          alt={attachment.sticker_name}
          style={{
            position: 'absolute',
            left: `${attachment.position_x}%`,
            top: `${attachment.position_y}%`,
            transform: `
              translate(-50%, -50%) 
              rotate(${attachment.rotation}deg) 
              scale(${attachment.scale})
            `,
            zIndex: attachment.z_index
          }}
        />
      ))}
    </div>
  );
};
```

### 5. Update Sticker Position (Drag & Drop)

```typescript
const handleStickerDrag = async (attachmentId: string, newX: number, newY: number) => {
  await stickerService.updateStickerAttachment(attachmentId, {
    x: newX,
    y: newY
  });
};
```

### 6. Remove Sticker

```typescript
const removeSticker = async (attachmentId: string) => {
  await stickerService.removeStickerAttachment(attachmentId);
};
```

## 🎯 Use Cases

### Use Case 1: Sticker Picker Modal

```typescript
const StickerPicker = ({ onSelect }: { onSelect: (stickerId: string) => void }) => {
  const [stickers, setStickers] = useState({ custom: [], public: [], predefined: [] });
  const [activeTab, setActiveTab] = useState('predefined');

  useEffect(() => {
    stickerService.getStickers().then(setStickers);
  }, []);

  return (
    <div className="sticker-picker">
      <div className="tabs">
        <button onClick={() => setActiveTab('predefined')}>Default</button>
        <button onClick={() => setActiveTab('custom')}>My Stickers</button>
        <button onClick={() => setActiveTab('public')}>Community</button>
      </div>

      <div className="sticker-grid">
        {stickers[activeTab].map(sticker => (
          <img
            key={sticker.id}
            src={sticker.image_url}
            onClick={() => onSelect(sticker.id)}
            className="cursor-pointer hover:scale-110"
          />
        ))}
      </div>

      <StickerUploadButton />
    </div>
  );
};
```

### Use Case 2: Drag & Drop Sticker Placement

```typescript
const DraggableSticker = ({ attachment, onUpdate }) => {
  const [position, setPosition] = useState({ x: attachment.position_x, y: attachment.position_y });
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = async () => {
    setIsDragging(false);
    await stickerService.updateStickerAttachment(attachment.id, position);
    onUpdate();
  };

  return (
    <Draggable
      position={{ x: position.x, y: position.y }}
      onDrag={(e, data) => setPosition({ x: data.x, y: data.y })}
      onStop={handleDragEnd}
    >
      <img
        src={attachment.sticker_image_url}
        className={isDragging ? 'dragging' : ''}
      />
    </Draggable>
  );
};
```

### Use Case 3: Sticker Management Dashboard

```typescript
const MyStickersDashboard = () => {
  const [myStickers, setMyStickers] = useState([]);

  const loadMyStickers = async () => {
    const { custom } = await stickerService.getStickers();
    setMyStickers(custom);
  };

  const deleteSticker = async (stickerId: string) => {
    await stickerService.deleteSticker(stickerId);
    loadMyStickers();
  };

  const togglePublic = async (sticker) => {
    await stickerService.updateSticker(sticker.id, {
      isPublic: !sticker.is_public
    });
    loadMyStickers();
  };

  return (
    <div className="stickers-dashboard">
      <h2>My Stickers ({myStickers.length})</h2>
      {myStickers.map(sticker => (
        <div key={sticker.id} className="sticker-card">
          <img src={sticker.image_url} />
          <div>
            <h3>{sticker.name}</h3>
            <p>Used {sticker.usage_count} times</p>
            <button onClick={() => togglePublic(sticker)}>
              {sticker.is_public ? 'Make Private' : 'Make Public'}
            </button>
            <button onClick={() => deleteSticker(sticker.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 🔒 Security & Permissions

### File Upload Validation
- Max file size: 2MB
- Allowed types: PNG, JPEG, GIF, SVG, WebP
- Base64 encoding for transfer
- Server-side validation

### Access Control
- Users can only delete their own stickers
- Public stickers visible to all
- Private stickers only visible to owner
- Attachment requires entity access (trip ownership/collaboration)

### Permission Checks
```sql
-- Check if user can attach sticker to entity
SELECT user_can_attach_sticker(user_id, entity_type, entity_id);

-- Returns true if:
-- - User owns the trip
-- - User is a collaborator on the trip
-- - Entity is public (for viewing only)
```

## 📊 Database Functions

### Increment Usage Count
```sql
SELECT increment_sticker_usage('sticker-uuid');
```

### Check Attachment Permission
```sql
SELECT user_can_attach_sticker('user-uuid', 'place', 'place-uuid');
```

## 🎨 Predefined Stickers

The system includes 10 default stickers:

| Sticker | Category | Tags |
|---------|----------|------|
| ❤️ Heart | emotions | love, favorite |
| ⭐ Star | emotions | favorite, highlight |
| 📷 Camera | activities | photo, memory |
| 🍜 Food | activities | restaurant, meal |
| ✈️ Plane | travel | flight, transport |
| 📍 Map Pin | travel | location, place |
| ☀️ Sun | weather | sunny, outdoor |
| 🌙 Moon | weather | night, evening |
| 👍 Thumbs Up | reactions | like, good |
| 🔥 Fire | reactions | hot, amazing |

## 🔧 Configuration

### Environment Variables
```env
# Storage configuration
STORAGE_TYPE=local
STORAGE_PATH=./uploads
MAX_FILE_SIZE=10485760

# For production, consider using MinIO or S3
# STORAGE_TYPE=minio
# MINIO_ENDPOINT=minio.example.com
# MINIO_ACCESS_KEY=your-access-key
# MINIO_SECRET_KEY=your-secret-key
```

### Storage Directory Structure
```
uploads/
├── stickers/
│   ├── 1234567890-abc123.png
│   ├── 1234567891-def456.jpg
│   └── ...
├── photos/
├── covers/
└── avatars/
```

## 🧪 Testing

### Test Upload
```bash
curl -X POST http://localhost:5000/api/stickers/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "file": "base64_encoded_image_data",
    "name": "Test Sticker",
    "category": "custom",
    "isPublic": false,
    "contentType": "image/png"
  }'
```

### Test Attachment
```bash
curl -X POST http://localhost:5000/api/stickers/attach \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stickerId": "sticker-uuid",
    "entityType": "place",
    "entityId": "place-uuid",
    "positionX": 50,
    "positionY": 50
  }'
```

## 📈 Future Enhancements

### Planned Features
- [ ] Sticker categories and tags
- [ ] Sticker search and filtering
- [ ] Sticker packs/collections
- [ ] Animated stickers (GIF support)
- [ ] Sticker templates
- [ ] Social features (like/share stickers)
- [ ] Sticker usage analytics
- [ ] Batch operations
- [ ] Sticker marketplace
- [ ] AI-generated stickers

### Performance Optimizations
- [ ] Image compression on upload
- [ ] CDN integration
- [ ] Lazy loading for sticker grids
- [ ] Caching frequently used stickers
- [ ] Thumbnail generation

## 🐛 Troubleshooting

### Upload Fails
- Check file size (max 2MB)
- Verify file type is supported
- Ensure user is authenticated
- Check storage directory permissions

### Stickers Not Displaying
- Verify image URL is accessible
- Check entity permissions
- Ensure sticker attachment exists
- Validate CSS positioning

### Permission Denied
- Verify user owns/collaborates on trip
- Check entity exists
- Ensure sticker is public or owned by user

## 📚 Related Documentation

- [Storage Service](backend/src/services/storageService.ts)
- [Sticker Controller](backend/src/controllers/stickerController.ts)
- [Sticker Service](frontend/src/services/stickerService.ts)
- [Database Migration](backend/src/migrations/027_sticker_system.sql)

## 🤝 Contributing

When adding sticker features:
1. Update database schema if needed
2. Add API endpoints to controller
3. Update frontend service
4. Add tests
5. Update documentation

## 📝 License

Part of the Journo application.
