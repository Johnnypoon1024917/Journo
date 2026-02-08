# Invitation Link Controller - Manual Testing Guide

## Prerequisites

1. Backend server running: `npm run dev` in `backend/` directory
2. Valid authentication token (JWT)
3. Existing trip with you as the owner

## Test Scenarios

### 1. Generate Invitation Link

**Endpoint**: `POST /api/trips/:tripId/invitation-links`

```bash
# Replace YOUR_TOKEN and TRIP_ID with actual values
curl -X POST http://localhost:5000/api/trips/TRIP_ID/invitation-links \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "editor",
    "expiresIn": 168,
    "maxUses": 10
  }'
```

**Expected Response** (201):
```json
{
  "id": "uuid",
  "token": "cryptographic-token",
  "url": "http://localhost:3000/invite/cryptographic-token",
  "role": "editor",
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "maxUses": 10,
  "useCount": 0,
  "isActive": true,
  "createdAt": "2024-12-24T00:00:00.000Z"
}
```

### 2. Get Active Invitation Links

**Endpoint**: `GET /api/trips/:tripId/invitation-links`

```bash
curl -X GET http://localhost:5000/api/trips/TRIP_ID/invitation-links \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response** (200):
```json
[
  {
    "id": "uuid",
    "token": "cryptographic-token",
    "url": "http://localhost:3000/invite/cryptographic-token",
    "role": "editor",
    "createdBy": "user-uuid",
    "createdByName": "Your Name",
    "expiresAt": "2024-12-31T23:59:59.000Z",
    "maxUses": 10,
    "useCount": 0,
    "isActive": true,
    "createdAt": "2024-12-24T00:00:00.000Z",
    "updatedAt": "2024-12-24T00:00:00.000Z"
  }
]
```

### 3. Get Invitation Link Details (Public)

**Endpoint**: `GET /api/invitation-links/:token`

```bash
# No authentication required
curl -X GET http://localhost:5000/api/invitation-links/TOKEN
```

**Expected Response** (200):
```json
{
  "tripTitle": "Trip Title",
  "tripDestination": "Destination",
  "role": "editor",
  "inviterName": "Your Name",
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "isValid": true
}
```

### 4. Accept Invitation

**Endpoint**: `POST /api/invitation-links/:token/accept`

```bash
# Use a different user's token
curl -X POST http://localhost:5000/api/invitation-links/TOKEN/accept \
  -H "Authorization: Bearer DIFFERENT_USER_TOKEN"
```

**Expected Response** (200):
```json
{
  "trip": {
    "id": "trip-uuid",
    "title": "Trip Title",
    "destination": "Destination",
    ...
  },
  "collaborator": {
    "id": "collab-uuid",
    "role": "editor",
    "user": {
      "id": "user-uuid",
      "name": "User Name",
      "email": "user@example.com"
    },
    ...
  }
}
```

### 5. Revoke Invitation Link

**Endpoint**: `DELETE /api/trips/:tripId/invitation-links/:linkId`

```bash
curl -X DELETE http://localhost:5000/api/trips/TRIP_ID/invitation-links/LINK_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response** (200):
```json
{
  "message": "Link revoked"
}
```

## Error Testing

### Test 1: Generate Link Without Authentication

```bash
curl -X POST http://localhost:5000/api/trips/TRIP_ID/invitation-links \
  -H "Content-Type: application/json" \
  -d '{"role": "editor"}'
```

**Expected**: 401 Unauthorized

### Test 2: Generate Link as Non-Owner

```bash
# Use a token from a user who is not the trip owner
curl -X POST http://localhost:5000/api/trips/TRIP_ID/invitation-links \
  -H "Authorization: Bearer NON_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "editor"}'
```

**Expected**: 403 Forbidden

### Test 3: Invalid Role

```bash
curl -X POST http://localhost:5000/api/trips/TRIP_ID/invitation-links \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "invalid"}'
```

**Expected**: 400 Bad Request

### Test 4: Invalid expiresIn

```bash
curl -X POST http://localhost:5000/api/trips/TRIP_ID/invitation-links \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "editor", "expiresIn": 10000}'
```

**Expected**: 400 Bad Request

### Test 5: Accept Expired Link

```bash
# Use a token that has expired
curl -X POST http://localhost:5000/api/invitation-links/EXPIRED_TOKEN/accept \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected**: 400 Bad Request with message "Invitation link has expired"

### Test 6: Accept Link Twice

```bash
# Accept the same link twice with the same user
curl -X POST http://localhost:5000/api/invitation-links/TOKEN/accept \
  -H "Authorization: Bearer USER_TOKEN"

# Second attempt
curl -X POST http://localhost:5000/api/invitation-links/TOKEN/accept \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected**: Second attempt returns 400 Bad Request with message "You are already a collaborator on this trip"

## Verification Checklist

- [ ] Generate link returns 201 with valid link data
- [ ] Get links returns array of active links
- [ ] Get link details (public) works without auth
- [ ] Accept invitation adds user as collaborator
- [ ] Revoke link deactivates the link
- [ ] Non-owner cannot generate/revoke links (403)
- [ ] Invalid parameters return 400 errors
- [ ] Expired links cannot be accepted
- [ ] Already-collaborator cannot accept again
- [ ] Revoked links cannot be accepted

## Database Verification

After testing, verify in the database:

```sql
-- Check invitation links
SELECT * FROM invitation_links WHERE trip_id = 'TRIP_ID';

-- Check collaborators
SELECT * FROM trip_collaborators WHERE trip_id = 'TRIP_ID';

-- Check link usage
SELECT token, use_count, max_uses, is_active, expires_at 
FROM invitation_links 
WHERE trip_id = 'TRIP_ID';
```

## Notes

- Replace `YOUR_TOKEN`, `TRIP_ID`, `LINK_ID`, `TOKEN` with actual values
- Use different user tokens to test permission checks
- Check server logs for detailed error messages
- Verify database state after each operation
