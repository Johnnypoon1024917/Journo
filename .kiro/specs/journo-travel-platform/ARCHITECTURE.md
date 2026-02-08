# Journo Architecture Overview

## Self-Hosted Stack

Journo uses a **self-hosted architecture** with Docker deployment for maximum control, flexibility, and no vendor lock-in.

### Technology Stack

**Frontend:**
- React 18 + TypeScript + Vite
- Tailwind CSS + Headless UI + ShadCN
- Zustand for state management
- Socket.IO client for real-time features
- Capacitor for iOS/Android

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL 15+ (self-hosted)
- Prisma or TypeORM for database ORM
- JWT + bcrypt + Passport.js for authentication
- Socket.IO for WebSocket real-time features
- MinIO for S3-compatible object storage (or local filesystem)
- Redis for caching and sessions

**Deployment:**
- Docker + Docker Compose
- Nginx reverse proxy
- Let's Encrypt SSL certificates

### Key Differences from Supabase

| Feature | Supabase (Original) | Self-Hosted (Updated) |
|---------|---------------------|----------------------|
| **Database** | Supabase PostgreSQL | Local PostgreSQL in Docker |
| **Authentication** | Supabase Auth | JWT + bcrypt + Passport.js |
| **Real-time** | Supabase Realtime | Socket.IO WebSocket server |
| **Storage** | Supabase Storage | MinIO (S3-compatible) or local files |
| **API** | Auto-generated REST | Express REST API (custom) |
| **Deployment** | Supabase Cloud | Docker Compose (self-hosted) |
| **Cost** | Usage-based pricing | Infrastructure cost only |
| **Control** | Limited | Full control |

### Docker Services

The application runs as multiple Docker containers:

1. **postgres** - PostgreSQL 15 database
2. **redis** - Redis cache for sessions and rate limiting
3. **minio** - S3-compatible object storage for photos
4. **api** - Express backend API server
5. **web** - React frontend application
6. **nginx** - Reverse proxy and SSL termination

### Development Workflow

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Run migrations
docker-compose exec api npm run migrate

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### Production Deployment

1. Set up production server (VPS, AWS EC2, DigitalOcean, etc.)
2. Install Docker and Docker Compose
3. Clone repository and configure environment variables
4. Run `docker-compose -f docker-compose.prod.yml up -d`
5. Configure Nginx with SSL certificates
6. Set up automated backups for PostgreSQL and MinIO

### Benefits of Self-Hosted Architecture

✅ **Full Control** - Complete control over infrastructure and data
✅ **No Vendor Lock-in** - Can migrate to any hosting provider
✅ **Cost Effective** - Pay only for infrastructure, no per-user fees
✅ **Privacy** - All data stays on your servers
✅ **Customization** - Modify any part of the stack
✅ **Scalability** - Scale horizontally by adding more containers
✅ **Portability** - Docker ensures consistent environments

### API Structure

All backend endpoints follow RESTful conventions:

```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

GET    /api/trips
POST   /api/trips
GET    /api/trips/:id
PUT    /api/trips/:id
DELETE /api/trips/:id

POST   /api/trips/:id/days
PUT    /api/trips/:id/days/:dayId
DELETE /api/trips/:id/days/:dayId

POST   /api/trips/:id/places
PUT    /api/places/:id
DELETE /api/places/:id

POST   /api/trips/:id/story-items
GET    /api/trips/:id/story-items

POST   /api/trips/:id/packing-list
PUT    /api/packing-list/:id
DELETE /api/packing-list/:id

POST   /api/upload/photo
POST   /api/upload/cover

GET    /api/community/trips
POST   /api/trips/:id/like
DELETE /api/trips/:id/like

GET    /api/admin/metrics
GET    /api/admin/users
POST   /api/admin/moderate

POST   /api/analytics/events
POST   /api/scrape/locations
```

### Real-Time Events (Socket.IO)

```javascript
// Client subscribes to trip room
socket.emit('join-trip', { tripId: '123' });

// Server emits updates
socket.to(tripId).emit('trip-updated', { trip });
socket.to(tripId).emit('place-added', { place });
socket.to(tripId).emit('story-item-added', { item });
socket.to(tripId).emit('packing-item-checked', { itemId });

// Presence tracking
socket.to(tripId).emit('user-joined', { user });
socket.to(tripId).emit('user-left', { userId });
```

This architecture provides a robust, scalable, and fully self-hosted solution for the Journo platform.
