# Language Persistence Fix

## Issue
User reported that after switching to Japanese and refreshing the page, the language would revert back to Chinese (zh-TW).

## Root Cause
1. **Hardcoded default language**: The i18n config had `lng: 'zh-TW'` hardcoded, which overrode the language detector
2. **Wrong localStorage key**: The language detector was looking for `auth` key in localStorage, but the app uses `enhanced-auth-storage` for the Zustand persist middleware
3. **Missing language field**: The User interface in enhancedAuthStore didn't include the `language` field

## Solution

### 1. Removed Hardcoded Language
**File**: `frontend/src/i18n/config.ts`
- Removed `lng: 'zh-TW'` from i18n.init() configuration
- This allows the language detector to work properly

### 2. Updated Language Detector
**File**: `frontend/src/i18n/config.ts`
- Changed to read from `enhanced-auth-storage` instead of `auth`
- Added proper error handling and console logs for debugging
- Language detection priority:
  1. User's language from enhanced auth store
  2. i18nextLng from localStorage
  3. Browser language detection
  4. Fallback to English

### 3. Added Language Field to User Interface
**File**: `frontend/src/stores/enhancedAuthStore.ts`
- Added `language?: string` to the User interface
- This ensures the language field is properly typed and persisted

### 4. Updated Language Utils
**File**: `frontend/src/utils/languageUtils.ts`
- Changed to use `useEnhancedAuthStore` instead of localStorage directly
- Updates the user object in the store when language changes
- Properly syncs with backend API

## Testing Steps

1. **Login to the application**
2. **Change language to Japanese** (日本語)
   - Use any language selector (Settings, Trip Settings, or Side Navigation)
3. **Verify UI changes to Japanese immediately**
4. **Refresh the page** (F5 or Cmd+R)
5. **Verify language remains Japanese after refresh**
6. **Check browser console** for language detection logs:
   ```
   🌐 Loading language from user profile: ja
   ```

## Debug Console Logs

When the app loads, you should see one of these logs:
- `🌐 Loading language from user profile: ja` - Language loaded from user's saved preference
- `🌐 Loading language from localStorage: ja` - Language loaded from i18next cache
- `🌐 Detected browser language: ja` - Language detected from browser
- `🌐 Using default language: en` - Fallback to English

When changing language:
- `✅ Language preference saved to backend: ja` - Language successfully saved to backend

## Files Modified

1. `frontend/src/i18n/config.ts` - Fixed language detector and removed hardcoded default
2. `frontend/src/stores/enhancedAuthStore.ts` - Added language field to User interface
3. `frontend/src/utils/languageUtils.ts` - Updated to use enhanced auth store
4. `docs/LANGUAGE_PREFERENCE_IMPLEMENTATION.md` - Updated documentation

## Verification

To verify the fix is working:

1. Open browser DevTools Console
2. Login to the app
3. Change language to Japanese
4. Look for: `✅ Language preference saved to backend: ja`
5. Refresh the page
6. Look for: `🌐 Loading language from user profile: ja`
7. Verify UI is in Japanese

## Database Verification

You can also verify the language is saved in the database:

```sql
SELECT id, email, language FROM users WHERE email = 'your-email@example.com';
```

Should show:
```
language
--------
ja
```

## Status

✅ Fixed - Language now persists correctly across page refreshes

## Additional Fix Required

The backend was using `enhancedAuth` routes instead of the regular `auth` routes. Added the language endpoint to the enhanced auth routes:

### Files Modified (Additional)
1. `backend/src/routes/enhancedAuth.ts` - Added PATCH /api/auth/language endpoint
2. `backend/src/controllers/enhancedAuthController.ts` - Added updateLanguage method and db property

The endpoint is now available at `PATCH /api/auth/language` and requires authentication.
