# Invitation Link Controller

## Overview

The Invitation Link Controller provides REST API endpoints for managing shareable invitation links for trip collaboration. It enables trip owners to generate time-limited, usage-limited invitation links that can be shared with potential collaborators.

## Features

- **Generate Invitation Links**: Create shareable links with customizable expiration and usage limits
- **List Active Links**: View all active invitation links for a trip
- **Revoke Links**: Deactivate invitation links before they expire
- **Accept Invitations**: Allow users to join trips via invitation links
- **Public Link Details**: View invitation details without authentication

## API Endpoints

### 1. Generate Invitation Link

**Endpoint**: `POST /api/trips/:tripId/invitation-links`

**Authentication**: Required (Bearer token)

**Permission**: Only trip owners can generate invitation links

**Request Body**:
```json
{
  "role": "editor" | "viewer",
  "expiresIn": 168,  // Optional, hours (default: 168 = 7 days, max: 8760 = 1 year)
  "maxUses": 10      // Optional, null = unlimited
}
```

**Response** (201 Created):
```json
{
  "id": "link-uuid",
  "token": "cryptographic-token",
  "url": "https://app.com/invite/cryptographic-token",
  "role": "editor",
  "expiresAt": "2024-12-31T23:59:59Z",
  "maxUses": 10,
  "useCount": 0,
  "isActive": true,
  "createdAt": "2024-12-24T00:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid parameters (missing role, invalid expiresIn, invalid maxUses)
- `403 Forbidden`: User is not the trip owner
- `404 Not Found`: Trip not found
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl -X POST https://api.example.com/api/trips/trip-123/invitation-links \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "editor",
    "expiresIn": 168,
    "maxUses": 10
  }'
```

---

### 2. Get Invitation Links

**Endpoint**: `GET /api/trips/:tripId/invitation-links`

**Authentication**: Required (Bearer token)

**Permission**: Only trip owners can view invitation links

**Response** (200 OK):
```json
[
  {
    "id": "link-uuid",
    "token": "cryptographic-token",
    "url": "https://app.com/invite/cryptographic-token",
    "role": "editor",
    "createdBy": "user-uuid",
    "createdByName": "John Doe",
    "expiresAt": "2024-12-31T23:59:59Z",
    "maxUses": 10,
    "useCount": 3,
    "isActive": true,
    "createdAt": "2024-12-24T00:00:00Z",
    "updatedAt": "2024-12-24T00:00:00Z"
  }
]
```

**Error Responses**:
- `400 Bad Request`: Missing tripId
- `403 Forbidden`: User is not the trip owner
- `404 Not Found`: Trip not found
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl -X GET https://api.example.com/api/trips/trip-123/invitation-links \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Revoke Invitation Link

**Endpoint**: `DELETE /api/trips/:tripId/invitation-links/:linkId`

**Authentication**: Required (Bearer token)

**Permission**: Only trip owners can revoke invitation links

**Response** (200 OK):
```json
{
  "message": "Link revoked"
}
```

**Error Responses**:
- `400 Bad Request`: Missing tripId or linkId
- `403 Forbidden`: User is not the trip owner
- `404 Not Found`: Trip or link not found
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl -X DELETE https://api.example.com/api/trips/trip-123/invitation-links/link-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Accept Invitation

**Endpoint**: `POST /api/invitation-links/:token/accept`

**Authentication**: Required (Bearer token)

**Permission**: Any authenticated user

**Response** (200 OK):
```json
{
  "trip": {
    "id": "trip-uuid",
    "title": "Tokyo Adventure",
    "destination": "Tokyo, Japan",
    "startDate": "2024-12-25",
    "endDate": "2024-12-31",
    "description": "Amazing trip to Tokyo",
    "coverImage": "https://...",
    "isPublic": false,
    "ownerId": "owner-uuid",
    "ownerName": "Trip Owner",
    "createdAt": "2024-12-01T00:00:00Z",
    "updatedAt": "2024-12-01T00:00:00Z"
  },
  "collaborator": {
    "id": "collaborator-uuid",
    "tripId": "trip-uuid",
    "userId": "user-uuid",
    "role": "editor",
    "invitedBy": "owner-uuid",
    "createdAt": "2024-12-24T00:00:00Z",
    "updatedAt": "2024-12-24T00:00:00Z",
    "user": {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "profilePicture": "https://..."
    },
    "inviter": {
      "id": "owner-uuid",
      "name": "Trip Owner"
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid token, expired link, revoked link, max uses reached, already a collaborator
- `404 Not Found`: Trip not found
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl -X POST https://api.example.com/api/invitation-links/abc123token/accept \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Get Invitation Link Details (Public)

**Endpoint**: `GET /api/invitation-links/:token`

**Authentication**: Not required (public endpoint)

**Permission**: Public access

**Response** (200 OK):
```json
{
  "tripTitle": "Tokyo Adventure",
  "tripDestination": "Tokyo, Japan",
  "role": "editor",
  "inviterName": "Trip Owner",
  "expiresAt": "2024-12-31T23:59:59Z",
  "isValid": true,
  "reason": null  // Only present if isValid is false
}
```

**Error Responses**:
- `400 Bad Request`: Missing token
- `404 Not Found`: Link not found
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl -X GET https://api.example.com/api/invitation-links/abc123token
```

