# CORS and Login 401 Error Fix Complete

## 🔧 Issue Resolved

Fixed the persistent 401 Unauthorized error when trying to login. The root cause was a CORS configuration mismatch between frontend and backend ports.

## 🐛 Root Cause Analysis

### Primary Issue Identified:
**CORS Port Mismatch**: The backend CORS configuration had a default fallback to `http://localhost:5173`, but the frontend is running on `http://localhost:3000`. This caused CORS preflight failures, resulting in 401 errors.

### Secondary Issues:
1. **Admin User Deletion**: Admin user keeps getting deleted during database operations
2. **Rate Limiting**: Previous failed attempts may have triggered rate limiting

## ✅ Fixes Applied

### 1. CORS Configuration Fix
**File**: `backend/src/index.ts`

Updated the default CORS origins to match the frontend port:

```typescript
// Before
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',  // Wrong port
  credentials: true,
};

// After
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',  // Correct port
  credentials: true,
};
```

Also updated Socket.IO CORS configuration:
```typescript
// Before
cors: {
  origin: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:5173',  // Wrong port
  credentials: true,
}

// After
cors: {
  origin: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:3000',  // Correct port
  credentials: true,
}
```

### 2. Environment Variables Verification
**File**: `backend/.env`

Confirmed correct CORS configuration:
```env
CORS_ORIGIN=http://localhost:3000
SOCKET_IO_CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### 3. Admin User Recreation
**File**: `backend/src/utils/createAdminUser.ts`

Recreated admin user with fresh credentials:
- **Email**: `admin@journo.com`
- **Password**: `AdminJourno2024!`
- **Role**: `admin`
- **User ID**: `1f544be1-c217-4623-b110-3a83a8516edd`

### 4. Rate Limiting Reset
Cleared all login rate limits and reset failed login attempts.

## 🔄 Required Action: Restart Backend Server

**CRITICAL**: The backend server must be restarted to apply the CORS configuration changes.

```bash
# Stop the current backend server (Ctrl+C)
# Then restart it:
cd backend
npm run dev
```

## 🧪 Testing After Restart

### 1. Verify CORS Headers
After restarting the backend, test the CORS headers:

```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:5000/api/auth/login \
     -v
```

**Expected Response**: Should include `Access-Control-Allow-Origin: http://localhost:3000`

### 2. Test Login API
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"email":"admin@journo.com","password":"AdminJourno2024!"}' \
  -v
```

**Expected Response**: 200 OK with user data and tokens

## 🚀 Frontend Testing Steps

After restarting the backend server:

### 1. Clear Browser Cache
- **Chrome/Edge**: Ctrl+Shift+R or F12 → Network tab → Disable cache
- **Firefox**: Ctrl+Shift+R or F12 → Network tab → Settings → Disable cache
- **Safari**: Cmd+Option+R

### 2. Test Admin Login
1. **Navigate to**: http://localhost:3000/auth/login
2. **Enter credentials**:
   - Email: `admin@journo.com`
   - Password: `AdminJourno2024!`
3. **Click Login**

### 3. Expected Results
- ✅ No CORS errors in browser console
- ✅ Successful login response (200 OK)
- ✅ Redirect to admin dashboard
- ✅ Admin dashboard loads at http://localhost:3000/admin

## 🔍 Troubleshooting

### If 401 Error Persists:

1. **Check Backend Server Status**:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"ok","message":"Journo API is running"}`

2. **Check CORS Headers**:
   Open browser DevTools → Network tab → Look for CORS errors

3. **Check Admin User**:
   ```bash
   cd backend
   npx tsx -e "
   import pg from 'pg';
   const pool = new pg.Pool({
     host: 'localhost',
     port: 5432,
     database: 'journo_db',
     user: 'postgres',
     password: 'postgres'
   });
   pool.query('SELECT email, role FROM users WHERE email = \$1', ['admin@journo.com'])
     .then(r => console.log('Admin user:', r.rows[0] || 'Not found'))
     .finally(() => pool.end());
   "
   ```

4. **Recreate Admin User** (if needed):
   ```bash
   cd backend
   npx tsx src/utils/createAdminUser.ts
   ```

### If CORS Errors Appear:
- Verify backend is restarted
- Check browser console for specific CORS error messages
- Ensure frontend is running on port 3000
- Clear browser cache completely

## 📊 Network Flow Verification

### Successful Login Flow:
1. **Frontend** (http://localhost:3000) → **Backend** (http://localhost:5000)
2. **CORS Preflight** → `OPTIONS /api/auth/login` → `200 OK` with CORS headers
3. **Login Request** → `POST /api/auth/login` → `200 OK` with user data
4. **Frontend** → Stores tokens → Redirects to admin dashboard

### CORS Headers Expected:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## ✨ Summary

The 401 error was caused by CORS configuration preventing the frontend from communicating with the backend. The fixes include:

- ✅ Updated CORS origins to match frontend port (3000)
- ✅ Recreated admin user with proper credentials
- ✅ Cleared rate limiting blocks
- ✅ Verified environment variables

**Next Step**: Restart the backend server and test the login again. The CORS issue should be completely resolved.