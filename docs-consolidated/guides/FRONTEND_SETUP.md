# Frontend Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)

## Initial Setup

### 1. Clone and Install

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Configure the following variables in `.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000

# Feature Flags
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_PWA=true

# Analytics (optional)
VITE_ANALYTICS_ID=

# Map API Keys (optional)
VITE_GOOGLE_MAPS_API_KEY=
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── kawaii/     # Kawaii-themed components
│   │   ├── stickers/   # Sticker system
│   │   └── common/     # Shared components
│   ├── pages/          # Page components
│   ├── stores/         # Zustand state stores
│   ├── services/       # API and service clients
│   ├── utils/          # Utility functions
│   ├── i18n/           # Internationalization
│   ├── styles/         # Global styles
│   └── types/          # TypeScript types
├── .env                # Environment variables
└── vite.config.ts      # Vite configuration
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Key Technologies

### React + TypeScript
- Functional components with hooks
- TypeScript for type safety
- Strict mode enabled

### Vite
- Fast HMR (Hot Module Replacement)
- Optimized builds
- Plugin ecosystem

### Zustand
- Lightweight state management
- No boilerplate
- DevTools support

### React Router
- Client-side routing
- Protected routes
- Lazy loading

### Axios
- HTTP client
- Interceptors for auth
- Error handling

### i18next
- Internationalization
- 9 languages supported
- Dynamic language switching

## Common Tasks

### Adding a New Page

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link if needed
4. Add translations in `src/i18n/locales/`

### Adding a New Component

1. Create component in appropriate directory
2. Export from index file
3. Add TypeScript types
4. Write tests
5. Document usage

### Adding a New Store

1. Create store in `src/stores/`
2. Define state interface
3. Implement actions
4. Add persistence if needed
5. Use in components

### Adding Translations

1. Add keys to `src/i18n/locales/en/translation.json`
2. Translate to other languages
3. Use with `useTranslation()` hook
4. Test language switching

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Type Errors
```bash
# Regenerate types
npm run type-check
```

## Environment-Specific Configuration

### Development
- Hot reload enabled
- Source maps
- Verbose logging
- Mock data available

### Production
- Minified code
- Tree shaking
- Code splitting
- Service worker enabled

### iOS (Capacitor)
- Native bridge available
- Platform-specific APIs
- Different base URL handling

## Performance Tips

1. Use React.memo for expensive components
2. Implement virtual scrolling for long lists
3. Lazy load routes and components
4. Optimize images (WebP format)
5. Use service worker for caching
6. Monitor bundle size

## Debugging

### React DevTools
- Install browser extension
- Inspect component tree
- View props and state
- Profile performance

### Redux DevTools (Zustand)
- Enable in store configuration
- Time-travel debugging
- Action history

### Network Tab
- Monitor API calls
- Check request/response
- Verify headers
- Debug CORS issues

## Next Steps

- [iOS Setup Guide](./IOS_SETUP.md)
- [Testing Guide](./TESTING.md)
- [Component Documentation](../features/COMPONENTS.md)
- [State Management](../features/STATE_MANAGEMENT.md)
