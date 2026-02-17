# Design Document: iOS App Store Preparation

## Overview

This design document outlines the technical approach for preparing the Journo travel planning platform for iOS App Store publication. The application is currently a Progressive Web App (PWA) built with React, TypeScript, and Vite. The design focuses on three main areas:

1. **Native Wrapper Implementation**: Using Capacitor to package the PWA as a native iOS app
2. **Mobile-First UI/UX Optimization**: Enhancing responsive design, touch interactions, and iOS-specific patterns
3. **App Store Compliance**: Implementing required features, metadata, and review preparation

The design maintains the existing PWA architecture while adding native iOS capabilities through Capacitor plugins and optimizing the mobile experience for touch-based interactions.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    iOS Native Shell                      │
│                     (Capacitor)                          │
├─────────────────────────────────────────────────────────┤
│  Native Plugins  │  WebView Bridge  │  Native Features  │
│  - Camera        │  - JS ↔ Native   │  - Push Notifs   │
│  - Location      │  - Event Bus     │  - Biometrics    │
│  - Filesystem    │  - Plugin API    │  - Haptics       │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│              React PWA Application                       │
├─────────────────────────────────────────────────────────┤
│  UI Layer        │  State Management │  Services        │
│  - Components    │  - Zustand Stores │  - API Client   │
│  - Pages         │  - React Context  │  - Auth Service │
│  - Layouts       │  - Local State    │  - Offline Sync │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│              Backend API (Node.js/Express)               │
│  - REST Endpoints  │  WebSocket  │  Database (PostgreSQL)│
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Native Layer:**
- Capacitor 5.x (native wrapper)
- Swift/Objective-C (native iOS code)
- Xcode 15+ (build tooling)

**Web Layer (Existing):**
- React 18.2
- TypeScript 5.2
- Vite 5.0
- Tailwind CSS 3.3
- Framer Motion 12.29 (animations)
- Zustand 4.4 (state management)

**Build & Deploy:**
- Fastlane (iOS automation)
- App Store Connect API
- TestFlight (beta distribution)


## Components and Interfaces

### 1. Capacitor Configuration

**Purpose**: Configure the native iOS wrapper and bridge between web and native code.

**Configuration File**: `capacitor.config.ts`

```typescript
interface CapacitorConfig {
  appId: string;              // Bundle identifier (com.journo.app)
  appName: string;            // Display name
  webDir: string;             // Build output directory
  server?: {
    url?: string;             // Dev server URL
    cleartext?: boolean;      // Allow HTTP in dev
  };
  ios: {
    contentInset: 'always';   // Safe area handling
    scrollEnabled: boolean;   // WebView scrolling
    backgroundColor: string;  // Splash screen color
  };
  plugins: {
    SplashScreen: {
      launchShowDuration: number;
      backgroundColor: string;
      showSpinner: boolean;
    };
    PushNotifications: {
      presentationOptions: string[];
    };
    Keyboard: {
      resize: 'body' | 'ionic' | 'native';
      style: 'dark' | 'light';
    };
  };
}
```

### 2. Native Plugin Interfaces

**Camera Plugin**:
```typescript
interface CameraPlugin {
  getPhoto(options: CameraOptions): Promise<Photo>;
  checkPermissions(): Promise<PermissionStatus>;
  requestPermissions(): Promise<PermissionStatus>;
}

interface CameraOptions {
  quality: number;           // 0-100
  allowEditing: boolean;
  resultType: 'uri' | 'base64' | 'dataUrl';
  source: 'prompt' | 'camera' | 'photos';
  width?: number;
  height?: number;
}
```

**Geolocation Plugin**:
```typescript
interface GeolocationPlugin {
  getCurrentPosition(options?: PositionOptions): Promise<Position>;
  watchPosition(options: PositionOptions, callback: WatchCallback): string;
  clearWatch(options: { id: string }): Promise<void>;
  checkPermissions(): Promise<PermissionStatus>;
  requestPermissions(): Promise<PermissionStatus>;
}
```

