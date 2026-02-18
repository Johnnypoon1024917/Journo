#!/bin/bash

echo "🧹 Clearing Vite cache and build artifacts..."
echo ""

# Frontend cleanup
if [ -d "frontend/node_modules/.vite" ]; then
    echo "  Removing frontend/.vite cache..."
    rm -rf frontend/node_modules/.vite
fi

if [ -d "frontend/dist" ]; then
    echo "  Removing frontend/dist..."
    rm -rf frontend/dist
fi

if [ -d "frontend/dev-dist" ]; then
    echo "  Removing frontend/dev-dist..."
    rm -rf frontend/dev-dist
fi

# Backend cleanup
if [ -d "backend/dist" ]; then
    echo "  Removing backend/dist..."
    rm -rf backend/dist
fi

echo ""
echo "✅ Cache cleared successfully!"
echo ""
echo "📝 Next steps:"
echo "  1. Restart your dev servers"
echo "  2. Frontend: cd frontend && npm run dev"
echo "  3. Backend: cd backend && npm run dev"
echo "  4. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)"
echo ""
