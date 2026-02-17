# iOS Setup Guide

## Prerequisites

- macOS with Xcode 14+
- Node.js 18+
- CocoaPods installed
- Apple Developer account (for device testing)

## Initial Setup

### 1. Install Capacitor

```bash
cd frontend
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios
```

### 2. Initialize Capacitor

```bash
npx cap init
```

When prompted:
- App name: Journo
- App ID: com.journo.app
- Web directory: dist

### 3. Configure Environment

Create iOS-specific environment file:
```bash
cp .env.example .env.ios
```

Update `.env.ios`:
```env
VITE_API_URL=https://your-backend-url.com
VITE_SOCKET_URL=https://your-backend-url.com
```

### 4. Build and Sync

```bash
# Build the web app
npm run build

# Add iOS platform
npx cap add ios

# Sync web assets to iOS
npx cap sync ios
```

### 5. Open in Xcode

```bash
npx cap open ios
```

## Xcode Configuration

### 1. Signing & Capabilities

1. Select the project in Xcode
2. Go to "Signing & Capabilities"
3. Select your team
4. Ensure bundle identifier matches: `com.journo.app`

### 2. Info.plist Configuration

Add required permissions:

```xml
<key>NSCameraUsageDescription</key>
<string>To upload photos for your trips</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>To select photos for your trips</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>To show your location on the map</string>
```

### 3. App Transport Security

For development with HTTP backend:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

⚠️ Remove for production - use HTTPS only!

## Running the App

### Simulator

1. Select a simulator from the device dropdown
2. Click the play button or press Cmd+R
3. App will launch in simulator

### Physical Device

1. Connect iPhone via USB
2. Trust the computer on device
3. Select device from dropdown
4. Click play button
5. Trust developer certificate on device (Settings → General → Device Management)

## Development Workflow

### Making Changes

1. Edit web code in `frontend/src/`
2. Build: `npm run build`
3. Sync: `npx cap sync ios`
4. Reload app in Xcode

### Live Reload (Development)

```bash
# Start dev server
npm run dev

# In capacitor.config.ts, add:
server: {
  url: 'http://localhost:5173',
  cleartext: true
}

# Sync and run
npx cap sync ios
npx cap open ios
```

Now changes will hot-reload without rebuilding!

## Capacitor Plugins

### Installed Plugins

- @capacitor/app - App lifecycle
- @capacitor/haptics - Haptic feedback
- @capacitor/keyboard - Keyboard control
- @capacitor/network - Network status
- @capacitor/splash-screen - Splash screen
- @capacitor/status-bar - Status bar styling

### Using Plugins

```typescript
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// App state
App.addListener('appStateChange', ({ isActive }) => {
  console.log('App state changed. Is active?', isActive);
});

// Haptic feedback
await Haptics.impact({ style: ImpactStyle.Light });
```

## Platform-Specific Code

### Detecting Platform

```typescript
import { Capacitor } from '@capacitor/core';

const isIOS = Capacitor.getPlatform() === 'ios';
const isNative = Capacitor.isNativePlatform();
```

### Conditional Rendering

```typescript
{isIOS && <IOSSpecificComponent />}
{!isNative && <WebOnlyFeature />}
```

## Troubleshooting

### Build Fails

```bash
# Clean build folder
cd ios/App
xcodebuild clean

# Update pods
pod install --repo-update

# Sync again
npx cap sync ios
```

### White Screen on Launch

1. Check console in Xcode for errors
2. Verify API URL is accessible from device
3. Check Info.plist for App Transport Security
4. Ensure build was successful: `npm run build`

### API Connection Issues

1. Use HTTPS in production
2. For development, enable cleartext in capacitor.config.ts
3. Check network permissions
4. Verify backend is accessible from device network

### Plugin Not Working

```bash
# Reinstall plugin
npm uninstall @capacitor/plugin-name
npm install @capacitor/plugin-name

# Sync
npx cap sync ios
```

### CocoaPods Issues

```bash
# Update CocoaPods
sudo gem install cocoapods

# Clean and reinstall
cd ios/App
rm -rf Pods Podfile.lock
pod install
```

## App Store Preparation

### 1. App Icons

Place icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Required sizes:
- 1024x1024 (App Store)
- 180x180 (iPhone)
- 167x167 (iPad Pro)
- 152x152 (iPad)
- 120x120 (iPhone)
- 87x87 (iPhone)
- 80x80 (iPad)
- 76x76 (iPad)
- 60x60 (iPhone)
- 58x58 (iPhone)
- 40x40 (iPad/iPhone)
- 29x29 (iPad/iPhone)
- 20x20 (iPad/iPhone)

### 2. Launch Screen

Configure in `ios/App/App/Base.lproj/LaunchScreen.storyboard`

### 3. App Information

Update in Xcode:
- Display Name
- Version
- Build Number
- Bundle Identifier

### 4. Privacy Policy

Required for App Store submission. Add URL in App Store Connect.

### 5. Screenshots

Required sizes:
- 6.5" iPhone (1242 x 2688)
- 5.5" iPhone (1242 x 2208)
- 12.9" iPad Pro (2048 x 2732)

### 6. Archive and Upload

1. Select "Any iOS Device" as target
2. Product → Archive
3. Distribute App → App Store Connect
4. Upload

## Configuration Files

### capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.journo.app',
  appName: 'Journo',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
```

### Info.plist Key Settings

- CFBundleDisplayName: App name shown on home screen
- CFBundleShortVersionString: Version number
- CFBundleVersion: Build number
- UILaunchStoryboardName: Launch screen
- UIRequiredDeviceCapabilities: Required features

## Performance Optimization

1. Enable WKWebView optimizations
2. Minimize JavaScript bundle size
3. Use native plugins where possible
4. Implement proper caching
5. Optimize images for mobile

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests on iOS
```bash
# Install Appium or use Detox
npm run test:ios
```

### Manual Testing Checklist
- [ ] App launches successfully
- [ ] Login/logout works
- [ ] API calls succeed
- [ ] Offline mode works
- [ ] Push notifications (if implemented)
- [ ] Camera/photo library access
- [ ] Network change handling
- [ ] Background/foreground transitions

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