**Push Notifications Plugin**:
```typescript
interface PushNotificationsPlugin {
  register(): Promise<void>;
  getDeliveredNotifications(): Promise<DeliveredNotifications>;
  removeDeliveredNotifications(notifications: DeliveredNotifications): Promise<void>;
  removeAllDeliveredNotifications(): Promise<void>;
  createChannel(channel: NotificationChannel): Promise<void>;
  deleteChannel(channel: NotificationChannel): Promise<void>;
  listChannels(): Promise<NotificationChannelList>;
  checkPermissions(): Promise<PermissionStatus>;
  requestPermissions(): Promise<PermissionStatus>;
  addListener(eventName: string, listenerFunc: Function): PluginListenerHandle;
}
```

**Haptics Plugin**:
```typescript
interface HapticsPlugin {
  impact(options: { style: 'light' | 'medium' | 'heavy' }): Promise<void>;
  notification(options: { type: 'success' | 'warning' | 'error' }): Promise<void>;
  vibrate(options?: { duration?: number }): Promise<void>;
  selectionStart(): Promise<void>;
  selectionChanged(): Promise<void>;
  selectionEnd(): Promise<void>;
}
```

### 3. iOS-Specific Service Layer

**SafeAreaService**:
```typescript
class SafeAreaService {
  getInsets(): SafeAreaInsets;
  subscribeToChanges(callback: (insets: SafeAreaInsets) => void): () => void;
  applySafeAreaStyles(element: HTMLElement): void;
}

interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
```

**NativeNavigationService**:
```typescript
class NativeNavigationService {
  setStatusBarStyle(style: 'light' | 'dark'): Promise<void>;
  showStatusBar(): Promise<void>;
  hideStatusBar(): Promise<void>;
  setNavigationBarColor(color: string): Promise<void>;
}
```

**BiometricAuthService**:
```typescript
class BiometricAuthService {
  isAvailable(): Promise<BiometricAvailability>;
  authenticate(options: BiometricOptions): Promise<BiometricResult>;
}

interface BiometricOptions {
  reason: string;
  title?: string;
  subtitle?: string;
  fallbackTitle?: string;
}
```

### 4. Enhanced Touch Interaction Components

**TouchOptimizedButton**:
```typescript
interface TouchOptimizedButtonProps {
  onPress: () => void;
  onLongPress?: () => void;
  hapticFeedback?: 'light' | 'medium' | 'heavy';
  minTouchTarget?: number;  // Default: 44px
  children: React.ReactNode;
  disabled?: boolean;
}
```

**SwipeableCard**:
```typescript
interface SwipeableCardProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;  // Default: 100px
  children: React.ReactNode;
}
```

**PinchZoomContainer**:
```typescript
interface PinchZoomContainerProps {
  minScale?: number;        // Default: 0.5
  maxScale?: number;        // Default: 3
  onScaleChange?: (scale: number) => void;
  children: React.ReactNode;
}
```

### 5. Enhanced Sticker System

**MobileStickerCanvas**:
```typescript
interface MobileStickerCanvasProps {
  elementId: string;
  elementType: 'day' | 'activity' | 'booking' | 'trip';
  tripId: string;
  editable: boolean;
  hasValues: boolean;
  onStickerUpdate?: (sticker: Sticker) => void;
  onStickerDelete?: (stickerId: string) => void;
}

interface StickerGestures {
  onLongPress: (sticker: Sticker) => void;      // Enter edit mode
  onDrag: (sticker: Sticker, position: Point) => void;
  onPinch: (sticker: Sticker, scale: number) => void;
  onRotate: (sticker: Sticker, angle: number) => void;
  onDrop: (sticker: Sticker, target: DropTarget) => void;
}
```

**TouchGestureRecognizer**:
```typescript
class TouchGestureRecognizer {
  recognizeLongPress(duration: number): boolean;
  recognizePinch(): { scale: number; center: Point } | null;
  recognizeRotation(): number | null;
  recognizeDrag(): { delta: Point; velocity: Point } | null;
  recognizeSwipe(): SwipeDirection | null;
}
```


## Data Models

### 1. App Configuration

```typescript
interface AppConfig {
  version: string;
  buildNumber: number;
  bundleId: string;
  environment: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  features: FeatureFlags;
}

interface FeatureFlags {
  pushNotifications: boolean;
  biometricAuth: boolean;
  offlineMode: boolean;
  analytics: boolean;
  crashReporting: boolean;
}
```

