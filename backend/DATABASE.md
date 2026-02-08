# Journo Database Schema Documentation

This document provides a comprehensive overview of the Journo platform database schema.

## Overview

The Journo database uses PostgreSQL 14+ and consists of 20+ tables organized into several functional areas:

- **Authentication & Users** - User accounts and session management
- **Trips & Itineraries** - Core trip planning functionality
- **Social Features** - Community feed, likes, and sharing
- **Collaboration** - Multi-user trip editing
- **Budget & Packing** - Travel planning tools
- **Analytics** - User behavior and platform metrics
- **Admin & Moderation** - Content moderation and feature flags

## Entity Relationship Diagram

```
users
  ├── trips (owner_id)
  │   ├── trip_days
  │   │   └── places
  │   ├── story_items
  │   ├── trip_likes
  │   ├── packing_lists
  │   ├── trip_versions
  │   └── trip_collaborators
  ├── refresh_tokens
  ├── user_badges
  └── analytics_events
```

## Core Tables

### users

Stores user account information and authentication data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| name | VARCHAR(255) | NOT NULL | User display name |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | VARCHAR(50) | DEFAULT 'user' | User role (user, admin, moderator) |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_users_email` on email

### refresh_tokens

Stores JWT refresh tokens for session management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Token identifier |
| user_id | UUID | FOREIGN KEY → users | Token owner |
| token | TEXT | UNIQUE, NOT NULL | Refresh token value |
| expires_at | TIMESTAMP | NOT NULL | Token expiration time |
| created_at | TIMESTAMP | DEFAULT NOW() | Token creation time |

**Indexes:**
- `idx_refresh_tokens_token` on token
- `idx_refresh_tokens_user_id` on user_id

### trips

Main table for trip itineraries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Trip identifier |
| title | TEXT | NOT NULL | Trip title |
| destination | TEXT | | Destination name |
| start_date | DATE | | Trip start date |
| end_date | DATE | | Trip end date |
| cover_image_url | TEXT | | Cover image URL |
| theme | TEXT | DEFAULT 'default' | Visual theme |
| owner_id | UUID | FOREIGN KEY → users | Trip owner |
| is_public | BOOLEAN | DEFAULT TRUE | Public visibility |
| is_community | BOOLEAN | DEFAULT FALSE | Show in community feed |
| share_token | TEXT | UNIQUE | Public sharing token |
| total_budget | DECIMAL(12,2) | | Total trip budget |
| currency_code | TEXT | DEFAULT 'USD' | Budget currency |
| weather_data | JSONB | | Cached weather forecast |
| likes_count | INT | DEFAULT 0 | Number of likes |
| views_count | INT | DEFAULT 0 | Number of views |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_trips_owner` on owner_id
- `idx_trips_share_token` on share_token
- `idx_trips_community` on is_community (WHERE is_community = TRUE)
- `idx_trips_created_at` on created_at DESC

**Constraints:**
- theme CHECK: 'default', 'adventure', 'romantic', 'foodie', 'chill'

### trip_days

Individual days within a trip.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Day identifier |
| trip_id | UUID | FOREIGN KEY → trips | Parent trip |
| day_number | INT | NOT NULL | Day sequence number |
| date | DATE | | Actual date |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_trip_days_trip` on trip_id

**Constraints:**
- UNIQUE(trip_id, day_number)

### places

Locations within trip days.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Place identifier |
| trip_day_id | UUID | FOREIGN KEY → trip_days | Parent day |
| name | TEXT | NOT NULL | Place name |
| address | TEXT | | Full address |
| lat | DOUBLE PRECISION | | Latitude |
| lng | DOUBLE PRECISION | | Longitude |
| time_start | TIME | | Start time |
| time_end | TIME | | End time |
| notes | TEXT | | User notes |
| image_url | TEXT | | Place photo URL |
| place_type | TEXT | | Type of place |
| sticker | TEXT | | Sticker icon |
| cost | DECIMAL(10,2) | | Cost amount |
| cost_currency | TEXT | DEFAULT 'USD' | Cost currency |
| budget_category | TEXT | | Budget category |
| transport_mode | TEXT | | Transport to next place |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_places_trip_day` on trip_day_id

**Constraints:**
- place_type CHECK: 'attraction', 'food', 'hotel', 'transport', 'other'
- budget_category CHECK: 'accommodation', 'food', 'transport', 'activities', 'shopping', 'misc'
- transport_mode CHECK: 'driving', 'walking', 'transit', 'flight'

## Social Features

### story_items

