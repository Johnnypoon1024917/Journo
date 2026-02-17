# Capacitor iOS - Quick Start Guide

## ✅ Setup Complete!

Capacitor and the iOS project have been successfully configured for the Journo app.

## 🚀 Quick Commands

### Development Workflow
```bash
# 1. Make changes to your React app in src/

# 2. Build and sync to iOS
npm run cap:sync

# 3. Open in Xcode
npm run cap:open:ios

# 4. Build and run from Xcode (Cmd + R)
```

### Individual Commands
```bash
# Build web app
npm run build

# Copy web assets to iOS
npm run cap:copy

# Sync everything (copy + update plugins)
npx cap sync ios

# Open Xcode
npm run cap:open:ios

# Run on iOS (builds, syncs, and runs)
npm run cap:run:ios

# Update Capacitor
npm run cap:update
```

## 📱 Testing

### On Simulator
1. Open Xcode: `npm run cap:open:ios`
2. Select a simulator (e.g., iPhone 15)
3. Click Run (▶️) or press `Cmd + R`

### On Physical Device
1. Connect iPhone/iPad via USB
2. Trust computer on device
3. In Xcode, select your device
4. Click Run (▶️)
5. First time: Trust developer certificate in Settings

## ⚙️ Xcode Configuration (One-Time Setup)

### Required Steps
1. **Open Project**: `npm run cap:open:ios`
2. **Select App Target**: Click "App" in project navigator
3. **Signing & Capabilities Tab**:
   - Enable "Automatically manage signing"
   - Select your Team (Apple Developer account required)
4. **General Tab**:
   - Verify Bundle Identifier: `com.journo.app`
   - Set Deployment Target: iOS 14.0 or later

### Apple Developer Account
- **Free Account**: Can test on your own devices (7-day limit)
- **Paid Account** ($99/year): Required for App Store submission
- Sign up: https://developer.apple.com

## 📋 What's Configured

### App Information
- **App Name**: Journo
- **Bundle ID**: com.journo.app
- **Version**: 1.0.0
- **Minimum iOS**: 14.0

### Permissions (Info.plist)
- ✅ Camera access
- ✅ Photo library access
- ✅ Location (when in use)
- ✅ Notifications

### Capacitor Plugins
Ready to install:
- Camera
- Geolocation
- Push Notifications
- Haptics

## 🔍 Verify Setup

Run Capacitor doctor:
```bash
npx cap doctor
```

Expected output: "iOS looking great! 👌"

## 📁 Project Structure

```
frontend/
├── src/                    # React app source
├── dist/                   # Built web app (generated)
├── ios/                    # Native iOS project
│   └── App/
│       ├── App/
│       │   ├── public/     # Web assets (synced from dist/)
│       │   └── Info.plist  # iOS configuration
│       └── App.xcworkspace # Open this in Xcode
├── capacitor.config.ts     # Capacitor configuration
└── package.json            # NPM scripts
```

## 🐛 Troubleshooting

### "No provisioning profiles found"
- Open Xcode
- Go to Signing & Capabilities
- Select your Team
- Xcode will create profiles automatically

### "Build failed" in Xcode
```bash
# Clean and rebuild
npm run build
npx cap sync ios
# In Xcode: Product > Clean Build Folder (Cmd + Shift + K)
```

### Changes not appearing
```bash
# Make sure to sync after building
npm run build
npx cap sync ios
# Then rebuild in Xcode
```

### Xcode won't open
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Or open manually
open frontend/ios/App/App.xcworkspace
```

## 📚 Next Steps

### Task 2: Native Plugins
Install Capacitor plugins:
```bash
npm install @capacitor/camera
npm install @capacitor/geolocation
npm install @capacitor/push-notifications
npm install @capacitor/haptics
```

### Task 3: iOS Services
Implement iOS-specific services:
- SafeAreaService (notch handling)
- NativeNavigationService (status bar)
- BiometricAuthService (Face ID/Touch ID)

### Task 4: Mobile UI
Enhance responsive design:
- Safe area insets
- Touch-optimized components
- Mobile-first layouts

## 📖 Documentation

- [Capacitor Docs](https://capacitorjs.com/docs)
- [iOS Setup Guide](https://capacitorjs.com/docs/ios)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)

## ✨ Tips

1. **Always sync after building**: `npm run cap:sync`
2. **Use Xcode for debugging**: Better error messages and debugging tools
3. **Test on real devices**: Some features only work on physical devices
4. **Keep Capacitor updated**: `npm run cap:update`
5. **Check Capacitor doctor**: `npx cap doctor` to verify setup

---

**Status**: ✅ Ready for development
**Next Task**: Install and configure native plugins
