import { useRef, useCallback, useEffect } from 'react';

/**
 * useDebouncedUpdate Hook
 * 
 * Provides debounced updates with optimistic UI and retry logic.
 * Implements Requirement 5.10 - sticker persistence within 500ms
 */

interface UseDebouncedUpdateOptions<T> {
  delay?: number;
  maxRetries?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useDebouncedUpdate<T>(
  updateFn: (data: T) => Promise<void>,
  options: UseDebouncedUpdateOptions<T> = {}
) {
  const {
    delay = 500,
    maxRetries = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Map<string, T>>(new Map());
  const retryCountRef = useRef<Map<string, number>>(new Map());

  /**
   * Clear pending timeout
   */
  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Execute update with retry logic
   */
  const executeUpdate = useCallback(
    async (key: string, data: T) => {
      try {
        await updateFn(data);
        
        // Success - clear retry count and pending update
        retryCountRef.current.delete(key);
        pendingUpdatesRef.current.delete(key);
        onSuccess?.(data);
      } catch (error) {
        const retryCount = retryCountRef.current.get(key) || 0;
        
        if (retryCount < maxRetries) {
          // Retry after delay
          retryCountRef.current.set(key, retryCount + 1);
          
          setTimeout(() => {
            executeUpdate(key, data);
          }, retryDelay * (retryCount + 1)); // Exponential backoff
        } else {
          // Max retries reached
          retryCountRef.current.delete(key);
          pendingUpdatesRef.current.delete(key);
          onError?.(error as Error);
        }
      }
    },
    [updateFn, maxRetries, retryDelay, onSuccess, onError]
  );

  /**
   * Process all pending updates
   */
  const processPendingUpdates = useCallback(() => {
    const updates = Array.from(pendingUpdatesRef.current.entries());
    
    updates.forEach(([key, data]) => {
      executeUpdate(key, data);
    });
  }, [executeUpdate]);

  /**
   * Schedule a debounced update
   * Optimistic: UI updates immediately, backend update is debounced
   */
  const scheduleUpdate = useCallback(
    (key: string, data: T) => {
      // Store pending update
      pendingUpdatesRef.current.set(key, data);
      
      // Clear existing timeout
      clearPendingTimeout();
      
      // Schedule new timeout
      timeoutRef.current = setTimeout(() => {
        processPendingUpdates();
      }, delay);
    },
    [delay, clearPendingTimeout, processPendingUpdates]
  );

  /**
   * Flush all pending updates immediately
   */
  const flush = useCallback(() => {
    clearPendingTimeout();
    processPendingUpdates();
  }, [clearPendingTimeout, processPendingUpdates]);

  /**
   * Cancel all pending updates
   */
  const cancel = useCallback(() => {
    clearPendingTimeout();
    pendingUpdatesRef.current.clear();
    retryCountRef.current.clear();
  }, [clearPendingTimeout]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearPendingTimeout();
    };
  }, [clearPendingTimeout]);

  return {
    scheduleUpdate,
    flush,
    cancel,
    hasPendingUpdates: () => pendingUpdatesRef.current.size > 0,
  };
}
