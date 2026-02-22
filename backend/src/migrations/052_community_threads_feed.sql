-- ============================================================================
-- Migration 052: Community Threads Feed
-- ============================================================================
-- Description: Creates all tables, indexes, and functions for the community
--              threads feed feature including posts, communities, engagement
--              actions, and content moderation.
-- Requirements: 1.1, 2.1, 4.1, 8.1, 12.1
-- ============================================================================

-- ============================================================================
-- COMMUNITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url VARCHAR(500),
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT communities_name_not_empty CHECK (char_length(name) > 0),
  CONSTRAINT communities_member_count_non_negative CHECK (member_count >= 0),
  CONSTRAINT communities_post_count_non_negative CHECK (post_count >= 0)
);

-- ============================================================================
-- COMMUNITY MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(community_id, user_id),
  CONSTRAINT community_members_role_check CHECK (role IN ('member', 'moderator', 'admin'))
);

-- ============================================================================
-- POSTS TABLE (supports threading via parent_id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  media_urls JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  repost_count INTEGER DEFAULT 0,
  engagement_score DECIMAL(10,2) DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  flagged_for_review BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT posts_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  CONSTRAINT posts_like_count_non_negative CHECK (like_count >= 0),
  CONSTRAINT posts_reply_count_non_negative CHECK (reply_count >= 0),
  CONSTRAINT posts_repost_count_non_negative CHECK (repost_count >= 0),
  CONSTRAINT posts_engagement_score_non_negative CHECK (engagement_score >= 0)
);

-- ============================================================================
-- LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(post_id, user_id)
);

-- ============================================================================
-- REPOSTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reposts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(post_id, user_id)
);

-- ============================================================================
-- BOOKMARKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(post_id, user_id)
);

-- ============================================================================
-- REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT reports_status_check CHECK (status IN ('pending', 'reviewed', 'dismissed', 'removed')),
  CONSTRAINT reports_reason_not_empty CHECK (char_length(reason) > 0)
);

