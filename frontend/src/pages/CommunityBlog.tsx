/**
 * CommunityBlog Page
 * 
 * NOTE: This page is temporarily disabled as it uses the old trip-sharing
 * community feed functionality. It will be migrated to use the new threads-style
 * feed or kept as a separate feature in a future update.
 */

import { EmptyState } from '../components/common/EmptyState';

export function CommunityBlog() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <EmptyState
        title="Community Blog"
        description="This feature is being updated. Please use the main Community feed for now."
        icon={
          <svg
            className="w-16 h-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        }
      />
    </div>
  );
}
