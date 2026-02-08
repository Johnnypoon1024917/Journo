# Progressive Web App (PWA) Implementation

This document describes the PWA implementation for the Journo travel planning platform.

## Overview

Journo is now a fully functional Progressive Web App that can be installed on devices and works offline. The PWA implementation includes:

- **Web App Manifest**: Defines app metadata, icons, and installation behavior
- **Service Worker**: Handles offline caching and background sync
- **Install Prompt**: Custom UI for prompting users to install the app
- **Update Notifications**: Alerts users when a new version is available
- **Offline Status**: Visual indicators for network connectivity

## Features

### 1. Installable App

Users can install Journo as a standalone app on their devices:

- **Desktop**: Install via browser's install button or custom prompt
- **Android**: Add to home screen with full app experience
- **iOS**: Add to home screen (manual process via Safari share menu)

### 2. Offline Functionality

The app works offline with intelligent caching strategies:

- **Static Assets**: HTML, CSS, JS files cached for instant loading
- **Images**: Cached with CacheFirst strategy for fast display
- **API Responses**: NetworkFirst strategy with fallback to cache
- **Google Maps**: StaleWhileRevalidate for map tiles
- **Fonts**: Cached for 1 year

### 3. Background Sync

Changes made offline are automatically synced when connection is restored:

- Trip edits
- Place additions
- Photo uploads (queued for background processing)
- Packing list updates

### 4. Push Notifications (Future)

Infrastructure is in place for push notifications:

- Trip collaboration updates
- Community engagement
- Travel reminders

## File Structure

```
frontend/
├── public/
│   ├── manifest.json              # Web app manifest
│   ├── browserconfig.xml          # Windows tile configuration
│   ├── icons/                     # App icons (16x16 to 512x512)
│   │   ├── icon-16x16.png
│   │   ├── icon-32x32.png
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   └── screenshots/               # App screenshots for stores
│       ├── desktop-home.png
│       └── mobile-trip.png
├── src/
│   ├── components/common/
│   │   ├── PWAInstallPrompt.tsx   # Custom install prompt
│   │   ├── PWAUpdateNotification.tsx  # Update notification
│   │   └── OfflineStatus.tsx      # Offline indicator
│   └── services/
│       └── pwaService.ts          # PWA management service
├── vite.config.ts                 # Vite PWA plugin configuration
└── generate-icons.js              # Icon generation script
```

## Configuration

### Vite PWA Plugin

The PWA is configured in `vite.config.ts` using the `vite-plugin-pwa` plugin:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      // API caching
      {
        urlPattern: /^https:\/\/api\.journo\.app\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 // 24 hours
          }
        }
      },
      // Image caching
      {
        urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
          }
        }
      }
    ]
  }
})
```

### Manifest Configuration

The web app manifest (`public/manifest.json`) defines:

- **App Name**: "Journo - Travel Planning & Sharing"
- **Display Mode**: standalone (full-screen app experience)
- **Theme Color**: #3b82f6 (blue)
- **Background Color**: #ffffff (white)
- **Icons**: 8 sizes from 72x72 to 512x512
- **Shortcuts**: Quick actions for creating trips and viewing community

## Usage

### For Users

#### Installing the App

**Desktop (Chrome, Edge, Brave)**:
1. Visit the Journo website
2. Look for the install icon in the address bar
3. Click "Install" in the prompt
4. The app will open in a standalone window

**Android**:
1. Visit the Journo website in Chrome
2. Tap the "Install" button in the custom prompt
3. Or tap the menu (⋮) and select "Add to Home screen"
4. The app will appear on your home screen

**iOS (Safari)**:
1. Visit the Journo website in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to install

#### Using Offline

1. Install the app or visit while online
2. The app will cache necessary resources
3. When offline, you'll see an "Offline" indicator
4. Continue using the app - changes will sync when online

### For Developers

#### Building the PWA

```bash
cd frontend
npm run build
```

The build process will:
1. Compile TypeScript
2. Bundle assets with Vite
3. Generate service worker
4. Create PWA manifest
5. Output to `dist/` directory

#### Testing PWA Locally

```bash
npm run build
npm run preview
```

Then open Chrome DevTools:
1. Go to Application tab
2. Check "Service Workers" section
3. Verify "Manifest" section
4. Test offline mode in Network tab

#### Generating Icons

To regenerate app icons:

```bash
node generate-icons.js
```

This creates PNG icons from SVG templates in all required sizes.

## Components

### PWAInstallPrompt

Custom install prompt that appears when the app can be installed:

```typescript
import PWAInstallPrompt from '@/components/common/PWAInstallPrompt';