---

## Permission Checks

The controller implements strict permission checks:

1. **Owner-Only Operations**: Generate, list, and revoke operations require the user to be the trip owner
2. **Authenticated Operations**: Accept invitation requires authentication
3. **Public Operations**: Get link details is publicly accessible

Permission checks are performed by querying the database to verify:
- Trip ownership: `SELECT owner_id FROM trips WHERE id = $1`
- User authentication: Via JWT token in Authorization header

## Validation

### Input Validation

- **role**: Must be either 'editor' or 'viewer'
- **expiresIn**: Must be between 1 and 8760 hours (1 year)
- **maxUses**: Must be a positive number or null (unlimited)
- **tripId**: Must be a valid UUID
- **linkId**: Must be a valid UUID
- **token**: Must be a non-empty string

### Link Validation

When accepting an invitation, the service validates:
- Link exists
- Link is active (not revoked)
- Link has not expired
- Link has not reached maximum uses
- User is not already a collaborator

## Error Handling

The controller provides detailed error messages for different scenarios:

- **400 Bad Request**: Invalid input parameters or validation failures
- **403 Forbidden**: Permission denied (not trip owner)
- **404 Not Found**: Resource not found (trip, link)
- **500 Internal Server Error**: Unexpected server errors

All errors are logged to the console for debugging.

## Security Features

1. **Cryptographically Secure Tokens**: Uses `crypto.randomBytes(32)` for token generation
2. **Owner-Only Access**: Only trip owners can manage invitation links
3. **Time-Limited Links**: Links expire after specified duration
4. **Usage Limits**: Optional maximum use count prevents abuse
5. **Revocation**: Links can be deactivated at any time

## Integration with Services

The controller delegates business logic to the `InvitationLinkService`:

- `generateLink()`: Creates new invitation links
- `getActiveLinks()`: Retrieves active links for a trip
- `revokeLink()`: Deactivates a link
- `acceptInvitation()`: Processes invitation acceptance
- `getLinkByToken()`: Retrieves link details
- `validateLink()`: Validates link status

## Database Queries

The controller performs the following database operations:

1. **Owner Check**: `SELECT owner_id FROM trips WHERE id = $1`
2. **Trip Details**: `SELECT t.*, u.name as owner_name FROM trips t LEFT JOIN users u ON t.owner_id = u.id WHERE t.id = $1`
3. **Collaborator Details**: `SELECT tc.*, u.name, u.email, u.profile_picture FROM trip_collaborators tc LEFT JOIN users u ON tc.user_id = u.id WHERE tc.id = $1`

All other database operations are handled by the service layer.

## Testing

Comprehensive test suite covers:

- ✅ Successful operations for all endpoints
- ✅ Input validation (missing parameters, invalid formats)
- ✅ Permission checks (owner-only operations)
- ✅ Error handling (not found, forbidden, server errors)
- ✅ Edge cases (expired links, max uses, already collaborator)

Run tests:
```bash
npm test -- invitationLinkController.test.ts
```

## Usage Example

### Frontend Integration

```typescript
// Generate invitation link
const generateLink = async (tripId: string, role: 'editor' | 'viewer') => {
  const response = await fetch(`/api/trips/${tripId}/invitation-links`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role,
      expiresIn: 168, // 7 days
      maxUses: 10
    })
  });
  
  const link = await response.json();
  return link.url; // Share this URL
};

// Accept invitation
const acceptInvite = async (token: string) => {
  const response = await fetch(`/api/invitation-links/${token}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  const { trip, collaborator } = await response.json();
  // Navigate to trip
  router.push(`/trips/${trip.id}`);
};

// Get link details (public)
const getLinkDetails = async (token: string) => {
  const response = await fetch(`/api/invitation-links/${token}`);
  const details = await response.json();
  
  if (!details.isValid) {
    console.error('Invalid link:', details.reason);
  }
  
  return details;
};
```

## Related Files

- **Service**: `backend/src/services/invitationLinkService.ts`
- **Routes**: `backend/src/routes/invitationLinkRoutes.ts`
- **Tests**: `backend/src/controllers/__tests__/invitationLinkController.test.ts`
- **Migration**: `backend/src/migrations/031_collaboration_enhancements.sql`
- **Design Doc**: `.kiro/specs/collaboration-enhancement/design.md`

## Future Enhancements

Potential improvements:

1. **Email Notifications**: Send email when link is used
2. **Link Analytics**: Track link usage statistics
3. **Custom Messages**: Allow custom invitation messages
4. **Role Restrictions**: Limit which roles can be invited
5. **Batch Invitations**: Generate multiple links at once
6. **Link Templates**: Save link configurations as templates
