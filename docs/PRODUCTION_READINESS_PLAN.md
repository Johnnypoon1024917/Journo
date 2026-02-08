# Production Readiness Plan

## ✅ Task 1: Optimize Notification Deduplication (COMPLETED)

### Problem
One reorder action creates multiple notifications (one per collaborator/owner).

### Solution
Implemented notification batching/deduplication:
1. Check if similar notification exists in last 5 minutes
2. If exists, update existing notification instead of creating new one
3. Update message to generic "reordered activities" and increment count

### Implementation
- ✅ Added deduplication logic in `NotificationService.notifyActivityReordered()`
- ✅ Checks for existing unread notifications of same type for same trip
- ✅ Updates timestamp instead of creating duplicate

## ✅ Task 2: Remove localStorage, Move to Database (COMPLETED)

### Completed Migrations

#### ✅ 1. Booking Management (預約管理)
- **Status**: COMPLETED
- **Implementation**: 
  - Created `bookings` database table with full schema
  - Implemented CRUD API endpoints with access control
  - Updated `bookingService.ts` to use API instead of localStorage
  - Removed all localStorage logic
- **Details**: See `BOOKINGS_SHOPPING_DATABASE_MIGRATION.md`

#### ✅ 2. Shopping List
- **Status**: COMPLETED
- **Implementation**:
  - Created `shopping_items` database table with full schema
  - Implemented CRUD API endpoints with access control
  - Updated `shoppingService.ts` to use API instead of localStorage
  - Removed all localStorage logic
- **Details**: See `BOOKINGS_SHOPPING_DATABASE_MIGRATION.md`

### Remaining localStorage Usage

See `LOCALSTORAGE_AUDIT.md` for complete audit. Remaining items are:
- ✅ Acceptable: PWA preferences, analytics opt-out, language preference, layout preferences
- ⚠️ Needs review: Direct token access in some services, regeneration memory size limits
- 🔄 To migrate: Offline queue (move to IndexedDB)

## Next Steps

### Phase 2: Fix Token Access
Update services that access `localStorage.getItem('accessToken')` directly:
- `routeCalculationService.ts`
- `quickPlanOfflineService.ts`
- `analyticsService.ts`

Should use: `useEnhancedAuthStore.getState().accessToken`

### Phase 3: Optimization
1. Move offline queue to IndexedDB
2. Add size limits to regeneration memory
3. Test all features thoroughly in production-like environment

## Testing Checklist

### Bookings & Shopping
- [ ] Create booking - verify it persists in database
- [ ] Update booking - verify changes saved
- [ ] Delete booking - verify removed from database
- [ ] Create shopping item - verify it persists
- [ ] Toggle shopping item purchased status
- [ ] Update shopping item - verify changes saved
- [ ] Delete shopping item - verify removed
- [ ] Verify collaborators can see and modify items
- [ ] Verify data persists across browser sessions
- [ ] Verify no localStorage usage for bookings/shopping

### Notifications
- [ ] Verify activity reorder creates only one notification
- [ ] Verify notification deduplication works
- [ ] Verify notifications persist in database