### 2. Device Information

```typescript
interface DeviceInfo {
  platform: 'ios';
  model: string;              // iPhone14,2
  osVersion: string;          // 17.2
  appVersion: string;         // 1.0.0
  buildNumber: string;        // 42
  manufacturer: 'Apple';
  isVirtual: boolean;
  screenWidth: number;
  screenHeight: number;
  safeAreaInsets: SafeAreaInsets;
  hasNotch: boolean;
  supportsHaptics: boolean;
  supportsBiometrics: boolean;
}
```

### 3. Permission State

```typescript
interface PermissionState {
  camera: PermissionStatus;
  photos: PermissionStatus;
  location: PermissionStatus;
  notifications: PermissionStatus;
  microphone: PermissionStatus;
}

type PermissionStatus = 
  | 'prompt'      // Not yet requested
  | 'granted'     // User granted
  | 'denied'      // User denied
  | 'limited';    // Partial access (iOS 14+)
```

### 4. Touch Gesture Data

```typescript
interface TouchGesture {
  type: 'tap' | 'longPress' | 'drag' | 'pinch' | 'rotate' | 'swipe';
  startTime: number;
  endTime: number;
  startPosition: Point;
  endPosition: Point;
  touches: TouchPoint[];
  velocity?: Point;
  scale?: number;
  rotation?: number;
}

interface TouchPoint {
  identifier: number;
  clientX: number;
  clientY: number;
  force?: number;           // 3D Touch pressure
  radiusX?: number;
  radiusY?: number;
}

interface Point {
  x: number;
  y: number;
}
```

### 5. Sticker Data (Enhanced)

```typescript
interface Sticker {
  id: string;
  type: string;
  imageUrl: string;
  position: Point;
  scale: number;            // 0.5 - 3.0
  rotation: number;         // 0 - 360 degrees
  value?: number;           // Optional value (0-200%)
  zIndex: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface StickerPlacement {
  stickerId: string;
  elementId: string;
  elementType: 'day' | 'activity' | 'booking' | 'trip';
  tripId: string;
  position: Point;
  scale: number;
  rotation: number;
  value?: number;
}
```

### 6. App Store Metadata

```typescript
interface AppStoreMetadata {
  appName: string;
  subtitle: string;
  description: string;
  keywords: string[];
  supportUrl: string;
  marketingUrl?: string;
  privacyPolicyUrl: string;
  categories: {
    primary: AppCategory;
    secondary?: AppCategory;
  };
  ageRating: AgeRating;
  screenshots: Screenshot[];
  previewVideo?: PreviewVideo;
}

interface Screenshot {
  deviceType: 'iPhone6.5' | 'iPhone6.7' | 'iPhone5.5' | 'iPad12.9' | 'iPad11';
  url: string;
  displayOrder: number;
}

type AppCategory = 'Travel' | 'Lifestyle' | 'Productivity' | 'Social Networking';
type AgeRating = '4+' | '9+' | '12+' | '17+';
```

### 7. Analytics Event

```typescript
interface AnalyticsEvent {
  name: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  deviceInfo: DeviceInfo;
  appVersion: string;
}

// Common events
type EventName =
  | 'app_opened'
  | 'trip_created'
  | 'trip_viewed'
  | 'activity_added'
  | 'sticker_placed'
  | 'sticker_edited'
  | 'sticker_deleted'
  | 'offline_mode_enabled'
  | 'push_notification_received'
  | 'push_notification_tapped'
  | 'biometric_auth_success'
  | 'biometric_auth_failed';
```

### 8. Crash Report

```typescript
interface CrashReport {
  id: string;
  timestamp: Date;
  appVersion: string;
  osVersion: string;
  deviceModel: string;
  errorMessage: string;
  stackTrace: string;
  breadcrumbs: Breadcrumb[];
  userId?: string;
  customData: Record<string, any>;
}

interface Breadcrumb {
  timestamp: Date;
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}
```


## Error Handling

### Error Categories

1. **Network Errors**
   - Connection timeout
   - Server unavailable
   - API errors (4xx, 5xx)
   - Offline mode

