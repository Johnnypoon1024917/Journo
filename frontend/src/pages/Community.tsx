/**
 * Community Page
 * 
 * Main entry point for the community threads feed.
 * This component wraps the CommunityThreads component which implements
 * the threads-style feed with infinite scroll, real-time updates, and
 * responsive layout.
 * 
 * Note: The old CommunityFeed component (trip-sharing feed) is still
 * available at CommunityFeed.tsx but is not used by this page.
 */

import { CommunityThreads } from './CommunityThreads';

export function Community() {
  return <CommunityThreads />;
}
