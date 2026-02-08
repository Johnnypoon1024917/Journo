# Invitation Link Service

## Overview

The `InvitationLinkService` provides functionality for managing shareable invitation links for trip collaboration. It enables trip owners to generate secure, time-limited invitation links that can be shared with potential collaborators.

## Features

- **Cryptographically Secure Token Generation**: Uses `crypto.randomBytes(32)` to generate 64-character hex tokens
- **Expiration Management**: Links can be configured to expire after a specified number of hours
- **Usage Limits**: Optional maximum use count to limit how many times a link can be used
- **Validation**: Comprehensive validation checks for expired, revoked, and max-use-reached links
- **Transaction Safety**: Uses database transactions to ensure data consistency
- **Role-Based Access**: Supports 'editor' and 'viewer' roles for invited collaborators

## API Reference

### `generateLink(options: GenerateLinkOptions): Promise<InvitationLink>`

Generates a new invitation link with a cryptographically secure token.

**Parameters:**
- `tripId` (string): The ID of the trip
- `role` ('editor' | 'viewer'): The role to assign to invited users
- `createdBy` (string): The ID of the user creating the link
- `expiresIn` (number, optional): Hours until expiration (default: 168 = 7 days)
- `maxUses` (number | null, optional): Maximum number of uses (null = unlimited)

**Returns:** `InvitationLink` object with all link details

**Example:**
```typescript
const link = await invitationLinkService.generateLink({
  tripId: 'trip-uuid',
  role: 'editor',
  createdBy: 'user-uuid',
  expiresIn: 168, // 7 days
  maxUses: 5
});
```

### `validateLink(token: string): Promise<ValidationResult>`

Validates an invitation link and checks if it can be used.

**Parameters:**
- `token` (string): The invitation link token

**Returns:** `ValidationResult` with:
- `isValid` (boolean): Whether the link is valid
- `link` (InvitationLink, optional): The link details if found
- `reason` (string, optional): Reason for invalidity

**Validation Checks:**
- Link exists
- Link is active (not revoked)
- Link has not expired
- Link has not reached maximum uses

**Example:**
```typescript
const validation = await invitationLinkService.validateLink(token);
if (validation.isValid) {
  // Proceed with invitation acceptance
} else {
  console.log(`Invalid: ${validation.reason}`);
}
```

### `acceptInvitation(token: string, userId: string): Promise<AcceptInvitationResult>`

Accepts an invitation and adds the user as a collaborator to the trip.

**Parameters:**
- `token` (string): The invitation link token
- `userId` (string): The ID of the user accepting the invitation

**Returns:** `AcceptInvitationResult` with:
- `collaboratorId` (string): The ID of the new collaborator record
- `tripId` (string): The trip ID
- `userId` (string): The user ID
- `role` ('editor' | 'viewer'): The assigned role

**Behavior:**
- Validates the link before accepting
- Checks if user is already a collaborator
- Adds user as collaborator with specified role
- Increments the link's use count
- Uses database transaction for atomicity

**Throws:**
- Error if link is invalid
- Error if user is already a collaborator

**Example:**
```typescript
try {
  const result = await invitationLinkService.acceptInvitation(token, userId);
  console.log(`User added as ${result.role}`);
} catch (error) {
  console.error('Failed to accept invitation:', error.message);
}
```

### `revokeLink(linkId: string, tripId: string): Promise<void>`

Revokes an invitation link, making it unusable.

**Parameters:**
- `linkId` (string): The ID of the link to revoke
- `tripId` (string): The trip ID (for verification)

**Throws:**
- Error if link not found

**Example:**
```typescript
await invitationLinkService.revokeLink(linkId, tripId);
```

### `getActiveLinks(tripId: string): Promise<InvitationLink[]>`

Retrieves all active (non-revoked) invitation links for a trip.

**Parameters:**
- `tripId` (string): The trip ID

**Returns:** Array of `InvitationLink` objects, ordered by creation date (newest first)

**Example:**
```typescript
const activeLinks = await invitationLinkService.getActiveLinks(tripId);
console.log(`Found ${activeLinks.length} active links`);
```

### `getLinkByToken(token: string): Promise<InvitationLink | null>`

Retrieves an invitation link by its token (public access, no validation).

**Parameters:**
- `token` (string): The invitation link token

**Returns:** `InvitationLink` object or `null` if not found

**Note:** This method returns the link regardless of its status (active, revoked, expired). Use `validateLink()` for validation.

