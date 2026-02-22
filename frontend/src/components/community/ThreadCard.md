# ThreadCard Component

A comprehensive post card component for the community threads feed. Displays posts with engagement actions, media carousels, trip embeds, and nested replies.

## Features

- **Author Information**: Displays user avatar, name, community, and timestamp
- **Content Display**: Shows post content with automatic truncation for long posts (>280 characters)
- **Trip Embeds**: Expandable accordion showing trip details with mini map link
- **Media Carousel**: Swipeable carousel for multiple images with pagination dots
- **Tags**: Clickable hashtags that link to tag-filtered feeds
- **Engagement Actions**: Like, reply, repost, and bookmark with optimistic updates
- **Nested Replies**: Visual connectors showing conversation hierarchy
- **Accessibility**: Full keyboard navigation, ARIA labels, and screen reader support
- **Responsive**: Works seamlessly on mobile and desktop

## Usage

### Basic Usage

```tsx
import { ThreadCard } from '@/components/community';

function MyFeed() {
  const handleReply = (postId: string) => {
    // Open reply composer
  };

  const handleReport = (postId: string) => {
    // Open report modal
  };

  return (
    <ThreadCard
      post={post}
      onReply={handleReply}
      onReport={handleReport}
    />
  );
}
```

### With Nested Replies

```tsx
<ThreadCard
  post={parentPost}
  onReply={handleReply}
  onReport={handleReport}
  showReplies={true}
  replies={replyPosts}
/>
```

### With Custom Depth (for nested threads)

```tsx
<ThreadCard
  post={nestedPost}
  onReply={handleReply}
  onReport={handleReport}
  depth={2}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `post` | `PostWithEngagement` | Yes | - | The post data to display |
| `onReply` | `(postId: string) => void` | No | - | Callback when reply button is clicked |
| `onReport` | `(postId: string) => void` | No | - | Callback when report button is clicked |
| `showReplies` | `boolean` | No | `false` | Whether to show nested replies |
| `replies` | `PostWithEngagement[]` | No | `[]` | Array of reply posts to display |
| `depth` | `number` | No | `0` | Nesting depth for visual indentation |

## Post Data Structure

```typescript
interface PostWithEngagement {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  communityId?: string;
  communityName?: string;
  parentId?: string;
  content: string;
  tripId?: string;
  tripEmbed?: TripSummary;
  mediaUrls: string[];
  tags: string[];
  likeCount: number;
  replyCount: number;
  repostCount: number;
  engagementScore: number;
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Engagement Actions

The component uses the `usePostActions` hook for optimistic updates:

- **Like/Unlike**: Toggles like state and updates count instantly
- **Repost/Unrepost**: Toggles repost state and updates count instantly
- **Bookmark/Unbookmark**: Toggles bookmark state instantly
- **Reply**: Triggers `onReply` callback with post ID

All actions automatically revert on error.

## Trip Embed

When a post includes a `tripEmbed`, an expandable accordion is displayed showing:

- Trip title and cover image
- Destination list
- Date range
- Budget (if available)
- Link to full trip itinerary

## Media Carousel

For posts with multiple images:

- Swipeable carousel with navigation arrows
- Pagination dots showing current position
- Responsive image sizing (max-height: 24rem)
- Single images display without carousel controls

## Nested Replies

Replies are visually nested with:

- Left margin indentation (max 8rem)
- Vertical connector line
- Recursive rendering for deep threads
- Preserved engagement actions at each level

## Accessibility

- Semantic HTML with `<article>` and proper heading structure
- ARIA labels on all interactive elements
- ARIA pressed states for toggle buttons
- Keyboard navigation support
- Screen reader announcements for actions
- Focus indicators on all interactive elements

## Styling

The component uses Tailwind CSS with dark mode support:

- Light mode: White background with gray borders
- Dark mode: Dark gray background with lighter borders
- Hover states for better interactivity
- Smooth transitions for all state changes

## Performance

- Optimistic updates for instant UI feedback
- Memoized engagement state from Zustand store
- Lazy loading for images (handled by browser)
- Efficient re-rendering with React hooks

## Examples

See `ThreadCard.example.tsx` for comprehensive usage examples including:

1. Simple text post
2. Post with trip embed
3. Post with media carousel
4. Long post with truncation
5. Post with nested replies

## Requirements Validated

- **Requirement 2.3**: Nested replies with visual connectors
- **Requirement 3.2**: Trip embed accordion rendering
- **Requirement 3.3**: Trip embed expansion with details
- **Requirement 19.1**: Media carousel for multiple items
- **Requirement 19.2**: Carousel pagination dots
- **Requirement 20.3**: Tags as clickable links

## Related Components

- `usePostActions` - Hook for engagement actions
- `useCommunityStore` - Zustand store for post data
- `CommunityComposer` - For creating posts and replies
- `TripEmbed` - Standalone trip embed component (if needed)
- `MediaLightbox` - Full-screen media viewer (future enhancement)

## Future Enhancements

- [ ] Full-screen media lightbox on image click
- [ ] Video support in media carousel
- [ ] Animated engagement count updates
- [ ] Share button with native share API
- [ ] Copy link functionality
- [ ] Edit post inline (for post authors)
- [ ] Delete confirmation modal
- [ ] Mention highlighting (@username)
- [ ] Link preview cards
- [ ] Poll support
