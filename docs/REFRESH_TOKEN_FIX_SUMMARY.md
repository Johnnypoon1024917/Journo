# Refresh Token Issue - Investigation & Fix

## Problem
After logging in, the `/api/auth/refresh` endpoint returns 401 (Unauthorized), even though the user just logged in successfully.

## Investigation

### What I Found
1. ✅ **Enhanced Auth Controller** is properly configured and setting cookies
2. ✅ **Enhanced Auth Service** is generating refresh tokens during login
3. ✅ **Routes** are using the enhanced auth system (not the old one)
4. ✅ **Cookie settings** are correct for development (httpOnly, sameSite: 'lax', secure: false)
5. ✅ **CORS** is configured with credentials: true

### What I Added
**Debug logging** to help diagnose the issue:

#### In `enhancedAuthController.ts`:
- Login endpoint now logs when setting the refresh token cookie
- Refresh endpoint now logs what cookies it receives
- Both endpoints show cookie options and token previews

## Next Steps to Debug

### 1. Restart Your Backend
The new logging won't work until you restart:
```bash
cd backend
npm run dev
```

### 2. Clear Browser Cookies
1. Open DevTools (F12)
2. Go to Application → Cookies
3. Delete all cookies for `localhost:5000` and `localhost:3000`

### 3. Log In and Watch Backend Logs
Look for these messages in your backend terminal:

**During Login:**
```
🍪 Setting refresh token cookie: {
  hasToken: true,
  tokenPreview: 'eyJhbGciOiJIUzI1NiIs...',
  cookieOptions: { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 604800000, path: '/' },
  rememberMe: false
}
```

**During Refresh (automatic or manual):**
```
🔄 Refresh token request: {
  hasRefreshToken: true,
  tokenPreview: 'eyJhbGciOiJIUzI1NiIs...',
  cookies: [ 'refreshToken' ],
  ipAddress: '::1',
  userAgent: 'Mozilla/5.0...'
}
```

### 4. Check Browser DevTools

#### Application Tab:
- Go to Application → Cookies → `http://localhost:5000`
- Look for `refreshToken` cookie
- Check its properties (HttpOnly, SameSite, Expires)

#### Network Tab:
- Find the `/api/auth/login` request
- Check Response Headers for `Set-Cookie: refreshToken=...`
- Find the `/api/auth/refresh` request
- Check Request Headers for `Cookie: refreshToken=...`

## Possible Issues & Solutions

### Issue A: Cookie Not Being Set
**Symptoms:** No cookie in browser, no `Set-Cookie` header
**Diagnosis:** Backend logs show "⚠️ No refresh token in login result!"
**Solution:** Check database for refresh_tokens table, check auth service

### Issue B: Cookie Not Being Sent
**Symptoms:** Cookie exists but not sent in requests
**Diagnosis:** Backend logs show "hasRefreshToken: false" but browser has cookie
**Possible Causes:**
1. Frontend not sending `credentials: 'include'`
2. CORS not allowing credentials
3. Cookie domain/path mismatch

**Solution:** Check frontend auth store's fetch calls

### Issue C: Cookie Invalid/Expired
**Symptoms:** Cookie sent but refresh fails
**Diagnosis:** Backend logs show "⚠️ Refresh token validation failed"
**Solution:** Check database refresh_tokens table for the token

### Issue D: Database Issue
**Symptoms:** Login succeeds but no refresh token generated
**Diagnosis:** Backend logs show error during token storage
**Solution:** Check database connection and refresh_tokens table

## Testing Commands

### Check if cookie exists (run in browser console):
```javascript
document.cookie.split(';').find(c => c.trim().startsWith('refreshToken='))
```

### Manual refresh test (run in browser console):
```javascript
fetch('http://localhost:5000/api/auth/refresh', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

### Check database for refresh tokens:
```sql
SELECT id, user_id, expires_at, created_at 
FROM refresh_tokens 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 5;
```

## What to Share

After following the steps above, share:
1. Backend log output during login
2. Backend log output during refresh
3. Screenshot of browser cookies (Application tab)
4. Screenshot of Network tab showing login and refresh requests
5. Any error messages from browser console

This will help me pinpoint the exact issue!