Photos, videos, and notes in trip journey feed.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Story item identifier |
| trip_id | UUID | FOREIGN KEY → trips | Parent trip |
| user_id | UUID | FOREIGN KEY → users | Creator |
| type | TEXT | NOT NULL | Item type |
| content_url | TEXT | | Photo/video URL |
| caption | TEXT | | Item caption |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_story_items_trip` on trip_id
- `idx_story_items_created` on created_at DESC
- `idx_story_items_user` on user_id

**Constraints:**
- type CHECK: 'photo', 'youtube', 'note'

### trip_likes

User likes on trips.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Like identifier |
| trip_id | UUID | FOREIGN KEY → trips | Liked trip |
| user_id | UUID | FOREIGN KEY → users | User who liked |
| created_at | TIMESTAMP | DEFAULT NOW() | Like timestamp |

**Indexes:**
- `idx_trip_likes_trip` on trip_id
- `idx_trip_likes_user` on user_id

**Constraints:**
- UNIQUE(trip_id, user_id)

## Collaboration

### trip_collaborators

Multi-user trip collaboration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Collaborator identifier |
| trip_id | UUID | FOREIGN KEY → trips | Trip |
| user_id | UUID | FOREIGN KEY → users | Collaborator |
| role | TEXT | NOT NULL | Collaboration role |
| invited_by | UUID | FOREIGN KEY → users | Inviter |
| created_at | TIMESTAMP | DEFAULT NOW() | Invitation timestamp |

**Indexes:**
- `idx_trip_collaborators_trip` on trip_id
- `idx_trip_collaborators_user` on user_id
- `idx_trip_collaborators_role` on role

**Constraints:**
- role CHECK: 'owner', 'editor', 'viewer'
- UNIQUE(trip_id, user_id)

### trip_versions

Version history for undo/redo.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Version identifier |
| trip_id | UUID | FOREIGN KEY → trips | Trip |
| version_data | JSONB | NOT NULL | Complete trip snapshot |
| created_at | TIMESTAMP | DEFAULT NOW() | Version timestamp |

**Indexes:**
- `idx_trip_versions_trip` on (trip_id, created_at DESC)

## Planning Tools

### packing_lists

Trip packing checklist items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Item identifier |
| trip_id | UUID | FOREIGN KEY → trips | Trip |
| item | TEXT | NOT NULL | Item description |
| category | TEXT | | Item category |
| is_checked | BOOLEAN | DEFAULT FALSE | Packed status |
| added_by | UUID | FOREIGN KEY → users | User who added |
| is_custom | BOOLEAN | DEFAULT FALSE | Custom vs suggested |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_packing_lists_trip` on trip_id
- `idx_packing_lists_added_by` on added_by

**Constraints:**
- category CHECK: 'essentials', 'clothing', 'toiletries', 'electronics', 'documents', 'health', 'activities', 'misc'

### packing_templates

Auto-suggestion templates for packing lists.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Template identifier |
| destination_type | TEXT | | Destination type |
| weather_condition | TEXT | | Weather condition |
| trip_duration_days | INT | | Trip duration |
| item | TEXT | NOT NULL | Item to suggest |
| category | TEXT | NOT NULL | Item category |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_packing_templates_lookup` on (destination_type, weather_condition)
- `idx_packing_templates_duration` on trip_duration_days

## Analytics

### analytics_events

User behavior tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Event identifier |
| event_name | TEXT | NOT NULL | Event type |
| user_id | UUID | FOREIGN KEY → users | User |
| trip_id | UUID | FOREIGN KEY → trips | Related trip |
| metadata | JSONB | | Additional data |
| created_at | TIMESTAMP | DEFAULT NOW() | Event timestamp |

**Indexes:**
- `idx_analytics_events_name` on event_name
- `idx_analytics_events_created` on created_at DESC
- `idx_analytics_events_user` on user_id
- `idx_analytics_events_trip` on trip_id

### user_badges

Achievement system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Badge identifier |
| user_id | UUID | FOREIGN KEY → users | User |
| trip_id | UUID | FOREIGN KEY → trips | Related trip |
| badge_type | TEXT | NOT NULL | Badge type |
| earned_at | TIMESTAMP | DEFAULT NOW() | Earned timestamp |

**Indexes:**
- `idx_user_badges_user` on user_id
- `idx_user_badges_trip` on trip_id
- `idx_user_badges_type` on badge_type

### currency_rates

Exchange rate cache.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Rate identifier |
| base_currency | TEXT | NOT NULL | Base currency code |
| target_currency | TEXT | NOT NULL | Target currency code |
| rate | DECIMAL(12,6) | NOT NULL | Exchange rate |
| cached_at | TIMESTAMP | DEFAULT NOW() | Cache timestamp |

**Indexes:**
- `idx_currency_rates_lookup` on (base_currency, target_currency)
- `idx_currency_rates_cached_at` on cached_at

**Constraints:**
- UNIQUE(base_currency, target_currency)

## Admin & Moderation

### feature_flags

Feature toggle system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Flag identifier |
| name | TEXT | UNIQUE, NOT NULL | Feature name |
| enabled | BOOLEAN | DEFAULT FALSE | Enabled status |
| rollout_percentage | INT | DEFAULT 100 | Gradual rollout % |
| description | TEXT | | Feature description |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_feature_flags_name` on name
- `idx_feature_flags_enabled` on enabled

**Constraints:**
- rollout_percentage CHECK: >= 0 AND <= 100

### moderation_flags