2. **Permission Errors**
   - Permission denied
   - Permission not determined
   - Limited permission access

3. **Native Plugin Errors**
   - Plugin not available
   - Plugin initialization failed
   - Native API call failed

4. **Data Errors**
   - Sync conflict
   - Data corruption
   - Storage quota exceeded

5. **User Input Errors**
   - Invalid form data
   - File too large
   - Unsupported file type

### Error Handling Strategy

**Network Errors**:
```typescript
class NetworkErrorHandler {
  handle(error: NetworkError): void {
    if (error.code === 'TIMEOUT') {
      // Show retry option
      showToast('Request timed out. Tap to retry.', { action: 'retry' });
    } else if (error.code === 'OFFLINE') {
      // Enable offline mode
      offlineStore.setOffline(true);
      showToast('You are offline. Changes will sync when online.');
    } else if (error.status >= 500) {
      // Server error
      showToast('Server error. Please try again later.');
      logError(error);
    } else if (error.status === 401) {
      // Unauthorized - refresh token or logout
      authService.refreshToken().catch(() => authService.logout());
    }
  }
}
```

**Permission Errors**:
```typescript
class PermissionErrorHandler {
  handle(permission: PermissionType, status: PermissionStatus): void {
    if (status === 'denied') {
      showAlert({
        title: `${permission} Access Required`,
        message: `Please enable ${permission} access in Settings to use this feature.`,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openAppSettings() }
        ]
      });
    } else if (status === 'limited') {
      showToast(`Limited ${permission} access. Some features may not work.`);
    }
  }
}
```

**Native Plugin Errors**:
```typescript
class PluginErrorHandler {
  handle(plugin: string, error: Error): void {
    logError({ plugin, error });
    
    // Provide fallback functionality
    if (plugin === 'Camera') {
      // Fall back to file input
      showToast('Camera unavailable. Using file picker instead.');
      return useFilePicker();
    } else if (plugin === 'Haptics') {
      // Silently fail - haptics are nice-to-have
      return;
    } else {
      // Show generic error
      showToast('Feature temporarily unavailable.');
    }
  }
}
```

**Graceful Degradation**:
- Camera unavailable → Use file picker
- Haptics unavailable → Continue without feedback
- Biometrics unavailable → Use password only
- Push notifications denied → Use in-app notifications
- Location unavailable → Manual location entry

### Error Logging

```typescript
interface ErrorLog {
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  stack?: string;
  context: Record<string, any>;
  userId?: string;
  deviceInfo: DeviceInfo;
}

class ErrorLogger {
  log(error: Error, context?: Record<string, any>): void {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      level: 'error',
      category: error.name,
      message: error.message,
      stack: error.stack,
      context: context || {},
      userId: authStore.userId,
      deviceInfo: getDeviceInfo()
    };
    
    // Send to crash reporting service
    crashReporter.log(errorLog);
    
    // Store locally for debugging
    localErrorStore.add(errorLog);
  }
}
```

## Testing Strategy

### Testing Pyramid

```
        ┌─────────────┐
        │   E2E (5%)  │  Critical user flows
        ├─────────────┤
        │ Integration │  Component interactions
        │    (15%)    │  API integration
        ├─────────────┤
        │   Unit      │  Business logic
        │   (80%)     │  Utilities
        └─────────────┘
```

### Unit Testing

**Tools**: Vitest, React Testing Library, fast-check (property-based testing)

**Coverage Requirements**:
- Business logic: 90%+
- Utilities: 90%+
- Components: 70%+
- Services: 85%+

**Test Categories**:
1. Component rendering tests
2. User interaction tests
3. State management tests
4. Service layer tests
5. Utility function tests
6. Property-based tests for critical logic

### Integration Testing

**Tools**: Vitest, MSW (Mock Service Worker)

**Test Scenarios**:
1. API integration tests
2. Authentication flow tests
3. Offline sync tests
4. Native plugin integration tests
5. State synchronization tests

### End-to-End Testing

**Tools**: Detox or Appium

**Critical User Journeys**:
1. User registration and login
2. Create trip and add activities
3. Place and edit stickers
4. Offline mode and sync
5. Push notification handling
6. Biometric authentication

### Device Testing Matrix

