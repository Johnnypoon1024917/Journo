# Content Moderation System

## Overview

The content moderation system provides a comprehensive workflow for handling inappropriate content in the community threads feed. It includes user reporting, automatic flagging, and moderator review capabilities.

## Features

### 1. User Reporting

Users can report posts that violate community guidelines.

**Endpoint**: `POST /api/community/posts/:postId/report`

**Request Body**:
```json
{
  "reason": "Spam | Harassment | Inappropriate | Other",
  "description": "Optional detailed description"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Post reported successfully",
  "flagged": false
}
```

**Features**:
- Prevents duplicate reports from the same user
- Validates post exists and is not deleted
- Automatically flags posts with 3+ reports

### 2. Automatic Flagging

Posts are automatically flagged for moderator review when they receive 3 or more reports.

**Database Field**: `posts.flagged_for_review`

**Behavior**:
- When a post receives its 3rd report, `flagged_for_review` is set to `true`
- Flagged posts appear in the moderator dashboard
- Cache is invalidated when posts are flagged

### 3. Moderator Dashboard

#### Get All Reports

**Endpoint**: `GET /api/community/reports`

**Query Parameters**:
- `status`: `pending | reviewed | dismissed | removed` (default: `pending`)
- `flagged`: `true | false` (filter for flagged posts only)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "report-uuid",
      "post_id": "post-uuid",
      "reason": "Spam",
      "description": "Contains promotional links",
      "status": "pending",
      "post_content": "Post text...",
      "flagged_for_review": true,
      "reporter_name": "username",
      "report_count": "3",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Flagged Posts

**Endpoint**: `GET /api/community/moderation/flagged`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "post-uuid",
      "content": "Post text...",
      "user_id": "author-uuid",
      "author_name": "username",
      "created_at": "2024-01-01T00:00:00Z",
      "like_count": 5,
      "reply_count": 2,
      "repost_count": 1,
      "pending_report_count": 3,
      "total_report_count": 3,
      "reports": [
        {
          "id": "report-uuid",
          "reason": "Spam",
          "description": "Details...",
          "reporter_name": "username",
          "created_at": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

#### Review Report

**Endpoint**: `PUT /api/community/reports/:reportId/review`

**Request Body**:
```json
{
  "action": "dismiss | remove"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Report dismissed successfully"
}
```

**Behavior**:

**Dismiss Action**:
- Updates report status to `dismissed`
- Records reviewer and review timestamp
- Unflags post if all reports are now dismissed/removed
- Post remains visible in feeds

**Remove Action**:
- Updates report status to `removed`
- Marks post as deleted (`is_deleted = true`)
- Unflags post (`flagged_for_review = false`)
- Invalidates feed cache
- Post is hidden from all feeds

## Database Schema

### Reports Table

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id),
  reporter_id UUID NOT NULL REFERENCES users(id),
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Posts Table (Moderation Fields)

```sql
ALTER TABLE posts ADD COLUMN flagged_for_review BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
```

## Workflow

### User Reports Post

1. User clicks "Report" button on post
2. Selects reason and optionally adds description
3. System creates report record
4. System counts total reports for post
5. If count >= 3, post is flagged for review
6. Cache is invalidated if post was flagged

### Moderator Reviews Reports

1. Moderator accesses moderation dashboard
2. Views list of flagged posts or all reports
3. Reviews post content and report details
4. Decides to dismiss or remove

**If Dismiss**:
- Report marked as dismissed
- If all reports dismissed, post is unflagged
- Post remains visible

**If Remove**:
- Report marked as removed
- Post marked as deleted
- Post unflagged
- Post hidden from feeds
- Cache invalidated

## Security Considerations

### Authentication

All moderation endpoints require authentication:
```typescript
router.post('/posts/:postId/report', authenticateToken, ...);
router.get('/reports', authenticateToken, ...);
router.get('/moderation/flagged', authenticateToken, ...);
router.put('/reports/:reportId/review', authenticateToken, ...);
```

### Authorization

**Current Implementation**: Simplified check (any authenticated user)

**Production Recommendation**: Implement role-based access control:
```typescript
// Check user role from database
const userRole = await pool.query(
  'SELECT role FROM users WHERE id = $1',
  [userId]
);

if (!['moderator', 'admin'].includes(userRole.rows[0].role)) {
  return res.status(403).json({ error: 'Insufficient permissions' });
}
```

### Rate Limiting

Consider adding rate limiting to prevent report abuse:
```typescript
// Limit to 10 reports per hour per user
router.post('/posts/:postId/report', 
  authenticateToken,
  rateLimitMiddleware({ maxRequests: 10, windowMs: 3600000 }),
  CommunityController.reportPost
);
```

## Performance Optimizations

### Indexes

```sql
-- Efficient querying of flagged posts
CREATE INDEX idx_posts_flagged_for_review 
ON posts(flagged_for_review) 
WHERE flagged_for_review = TRUE;

-- Efficient report lookups
CREATE INDEX idx_reports_post_id ON reports(post_id);
CREATE INDEX idx_reports_status ON reports(status);
```

### Caching

- Feed cache is invalidated when posts are flagged or removed
- Consider caching flagged posts list for moderators (short TTL)

## Testing

Run moderation tests:
```bash
npm test -- moderation.test.ts
```

Test coverage includes:
- Creating reports
- Preventing duplicate reports
- Automatic flagging at 3 reports
- Retrieving flagged posts
- Reviewing reports (dismiss/remove)
- Database state verification

## Future Enhancements

1. **Automated Content Filtering**
   - Implement AI-based content analysis
   - Auto-flag posts with high toxicity scores
   - Keyword-based filtering

2. **Appeal System**
   - Allow users to appeal removed posts
   - Moderator review of appeals
   - Reinstatement workflow

3. **Moderator Actions Log**
   - Track all moderation actions
   - Audit trail for accountability
   - Analytics on moderation patterns

4. **User Reputation System**
   - Track user report accuracy
   - Penalize false reporting
   - Reward accurate reports

5. **Escalation Workflow**
   - Multi-tier moderation (community mods → admins)
   - Automatic escalation for severe violations
   - Priority queue for urgent reports

## API Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/community/posts/:postId/report` | POST | Required | Report a post |
| `/api/community/reports` | GET | Required | Get all reports |
| `/api/community/moderation/flagged` | GET | Required | Get flagged posts |
| `/api/community/reports/:reportId/review` | PUT | Required | Review a report |

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Reason is required | Missing report reason |
| 400 | You have already reported this post | Duplicate report |
| 400 | Invalid action | Invalid review action |
| 401 | Authentication required | Missing auth token |
| 404 | Post not found | Post doesn't exist or deleted |
| 404 | Report not found | Report doesn't exist |
| 500 | Failed to report post | Server error |
| 500 | Failed to fetch reports | Server error |
| 500 | Failed to review report | Server error |
