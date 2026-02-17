# iOS Connection Quick Fix

## Problem
iOS app can't connect to PostgreSQL server because it's using `localhost:5000`.

## Quick Solution (3 Steps)

### Step 1: Run the Setup Script
```bash
cd frontend
./setup-ios-dev.sh
```

This will:
- Detect your computer's IP address
- Create `.env.ios` with the correct configuration
- Build and sync the app to iOS

### Step 2: Start Backend Server
```bash
cd backend
npm start
```

The backend is now configured to:
- Listen on `0.0.0.0:5000` (accepts connections from network)
- Display your local IP address in the console
- Show the URL to use for iOS development

Look for output like:
```
🚀 Server is running on port 5000
📡 Socket.IO is ready for connections
🔗 API available at:
   - Local: http://localhost:5000/api
   - Network: http://192.168.1.100:5000/api
   📱 Use this URL for iOS development
```

### Step 3: Run iOS App
```bash
cd frontend
npm run cap:open:ios
```

Then in Xcode, click Run (▶️) or press `Cmd + R`.

## Verification

### Test Backend is Accessible
```bash
# Replace with your IP from Step 2
curl http://192.168.1.100:5000/api/health
```

Should return: `{"status":"ok"}` or similar

### Test from iOS Device
Open Safari on your iPhone and go to:
```
http://192.168.1.100:5000/api/health
```

If this works, your app will work too.

## What Was Changed

### 1. Frontend Configuration
- ✅ Created `.env.ios` with your computer's IP
- ✅ Updated `Info.plist` to allow HTTP connections
- ✅ Built and synced to iOS

### 2. Backend Configuration
- ✅ Changed `httpServer.listen(PORT)` to `httpServer.listen(PORT, '0.0.0.0')`
- ✅ Added network IP display in console
- ✅ Now accepts connections from iOS devices

## Troubleshooting

### "Connection failed" or "Network error"

**Check 1: Same WiFi Network**
- Your iOS device must be on the same WiFi as your computer
- Corporate/school networks may block device-to-device communication

**Check 2: Backend is Running**
```bash
# Check if backend is running
curl http://localhost:5000/api/health
```

**Check 3: Firewall (macOS)**
```bash
# Allow Node.js through firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add $(which node)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock $(which node)
```

**Check 4: IP Address Changed**
If your IP address changes (new WiFi, router restart, etc.):
```bash
cd frontend
./setup-ios-dev.sh
```

### "App Transport Security" Error

Already fixed! The Info.plist has been updated to allow local HTTP connections.

### Works on Simulator but not Device

- Simulator can use `localhost`, physical devices cannot
- Make sure you ran `./setup-ios-dev.sh` to use your IP address
- Verify device is on same WiFi network

## Switch Back to Web Development

To switch back to web development with localhost:

```bash
cd frontend

# Restore the original .env
cp .env.backup .env

# Or manually edit .env to use localhost
echo "VITE_API_URL=http://localhost:5000/api" > .env
echo "VITE_SOCKET_URL=http://localhost:5000" >> .env
```

## Production Builds

For production/TestFlight builds, use HTTPS:

```bash
cd frontend

# Create production environment
cat > .env.production << EOF
VITE_API_URL=https://api.journo.app/api
VITE_SOCKET_URL=https://api.journo.app
VITE_GOOGLE_MAPS_API_KEY=your_production_key
EOF

# Build for production
npm run build
npx cap sync ios
```

**Important:** Remove or restrict the `NSAppTransportSecurity` settings in Info.plist for production.

## Summary

✅ Backend now listens on `0.0.0.0:5000` (accepts network connections)
✅ Frontend configured with your computer's IP address
✅ Info.plist allows HTTP for local development
✅ Setup script automates the configuration

Your iOS app should now be able to connect to the PostgreSQL server!

## Need More Help?

See the detailed guide: `frontend/IOS_API_CONNECTION_GUIDE.md`
