/**
 * Optimistic Update Infrastructure
 * Exports all optimistic update related services and utilities
 */

export { optimisticUpdateManager, type OptimisticUpdate, type UpdateOptions } from '../optimisticUpdateManager';
export { syncQueueService, type SyncQueueOptions } from '../syncQueueService';
export {
  retryWithBackoff,
  RetryableError,
  NonRetryableError,
  isNetworkError,
  isServerError,
  isTimeoutError,
  isClientError,
  getUserFriendlyErrorMessage,
  createRetryableError,
  createNonRetryableError,
  type RetryOptions,
} from '../../utils/errorHandling';
export { usePlaceStore } from '../../stores/placeStore';