// Used in App.tsx
<PWAInstallPrompt />
```

Features:
- Detects if app is installable
- Shows custom UI with app benefits
- Remembers if user dismissed
- Handles install flow

### PWAUpdateNotification

Notifies users when a new version is available:

```typescript
import PWAUpdateNotification from '@/components/common/PWAUpdateNotification';

// Used in App.tsx
<PWAUpdateNotification />
```

Features:
- Detects service worker updates
- Shows update prompt
- Handles app reload
- Shows offline-ready notification

### OfflineStatus

Visual indicator for network connectivity:

```typescript
import OfflineStatus from '@/components/common/OfflineStatus';

// Used in App.tsx
<OfflineStatus />
```

Features:
- Monitors online/offline status
- Shows banner when offline
- Shows confirmation when back online
- Auto-hides after 3 seconds

### PWA Service

Programmatic API for PWA features:

```typescript
import { pwaService } from '@/services/pwaService';

// Check if app can be installed
if (pwaService.canInstall()) {
  // Show custom install UI
}

// Check if app is already installed
if (pwaService.isInstalled()) {
  // Hide install prompts
}

// Trigger install
const outcome = await pwaService.install();
// outcome: 'accepted' | 'dismissed' | 'unavailable'

// Get device type
const device = pwaService.getDeviceType();
// device: 'ios' | 'android' | 'desktop'

// Subscribe to install prompt changes
const unsubscribe = pwaService.onInstallPromptChange((canInstall) => {
  console.log('Can install:', canInstall);
});
```

## Caching Strategies

### NetworkFirst (API Calls)

- Try network first
- Fall back to cache if offline
- Update cache with fresh data
- Best for: API responses, dynamic content

### CacheFirst (Images)

- Check cache first
- Only fetch from network if not cached
- Best for: Images, fonts, static assets

### StaleWhileRevalidate (Maps)

- Serve from cache immediately
- Update cache in background
- Best for: Google Maps tiles, frequently updated content

## Testing

### Manual Testing

1. **Install Flow**:
   - Open app in browser
   - Verify install prompt appears
   - Click install and verify app opens
   - Check app appears in OS app list

2. **Offline Mode**:
   - Open app while online
   - Open DevTools Network tab
   - Set to "Offline"
   - Verify app still works
   - Make changes
   - Go back online
   - Verify changes sync

3. **Update Flow**:
   - Deploy new version
   - Open existing app
   - Verify update notification appears
   - Click update
   - Verify app reloads with new version

### Automated Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific PWA tests
npm test -- pwa
```

## Performance

### Lighthouse Scores

Target scores for PWA audit:

- **Performance**: 90+
- **Accessibility**: 90+
- **Best Practices**: 90+
- **SEO**: 90+
- **PWA**: 100

### Bundle Size

- Initial bundle: < 500KB (gzipped)
- Service worker: < 50KB
- Total cached assets: < 15MB

### Load Times

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Largest Contentful Paint: < 2.5s

## Browser Support

### Full PWA Support

- Chrome 67+ (Desktop & Android)
- Edge 79+
- Samsung Internet 8.2+
- Opera 54+

### Partial Support

- Safari 11.1+ (iOS & macOS)
  - No install prompt
  - Manual "Add to Home Screen"
  - Limited service worker features

- Firefox 79+
  - No install prompt on desktop
  - Works on Android

## Troubleshooting

### Install Prompt Not Showing

1. Check if app is already installed
2. Verify HTTPS (required for PWA)
3. Check manifest.json is valid
4. Ensure service worker is registered
5. Clear browser cache and reload

### Service Worker Not Updating

1. Close all app tabs
2. Unregister service worker in DevTools
3. Clear cache
4. Reload page
5. Verify new service worker activates

### Offline Mode Not Working

1. Check service worker is active
2. Verify caching strategies in DevTools
3. Check Network tab for cached responses
4. Ensure resources are within cache limits

### Icons Not Displaying

1. Verify icon files exist in public/icons/
2. Check manifest.json icon paths
3. Regenerate icons with generate-icons.js
4. Clear browser cache
5. Reinstall app

## Future Enhancements

### Planned Features

1. **Push Notifications**
   - Trip collaboration updates
   - Community engagement
   - Travel reminders

2. **Background Sync**
   - Automatic photo uploads
   - Periodic data refresh
   - Conflict resolution

3. **Advanced Caching**
   - Predictive prefetching
   - Smart cache management
   - Offline map tiles

4. **App Shortcuts**
   - Quick actions from home screen
   - Context menu integration
   - Share target API

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## Support

For issues or questions about the PWA implementation:

1. Check this documentation
2. Review browser console for errors
3. Test in Chrome DevTools Application tab
4. Check service worker status
5. Contact development team

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainer**: Journo Development Team