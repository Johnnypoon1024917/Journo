# iOS API Connection Guide

## Problem

The iOS app cannot connect to the PostgreSQL server because it's configured to use `http://localhost:5000`, which refers to the iOS device itself, not your development machine.

## Solution Options

### Option 1: Use Your Computer's Local IP Address (Recommended for Development)

This is the easiest solution for local development and testing.

#### Step 1: Find Your Computer's IP Address

**On macOS:**
```bash
# Get your local IP address
ipconfig getifaddr en0
# Or if on WiFi:
ipconfig getifaddr en1
```

**On Linux:**
```bash
hostname -I | awk '{print $1}'
```

**On Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

Your IP will look something like: `192.168.1.100` or `10.0.0.50`

#### Step 2: Update Environment Configuration

Create a new environment file for iOS development:

**frontend/.env.ios**
```bash
# Replace 192.168.1.100 with YOUR computer's IP address
VITE_API_URL=http://192.168.1.100:5000/api
VITE_SOCKET_URL=http://192.168.1.100:5000
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBmFCy71VLlgNcbvEQNu2azuSM5flgArE4
```

#### Step 3: Update Capacitor Configuration

Add server configuration to `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.journo.app',
  appName: 'Journo',
  webDir: 'dist',
  
  // Add this for development
  server: {
    // Replace with your computer's IP address
    url: 'http://192.168.1.100:3000',
    cleartext: true  // Allow HTTP in development
  },
  
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    backgroundColor: '#ffffff'
  },
  // ... rest of config
};

export default config;
```

#### Step 4: Configure Backend to Accept External Connections

Update your backend to listen on all network interfaces:

**backend/server.js or backend/index.js:**
```javascript
// Change from:
app.listen(5000, 'localhost', () => {
  console.log('Server running on http://localhost:5000');
});

// To:
app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on http://0.0.0.0:5000');
  console.log('Accessible at http://192.168.1.100:5000'); // Your IP
});
```

#### Step 5: Update iOS Info.plist for HTTP Access

iOS requires explicit permission to use HTTP (non-HTTPS) connections.

**frontend/ios/App/App/Info.plist** - Add this:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <!-- Or more secure, allow only your development server -->
    <key>NSExceptionDomains</key>
    <dict>
        <key>192.168.1.100</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

#### Step 6: Rebuild and Sync

```bash
cd frontend

# Copy the iOS environment file
cp .env.ios .env

# Build with the new configuration
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npm run cap:open:ios
```

#### Step 7: Verify Connection

1. Make sure your backend server is running
2. Make sure your iOS device/simulator is on the same WiFi network
3. Run the app from Xcode
4. Check the Xcode console for connection logs

---

### Option 2: Use ngrok for External Access

If you need to test on a device not on your local network, use ngrok:

#### Step 1: Install ngrok
```bash
brew install ngrok
# Or download from https://ngrok.com/download
```

#### Step 2: Start ngrok Tunnel
```bash
# Tunnel to your backend server
ngrok http 5000
```

This will give you a public URL like: `https://abc123.ngrok.io`

#### Step 3: Update Environment
**frontend/.env.ios**
```bash
VITE_API_URL=https://abc123.ngrok.io/api
VITE_SOCKET_URL=https://abc123.ngrok.io
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBmFCy71VLlgNcbvEQNu2azuSM5flgArE4
```

#### Step 4: Rebuild and Sync
```bash
npm run build
npx cap sync ios
```

**Advantages:**
- Works from anywhere (not just local network)
- Uses HTTPS (no Info.plist changes needed)
- Can share with testers

**Disadvantages:**
- Requires internet connection
- Free tier has limitations
- URL changes each time you restart ngrok

---

### Option 3: Production Configuration

For production/TestFlight builds, use your production server:

**frontend/.env.production**
```bash
VITE_API_URL=https://api.journo.app/api
VITE_SOCKET_URL=https://api.journo.app
VITE_GOOGLE_MAPS_API_KEY=your_production_key
```

