# iOS App Store Preparation - Setup Guide

## ✅ Completed Setup

The following has been successfully configured:

1. **Capacitor Installation**: Installed `@capacitor/core`, `@capacitor/cli`, and `@capacitor/ios`
2. **Capacitor Configuration**: Created `capacitor.config.ts` with iOS-specific settings
3. **iOS Project Generation**: Generated native iOS project in `frontend/ios/`
4. **Permission Descriptions**: Added required permission descriptions to Info.plist:
   - Camera access
   - Photo library access
   - Location access (when in use)
   - Notifications access
5. **Build Scripts**: Added Capacitor scripts to package.json

## 📋 Next Steps: Xcode Configuration

To complete the iOS setup, you need to configure build settings and signing in Xcode:

### 1. Open the iOS Project in Xcode

```bash
cd frontend
npm run cap:open:ios
```

Or manually open: `frontend/ios/App/App.xcworkspace`

### 2. Configure Build Settings

In Xcode:

1. Select the **App** target in the project navigator
2. Go to the **General** tab
3. Configure the following:

   **Identity:**
   - Display Name: `Journo`
   - Bundle Identifier: `com.journo.app`
   - Version: `1.0.0`
   - Build: `1`

   **Deployment Info:**
   - Minimum Deployments: iOS 14.0 or later
   - Device Orientation: Portrait, Landscape Left, Landscape Right
   - Status Bar Style: Default
   - Hide status bar: Unchecked
   - Requires full screen: Unchecked

### 3. Configure Signing & Capabilities

1. Go to the **Signing & Capabilities** tab
2. Enable **Automatically manage signing**
3. Select your **Team** (you'll need an Apple Developer account)
4. Xcode will automatically generate provisioning profiles

**Required Capabilities to Add:**
- Push Notifications (for future implementation)
- Background Modes (if needed for offline sync)

### 4. Configure Build Settings (Advanced)

Go to **Build Settings** tab:

1. **Swift Language Version**: Swift 5
2. **iOS Deployment Target**: 14.0
3. **Supported Platforms**: iOS
4. **Architectures**: Standard architectures (arm64)

### 5. Test the Build

1. Select a simulator or connected device
2. Click the **Play** button or press `Cmd + R`
3. The app should build and launch successfully

## 🔧 Development Workflow

### Building and Syncing

After making changes to your web app:

```bash
# Build web app and sync to iOS
npm run cap:sync

# Or step by step:
npm run build
npx cap copy ios
npx cap sync ios
```

### Opening in Xcode

```bash
npm run cap:open:ios
```

### Running on Device/Simulator

```bash
# Build, sync, and run
npm run cap:run:ios
```

## 📱 Testing on Physical Device

1. Connect your iPhone/iPad via USB
2. Trust the computer on your device
3. In Xcode, select your device from the device dropdown
4. Click Run (Cmd + R)
5. On first run, you may need to trust the developer certificate:
   - Settings > General > VPN & Device Management
   - Trust your developer certificate

## 🔐 Code Signing Requirements

To run on a physical device or submit to App Store, you need:

1. **Apple Developer Account** ($99/year)
   - Individual or Organization account
   - Sign up at: https://developer.apple.com

2. **Development Certificate**
   - Xcode can generate this automatically
   - Or create manually in Apple Developer Portal

3. **Provisioning Profile**
   - Development profile for testing
   - Distribution profile for App Store submission

## 📝 Configuration Files

### capacitor.config.ts
Located at: `frontend/capacitor.config.ts`

Current configuration:
- App ID: `com.journo.app`
- App Name: `Journo`
- Web Directory: `dist`
- iOS content inset: `always`
- Splash screen duration: 2000ms

### Info.plist
Located at: `frontend/ios/App/App/Info.plist`

Contains permission descriptions for:
- Camera
- Photo Library
- Location (When In Use)
- User Notifications

## 🚀 Next Implementation Tasks

After completing Xcode configuration, proceed with:

1. **Task 2**: Implement native plugin integrations (Camera, Geolocation, Push Notifications, Haptics)
2. **Task 3**: Implement iOS-specific services (SafeArea, NativeNavigation, BiometricAuth)
3. **Task 4**: Enhance responsive design for mobile

## 📚 Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)

## ⚠️ Important Notes

1. **Bundle Identifier**: The bundle ID `com.journo.app` must be unique in the App Store. If this is already taken, you'll need to change it in both `capacitor.config.ts` and Xcode.

2. **Minimum iOS Version**: Set to iOS 14.0 to support a wide range of devices while maintaining modern features.

3. **Simulator vs Device**: Some features (camera, haptics, biometrics) only work on physical devices.

4. **Build Errors**: If you encounter build errors, try:
   - Clean build folder: Product > Clean Build Folder (Cmd + Shift + K)
   - Delete derived data: Xcode > Preferences > Locations > Derived Data
   - Run `npx cap sync ios` again

## ✅ Verification Checklist

Before proceeding to the next task, verify:

- [ ] iOS project opens in Xcode without errors
- [ ] Bundle identifier is set to `com.journo.app`
- [ ] Signing is configured with your Apple Developer account
- [ ] App builds successfully in Xcode
- [ ] App runs on iOS Simulator
- [ ] Permission descriptions are present in Info.plist
- [ ] Capacitor scripts work (`npm run cap:sync`, `npm run cap:open:ios`)

---

**Status**: Task 1 Complete ✅
**Next**: Task 2 - Implement native plugin integrations
