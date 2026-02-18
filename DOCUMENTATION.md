# Journo Travel Platform - Complete Documentation

> Consolidated documentation for the Journo Travel Platform
> Last Updated: February 18, 2026

> **Note**: Additional documentation is available in the `/docs` folder, including architecture guides, feature documentation, and setup guides.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Features](#features)
5. [Development Guide](#development-guide)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Project Overview

Journo is a collaborative travel planning platform with real-time features, offline support, and a bubblequest-themed UI.

### Tech Stack
- **Frontend**: React, TypeScript, Vite, Capacitor (iOS)
- **Backend**: Node.js, Express, PostgreSQL
- **Real-time**: Socket.io
- **Styling**: Custom design system with BubbleQuest theme
- **i18n**: Multi-language support

### Key Features
- Real-time collaboration
- Offline-first architecture
- Trip planning and scheduling
- Budget tracking
- Activity management
- Custom sticker system
- Multi-language support
- iOS mobile app

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (optional)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure database in .env
npm run migrate
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure API endpoint in .env
npm run dev
```

### iOS Setup
```bash
cd frontend
npm run build
npx cap sync ios
npx cap open ios
```

---

## Architecture

### System Design
- **Frontend**: React SPA with PWA capabilities
- **Backend**: RESTful API + WebSocket server
- **Database**: PostgreSQL with migration system
- **Real-time**: Socket.io for live collaboration
- **Offline**: IndexedDB + service workers

### Key Patterns
- Zustand for state management
- Optimistic UI updates
- Conflict resolution for offline sync
- Component-based design system

---

## Features

### Authentication & Authorization
- JWT-based authentication
- Refresh token rotation
- Session management
- Role-based permissions

### Trip Management
- Create and manage trips
- Invite collaborators
- Real-time updates
- Per-trip theming

### Schedule & Activities
- Day-by-day planning
- Activity creation and reordering
- Time calculations
- Route optimization
- Custom stickers

### Budget Tracking
- Expense management
- Category-based budgeting
- Multi-currency support
- Shared expenses

### Collaboration
- Real-time presence
- Activity logging
- Notifications
- Invitation system

### Offline Support
- Offline-first architecture
- Automatic sync on reconnection
- Conflict resolution
- Storage management

### Internationalization
- Multi-language support (EN, ES, FR, DE, IT, PT, JA, KO, ZH)
- Locale-specific formatting
- RTL support
- Dynamic translations

### Accessibility
- WCAG 2.1 AA compliance efforts
- Keyboard navigation
- Screen reader support
- Reduced motion support
- Dynamic type support

---

## Development Guide

### Project Structure
```
/backend
  /src
    /controllers  - Request handlers
    /services     - Business logic
    /middleware   - Auth, validation
    /routes       - API routes
    /migrations   - Database migrations
    
/frontend
  /src
    /components   - React components
    /pages        - Page components
    /stores       - Zustand stores
    /services     - API clients
    /utils        - Utilities
    /i18n         - Translations
```

### Design System
Located in `/frontend/src/design-system` and `/frontend/src/components/bubblequest`

Key components:
- Buttons, inputs, cards
- Layout components
- Navigation
- Modals and overlays
- Sticker system

### State Management
- **authStore**: Authentication state
- **tripStore**: Trip data
- **activityStore**: Activities
- **budgetStore**: Budget data
- **notificationStore**: Notifications
- **offlineStore**: Offline queue

### API Integration
- Base URL configuration in `.env`
- Axios interceptors for auth
- Error handling
- Retry logic

---

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Credentials
- Email: test@example.com
- Password: Test123!

---

## Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Production Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
```

### iOS App Store
See `.kiro/specs/ios-app-store-preparation/` for detailed preparation steps.

---

## Troubleshooting

### Common Issues

#### Authentication Errors
- Check JWT token expiration
- Verify refresh token rotation
- Clear browser storage and retry

#### Database Connection
- Verify PostgreSQL is running
- Check connection string in `.env`
- Run migrations: `npm run migrate`

#### iOS Connection Issues
- Ensure backend URL is accessible from device
- Check CORS configuration
- Verify SSL certificates for HTTPS

#### Offline Sync Conflicts
- Check conflict resolution logs
- Verify IndexedDB storage
- Clear offline queue if needed

#### Sticker System Issues
- Verify foreign key constraints
- Check attachment table
- Ensure proper permissions

### Debug Tools
- Browser DevTools
- React DevTools
- Redux DevTools (for Zustand)
- Network tab for API calls
- Console for errors

---

## Additional Resources

### Specifications
Detailed specs available in `.kiro/specs/`:
- Budget page implementation
- Collaboration enhancements
- Enhanced authentication
- iOS app store preparation
- BubbleQuest UI redesign

### Component Documentation
See individual component README files in:
- `/frontend/src/components/bubblequest/`
- `/frontend/src/components/stickers/`
- `/frontend/src/design-system/`

### Service Documentation
See service README files in:
- `/frontend/src/services/`
- `/backend/src/services/`

---

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Submit pull requests with clear descriptions

## License

[Add license information]

## Support

For issues and questions, please refer to the troubleshooting section or create an issue in the repository.
