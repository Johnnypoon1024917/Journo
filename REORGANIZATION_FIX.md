# Fix for Module Not Found Errors After Reorganization

## Issue

After reorganizing files, you may see 404 errors like:
```
http://localhost:3000/src/services/collaboratorService.ts?t=... net::ERR_ABORTED 404 (Not Found)
```

This happens because:
1. Vite's dev server has cached the old module paths
2. The browser has cached module imports
3. Build artifacts reference old paths

## Solution

Run these commands to clear all caches and restart:

### Frontend

```bash
cd frontend

# Stop the dev server (Ctrl+C)

# Clear Vite cache
rm -rf node_modules/.vite

# Clear dist folder
rm -rf dist

# Clear dev-dist folder  
rm -rf dev-dist

# Restart dev server
npm run dev
```

### Full Clean (if above doesn't work)

```bash
cd frontend

# Stop the dev server

# Clear all caches and builds
rm -rf node_modules/.vite dist dev-dist

# Clear browser cache:
# - Open DevTools (F12)
# - Right-click refresh button
# - Select "Empty Cache and Hard Reload"

# Restart
npm run dev
```

### Backend (if needed)

```bash
cd backend

# Clear TypeScript build cache
rm -rf dist

# Rebuild
npm run build
```

## Verification

After restarting, verify the new paths work:

```bash
# Check that files exist in new locations
ls frontend/src/features/ai/
ls frontend/src/features/collab/

# Should show:
# features/ai/: quickPlanService.ts, useDestinationSuggestions.ts, etc.
# features/collab/: collaboratorService.ts, usePresence.ts, useItemLock.ts
```

## Import Updates (if you have custom code)

If you have custom code importing these files, update the paths:

### Old Imports
```typescript
// ❌ Old - will fail
import { collaboratorService } from '../services/collaboratorService';
import usePresence from '../hooks/usePresence';
import useItemLock from '../hooks/useItemLock';
import { quickPlanService } from '../services/quickPlanService';
import useDestinationSuggestions from '../hooks/useDestinationSuggestions';
```

### New Imports
```typescript
// ✅ New - correct paths
import { collaboratorService, usePresence, useItemLock } from '../features/collab';
import { quickPlanService, useDestinationSuggestions } from '../features/ai';
```

## Prevention

To avoid this in the future:
1. Always clear Vite cache after major file moves: `rm -rf node_modules/.vite`
2. Use hard refresh in browser after reorganization
3. Restart dev server after moving files

## Still Having Issues?

If problems persist:

1. **Check for stale imports**
   ```bash
   # Search for old import paths
   grep -r "services/collaboratorService" frontend/src/
   grep -r "hooks/usePresence" frontend/src/
   grep -r "hooks/useItemLock" frontend/src/
   ```

2. **Clear everything**
   ```bash
   cd frontend
   rm -rf node_modules/.vite dist dev-dist
   npm install
   npm run dev
   ```

3. **Check browser console**
   - Open DevTools (F12)
   - Look for specific files causing 404s
   - Clear browser cache completely

4. **Verify file locations**
   ```bash
   find frontend/src -name "collaboratorService.ts"
   find frontend/src -name "usePresence.ts"
   ```

## Quick Fix Script

Save this as `clear-cache.sh` in the project root:

```bash
#!/bin/bash

echo "Clearing Vite cache and build artifacts..."

cd frontend
rm -rf node_modules/.vite
rm -rf dist
rm -rf dev-dist

cd ../backend
rm -rf dist

echo "✅ Cache cleared!"
echo "Now restart your dev servers:"
echo "  Frontend: cd frontend && npm run dev"
echo "  Backend: cd backend && npm run dev"
```

Make it executable:
```bash
chmod +x clear-cache.sh
./clear-cache.sh
```

---

**Note**: This is a one-time issue after the reorganization. Once caches are cleared and the dev server restarted, everything will work normally.
