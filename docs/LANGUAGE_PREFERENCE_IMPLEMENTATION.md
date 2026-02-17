# Language Preference Implementation

## Overview
Implemented user language preference saving to backend database, allowing users to maintain their language selection across sessions and devices.

## Changes Made

### Backend Changes

#### 1. Database Migration
- **File**: `backend/src/migrations/043_add_user_language_preference.sql`
- Added `language` column to `users` table (VARCHAR(10), default 'zh-TW')
- Added index for faster lookups
- Migration successfully applied

#### 2. User Model Updates
- **File**: `backend/src/models/User.ts`
- Added `language?: string` to `User` interface
- Added `language?: string` to `UserResponse` interface
- Updated `update()` method to accept and save language preference
- Updated all SELECT queries to include `language` field

#### 3. Auth Service
- **File**: `backend/src/services/authService.ts`
- No changes needed - uses UserModel which now supports language

#### 4. Auth Controller
- **File**: `backend/src/controllers/authController.ts`
- Added `updateLanguage()` method to handle language preference updates
- Validates language against allowed values: 'en', 'zh-TW', 'zh-CN', 'ja'
- Returns updated user object with new language preference

#### 5. Auth Routes
- **File**: `backend/src/routes/auth.ts`
- Added `PATCH /auth/language` endpoint (protected route)
- Requires authentication via JWT token

### Frontend Changes

#### 1. Auth Service
- **File**: `frontend/src/services/authService.ts`
- Added `updateLanguage()` method to call backend API
- Sends PATCH request to `/auth/language` with language code

#### 2. Language Utility
- **File**: `frontend/src/utils/languageUtils.ts` (NEW)
- Created centralized `changeLanguage()` function
- Handles both i18n language change and backend API call
- Updates localStorage auth data with new language
- Gracefully handles errors (language still changes locally if backend fails)
- Provides `getCurrentLanguage()` and `getAvailableLanguages()` helpers

#### 3. i18n Configuration
- **File**: `frontend/src/i18n/config.ts`
- Updated language detector to check user's saved language preference first
- Priority order:
  1. User's language from auth data (backend)
  2. localStorage i18nextLng
  3. Browser language detection
  4. Default to 'en'

#### 4. Settings Page
- **File**: `frontend/src/pages/Settings.tsx`
- Updated language selector to use `changeLanguage()` utility
- Now saves preference to backend when user changes language

#### 5. Side Navigation
- **File**: `frontend/src/components/kawaii/SideNavigation.tsx`
- Updated language selector to use `changeLanguage()` utility
- Now saves preference to backend when user changes language

#### 6. Trip Settings Screen
- **File**: `frontend/src/pages/TripSettingsScreen.tsx`
- Updated language selector to use `changeLanguage()` utility
- Now saves preference to backend when user changes language

## API Endpoint

### PATCH /auth/language
Updates the authenticated user's language preference.

**Authentication**: Required (JWT token)

**Request Body**:
```json
{
  "language": "en" | "zh-TW" | "zh-CN" | "ja"
}
```

**Response** (200 OK):
```json
{
  "message": "Language preference updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "language": "zh-TW",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:
- 400: Invalid language code
- 401: Authentication required
- 500: Server error

## User Flow

1. User changes language via dropdown in:
   - Settings page (`/settings`)
   - Trip Settings page (`/trips/:id/settings`)
   - Side Navigation (desktop)

2. `changeLanguage()` function is called:
   - Updates i18n language immediately (UI changes)
   - Saves to localStorage
   - Calls backend API to save preference
   - Updates user object in enhanced auth store with new language

3. On next login/page refresh:
   - i18n detector checks enhanced auth store for user's saved language
   - Applies user's preferred language automatically
   - Works across devices (synced via backend)

## Key Implementation Details

### Language Detection Priority
The i18n configuration checks for language in this order:
1. **User's language from enhanced auth store** (`enhanced-auth-storage` in localStorage)
2. **i18next localStorage** (`i18nextLng`)
3. **Browser language detection**
4. **Fallback to English**

### Auth Store Integration
- Added `language?: string` field to User interface in `enhancedAuthStore.ts`
- Language is persisted in the auth store alongside user data
- When language changes, the store is updated immediately
- On app initialization, language is loaded from the persisted auth store

### Fixed Issues
- Removed hardcoded `lng: 'zh-TW'` from i18n config that was overriding the detector
- Updated language detector to read from `enhanced-auth-storage` instead of old `auth` key
- Language now properly persists across page refreshes

## Benefits

- **Persistent**: Language preference saved to database
- **Cross-device**: Works across all user's devices
- **Graceful degradation**: Falls back to localStorage if backend fails
- **Immediate feedback**: UI updates instantly, backend save happens in background
- **Secure**: Protected endpoint requires authentication

## Testing

To test the implementation:

1. Login to the application
2. Change language via any language selector
3. Refresh the page - language should persist
4. Login from another device - language should be the same
5. Check browser console for any errors
6. Verify database has language value: `SELECT id, email, language FROM users;`

## Database Schema

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'zh-TW';

CREATE INDEX IF NOT EXISTS idx_users_language ON users(language);
```

## Migration Status

✅ Migration `043_add_user_language_preference.sql` successfully applied

## Files Modified

### Backend (5 files)
1. `backend/src/migrations/043_add_user_language_preference.sql` (NEW)
2. `backend/src/models/User.ts`
3. `backend/src/controllers/authController.ts`
4. `backend/src/routes/auth.ts`
5. `backend/src/services/authService.ts` (no changes needed)

### Frontend (6 files)
1. `frontend/src/utils/languageUtils.ts` (NEW)
2. `frontend/src/services/authService.ts`
3. `frontend/src/i18n/config.ts`
4. `frontend/src/pages/Settings.tsx`
5. `frontend/src/components/kawaii/SideNavigation.tsx`
6. `frontend/src/pages/TripSettingsScreen.tsx`

## Next Steps

The language preference feature is now fully implemented. Users can:
- Change language from any language selector
- Have their preference saved to their profile
- Access their preferred language across devices
- Experience seamless language persistence

No additional work is required for this feature.