-- ============================================================================
-- USER FOLLOWS TABLE (for Following feed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(follower_id, following_id),
  CONSTRAINT user_follows_no_self_follow CHECK (follower_id != following_id)
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_parent_id ON posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_engagement_score_desc ON posts(engagement_score DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_posts_trip_id ON posts(trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON posts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_posts_flagged_for_review ON posts(flagged_for_review) WHERE flagged_for_review = TRUE;

-- Likes indexes
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- Reposts indexes
CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON reposts(user_id);

-- Bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_post_id ON reports(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Community members indexes
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);

-- User follows indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

-- Communities indexes
CREATE INDEX IF NOT EXISTS idx_communities_name ON communities(name);
CREATE INDEX IF NOT EXISTS idx_communities_member_count_desc ON communities(member_count DESC);

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Function to calculate engagement score
-- Formula: (likes × 3) + (replies × 2) + reposts + recency_bonus
-- Recency bonus: < 24h = +10, 24-48h = +5, > 48h = 0
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_like_count INTEGER,
  p_reply_count INTEGER,
  p_repost_count INTEGER,
  p_created_at TIMESTAMP
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  base_score DECIMAL(10,2);
  recency_bonus DECIMAL(10,2);
  hours_old DECIMAL(10,2);
BEGIN
  -- Calculate base engagement score
  base_score := (p_like_count * 3) + (p_reply_count * 2) + p_repost_count;
  
  -- Calculate hours since creation
  hours_old := EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 3600;
  
  -- Calculate recency bonus
  IF hours_old < 24 THEN
    recency_bonus := 10;
  ELSIF hours_old < 48 THEN
    recency_bonus := 5;
  ELSE
    recency_bonus := 0;
  END IF;
  
  RETURN base_score + recency_bonus;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update engagement score for a post
CREATE OR REPLACE FUNCTION update_post_engagement_score(p_post_id UUID)
RETURNS VOID AS $$
DECLARE
  v_like_count INTEGER;
  v_reply_count INTEGER;
  v_repost_count INTEGER;
  v_created_at TIMESTAMP;
  v_new_score DECIMAL(10,2);
BEGIN
  -- Get current counts and created_at
  SELECT like_count, reply_count, repost_count, created_at
  INTO v_like_count, v_reply_count, v_repost_count, v_created_at
  FROM posts
  WHERE id = p_post_id;
  
  -- Calculate new engagement score
  v_new_score := calculate_engagement_score(
    v_like_count,
    v_reply_count,
    v_repost_count,
    v_created_at
  );
  
  -- Update the post
  UPDATE posts
  SET engagement_score = v_new_score
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update communities updated_at
CREATE OR REPLACE FUNCTION update_communities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_communities_updated_at ON communities;
CREATE TRIGGER trigger_update_communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW
  EXECUTE FUNCTION update_communities_updated_at();

-- Trigger to update posts updated_at
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_posts_updated_at ON posts;
CREATE TRIGGER trigger_update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_posts_updated_at();

-- Trigger to update engagement score when counts change
CREATE OR REPLACE FUNCTION trigger_update_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.engagement_score := calculate_engagement_score(
    NEW.like_count,
    NEW.reply_count,
    NEW.repost_count,
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_posts_engagement_score ON posts;
CREATE TRIGGER trigger_posts_engagement_score
  BEFORE INSERT OR UPDATE OF like_count, reply_count, repost_count ON posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_engagement_score();

-- Trigger to increment community member count
CREATE OR REPLACE FUNCTION increment_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE communities
  SET member_count = member_count + 1
  WHERE id = NEW.community_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_community_member_count ON community_members;
CREATE TRIGGER trigger_increment_community_member_count
  AFTER INSERT ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION increment_community_member_count();

-- Trigger to decrement community member count
CREATE OR REPLACE FUNCTION decrement_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE communities
  SET member_count = member_count - 1
  WHERE id = OLD.community_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_community_member_count ON community_members;
CREATE TRIGGER trigger_decrement_community_member_count
  AFTER DELETE ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION decrement_community_member_count();

-- Trigger to increment community post count
CREATE OR REPLACE FUNCTION increment_community_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.community_id IS NOT NULL THEN
    UPDATE communities
    SET post_count = post_count + 1
    WHERE id = NEW.community_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_community_post_count ON posts;
CREATE TRIGGER trigger_increment_community_post_count
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION increment_community_post_count();

-- Trigger to decrement community post count on deletion
CREATE OR REPLACE FUNCTION decrement_community_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.community_id IS NOT NULL THEN
    UPDATE communities
    SET post_count = post_count - 1
    WHERE id = OLD.community_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_community_post_count ON posts;
CREATE TRIGGER trigger_decrement_community_post_count
  AFTER DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION decrement_community_post_count();

-- Trigger to increment post reply count
CREATE OR REPLACE FUNCTION increment_post_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    UPDATE posts
    SET reply_count = reply_count + 1
    WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_post_reply_count ON posts;
CREATE TRIGGER trigger_increment_post_reply_count
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION increment_post_reply_count();

-- Trigger to decrement post reply count on deletion
CREATE OR REPLACE FUNCTION decrement_post_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.parent_id IS NOT NULL THEN
    UPDATE posts
    SET reply_count = reply_count - 1
    WHERE id = OLD.parent_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_post_reply_count ON posts;
CREATE TRIGGER trigger_decrement_post_reply_count
  AFTER DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION decrement_post_reply_count();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE communities IS 'Communities that users can join to share posts within specific topics';
COMMENT ON TABLE community_members IS 'Membership records linking users to communities';
COMMENT ON TABLE posts IS 'User-generated posts with optional trip embeds, media, and threading support';
COMMENT ON TABLE likes IS 'Like actions on posts';
COMMENT ON TABLE reposts IS 'Repost actions on posts';
COMMENT ON TABLE bookmarks IS 'Bookmarked posts for later retrieval';
COMMENT ON TABLE reports IS 'Content moderation reports for inappropriate posts';
COMMENT ON TABLE user_follows IS 'User follow relationships for Following feed';

COMMENT ON FUNCTION calculate_engagement_score IS 'Calculates engagement score: (likes × 3) + (replies × 2) + reposts + recency_bonus';
COMMENT ON FUNCTION update_post_engagement_score IS 'Updates the engagement score for a specific post';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