Build for production:
```bash
npm run build
npx cap sync ios
```

---

## Quick Setup Script

Create this script to automate the setup:

**frontend/setup-ios-dev.sh**
```bash
#!/bin/bash

# Get local IP address
IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)

if [ -z "$IP" ]; then
    echo "❌ Could not detect IP address"
    echo "Please find your IP manually and update .env.ios"
    exit 1
fi

echo "✅ Detected IP address: $IP"

# Create .env.ios file
cat > .env.ios << EOF
VITE_API_URL=http://$IP:5000/api
VITE_SOCKET_URL=http://$IP:5000
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBmFCy71VLlgNcbvEQNu2azuSM5flgArE4
EOF

echo "✅ Created .env.ios with IP: $IP"

# Copy to .env
cp .env.ios .env
echo "✅ Copied to .env"

# Build and sync
echo "🔨 Building..."
npm run build

echo "📱 Syncing to iOS..."
npx cap sync ios

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure your backend is running on 0.0.0.0:5000"
echo "2. Open Xcode: npm run cap:open:ios"
echo "3. Run the app"
echo ""
echo "Your API URL: http://$IP:5000/api"
```

Make it executable:
```bash
chmod +x setup-ios-dev.sh
```

Run it:
```bash
./setup-ios-dev.sh
```

---

## Troubleshooting

### "Failed to fetch" or "Network request failed"

**Check 1: Backend is accessible**
```bash
# From your terminal, test if backend is accessible
curl http://192.168.1.100:5000/api/health
```

**Check 2: Same WiFi network**
- iOS device must be on the same WiFi as your computer
- Corporate/school networks may block device-to-device communication

**Check 3: Firewall**
```bash
# macOS - Allow incoming connections
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /path/to/node
```

**Check 4: Backend listening on correct interface**
```javascript
// Make sure backend uses 0.0.0.0, not localhost
app.listen(5000, '0.0.0.0');
```

### "App Transport Security" Error

Add the Info.plist configuration from Step 5 above.

### Connection works on simulator but not device

- Simulator can access localhost, physical devices cannot
- Make sure you're using your computer's IP address, not localhost
- Verify device is on same WiFi network

### IP Address Changes

Your IP address may change when you:
- Switch WiFi networks
- Restart your router
- Use VPN

Solution: Re-run the setup script or manually update .env.ios

---

## Environment File Strategy

**Recommended structure:**

```
frontend/
├── .env                    # Current active config (gitignored)
├── .env.example           # Template for new developers
├── .env.local             # Local web development (localhost)
├── .env.ios               # iOS development (your IP)
├── .env.production        # Production build
└── .env.staging           # Staging environment
```

**In .gitignore:**
```
.env
.env.local
.env.ios
```

**Switch between environments:**
```bash
# For web development
cp .env.local .env

# For iOS development
cp .env.ios .env

# For production build
cp .env.production .env
```

---

## Testing the Connection

### Test 1: Backend Health Check
```bash
# Replace with your IP
curl http://192.168.1.100:5000/api/health
```

Expected: `{"status":"ok"}` or similar

### Test 2: From iOS Simulator
```bash
# Simulator can use localhost
curl http://localhost:5000/api/health
```

### Test 3: From iOS Device
Open Safari on your iPhone and navigate to:
```
http://192.168.1.100:5000/api/health
```

If this works, your app should work too.

---

## Summary

**For local iOS development:**
1. Find your computer's IP address
2. Update `.env.ios` with your IP
3. Configure backend to listen on `0.0.0.0`
4. Add HTTP exception to Info.plist
5. Build and sync: `npm run build && npx cap sync ios`
6. Run from Xcode

**For production:**
1. Use production API URL with HTTPS
2. Remove HTTP exceptions from Info.plist
3. Build with production environment

---

## Need Help?

If you're still having issues:

1. Check Xcode console for error messages
2. Check backend logs for incoming requests
3. Verify network connectivity
4. Try the ngrok option if local network has restrictions
