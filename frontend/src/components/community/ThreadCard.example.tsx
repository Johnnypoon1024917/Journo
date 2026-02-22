/**
 * ThreadCard Component Examples
 * 
 * Demonstrates various use cases of the ThreadCard component
 */

import { ThreadCard } from './ThreadCard';
import { PostWithEngagement } from '@/types/community';

// Example 1: Simple post with text only
const simplePost: PostWithEngagement = {
  id: '1',
  userId: 'user-1',
  userName: 'Jane Traveler',
  userAvatar: 'https://i.pravatar.cc/150?img=1',
  content: 'Just got back from an amazing trip to Tokyo! The cherry blossoms were in full bloom 🌸',
  mediaUrls: [],
  tags: ['Tokyo', 'Japan', 'CherryBlossoms'],
  likeCount: 42,
  replyCount: 5,
  repostCount: 8,
  engagementScore: 150,
  isDeleted: false,
  isLiked: false,
  isReposted: false,
  isBookmarked: false,
  createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  updatedAt: new Date(Date.now() - 3600000).toISOString(),
};

// Example 2: Post with trip embed
const postWithTrip: PostWithEngagement = {
  id: '2',
  userId: 'user-2',
  userName: 'John Explorer',
  userAvatar: 'https://i.pravatar.cc/150?img=2',
  communityId: 'comm-1',
  communityName: 'Asia Travel',
  content: 'Check out my 10-day adventure through Southeast Asia! From bustling Bangkok to serene Bali.',
  tripId: 'trip-1',
  tripEmbed: {
    id: 'trip-1',
    title: 'Southeast Asia Adventure',
    startDate: '2024-03-01',
    endDate: '2024-03-10',
    destinations: ['Bangkok', 'Chiang Mai', 'Bali'],
    budget: 2500,
    currency: 'USD',
    coverImage: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400',
  },
  mediaUrls: [],
  tags: ['Thailand', 'Indonesia', 'Backpacking'],
  likeCount: 156,
  replyCount: 23,
  repostCount: 34,
  engagementScore: 520,
  isDeleted: false,
  isLiked: true,
  isReposted: false,
  isBookmarked: true,
  createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  updatedAt: new Date(Date.now() - 86400000).toISOString(),
};

// Example 3: Post with media carousel
const postWithMedia: PostWithEngagement = {
  id: '3',
  userId: 'user-3',
  userName: 'Sarah Photographer',
  userAvatar: 'https://i.pravatar.cc/150?img=3',
  content: 'Sunset views from Santorini never get old! Here are some of my favorite shots from this magical island.',
  mediaUrls: [
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
    'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
    'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=800',
  ],
  tags: ['Santorini', 'Greece', 'Photography'],
  likeCount: 234,
  replyCount: 12,
  repostCount: 45,
  engagementScore: 780,
  isDeleted: false,
  isLiked: false,
  isReposted: true,
  isBookmarked: false,
  createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  updatedAt: new Date(Date.now() - 7200000).toISOString(),
};

// Example 4: Long post with truncation
const longPost: PostWithEngagement = {
  id: '4',
  userId: 'user-4',
  userName: 'Mike Storyteller',
  userAvatar: 'https://i.pravatar.cc/150?img=4',
  content: `My journey through Patagonia was nothing short of extraordinary. From the moment I set foot in this wild, untamed landscape, I knew I was in for an adventure of a lifetime. The towering peaks of Torres del Paine, the massive glaciers of Los Glaciares National Park, and the windswept plains that stretch as far as the eye can see - every moment was breathtaking. I spent two weeks hiking, camping, and immersing myself in the raw beauty of this region. The people I met along the way, the challenges I faced, and the incredible wildlife encounters made this trip unforgettable.`,
  mediaUrls: [],
  tags: ['Patagonia', 'Argentina', 'Chile', 'Hiking'],
  likeCount: 89,
  replyCount: 15,
  repostCount: 12,
  engagementScore: 320,
  isDeleted: false,
  isLiked: false,
  isReposted: false,
  isBookmarked: false,
  createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  updatedAt: new Date(Date.now() - 172800000).toISOString(),
};

// Example 5: Nested replies
const parentPost: PostWithEngagement = {
  id: '5',
  userId: 'user-5',
  userName: 'Emma Wanderer',
  userAvatar: 'https://i.pravatar.cc/150?img=5',
  content: 'What are your must-visit destinations in Europe for first-timers?',
  mediaUrls: [],
  tags: ['Europe', 'TravelAdvice'],
  likeCount: 67,
  replyCount: 8,
  repostCount: 3,
  engagementScore: 250,
  isDeleted: false,
  isLiked: false,
  isReposted: false,
  isBookmarked: false,
  createdAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
  updatedAt: new Date(Date.now() - 10800000).toISOString(),
};

const reply1: PostWithEngagement = {
  id: '5-1',
  userId: 'user-6',
  userName: 'David Guide',
  userAvatar: 'https://i.pravatar.cc/150?img=6',
  parentId: '5',
  content: 'Paris, Rome, and Barcelona are classics for a reason! You can\'t go wrong with these three.',
  mediaUrls: [],
  tags: [],
  likeCount: 12,
  replyCount: 2,
  repostCount: 0,
  engagementScore: 40,
  isDeleted: false,
  isLiked: false,
  isReposted: false,
  isBookmarked: false,
  createdAt: new Date(Date.now() - 9000000).toISOString(),
  updatedAt: new Date(Date.now() - 9000000).toISOString(),
};

const reply2: PostWithEngagement = {
  id: '5-2',
  userId: 'user-7',
  userName: 'Lisa Local',
  userAvatar: 'https://i.pravatar.cc/150?img=7',
  parentId: '5',
  content: 'Don\'t forget about Prague and Amsterdam! Both are incredibly beautiful and easy to navigate.',
  mediaUrls: [],
  tags: [],
  likeCount: 8,
  replyCount: 0,
  repostCount: 1,
  engagementScore: 30,
  isDeleted: false,
  isLiked: true,
  isReposted: false,
  isBookmarked: false,
  createdAt: new Date(Date.now() - 7200000).toISOString(),
  updatedAt: new Date(Date.now() - 7200000).toISOString(),
};

/**
 * Example usage of ThreadCard component
 */
export function ThreadCardExamples() {
  const handleReply = (postId: string) => {
    console.log('Reply to post:', postId);
  };

  const handleReport = (postId: string) => {
    console.log('Report post:', postId);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      <h1 className="text-2xl font-bold mb-6">ThreadCard Examples</h1>

      <section>
        <h2 className="text-xl font-semibold mb-3">Simple Post</h2>
        <ThreadCard
          post={simplePost}
          onReply={handleReply}
          onReport={handleReport}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Post with Trip Embed</h2>
        <ThreadCard
          post={postWithTrip}
          onReply={handleReply}
          onReport={handleReport}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Post with Media Carousel</h2>
        <ThreadCard
          post={postWithMedia}
          onReply={handleReply}
          onReport={handleReport}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Long Post with Truncation</h2>
        <ThreadCard
          post={longPost}
          onReply={handleReply}
          onReport={handleReport}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Post with Nested Replies</h2>
        <ThreadCard
          post={parentPost}
          onReply={handleReply}
          onReport={handleReport}
          showReplies={true}
          replies={[reply1, reply2]}
        />
      </section>
    </div>
  );
}

export default ThreadCardExamples;
