# Migration 031: Collaboration Enhancements

## Overview

This migration adds database support for enhanced collaboration features in the trip planning application. It introduces two new tables and enhances two existing tables to support:

- Shareable invitation links with expiration
- Activity logging for audit trails
- Real-time presence tracking
- Enhanced notification management

## Changes

### New Tables

#### 1. `invitation_links`
Stores shareable invitation links that allow users to join trips without email invitations.

**Columns:**
- `id` (UUID, PK) - Unique identifier
- `trip_id` (UUID, FK) - Reference to trips table
- `token` (VARCHAR, UNIQUE) - Unique token for the invitation URL
- `role` (VARCHAR) - Role to grant (editor/viewer)
- `created_by` (UUID, FK) - User who created the link
- `expires_at` (TIMESTAMP) - When the link expires
- `max_uses` (INTEGER, nullable) - Maximum number of uses (NULL = unlimited)
- `use_count` (INTEGER) - Number of times the link has been used
- `is_active` (BOOLEAN) - Whether the link is active
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- `idx_invitation_links_token` - Fast lookup by token
- `idx_invitation_links_trip_id` - Fast lookup by trip
- `idx_invitation_links_expires_at` - Fast cleanup of expired links

#### 2. `activity_log`
Tracks all changes to trip content for audit trails and activity feeds.

**Columns:**
- `id` (UUID, PK) - Unique identifier
- `trip_id` (UUID, FK) - Reference to trips table
- `user_id` (UUID, FK, nullable) - User who made the change
- `action_type` (VARCHAR) - Type of action (e.g., 'place_added', 'day_updated')
- `entity_type` (VARCHAR) - Type of entity affected (e.g., 'place', 'day')
- `entity_id` (UUID, nullable) - ID of the affected entity
- `entity_name` (TEXT) - Human-readable name of the entity
- `changes` (JSONB) - Detailed change data
- `metadata` (JSONB) - Additional context
- `created_at` (TIMESTAMP) - When the action occurred

**Indexes:**
- `idx_activity_log_trip_id` - Fast lookup by trip
- `idx_activity_log_user_id` - Fast lookup by user
- `idx_activity_log_created_at` - Fast chronological queries
- `idx_activity_log_action_type` - Fast filtering by action type

**Supported Action Types:**
- Trip: `trip_created`, `trip_updated`, `trip_deleted`
- Days: `day_added`, `day_updated`, `day_deleted`
- Places: `place_added`, `place_updated`, `place_deleted`, `place_reordered`
- Packing: `packing_item_added`, `packing_item_updated`, `packing_item_deleted`
- Shopping: `shopping_item_added`, `shopping_item_updated`, `shopping_item_deleted`
- Collaborators: `collaborator_added`, `collaborator_removed`, `collaborator_role_changed`
- Stories: `story_added`, `story_deleted`

### Enhanced Tables

#### 3. `trip_collaborators`
Added columns for real-time presence tracking.

**New Columns:**
- `last_active_at` (TIMESTAMP) - Last time the user was active
- `is_online` (BOOLEAN) - Whether the user is currently online
- `current_editing_entity` (VARCHAR) - What the user is currently editing
- `current_editing_entity_id` (UUID) - ID of the entity being edited

**New Indexes:**
- `idx_trip_collaborators_last_active` - Fast sorting by activity

#### 4. `notifications`
Added columns for better notification management.

**New Columns:**
- `is_read` (BOOLEAN) - Whether the notification has been read
- `read_at` (TIMESTAMP) - When the notification was read
- `category` (VARCHAR) - Category (collaboration/activity/mention/system/general)
- `priority` (VARCHAR) - Priority level (low/normal/high/urgent)
- `action_url` (TEXT) - URL to navigate to when clicked
- `expires_at` (TIMESTAMP) - When the notification expires

**New Indexes:**
- `idx_notifications_is_read` - Fast filtering by read status
- `idx_notifications_category` - Fast filtering by category
- `idx_notifications_created_at` - Fast chronological queries

## Helper Functions

### 1. `cleanup_expired_invitation_links()`
Removes expired invitation links from the database.

**Returns:** Number of links deleted

