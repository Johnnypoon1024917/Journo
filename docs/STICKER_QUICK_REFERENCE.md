# Sticker System - Quick Reference Card

## 🚀 Quick Start

### Upload a Sticker
```typescript
const sticker = await stickerService.uploadSticker(file, 'Name', 'custom', false);
```

### Get All Stickers
```typescript
const { custom, public, predefined } = await stickerService.getStickers();
```

### Attach to Entity
```typescript
await stickerService.attachSticker(stickerId, 'place', placeId, { x: 50, y: 50 });
```

### Get Entity Stickers
```typescript
const stickers = await stickerService.getEntityStickers('trip_day', dayId);
```

### Update Position
```typescript
await stickerService.updateStickerAttachment(attachmentId, { x: 60, y: 40, rotation: 15 });
```

### Remove Sticker
```typescript
await stickerService.removeStickerAttachment(attachmentId);
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stickers/upload` | Upload custom sticker |
| GET | `/api/stickers` | Get all stickers |
| GET | `/api/stickers/predefined` | Get system stickers |
| GET | `/api/stickers/:id` | Get single sticker |
| PUT | `/api/stickers/:id` | Update sticker |
| DELETE | `/api/stickers/:id` | Delete sticker |
| POST | `/api/stickers/attach` | Attach to entity |
| GET | `/api/stickers/entity/:type/:id` | Get entity stickers |
| PUT | `/api/stickers/attachment/:id` | Update attachment |
| DELETE | `/api/stickers/attachment/:id` | Remove attachment |

## 🎨 Entity Types

- `place` - Individual activity/place
- `trip_day` - Entire day card
- `trip` - Trip overview

## 📏 Position System

```typescript
{
  x: 50,        // 0-100 (percentage from left)
  y: 50,        // 0-100 (percentage from top)
  rotation: 0,  // degrees
  scale: 1.0,   // 0.1-5.0
  zIndex: 0     // layer order
}
```

## 🔒 File Requirements

- **Max Size:** 2MB
- **Types:** PNG, JPEG, GIF, SVG, WebP
- **Recommended:** 128x128 to 512x512 pixels

## 🎯 Predefined Stickers

| Icon | Name | Category |
|------|------|----------|
| ❤️ | Heart | emotions |
| ⭐ | Star | emotions |
| 📷 | Camera | activities |
| 🍜 | Food | activities |
| ✈️ | Plane | travel |
| 📍 | Map Pin | travel |
| ☀️ | Sun | weather |
| 🌙 | Moon | weather |
| 👍 | Thumbs Up | reactions |
| 🔥 | Fire | reactions |

## 💾 Database Tables

```sql
stickers              -- User-uploaded stickers
sticker_attachments   -- Sticker placements
predefined_stickers   -- System stickers
```

## 🔐 Permissions

- Upload: Authenticated users
- Attach: Trip owner or collaborator
- View: Public stickers or own stickers
- Delete: Own stickers only

## 📦 Import

```typescript
import stickerService from '@/services/stickerService';
```

## 🎨 Display Example

```tsx
<img
  src={attachment.sticker_image_url}
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
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Upload fails | Check file size (<2MB) and type |
| Permission denied | Verify trip access |
| Sticker not showing | Check entity_id and entity_type |
| Position wrong | Use percentage (0-100) not pixels |

## 📚 Documentation

- Full Guide: `STICKER_SYSTEM_README.md`
- Implementation: `STICKER_SYSTEM_COMPLETE.md`
- Summary: `STICKER_IMPLEMENTATION_SUMMARY.md`

## 🔗 Related Files

- Backend Controller: `backend/src/controllers/stickerController.ts`
- Backend Routes: `backend/src/routes/stickers.ts`
- Frontend Service: `frontend/src/services/stickerService.ts`
- Example Component: `frontend/src/components/kawaii/StickerUploadExample.tsx`
- Database Migration: `backend/src/migrations/027_sticker_system.sql`
