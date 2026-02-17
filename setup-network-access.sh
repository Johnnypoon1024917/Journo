#!/bin/bash

echo "🔍 Checking network access to backend..."

# Get local IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not determine local IP address"
    exit 1
fi

echo "📍 Your local IP: $LOCAL_IP"

# Test localhost
echo ""
echo "Testing localhost:5000..."
if curl -s http://localhost:5000/api/theme/system > /dev/null 2>&1; then
    echo "✅ Backend accessible on localhost"
else
    echo "❌ Backend NOT accessible on localhost"
    echo "   Start the backend with: cd backend && npm start"
    exit 1
fi

# Test network IP
echo ""
echo "Testing $LOCAL_IP:5000..."
if timeout 2 curl -s http://$LOCAL_IP:5000/api/theme/system > /dev/null 2>&1; then
    echo "✅ Backend accessible on network IP"
else
    echo "❌ Backend NOT accessible on network IP"
    echo ""
    echo "This is likely a firewall issue. To fix:"
    echo "1. Open System Settings → Network → Firewall"
    echo "2. Click 'Options' or 'Firewall Options'"
    echo "3. Find 'node' in the list and ensure it's set to 'Allow incoming connections'"
    echo "4. Or temporarily disable the firewall for testing"
    echo ""
    echo "Alternative: Use localhost and test in browser on this machine"
    echo "   Update frontend/.env to use: VITE_API_URL=http://localhost:5000/api"
fi
