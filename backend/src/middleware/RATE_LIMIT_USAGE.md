# Rate Limiting Middleware Usage Guide

## Overview

This document describes how to use the rate limiting middleware for the community threads feed feature.

## Middleware Functions

### `postCreationRateLimit`

Rate limiting middleware specifically for post creation endpoints.

**Configuration:**
- Window: 1 hour (60 minutes)
- Max requests: 5 posts per hour per user
- Storage: Redis (distributed rate limiting)
- Key: User ID from authenticated request

**Response on limit exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "message": "You can only create 5 posts per hour. Please try again later.",
  "retryAfter": "3600"
}
```

**HTTP Status:** 429 Too Many Requests

### `generalApiRateLimit`

General rate limiting middleware for API endpoints.

**Configuration:**
- Window: 15 minutes
- Max requests: 100 requests per 15 minutes per user
- Storage: Redis (distributed rate limiting)
- Key: User ID or IP address

## Usage Example

### In Route Definition

```typescript
import { Router } from 'express';
import { postCreationRateLimit } from '../middleware/rateLimitMiddleware.js';
import { authenticateToken } from '../middleware/auth.js';
import { CommunityController } from '../controllers/communityController.js';

const router = Router();

// Apply rate limiting to post creation endpoint
router.post(
  '/posts',
  authenticateToken,           // Authentication first
  postCreationRateLimit,       // Then rate limiting
  CommunityController.createPost
);

export default router;
```

## Implementation Details

### Redis Store

The middleware uses `rate-limit-redis` to store rate limit data in Redis, enabling:
- Distributed rate limiting across multiple server instances
- Persistent rate limit tracking
- Automatic cleanup of expired records

### Key Generation

The middleware generates keys based on:
1. **Primary:** User ID from authenticated request (`req.user.id`)
2. **Fallback:** IP address if user is not authenticated

### Headers

The middleware sets standard rate limit headers:
- `RateLimit-Limit`: Maximum number of requests allowed
- `RateLimit-Remaining`: Number of requests remaining
- `RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)
- `Retry-After`: Seconds until the user can retry (only on 429 response)

## Testing

To test rate limiting:

1. Make 5 POST requests to `/api/community/posts` within 1 hour
2. The 6th request should return a 429 status code
3. Wait for the time specified in `Retry-After` header
4. Subsequent requests should succeed

## Requirements Validation

This implementation validates:
- **Requirement 1.6:** "WHEN a user creates more than 5 posts within 1 hour, THE Rate_Limiter SHALL reject subsequent posts until the time window resets"

## Related Files

- `backend/src/middleware/rateLimitMiddleware.ts` - Middleware implementation
- `backend/src/config/redis.ts` - Redis client configuration
- `backend/src/services/communityService.ts` - Content sanitization