| Device | iOS Version | Screen Size | Test Priority |
|--------|-------------|-------------|---------------|
| iPhone SE (3rd gen) | 15.0 | 4.7" | High |
| iPhone 14 | 16.0 | 6.1" | High |
| iPhone 14 Pro | 17.0 | 6.1" | High |
| iPhone 14 Pro Max | 17.0 | 6.7" | High |
| iPhone 13 mini | 15.0 | 5.4" | Medium |
| iPad Air | 16.0 | 10.9" | Medium |
| iPad Pro 12.9" | 17.0 | 12.9" | Low |

### Performance Testing

**Metrics to Monitor**:
- App launch time: < 2s
- Screen transition time: < 300ms
- API response time: < 1s
- Sticker drag performance: 60fps
- Memory usage: < 200MB
- Battery drain: < 5% per hour of active use

**Tools**:
- Xcode Instruments
- Lighthouse Mobile
- React DevTools Profiler

### Accessibility Testing

**Manual Testing**:
- VoiceOver navigation
- Dynamic Type scaling
- Voice Control
- Switch Control
- Reduce Motion

**Automated Testing**:
- axe-core accessibility tests
- Color contrast validation
- Touch target size validation
- ARIA label validation

### Beta Testing (TestFlight)

**Beta Testing Plan**:
1. Internal testing (5 developers): 1 week
2. External testing (20 users): 2 weeks
3. Collect feedback via in-app form
4. Monitor crash reports and analytics
5. Iterate based on feedback

**Beta Testing Checklist**:
- [ ] All features functional
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Accessibility working
- [ ] Offline mode working
- [ ] Push notifications working
- [ ] Biometric auth working
- [ ] App Store metadata complete


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

**Consolidated Safe Area Properties**: Requirements 7.1, 7.2, 7.3 all test safe area inset application. These can be combined into a single comprehensive property that tests all safe area insets.

**Consolidated Touch Target Properties**: Requirements 4.1 and 5.9 both test minimum touch target size. These can be combined into one property.

**Consolidated Accessibility Label Properties**: Requirements 9.1 and 9.5 both test that elements have proper labels/alt text. These can be combined.

**Consolidated Responsive Layout Properties**: Requirements 3.1, 3.7 both test that content fits within viewport. These can be combined.

**Consolidated Haptic Feedback Properties**: Requirement 5.7 tests haptic feedback for sticker interactions, which is a subset of general touch feedback. This can be part of a broader haptic feedback property.

### Core Properties

**Property 1: Permission Request Before Access**
*For any* device feature (camera, location, notifications, photo library), when the app attempts to access it, a permission request must be made before the access attempt if permission has not been granted.
**Validates: Requirements 1.2**

**Property 2: Graceful Permission Denial Handling**
*For any* permission denial, the app must continue functioning without crashing and core features must remain accessible.
**Validates: Requirements 1.4**

**Property 3: Network Error Handling**
*For any* network request, the app must have error handling that catches failures and provides user feedback.
**Validates: Requirements 1.9**

**Property 4: Viewport Content Containment**
*For any* page or screen in the app, all content must render within the viewport width without requiring horizontal scrolling.
**Validates: Requirements 3.1, 3.7**

**Property 5: Orientation Change Responsiveness**
*For any* device orientation change, the app must adapt the layout within 300ms.
**Validates: Requirements 3.2**

**Property 6: Safe Area Inset Application**
*For any* screen with content near device edges, the app must apply appropriate safe area insets (top, bottom, left, right) to prevent content from being obscured by notches or home indicators.
**Validates: Requirements 3.4, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.8, 7.10**

**Property 7: Responsive Column Counts**
*For any* list or grid display, the number of columns must adjust based on viewport width (1 on mobile, 2 on tablet, 3+ on desktop).
**Validates: Requirements 3.5**

**Property 8: Minimum Font Size**
*For any* body text element, the font size must be at least 14px.
**Validates: Requirements 3.6**

**Property 9: Minimum Touch Target Size**
*For any* interactive element (including stickers when scaled), the touch target must be at least 44x44 pixels.
**Validates: Requirements 4.1, 5.9**