**Example:**
```typescript
const link = await invitationLinkService.getLinkByToken(token);
if (link) {
  console.log(`Link created by: ${link.createdByName}`);
}
```

## Data Types

### InvitationLink
```typescript
interface InvitationLink {
  id: string;
  tripId: string;
  token: string;
  role: 'editor' | 'viewer';
  createdBy: string;
  createdByName?: string;
  expiresAt: Date;
  maxUses: number | null;
  useCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### ValidationResult
```typescript
interface ValidationResult {
  isValid: boolean;
  link?: InvitationLink;
  reason?: string;
}
```

### AcceptInvitationResult
```typescript
interface AcceptInvitationResult {
  collaboratorId: string;
  tripId: string;
  userId: string;
  role: 'editor' | 'viewer';
}
```

## Security Considerations

1. **Token Generation**: Uses `crypto.randomBytes(32)` for cryptographically secure random tokens (64 hex characters)
2. **Expiration**: All links have an expiration date to limit exposure
3. **Revocation**: Links can be revoked at any time by trip owners
4. **Usage Limits**: Optional max uses prevent unlimited sharing
5. **Validation**: Comprehensive validation before accepting invitations
6. **Transactions**: Database transactions ensure data consistency

## Database Schema

The service uses the `invitation_links` table:

```sql
CREATE TABLE invitation_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('editor', 'viewer')),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    max_uses INTEGER DEFAULT NULL,
    use_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Testing

The service includes comprehensive unit tests covering:

- ✅ Token generation with cryptographic security
- ✅ Link validation (valid, expired, revoked, max uses)
- ✅ Invitation acceptance with transaction handling
- ✅ Link revocation
- ✅ Active links retrieval
- ✅ Duplicate prevention
- ✅ Error handling
- ✅ Edge cases

**Test Coverage:** >80%

Run tests with:
```bash
npm test -- invitationLinkService.test.ts
```

Or run manual integration test:
```bash
npx tsx test_invitation_link_service.ts
```

## Usage Example

```typescript
import { invitationLinkService } from './services/invitationLinkService';

// 1. Generate a link
const link = await invitationLinkService.generateLink({
  tripId: 'trip-123',
  role: 'editor',
  createdBy: 'owner-456',
  expiresIn: 168, // 7 days
  maxUses: 10
});

console.log(`Share this link: https://app.com/invite/${link.token}`);

// 2. Validate the link (when user clicks it)
const validation = await invitationLinkService.validateLink(link.token);
if (!validation.isValid) {
  throw new Error(validation.reason);
}

// 3. Accept the invitation
const result = await invitationLinkService.acceptInvitation(
  link.token,
  'new-user-789'
);

console.log(`User added as ${result.role}`);

// 4. Get all active links
const activeLinks = await invitationLinkService.getActiveLinks('trip-123');
console.log(`Active links: ${activeLinks.length}`);

// 5. Revoke a link
await invitationLinkService.revokeLink(link.id, 'trip-123');
```

## Error Handling

The service throws errors for:
- Invalid tokens
- Expired links
- Revoked links
- Max uses reached
- Duplicate collaborators
- Database errors

Always wrap service calls in try-catch blocks:

```typescript
try {
  await invitationLinkService.acceptInvitation(token, userId);
} catch (error) {
  if (error.message.includes('expired')) {
    // Handle expired link
  } else if (error.message.includes('revoked')) {
    // Handle revoked link
  } else if (error.message.includes('already a collaborator')) {
    // Handle duplicate
  } else {
    // Handle other errors
  }
}
```

## Integration with Controllers

The service is designed to be used by the `invitationLinkController`:

```typescript
// In controller
export const generateInvitationLink = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { role, expiresIn, maxUses } = req.body;
    const userId = req.user?.userId;

    const link = await invitationLinkService.generateLink({
      tripId,
      role,
      createdBy: userId,
      expiresIn,
      maxUses
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.json({
      ...link,
      url: `${baseUrl}/invite/${link.token}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate invitation link' });
  }
};
```

## Performance Considerations

- Uses database indexes on `token`, `trip_id`, and `expires_at` columns
- Efficient queries with proper WHERE clauses
- Transaction usage minimized to critical operations
- No N+1 query problems

## Future Enhancements

Potential improvements:
- Email notifications when link is used
- Link usage analytics
- Custom link aliases
- Link templates
- Batch link generation
- Link expiration reminders
