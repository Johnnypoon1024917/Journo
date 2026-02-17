# System Architecture Overview

## High-Level Architecture

```
┌─────────────────┐
│   iOS App       │
│   (Capacitor)   │
└────────┬────────┘
         │
┌────────▼────────┐      ┌──────────────┐
│   React SPA     │◄────►│  Socket.io   │
│   (Frontend)    │      │  (Real-time) │
└────────┬────────┘      └──────┬───────┘
         │                      │
         │  REST API            │
         │                      │
┌────────▼──────────────────────▼───┐
│      Express Backend              │
│   (Node.js + TypeScript)          │
└────────┬──────────────────────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │
│   (Database)    │
└─────────────────┘
```

## Frontend Architecture

### Component Hierarchy
- **Pages**: Top-level route components
- **Organisms**: Complex composed components
- **Molecules**: Multi-element components
- **Atoms**: Basic building blocks

### State Management (Zustand)
- authStore - Authentication & user state
- tripStore - Trip data & operations
- activityStore - Activity management
- budgetStore - Budget tracking
- notificationStore - Notifications
- offlineStore - Offline queue & sync

### Services Layer
- API clients (axios-based)
- Socket.io client
- Offline manager
- PWA manager
- Analytics

## Backend Architecture

### Layers
1. **Routes**: Express route definitions
2. **Controllers**: Request/response handling
3. **Services**: Business logic
4. **Middleware**: Auth, validation, logging
5. **Database**: PostgreSQL with migrations

### Key Services
- Authentication service
- Trip management service
- Activity service
- Budget service
- Notification service
- Socket service
- Email service

## Database Schema

### Core Tables
- users
- trips
- trip_members
- activities
- places
- budgets
- notifications
- user_sessions
- sticker_attachments

### Relationships
- Users ↔ Trips (many-to-many via trip_members)
- Trips → Activities (one-to-many)
- Activities → Places (one-to-many)
- Activities → Stickers (one-to-many)

## Real-Time Communication

### Socket.io Events
- trip:join / trip:leave
- activity:created / activity:updated / activity:deleted
- member:joined / member:left
- notification:new
- presence:update

## Offline Support

### Strategy
1. **Optimistic UI**: Immediate local updates
2. **Queue**: Store operations in IndexedDB
3. **Sync**: Replay queue on reconnection
4. **Conflict Resolution**: Last-write-wins with timestamps

### Storage
- IndexedDB for offline data
- Service Worker for asset caching
- LocalStorage for preferences

## Security

### Authentication Flow
1. Login → JWT access token (15min) + refresh token (7d)
2. Access token in memory
3. Refresh token in httpOnly cookie
4. Auto-refresh before expiration
5. Logout clears all tokens

### Authorization
- Role-based access control (RBAC)
- Trip-level permissions (owner, editor, viewer)
- Middleware validation on all protected routes

## Deployment Architecture

### Production Setup
```
┌──────────────┐
│   Nginx      │ (Reverse proxy, SSL)
└──────┬───────┘
       │
┌──────▼───────┐
│   Frontend   │ (Static files)
│   (Vite)     │
└──────────────┘

┌──────────────┐
│   Backend    │ (Node.js process)
│   (Express)  │
└──────┬───────┘
       │
┌──────▼───────┐
│  PostgreSQL  │ (Database)
└──────────────┘
```

### Docker Deployment
- Multi-container setup with docker-compose
- Separate containers for frontend, backend, database
- Volume mounts for persistence
- Network isolation

## Performance Considerations

### Frontend
- Code splitting by route
- Lazy loading components
- Image optimization
- Service worker caching
- Virtual scrolling for long lists

### Backend
- Database connection pooling
- Query optimization with indexes
- Caching layer (Redis optional)
- Rate limiting
- Compression middleware

## Monitoring & Logging

### Frontend
- Error boundary for React errors
- Analytics tracking
- Performance monitoring
- Console logging (dev only)

### Backend
- Winston logger
- Request logging
- Error tracking
- Health check endpoints

## Scalability

### Horizontal Scaling
- Stateless backend design
- Session storage in database
- Socket.io with Redis adapter (future)
- Load balancer ready

### Database Scaling
- Read replicas (future)
- Connection pooling
- Query optimization
- Proper indexing