**Property 10: Touch Target Spacing**
*For any* pair of adjacent interactive elements, the spacing between them must be at least 8px.
**Validates: Requirements 4.2**

**Property 11: Visual Feedback Timing**
*For any* tap on an interactive element, visual feedback must appear within 100ms.
**Validates: Requirements 4.3**

**Property 12: Destructive Action Protection**
*For any* destructive action (delete, remove, clear), the app must implement either a confirmation dialog or a delay to prevent accidental taps.
**Validates: Requirements 4.5**

**Property 13: Swipe Animation Performance**
*For any* swipe gesture, the resulting animation must maintain 60fps performance.
**Validates: Requirements 4.7, 5.2**

**Property 14: Text Selection Control**
*For any* UI element that is not meant for text copying, the element must have text selection disabled (user-select: none).
**Validates: Requirements 4.8**

**Property 15: Keyboard Type Matching**
*For any* form input, the input type must trigger the appropriate keyboard type (email → email keyboard, number → numeric keyboard, etc.).
**Validates: Requirements 4.10**

**Property 16: Sticker Drag Performance**
*For any* sticker drag operation, the sticker must follow the touch point smoothly with 60fps performance.
**Validates: Requirements 5.2**

**Property 17: Sticker Proximity Feedback**
*For any* sticker being dragged, when it comes within 100px of the recycle bin, the bin must provide visual feedback (open lid, glow).
**Validates: Requirements 5.3**

**Property 18: Sticker Resize Constraints**
*For any* pinch gesture on a sticker, the resulting size must be constrained between 50px and 300px.
**Validates: Requirements 5.5**

**Property 19: Sticker Haptic Feedback**
*For any* sticker interaction (drag start, edit mode, delete), the app must provide appropriate haptic feedback (light, medium, or heavy).
**Validates: Requirements 5.7**

**Property 20: Sticker Persistence Timing**
*For any* sticker operation (move, resize, rotate, delete), the change must be persisted to the backend within 500ms.
**Validates: Requirements 5.10**

**Property 21: Offline Change Queueing**
*For any* data modification made while offline, the change must be added to the sync queue for later synchronization.
**Validates: Requirements 11.3**

**Property 22: Offline Storage Size Limit**
*For any* offline data storage operation, the total cached data must not exceed 50MB.
**Validates: Requirements 11.10**

**Property 23: ARIA Label Presence**
*For any* interactive element or image, the element must have either an ARIA label, alt text, or associated label element.
**Validates: Requirements 9.1, 9.5**

**Property 24: Color Contrast Compliance**
*For any* text and background color combination, the contrast ratio must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).
**Validates: Requirements 9.2**

**Property 25: Dynamic Type Support**
*For any* text element, the text must scale appropriately when the system font size is changed (up to 200%).
**Validates: Requirements 9.3**

**Property 26: Keyboard Navigation Completeness**
*For any* interactive feature, it must be accessible via keyboard navigation.
**Validates: Requirements 9.4**

**Property 27: State Change Announcements**
*For any* state change (loading, error, success), the change must be announced to screen readers via ARIA live regions.
**Validates: Requirements 9.6**

**Property 28: Reduce Motion Support**
*For any* non-essential animation, the animation must be disabled when the user has enabled Reduce Motion preference.
**Validates: Requirements 9.7**

**Property 29: Form Input Label Association**
*For any* form input, the input must have an associated label element for screen readers.
**Validates: Requirements 9.9**

**Property 30: Translation Completeness**
*For any* UI text string, the string must use the i18n translation system rather than hardcoded text.
**Validates: Requirements 15.4**

**Property 31: Locale-Specific Formatting**
*For any* date, time, or number display, the formatting must use locale-specific formats based on the user's language setting.
**Validates: Requirements 15.5**

**Property 32: Translation Fallback**
*For any* missing translation key, the app must display the English fallback text.
**Validates: Requirements 15.8**

### Example-Based Tests

**Example 1: Privacy Policy Accessibility**
The settings screen must include a link to the privacy policy that opens the policy document.
**Validates: Requirements 1.1**

**Example 2: Info.plist Permission Descriptions**
The Info.plist file must contain description strings for all permission keys (NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, etc.).
**Validates: Requirements 1.3**

