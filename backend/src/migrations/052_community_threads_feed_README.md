# Migration 052: Community Threads Feed

## Overview

This migration creates the complete database schema for the community threads feed feature, including tables for posts, communities, engagement actions, and content moderation.

## Requirements

This migration implements the following requirements:
- **1.1**: Post creation and management
- **2.1**: Threaded conversations with parent_id references
- **4.1**: Social engagement actions (likes, reposts, bookmarks)
- **8.1**: Community management and membership
- **12.1**: Content moderation and reporting

## Tables Created

### Core Tables

1. **communities** - Communities that users can join
   - Tracks member count and post count
   - Supports moderator roles

2. **community_members** - User membership in communities
   - Links users to communities
   - Supports roles: member, moderator, admin

3. **posts** - User-generated posts with threading support
   - Supports parent_id for threaded conversations
   - Includes engagement metrics (likes, replies, reposts)
   - Supports trip embeds via trip_id foreign key
   - Stores media URLs in JSONB format
   - Includes tags array for categorization
   - Calculates engagement_score automatically

### Engagement Tables

4. **likes** - Like actions on posts
5. **reposts** - Repost actions on posts
6. **bookmarks** - Bookmarked posts for later retrieval

### Moderation Tables

7. **reports** - Content moderation reports
   - Tracks report status (pending, reviewed, dismissed, removed)
   - Links to reviewer and review timestamp

### Social Tables

8. **user_follows** - User follow relationships
   - Used for Following feed generation
   - Prevents self-follows with CHECK constraint

## Indexes

Performance indexes are created on:
- Post queries (user_id, community_id, parent_id, created_at, engagement_score)
- Engagement lookups (post_id, user_id on likes, reposts, bookmarks)
- Community queries (member_id, community_id)
- Follow relationships (follower_id, following_id)
- Tag searches (GIN index on tags array)

## Functions

### calculate_engagement_score

Calculates the engagement score for a post using the formula:
```
engagement_score = (likes × 3) + (replies × 2) + reposts + recency_bonus

recency_bonus:
  - < 24 hours: +10
  - 24-48 hours: +5
  - > 48 hours: 0
```

**Parameters:**
- `p_like_count` (INTEGER) - Number of likes
- `p_reply_count` (INTEGER) - Number of replies
- `p_repost_count` (INTEGER) - Number of reposts
- `p_created_at` (TIMESTAMP) - Post creation timestamp

**Returns:** DECIMAL(10,2) - Calculated engagement score

### update_post_engagement_score

Updates the engagement score for a specific post by recalculating it based on current counts.

**Parameters:**
- `p_post_id` (UUID) - Post ID to update

**Returns:** VOID

## Triggers

### Automatic Timestamp Updates
- `trigger_update_communities_updated_at` - Updates communities.updated_at on UPDATE
- `trigger_update_posts_updated_at` - Updates posts.updated_at on UPDATE

### Engagement Score Updates
- `trigger_posts_engagement_score` - Automatically recalculates engagement_score when like_count, reply_count, or repost_count changes

### Community Counters
- `trigger_increment_community_member_count` - Increments member_count when user joins
- `trigger_decrement_community_member_count` - Decrements member_count when user leaves
- `trigger_increment_community_post_count` - Increments post_count when post created
- `trigger_decrement_community_post_count` - Decrements post_count when post deleted

### Post Counters
- `trigger_increment_post_reply_count` - Increments reply_count when reply created
- `trigger_decrement_post_reply_count` - Decrements reply_count when reply deleted

## Running the Migration

### Apply Migration

```bash
# Using the test script (recommended for first time)
node backend/migrations/test_community_migration.mjs

# Or apply directly
node backend/migrations/run_community_migration.mjs

# Or using the general migration runner
node backend/migrations/run_migrations.mjs
```

### Rollback Migration

```bash
node backend/migrations/rollback_community_migration.mjs
```

## Testing

The migration includes comprehensive tests that verify:

1. ✅ All tables are created successfully
2. ✅ Engagement score calculation is correct
3. ✅ Triggers update counters properly
4. ✅ Rollback removes all objects cleanly
5. ✅ Re-application works after rollback

Run tests with:
```bash
node backend/migrations/test_community_migration.mjs
```

## Constraints

### Data Integrity
- Post content must be 1-500 characters
- All counts (likes, replies, reposts, members, posts) must be non-negative
- Engagement score must be non-negative
- Users cannot follow themselves
- Community member roles must be: member, moderator, or admin
- Report status must be: pending, reviewed, dismissed, or removed

### Referential Integrity
- Posts cascade delete when user is deleted
- Posts set community_id to NULL when community is deleted
- Replies cascade delete when parent post is deleted
- Likes, reposts, bookmarks cascade delete when post is deleted
- Community members cascade delete when user or community is deleted

## Performance Considerations

- Indexes are created on all foreign keys for efficient joins
- GIN index on tags array for fast tag searches
- Partial index on posts.engagement_score for active posts only (is_deleted = FALSE)
- Engagement score calculation is marked IMMUTABLE for query optimization

## Migration Size

- **Tables:** 8
- **Indexes:** 20+
- **Functions:** 11
- **Triggers:** 10

## Dependencies

This migration requires:
- PostgreSQL 12+ (for uuid_generate_v4())
- Existing `users` table
- Existing `trips` table

## Notes

- The migration uses `IF NOT EXISTS` clauses for idempotency
- All timestamps use `NOW()` for consistency
- JSONB is used for media_urls to support flexible media storage
- Text arrays are used for tags to support multiple tags per post
- Engagement score is automatically calculated via trigger on INSERT/UPDATE

## Rollback Safety

The rollback script:
1. Drops all triggers first
2. Drops all functions
3. Drops all tables in reverse dependency order
4. Uses CASCADE to handle any remaining dependencies

This ensures clean rollback without orphaned objects.

## Next Steps

After applying this migration:

1. Implement backend services (CommunityService)
2. Create API controllers (CommunityController)
3. Add Socket.IO event handlers for real-time updates
4. Implement frontend components
5. Add rate limiting middleware
6. Implement content sanitization

See `.kiro/specs/community-threads-feed/tasks.md` for the complete implementation plan.
