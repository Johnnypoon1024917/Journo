# Documentation Quick Index

> Quick reference for finding documentation in the Journo Travel Platform

## 🚀 Getting Started

**New to the project?** Start here:
1. [Main Documentation](./DOCUMENTATION.md) - Complete overview
2. [Migration Guide](./MIGRATION_GUIDE.md) - Understanding the new structure
3. [Frontend Setup](./docs-consolidated/guides/FRONTEND_SETUP.md)
4. [Backend Setup](./docs-consolidated/guides/BACKEND_SETUP.md)

## 📖 Documentation by Topic

### Setup & Installation
- [Frontend Setup Guide](./docs-consolidated/guides/FRONTEND_SETUP.md) - React app setup
- [Backend Setup Guide](./docs-consolidated/guides/BACKEND_SETUP.md) - Node.js API setup
- [iOS Setup Guide](./docs-consolidated/guides/IOS_SETUP.md) - Capacitor iOS app
- [Testing Guide](./docs-consolidated/guides/TESTING.md) - Running tests

### Architecture
- [System Overview](./docs-consolidated/architecture/SYSTEM_OVERVIEW.md) - High-level architecture
- [Database Schema](./backend/DATABASE.md) - Database structure
- [API Documentation](./backend/README.md) - Backend API reference

### Features
- [Authentication System](./docs-consolidated/features/AUTHENTICATION.md) - JWT auth, sessions
- [Sticker System](./docs-consolidated/features/STICKER_SYSTEM.md) - Custom stickers
- [Offline Support](./docs-consolidated/features/OFFLINE_SUPPORT.md) - Offline-first architecture
- [Real-time Collaboration](./backend/src/services/SOCKET_README.md) - Socket.io integration
- [Internationalization](./frontend/src/i18n/README.md) - Multi-language support

### Component Documentation
- [Kawaii Components](./frontend/src/components/bubblequest/README.md) - UI components
- [Design System](./frontend/src/design-system/README.md) - Design tokens
- [Sticker Components](./frontend/src/components/stickers/README.md) - Sticker UI

### Development
- [Testing Guide](./docs-consolidated/guides/TESTING.md) - Unit, integration, E2E tests
- [Frontend README](./frontend/README.md) - Frontend development
- [Backend README](./backend/README.md) - Backend development

## 🔍 Finding Specific Information

### Authentication & Security
- Login/logout flow → [Authentication](./docs-consolidated/features/AUTHENTICATION.md)
- JWT tokens → [Authentication](./docs-consolidated/features/AUTHENTICATION.md)
- Permissions → [Authentication](./docs-consolidated/features/AUTHENTICATION.md)

### Data & State
- State management → [Frontend Setup](./docs-consolidated/guides/FRONTEND_SETUP.md)
- Database schema → [Backend Database](./backend/DATABASE.md)
- Offline storage → [Offline Support](./docs-consolidated/features/OFFLINE_SUPPORT.md)

### UI & Components
- Component library → [Kawaii Components](./frontend/src/components/bubblequest/README.md)
- Design system → [Design System](./frontend/src/design-system/README.md)
- Styling → [Frontend Setup](./docs-consolidated/guides/FRONTEND_SETUP.md)

### Mobile & iOS
- iOS setup → [iOS Setup Guide](./docs-consolidated/guides/IOS_SETUP.md)
- Capacitor → [iOS Setup Guide](./docs-consolidated/guides/IOS_SETUP.md)
- Native features → [iOS Services](./frontend/src/services/IOS_SERVICES_README.md)

### Testing & Quality
- Running tests → [Testing Guide](./docs-consolidated/guides/TESTING.md)
- Writing tests → [Testing Guide](./docs-consolidated/guides/TESTING.md)
- Test coverage → [Testing Guide](./docs-consolidated/guides/TESTING.md)

## 📁 File Locations

### Configuration Files
- Frontend env: `frontend/.env`
- Backend env: `backend/.env`
- Capacitor: `frontend/capacitor.config.ts`
- Vite: `frontend/vite.config.ts`

### Source Code
- Frontend components: `frontend/src/components/`
- Frontend pages: `frontend/src/pages/`
- Frontend stores: `frontend/src/stores/`
- Backend controllers: `backend/src/controllers/`
- Backend services: `backend/src/services/`
- Backend routes: `backend/src/routes/`

### Documentation
- Main docs: `DOCUMENTATION.md`
- Consolidated docs: `docs-consolidated/`
- Component docs: `frontend/src/components/*/README.md`
- Service docs: `backend/src/services/*_README.md`

## 🛠️ Common Tasks

### Setup Tasks
```bash
# Frontend setup
cd frontend && npm install && cp .env.example .env && npm run dev

# Backend setup
cd backend && npm install && cp .env.example .env && npm run migrate && npm run dev

# iOS setup
cd frontend && npm run build && npx cap sync ios && npx cap open ios
```

### Development Tasks
```bash
# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

### Documentation Tasks
```bash
# Search documentation
grep -r "search term" docs-consolidated/

# Archive old docs
./cleanup-docs.sh

# Restore archived docs
tar -xzf docs-archive-*.tar.gz
```

## 📊 Documentation Statistics

- **Total consolidated docs**: 9 files
- **Total lines**: ~3,100 lines
- **Categories**: 3 (architecture, features, guides)
- **Old docs archived**: 200+ files

## 🔄 Migration Information

The documentation was consolidated on **February 18, 2026**.

- Old scattered docs → Archived in `docs-archive-YYYYMMDD.tar.gz`
- New organized structure → `docs-consolidated/`
- Main reference → `DOCUMENTATION.md`

See [Migration Guide](./MIGRATION_GUIDE.md) for details.

## 💡 Tips

1. **Start with DOCUMENTATION.md** - It's the main reference
2. **Use search** - `grep -r "term" docs-consolidated/`
3. **Check component READMEs** - Many components have their own docs
4. **Review specs** - Detailed specs in `.kiro/specs/`
5. **Ask the team** - When docs aren't clear

## 🆘 Need Help?

1. Check [DOCUMENTATION.md](./DOCUMENTATION.md)
2. Search [docs-consolidated/](./docs-consolidated/)
3. Review component-specific README files
4. Check archived docs if needed
5. Ask team members

## 📝 Contributing to Documentation

When adding documentation:

1. **Feature docs** → `docs-consolidated/features/`
2. **How-to guides** → `docs-consolidated/guides/`
3. **Architecture** → `docs-consolidated/architecture/`
4. **Component docs** → Keep with component
5. **Update main docs** → Update `DOCUMENTATION.md` if needed

---

**Last Updated**: February 18, 2026
**Maintained By**: Development Team