**Example 3: Account Deletion Feature**
The settings screen must include a "Delete Account" option that, when confirmed, deletes the user's account and associated data.
**Validates: Requirements 1.8**

**Example 4: App Icon Completeness**
The app bundle must include icon files for all required sizes: 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024.
**Validates: Requirements 2.1**

**Example 5: Screenshot Availability**
The app submission must include at least 3 screenshots for each required device size (6.5", 6.7", 5.5" iPhone).
**Validates: Requirements 2.2**

**Example 6: Keyboard Viewport Adjustment**
When a form input is focused and the keyboard appears, the viewport must scroll to keep the input visible.
**Validates: Requirements 3.8**

**Example 7: Viewport Meta Tag**
The HTML must include a viewport meta tag with `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no`.
**Validates: Requirements 3.9**

**Example 8: Touch Gesture Support**
The app must implement gesture recognizers for tap, long-press, swipe, and pinch-to-zoom gestures.
**Validates: Requirements 4.4**

**Example 9: Pull-to-Refresh Implementation**
The trip list and community feed screens must implement pull-to-refresh functionality.
**Validates: Requirements 4.9**

**Example 10: Sticker Long-Press Edit Mode**
When a user long-presses a sticker for 400ms, the sticker must enter edit mode with scale 1.15x and wobble animation.
**Validates: Requirements 5.1**

**Example 11: Sticker Drop Deletion Animation**
When a user drops a sticker on the recycle bin, the sticker must animate (shrink, fly to bin center, confetti) and be deleted.
**Validates: Requirements 5.4**

**Example 12: Sticker Rotation Gesture**
When a user rotates two fingers on a sticker, the sticker must rotate smoothly following the gesture.
**Validates: Requirements 5.6**

**Example 13: Sticker Edit Mode Timeout**
When a user taps outside a sticker in edit mode, the edit mode must exit after 2 seconds of inactivity.
**Validates: Requirements 5.8**

**Example 14: Safe Area CSS Variables**
The CSS must use `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)`, and `env(safe-area-inset-right)` for safe area calculations.
**Validates: Requirements 7.9**

**Example 15: Offline Data Display**
When the app is offline, the trip list must display cached trip data from the last sync.
**Validates: Requirements 11.1**

**Example 16: Offline Trip Creation**
When the app is offline, users must be able to create and edit trips, with changes stored locally.
**Validates: Requirements 11.2**

**Example 17: Online Sync Trigger**
When the app regains connectivity after being offline, it must automatically sync queued changes within 5 seconds.
**Validates: Requirements 11.4**

**Example 18: Offline Indicator Display**
When the app is offline, a clear offline indicator must be displayed in the UI.
**Validates: Requirements 11.5**

**Example 19: Sync Conflict Resolution**
When a sync conflict occurs, the app must display a dialog prompting the user to choose which version to keep.
**Validates: Requirements 11.6**

**Example 20: Essential Asset Caching**
The service worker must cache essential assets (icons, fonts, core UI components) for offline use.
**Validates: Requirements 11.7**

**Example 21: Manual Sync Trigger**
The app must include a sync button that, when tapped, triggers synchronization with the backend.
**Validates: Requirements 11.8**

**Example 22: Sync Progress Feedback**
During synchronization, the app must display progress indicators (syncing, synced, failed).
**Validates: Requirements 11.9**

**Example 23: Language Support**
The app must include translation files for English, Japanese, Chinese (Simplified), and Chinese (Traditional).
**Validates: Requirements 15.1**

**Example 24: Device Language Detection**
On first launch, the app must detect the device language and set the app language to match.
**Validates: Requirements 15.2**

**Example 25: Manual Language Selection**
The settings screen must include a language selector that allows users to change the app language.
**Validates: Requirements 15.3**

**Example 26: Language Change Without Restart**
When a user changes the app language, the change must apply immediately without requiring an app restart.
**Validates: Requirements 15.9**

**Example 27: Language Preference Persistence**
The user's language preference must be stored persistently and survive app restarts.
**Validates: Requirements 15.10**

**Example 28: Skip Link Availability**
Pages with navigation must include skip links for bypassing repetitive navigation elements.
**Validates: Requirements 9.10**