Content moderation flags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Flag identifier |
| resource_type | TEXT | NOT NULL | Resource type |
| resource_id | UUID | NOT NULL | Resource ID |
| reason | TEXT | NOT NULL | Flag reason |
| moderator_id | UUID | FOREIGN KEY → users | Moderator |
| status | TEXT | DEFAULT 'pending' | Flag status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_moderation_flags_resource` on (resource_type, resource_id)
- `idx_moderation_flags_status` on status
- `idx_moderation_flags_moderator` on moderator_id
- `idx_moderation_flags_created` on created_at DESC

**Constraints:**
- resource_type CHECK: 'trip', 'story_item', 'user'
- status CHECK: 'pending', 'reviewed', 'resolved', 'dismissed'

### moderation_log

Moderation action history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Log identifier |
| action | TEXT | NOT NULL | Action type |
| resource_type | TEXT | NOT NULL | Resource type |
| resource_id | UUID | NOT NULL | Resource ID |
| reason | TEXT | | Action reason |
| moderator_id | UUID | FOREIGN KEY → users | Moderator |
| metadata | JSONB | | Additional data |
| created_at | TIMESTAMP | DEFAULT NOW() | Action timestamp |

**Indexes:**
- `idx_moderation_log_resource` on (resource_type, resource_id)
- `idx_moderation_log_moderator` on moderator_id
- `idx_moderation_log_created` on created_at DESC
- `idx_moderation_log_action` on action

**Constraints:**
- action CHECK: 'flag', 'hide', 'delete', 'warn', 'ban', 'restore'
- resource_type CHECK: 'trip', 'story_item', 'user'

## Database Functions

### Security Functions

- `user_owns_trip(user_id, trip_id)` - Check if user owns a trip
- `user_is_collaborator(user_id, trip_id)` - Check if user is a collaborator
- `user_can_edit_trip(user_id, trip_id)` - Check if user can edit a trip
- `trip_is_public(trip_id)` - Check if trip is public
- `get_trip_owner(trip_id)` - Get trip owner ID

### Counter Functions

- `increment_trip_views(trip_id)` - Increment trip view count
- `increment_trip_likes(trip_id)` - Increment trip like count
- `decrement_trip_likes(trip_id)` - Decrement trip like count

## Triggers

### Automatic Timestamps

- `update_updated_at_column()` - Updates updated_at on record modification
- Applied to: users, trips, places, packing_lists, destination_suggestions, moderation_flags, feature_flags

### Like Counter Management

- `update_likes_count_on_insert()` - Auto-increment likes_count on trip_likes INSERT
- `update_likes_count_on_delete()` - Auto-decrement likes_count on trip_likes DELETE

### Collaboration Management

- `ensure_owner_is_collaborator()` - Auto-add trip owner as collaborator with owner role
- `validate_collaborator_role_change()` - Prevent changing owner's role
- `prevent_delete_last_owner()` - Ensure at least one owner exists

## Cascade Deletes

- Deleting a **user** cascades to:
  - refresh_tokens
  - trips (and all trip data)
  - story_items
  - trip_collaborators
  - packing_lists

- Deleting a **trip** cascades to:
  - trip_days (and all places)
  - story_items
  - trip_likes
  - packing_lists
  - trip_versions
  - trip_collaborators

- Deleting a **trip_day** cascades to:
  - places

## Performance Considerations

### Indexes

All foreign keys have indexes for efficient joins. Additional indexes are created for:
- Frequently filtered columns (is_public, is_community, role)
- Sort operations (created_at DESC)
- Unique constraints (email, share_token)

### Query Optimization

- Use `EXPLAIN ANALYZE` to profile slow queries
- Consider materialized views for expensive aggregations
- Implement cursor-based pagination for large result sets
- Cache frequently accessed data (weather, currency rates)

## Backup Strategy

Recommended backup approach:
1. Daily full backups using `pg_dump`
2. Continuous WAL archiving for point-in-time recovery
3. Test restore procedures regularly
4. Store backups in multiple locations

## Migration Management

Migrations are stored in `backend/src/migrations/` and executed in alphabetical order.

To run migrations:
```bash
npm run migrate
```

To create a new migration:
1. Create a new file: `XXX_description.sql`
2. Write SQL statements
3. Run migrations

## Security Best Practices

1. **Never expose database credentials** - Use environment variables
2. **Use parameterized queries** - Prevent SQL injection
3. **Implement RLS at application level** - Check permissions before queries
4. **Encrypt sensitive data** - Use pgcrypto for sensitive fields
5. **Regular security audits** - Review access logs and permissions
6. **Backup encryption** - Encrypt backup files
7. **Connection pooling** - Limit concurrent connections

## Monitoring

Key metrics to monitor:
- Connection pool utilization
- Query execution time
- Table sizes and growth
- Index usage
- Lock contention
- Replication lag (if applicable)

Use tools like:
- pg_stat_statements for query analysis
- pgBadger for log analysis
- Prometheus + Grafana for metrics visualization
