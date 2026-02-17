# iOS-Specific Services

This document describes the iOS-specific services implemented for the Journo app to support native iOS functionality.

## Overview

Three core services have been implemented to provide iOS-native capabilities:

1. **SafeAreaService** - Handles safe area insets for notches and home indicators
2. **NativeNavigationService** - Controls status bar appearance and navigation
3. **BiometricAuthService** - Provides Face ID and Touch ID authentication

## SafeAreaService

Manages safe area insets to prevent content from being obscured by device notches, home indicators, and system UI.

### Features

- Detects safe area insets from iOS WebView
- Provides subscription mechanism for inset changes
- Applies safe area styles to elements
- Generates CSS custom properties
- Handles orientation changes automatically

### Usage

```typescript
import { safeAreaService } from './services/safeAreaService';

// Get current insets
const insets = safeAreaService.getInsets();
console.log(insets); // { top: 44, right: 0, bottom: 34, left: 0 }

// Subscribe to changes (e.g., orientation change)
const unsubscribe = safeAreaService.subscribeToChanges((insets) => {
  console.log('Safe area changed:', insets);
});

// Apply safe area padding to an element
const element = document.getElementById('my-element');
safeAreaService.applySafeAreaStyles(element, {
  top: true,
  bottom: true,
  left: false,
  right: false
});

// Apply CSS variables to document root
safeAreaService.applyCSSVariables();
// Now you can use: var(--safe-area-inset-top), etc. in CSS

// Check if device has safe area insets
if (safeAreaService.hasSafeAreaInsets()) {
  console.log('Device has notch or home indicator');
}

// Cleanup when done
unsubscribe();
```

### Requirements Implemented

- 3.4: Safe area inset detection
- 7.1: Apply safe-area-inset-top
- 7.2: Apply safe-area-inset-bottom
- 7.3: Apply safe-area-inset-left and safe-area-inset-right
- 7.4: Extend background colors into safe areas

## NativeNavigationService

Controls iOS status bar appearance and provides navigation-related native functionality.

### Features

- Set status bar style (light/dark)
- Show/hide status bar
- Set status bar background color
- Get status bar information
- Configure for light/dark themes
- Status bar overlay control

### Usage

```typescript
import { nativeNavigationService } from './services/nativeNavigationService';

// Set status bar style
await nativeNavigationService.setStatusBarStyle('dark'); // Light text on dark background
await nativeNavigationService.setStatusBarStyle('light'); // Dark text on light background

// Show/hide status bar
await nativeNavigationService.showStatusBar();
await nativeNavigationService.hideStatusBar();

// Set status bar background color
await nativeNavigationService.setStatusBarBackgroundColor('#FFFFFF');

// Get status bar info
const info = await nativeNavigationService.getStatusBarInfo();
console.log(info); // { visible: true, style: 'light', color: '#FFFFFF' }

// Configure for themes
await nativeNavigationService.configureLightTheme(); // Dark text, white background
await nativeNavigationService.configureDarkTheme(); // Light text, black background

// Set status bar overlay (content extends behind status bar)
await nativeNavigationService.setStatusBarOverlay(true);

// Check platform
if (nativeNavigationService.isNative()) {
  console.log('Running on native platform');
}
```

### Requirements Implemented

- 6.1: iOS-style navigation patterns
- 10.9: Configure status bar style

## BiometricAuthService

Provides biometric authentication using Face ID or Touch ID on iOS devices.

### Features

- Check biometric availability
- Authenticate with Face ID/Touch ID
- Automatic fallback to password
- Get biometry type name
- Handle authentication errors
- Resume listener for background/foreground transitions

### Usage

```typescript
import { biometricAuthService } from './services/biometricAuthService';

// Check if biometrics are available
const availability = await biometricAuthService.isAvailable();
console.log(availability);
// { isAvailable: true, biometryType: 'faceId', reason: undefined }

// Get biometry type name for display
const typeName = await biometricAuthService.getBiometryTypeName();
console.log(typeName); // "Face ID" or "Touch ID"

// Authenticate
const result = await biometricAuthService.authenticate({
  reason: 'Authenticate to access your account',
  title: 'Login',
  subtitle: 'Use biometrics to login',
  fallbackTitle: 'Use Password',
  cancelTitle: 'Cancel'
});

if (result.success) {
  console.log('Authentication successful');
} else {
  console.error('Authentication failed:', result.error);
  console.error('Error type:', result.errorType);
}

// Authenticate with automatic fallback
const resultWithFallback = await biometricAuthService.authenticateWithFallback({
  reason: 'Authenticate to access your account'
});

if (!resultWithFallback.success && resultWithFallback.errorType === 'fallbackRequired') {
  // Show password input
  console.log('Biometrics unavailable, show password input');
}

// Check support
if (await biometricAuthService.supportsBiometrics()) {
  console.log('Device supports biometric authentication');
}
```

### Error Types

- `unavailable` - Biometric authentication not available
- `notEnrolled` - No biometrics enrolled on device
- `userCancel` - User cancelled authentication
- `userFallback` - User chose to use password
- `systemCancel` - System cancelled (e.g., app went to background)
- `lockout` - Too many failed attempts
- `passcodeNotSet` - Device passcode not set
- `fallbackRequired` - Need to show password input
- `unknown` - Unknown error

### Requirements Implemented

- 16.8: Implement biometric authentication (Face ID, Touch ID) for app access

## Installation

These services require the following Capacitor plugins:

```bash
npm install @capacitor/status-bar
npm install @aparajita/capacitor-biometric-auth
```

## Platform Support

All services gracefully handle web platform by:
- Returning default values
- Logging debug messages
- Not throwing errors

This allows the app to work on both web and native platforms without conditional imports.

## Testing

The services can be tested on:
- iOS Simulator (limited biometric testing)
- Physical iOS devices (full functionality)
- Web browser (graceful degradation)

## Notes

- SafeAreaService automatically updates on orientation changes
- NativeNavigationService navigation bar color is iOS-specific (no-op on Android)
- BiometricAuthService requires device passcode to be set for biometrics to work
- All services are singleton instances exported from their respective files
