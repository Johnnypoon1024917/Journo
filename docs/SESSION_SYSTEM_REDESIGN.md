# Session System Redesign

## Problem
Cookie-based refresh tokens don't work reliably across different ports (localhost:3000 and localhost:5000), causing constant 401 errors.

## Solution
Implement a complete database-backed session system where:
1. All session data stored in database (user_sessions table already exists)
2. Frontend only stores session ID in memory (no localStorage, no cookies)
3. Backend validates session ID against database
4. Sessions automatically expire and clean up

## Architecture

### Frontend
- Store only: `sessionId` and `accessToken` in memory (Zustand store)
- Send `sessionId` in Authorization header: `Bearer {accessToken}:{sessionId}`
- No localStorage, no cookies, no persistence
- User must login again on page refresh (secure by default)

### Backend
- Validate both accessToken and sessionId
- Check session exists in database and is not expired
- Update last_activity on each request
- Clean up expired sessions automatically

## Implementation Steps

1. Update auth middleware to accept sessionId
2. Update login to return sessionId
3. Update frontend to send sessionId with every request
4. Remove all cookie logic
5. Remove localStorage persistence
6. Add session cleanup job

## Benefits
- No cross-origin cookie issues
- More secure (sessions in database, not client)
- Easy to invalidate sessions
- Easy to track active sessions
- Works reliably across all environments
