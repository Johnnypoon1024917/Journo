# localStorage Audit & Migration Plan

## Critical for Production (Must Move to Database)

### 1. **Booking Management (預約管理)** ✅ COMPLETED
- **File**: `frontend/src/services/bookingService.ts`
- **Status**: Migrated to database
- **Solution**: Created `bookings` table with full API endpoints

### 2. **Shopping List** ✅ COMPLETED
- **File**: `frontend/src/services/shoppingService.ts`
- **Status**: Migrated to database
- **Solution**: Created `shopping_items` table with full API endpoints

### 3. **Offline Queue** ⚠️ MEDIUM PRIORITY
- **File**: `frontend/src/services/offlineQueueService.ts`
- **Usage**: Stores pending sync operations
- **Impact**: Lost operations if browser cleared
- **Solution**: Move to IndexedDB or database

## Acceptable localStorage Usage (Can Keep)

### 1. **PWA Install Preferences**
- **Files**: `pwaService.ts`, `PWAInstallPrompt.tsx`, `PWAManager.ts`
- **Usage**: Remember if user dismissed install prompt
- **Reason**: UI preference, not critical data

### 2. **Analytics Opt-Out**
- **File**: `analyticsService.ts`
- **Usage**: Remember user's analytics preference
- **Reason**: Privacy preference, should persist locally

### 3. **Feature Flag Snapshots**
- **File**: `featureFlagService.ts`
- **Usage**: Cache feature flag states
- **Reason**: Performance optimization, not critical

### 4. **Language Preference**
- **File**: `LanguageSelector.tsx`
- **Usage**: Remember selected language
- **Reason**: UI preference

### 5. **Layout Preferences**
- **File**: `TripPlannerLayout.tsx`
- **Usage**: Remember panel sizes
- **Reason**: UI preference

### 6. **Auth Last Activity**
- **File**: `authenticationStateManager.ts`
- **Usage**: Track session activity
- **Reason**: Security feature, temporary

## Problematic Usage (Needs Review)

### 1. **Direct Token Access**
- **Files**: `routeCalculationService.ts`, `quickPlanOfflineService.ts`, `analyticsService.ts`
- **Issue**: Accessing `localStorage.getItem('accessToken')` directly
- **Problem**: Should use auth store instead
- **Solution**: Use `useEnhancedAuthStore.getState().accessToken`

### 2. **Regeneration Memory**
- **File**: `regenerationMemoryService.ts`
- **Usage**: Stores AI regeneration context
- **Impact**: Could be large, should have limits
- **Solution**: Add size limits or move to IndexedDB

## Migration Priority

### Phase 1: Critical Data (This Week)
1. ✅ Notification deduplication (DONE)
2. ✅ Bookings to database (DONE - See BOOKINGS_SHOPPING_DATABASE_MIGRATION.md)
3. ✅ Shopping to database (DONE - See BOOKINGS_SHOPPING_DATABASE_MIGRATION.md)

### Phase 2: Fix Token Access (This Week)
4. Update services to use auth store instead of localStorage

### Phase 3: Optimization (Next Week)
5. Move offline queue to IndexedDB
6. Add size limits to regeneration memory

## Completed Migrations

### ✅ Bookings & Shopping (Completed)
- **Date**: Current
- **Details**: See `BOOKINGS_SHOPPING_DATABASE_MIGRATION.md`
- **Changes**:
  - Created `bookings` and `shopping_items` database tables
  - Implemented full CRUD API endpoints with access control
  - Updated frontend services to use API instead of localStorage
  - Removed all localStorage usage for bookings and shopping
  - Data now persists in PostgreSQL database
  - Both trip owner and collaborators can access/modify items
