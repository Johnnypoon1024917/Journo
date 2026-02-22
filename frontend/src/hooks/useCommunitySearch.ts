/**
 * useCommunitySearch Hook
 * 
 * Custom hook for searching posts and communities with debounced input.
 * Provides search functionality with loading states and result management.
 * 
 * Requirements: 10.1, 10.3
 */

import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import CommunityService from '@/services/communityService';
import type { 
  PostWithEngagement, 
  Community, 
  SearchResponse,
  SearchResult 
} from '@/types/community';

export interface UseCommunitySearchOptions {
  /**
   * Type of search to perform
   */
  searchType: 'posts' | 'communities';

  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  debounceMs?: number;

  /**
   * Minimum query length before searching
   * @default 2
   */
  minQueryLength?: number;

  /**
   * Whether to automatically search on query change
   * @default true
   */
  autoSearch?: boolean;
}

export interface UseCommunitySearchReturn<T> {
  /**
   * Current search query
   */
  query: string;

  /**
   * Set the search query
   */
  setQuery: (query: string) => void;

  /**
   * Search results
   */
  results: SearchResult<T>[];

  /**
   * Whether a search is in progress
   */
  isSearching: boolean;

  /**
   * Error message if search failed
   */
  error: string | null;

  /**
   * Manually trigger a search
   */
  search: (searchQuery?: string) => Promise<void>;

  /**
   * Clear search results and query
   */
  clear: () => void;

  /**
   * Total number of results
   */
  totalCount: number;
}

/**
 * Hook for searching posts or communities with debounced input
 * 
 * @param options - Search configuration options
 * @returns Search state and control functions
 * 
 * @example
 * ```tsx
 * // Search posts
 * const { query, setQuery, results, isSearching } = useCommunitySearch({
 *   searchType: 'posts',
 *   debounceMs: 300
 * });
 * 
 * // Search communities
 * const { query, setQuery, results, isSearching } = useCommunitySearch({
 *   searchType: 'communities',
 *   debounceMs: 500
 * });
 * ```
 */
export function useCommunitySearch<T = PostWithEngagement | Community>(
  options: UseCommunitySearchOptions
): UseCommunitySearchReturn<T> {
  const { 
    searchType, 
    debounceMs = 300, 
    minQueryLength = 2,
    autoSearch = true 
  } = options;

  // State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult<T>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce the query
  const debouncedQuery = useDebounce(query, debounceMs);

  /**
   * Perform the search
   */
  const search = useCallback(async (searchQuery?: string) => {
    const queryToSearch = searchQuery ?? debouncedQuery;

    // Don't search if query is too short
    if (!queryToSearch || queryToSearch.trim().length < minQueryLength) {
      setResults([]);
      setTotalCount(0);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      let response: SearchResponse<any>;

      if (searchType === 'posts') {
        response = await CommunityService.searchPosts(queryToSearch.trim());
      } else {
        response = await CommunityService.searchCommunities(queryToSearch.trim());
      }

      setResults(response.results as SearchResult<T>[]);
      setTotalCount(response.totalCount);
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.message || 'Search failed. Please try again.');
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsSearching(false);
    }
  }, [debouncedQuery, searchType, minQueryLength]);

  /**
   * Clear search results and query
   */
  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setTotalCount(0);
    setError(null);
  }, []);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (autoSearch && debouncedQuery) {
      search();
    } else if (!debouncedQuery) {
      // Clear results when query is empty
      setResults([]);
      setTotalCount(0);
      setError(null);
    }
  }, [debouncedQuery, autoSearch, search]);

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    search,
    clear,
    totalCount,
  };
}

/**
 * Convenience hook for searching posts
 */
export function usePostSearch(options?: Omit<UseCommunitySearchOptions, 'searchType'>) {
  return useCommunitySearch<PostWithEngagement>({
    ...options,
    searchType: 'posts',
  });
}

/**
 * Convenience hook for searching communities
 */
export function useCommunitySearchOnly(options?: Omit<UseCommunitySearchOptions, 'searchType'>) {
  return useCommunitySearch<Community>({
    ...options,
    searchType: 'communities',
  });
}

export default useCommunitySearch;