**Usage:**
```sql
SELECT cleanup_expired_invitation_links();
```

### 2. `validate_invitation_link(token VARCHAR)`
Validates an invitation link and returns its status.

**Parameters:**
- `token` - The invitation link token

**Returns:**
- `is_valid` (BOOLEAN) - Whether the link is valid
- `link_id` (UUID) - ID of the link
- `trip_id` (UUID) - ID of the trip
- `role` (VARCHAR) - Role to grant
- `reason` (TEXT) - Reason for validity status

**Usage:**
```sql
SELECT * FROM validate_invitation_link('abc123token');
```

### 3. `increment_invitation_link_use(link_id UUID)`
Increments the use count for an invitation link.

**Parameters:**
- `link_id` - ID of the invitation link

**Usage:**
```sql
SELECT increment_invitation_link_use('00000000-0000-0000-0000-000000000001');
```

### 4. `log_activity(...)`
Logs an activity to the activity_log table.

**Parameters:**
- `p_trip_id` (UUID) - Trip ID
- `p_user_id` (UUID) - User ID
- `p_action_type` (VARCHAR) - Action type
- `p_entity_type` (VARCHAR) - Entity type
- `p_entity_id` (UUID) - Entity ID
- `p_entity_name` (TEXT) - Entity name
- `p_changes` (JSONB, optional) - Change details
- `p_metadata` (JSONB, optional) - Additional metadata

**Returns:** UUID of the created activity log entry

**Usage:**
```sql
SELECT log_activity(
  '00000000-0000-0000-0000-000000000001'::UUID,
  '00000000-0000-0000-0000-000000000002'::UUID,
  'place_added'::VARCHAR,
  'place'::VARCHAR,
  '00000000-0000-0000-0000-000000000003'::UUID,
  'Tokyo Tower'::TEXT,
  '{"name": "Tokyo Tower"}'::JSONB,
  '{"source": "api"}'::JSONB
);
```

## Running the Migration

The migration runs automatically when the backend server starts. To run it manually:

```bash
cd backend
npm run migrate
```

## Rolling Back

To rollback this migration, run the rollback script:

```bash
cd backend
psql -h localhost -U user -d journo -f src/migrations/031_collaboration_enhancements_rollback.sql
```

Or use the provided rollback SQL file which includes:
- Dropping all helper functions
- Removing new columns from enhanced tables
- Dropping new tables and their indexes
- Removing the migration record

## Testing

A comprehensive test suite is included at:
- `backend/src/migrations/__tests__/031_collaboration_enhancements.test.ts`

To run tests:
```bash
cd backend
npm test -- 031_collaboration_enhancements.test.ts
```

## Dependencies

This migration requires:
- PostgreSQL 12+ (for JSONB support)
- `uuid-ossp` extension (for UUID generation)
- Existing tables: `users`, `trips`, `trip_collaborators`, `notifications`
- Existing function: `update_updated_at_column()` (for triggers)

## Performance Considerations

- All foreign keys have appropriate indexes
- JSONB columns use GIN indexes for fast queries
- Timestamps are indexed for chronological queries
- Constraints ensure data integrity

## Security Considerations

- Invitation tokens should be cryptographically secure (handled in application layer)
- User IDs in activity_log use `ON DELETE SET NULL` to preserve audit trail
- Role constraints prevent invalid role assignments
- All foreign keys use `ON DELETE CASCADE` where appropriate

## Next Steps

After this migration, you can:
1. Implement the invitation link service (Task 2.1)
2. Implement the activity log service (Task 1.3)
3. Create API endpoints for these features
4. Build frontend components to display activity logs
5. Add real-time updates via WebSocket

## Related Tasks

- Task 1.1: ✅ Create Database Migration for New Tables (this migration)
- Task 1.2: Enhance Existing Tables (included in this migration)
- Task 1.3: Create Activity Log Service
- Task 2.1: Create Invitation Link Service

## Version History

- **v1.0.0** (2024) - Initial migration
  - Added invitation_links table
  - Added activity_log table
  - Enhanced trip_collaborators table
  - Enhanced notifications table
  - Added helper functions
