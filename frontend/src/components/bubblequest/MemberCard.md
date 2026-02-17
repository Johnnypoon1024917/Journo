# MemberCard Component

A bubblequest-styled card component for displaying trip members with their avatar, name, role, and online status.

## Features

- ✅ Avatar display with automatic initials generation
- ✅ Name and email display
- ✅ Role badge (owner, editor, viewer)
- ✅ Online/offline status indicator
- ✅ Edit/remove actions (for trip owners only)
- ✅ Touch-optimized interactions (44px minimum touch targets)
- ✅ Framer Motion animations
- ✅ Dark mode support
- ✅ Internationalization (i18n) support
- ✅ Accessibility features (ARIA labels, keyboard navigation)

## Requirements

Implements requirements:
- **14.1**: Display avatar, name, role
- **14.3**: Show online/offline status

## Usage

```tsx
import { MemberCard } from '@/components/bubblequest';
import { TripCollaboratorWithUser } from '@/types/collaboration';

const member: TripCollaboratorWithUser = {
  id: 'collab-1',
  trip_id: 'trip-1',
  user_id: 'user-1',
  role: 'editor',
  invited_by: 'user-owner',
  created_at: '2024-01-01T00:00:00Z',
  user: {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
  },
};

// Basic usage
<MemberCard member={member} />

// With online status
<MemberCard member={member} isOnline={true} />

// With management actions (for trip owner)
<MemberCard
  member={member}
  canManage={true}
  onRoleChange={(memberId, newRole) => {
    console.log(`Change ${memberId} to ${newRole}`);
  }}
  onRemove={(memberId) => {
    console.log(`Remove ${memberId}`);
  }}
/>

// Owner member (no actions shown)
<MemberCard
  member={ownerMember}
  isOwner={true}
  canManage={true}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `member` | `TripCollaboratorWithUser` | Required | The member data to display |
| `isOnline` | `boolean` | `false` | Whether the member is currently online |
| `isOwner` | `boolean` | `false` | Whether this member is the trip owner |
| `canManage` | `boolean` | `false` | Whether the current user can manage this member |
| `onRoleChange` | `(memberId: string, newRole: CollaboratorRole) => void` | - | Callback when role is changed |
| `onRemove` | `(memberId: string) => void` | - | Callback when member is removed |
| `className` | `string` | - | Additional CSS classes |

## Role Types

```typescript
type CollaboratorRole = 'owner' | 'editor' | 'viewer';
```

- **Owner**: Full control over the trip and members
- **Editor**: Can edit trip content but not manage members
- **Viewer**: Can only view trip content

## Avatar Initials

The component automatically generates initials from the member's name:

- Single name: First two letters (e.g., "Madonna" → "MA")
- Two names: First letter of each (e.g., "John Doe" → "JD")
- Multiple names: First and last initials (e.g., "Mary Jane Watson" → "MW")

## Status Indicator

The online/offline status is shown as a small colored dot on the avatar:
- 🟢 Green: Online
- ⚫ Gray: Offline

## Actions Menu

When `canManage={true}` and `isOwner={false}`, a three-dot menu appears with:

1. **Change Role**: Switch between editor and viewer roles
2. **Remove Member**: Remove the member from the trip

The menu is hidden for:
- Regular members when `canManage={false}`
- The trip owner (even when `canManage={true}`)

## Animations

- Smooth menu open/close transitions
- Delete animation (slide out) when removing a member
- Hover effects on interactive elements

## Accessibility

- Proper ARIA labels for status indicators and buttons
- Keyboard navigation support
- Focus indicators on interactive elements
- Minimum 44px touch targets for mobile

## Internationalization

The component uses the `members` translation namespace:

```json
{
  "members": {
    "roles": {
      "owner": "Owner",
      "editor": "Editor",
      "viewer": "Viewer"
    },
    "status": {
      "online": "Online",
      "offline": "Offline"
    },
    "actions": {
      "makeEditor": "Make Editor",
      "makeViewer": "Make Viewer",
      "remove": "Remove Member"
    }
  }
}
```

## Styling

The component uses Tailwind CSS with kawaii design tokens:
- Gradient avatar backgrounds
- Rounded corners (2xl)
- Soft shadows
- Theme-aware colors (light/dark mode)

## Example: Members List

```tsx
import { MemberCard } from '@/components/bubblequest';

function MembersList({ members, currentUserId, tripOwnerId }) {
  const handleRoleChange = async (memberId, newRole) => {
    await updateMemberRole(memberId, newRole);
  };

  const handleRemove = async (memberId) => {
    if (confirm('Remove this member?')) {
      await removeMember(memberId);
    }
  };

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          isOnline={onlineUsers.includes(member.user_id)}
          isOwner={member.user_id === tripOwnerId}
          canManage={currentUserId === tripOwnerId}
          onRoleChange={handleRoleChange}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
}
```

## Testing

The component includes comprehensive tests covering:
- Avatar and name display
- Role badge rendering
- Online/offline status
- Action menu functionality
- Role change callbacks
- Remove callbacks
- Accessibility features
- Touch optimization

Run tests:
```bash
npm test -- MemberCard.test.tsx
```
