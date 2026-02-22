-- ============================================================================
-- Migration 052 Rollback: Community Threads Feed
-- ============================================================================
-- Description: Rolls back all changes from migration 052
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_decrement_post_reply_count ON posts;
DROP TRIGGER IF EXISTS trigger_increment_post_reply_count ON posts;
DROP TRIGGER IF EXISTS trigger_decrement_community_post_count ON posts;
DROP TRIGGER IF EXISTS trigger_increment_community_post_count ON posts;
DROP TRIGGER IF EXISTS trigger_decrement_community_member_count ON community_members;
DROP TRIGGER IF EXISTS trigger_increment_community_member_count ON community_members;
DROP TRIGGER IF EXISTS trigger_posts_engagement_score ON posts;
DROP TRIGGER IF EXISTS trigger_update_posts_updated_at ON posts;
DROP TRIGGER IF EXISTS trigger_update_communities_updated_at ON communities;

-- Drop functions
DROP FUNCTION IF EXISTS decrement_post_reply_count();
DROP FUNCTION IF EXISTS increment_post_reply_count();
DROP FUNCTION IF EXISTS decrement_community_post_count();
DROP FUNCTION IF EXISTS increment_community_post_count();
DROP FUNCTION IF EXISTS decrement_community_member_count();
DROP FUNCTION IF EXISTS increment_community_member_count();
DROP FUNCTION IF EXISTS trigger_update_engagement_score();
DROP FUNCTION IF EXISTS update_posts_updated_at();
DROP FUNCTION IF EXISTS update_communities_updated_at();
DROP FUNCTION IF EXISTS update_post_engagement_score(UUID);
DROP FUNCTION IF EXISTS calculate_engagement_score(INTEGER, INTEGER, INTEGER, TIMESTAMP);

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS user_follows CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS reposts CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS community_members CASCADE;
DROP TABLE IF EXISTS communities CASCADE;

-- ============================================================================
-- END OF ROLLBACK
-- ============================================================================
