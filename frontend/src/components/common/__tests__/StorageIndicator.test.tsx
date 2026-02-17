/**
 * Unit tests for StorageIndicator component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StorageIndicator } from '../StorageIndicator';
import { storageSizeManager } from '../../../services/storageSizeManager';

vi.mock('../../../services/storageSizeManager');

describe('StorageIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when storage usage is below 50% and showDetails is false', async () => {
    vi.mocked(storageSizeManager.getStorageStats).mockResolvedValue({
      totalSize: 10 * 1024 * 1024, // 10MB
      maxSize: 50 * 1024 * 1024, // 50MB
      percentUsed: 20,
      isNearLimit: false,
      isOverLimit: false,
      breakdown: {
        trips: 5 * 1024 * 1024,
        tripDays: 2 * 1024 * 1024,
        places: 1 * 1024 * 1024,
        storyItems: 1 * 1024 * 1024,
        packingItems: 500 * 1024,
        syncQueue: 300 * 1024,
        pendingUploads: 100 * 1024,
        metadata: 100 * 1024,
        offlineQueue: 0,
        quickPlan: 0,
      },
    });

    const { container } = render(<StorageIndicator />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should render when storage usage is above 50%', async () => {
    vi.mocked(storageSizeManager.getStorageStats).mockResolvedValue({
      totalSize: 30 * 1024 * 1024, // 30MB
      maxSize: 50 * 1024 * 1024, // 50MB
      percentUsed: 60,
      isNearLimit: false,
      isOverLimit: false,
      breakdown: {
        trips: 20 * 1024 * 1024,
        tripDays: 5 * 1024 * 1024,
        places: 3 * 1024 * 1024,
        storyItems: 1 * 1024 * 1024,
        packingItems: 500 * 1024,
        syncQueue: 300 * 1024,
        pendingUploads: 100 * 1024,
        metadata: 100 * 1024,
        offlineQueue: 0,
        quickPlan: 0,
      },
    });

    vi.mocked(storageSizeManager.formatBytes).mockImplementation((bytes) => {
      if (bytes === 30 * 1024 * 1024) return '30 MB';
      if (bytes === 50 * 1024 * 1024) return '50 MB';
      return `${bytes} Bytes`;
    });

    render(<StorageIndicator />);

    await waitFor(() => {
      expect(screen.getByText('Offline Storage')).toBeInTheDocument();
      expect(screen.getByText('60.0%')).toBeInTheDocument();
      expect(screen.getByText(/30 MB of 50 MB used/)).toBeInTheDocument();
    });
  });

  it('should show warning when near limit', async () => {
    vi.mocked(storageSizeManager.getStorageStats).mockResolvedValue({
      totalSize: 42 * 1024 * 1024, // 42MB (84%)
      maxSize: 50 * 1024 * 1024, // 50MB
      percentUsed: 84,
      isNearLimit: true,
      isOverLimit: false,
      breakdown: {
        trips: 30 * 1024 * 1024,
        tripDays: 8 * 1024 * 1024,
        places: 2 * 1024 * 1024,
        storyItems: 1 * 1024 * 1024,
        packingItems: 500 * 1024,
        syncQueue: 300 * 1024,
        pendingUploads: 100 * 1024,
        metadata: 100 * 1024,
        offlineQueue: 0,
        quickPlan: 0,
      },
    });

    vi.mocked(storageSizeManager.formatBytes).mockImplementation((bytes) => {
      if (bytes === 42 * 1024 * 1024) return '42 MB';
      if (bytes === 50 * 1024 * 1024) return '50 MB';
      return `${bytes} Bytes`;
    });

    render(<StorageIndicator />);

    await waitFor(() => {
      expect(screen.getByText(/Storage nearly full/)).toBeInTheDocument();
    });
  });

  it('should show error when over limit', async () => {
    vi.mocked(storageSizeManager.getStorageStats).mockResolvedValue({
      totalSize: 52 * 1024 * 1024, // 52MB (104%)
      maxSize: 50 * 1024 * 1024, // 50MB
      percentUsed: 104,
      isNearLimit: true,
      isOverLimit: true,
      breakdown: {
        trips: 40 * 1024 * 1024,
        tripDays: 8 * 1024 * 1024,
        places: 2 * 1024 * 1024,
        storyItems: 1 * 1024 * 1024,
        packingItems: 500 * 1024,
        syncQueue: 300 * 1024,
        pendingUploads: 100 * 1024,
        metadata: 100 * 1024,
        offlineQueue: 0,
        quickPlan: 0,
      },
    });

    vi.mocked(storageSizeManager.formatBytes).mockImplementation((bytes) => {
      if (bytes === 52 * 1024 * 1024) return '52 MB';
      if (bytes === 50 * 1024 * 1024) return '50 MB';
      return `${bytes} Bytes`;
    });

    render(<StorageIndicator />);

    await waitFor(() => {
      expect(screen.getByText(/Storage limit exceeded/)).toBeInTheDocument();
    });
  });

  it('should show storage breakdown when showDetails is true', async () => {
    vi.mocked(storageSizeManager.getStorageStats).mockResolvedValue({
      totalSize: 30 * 1024 * 1024,
      maxSize: 50 * 1024 * 1024,
      percentUsed: 60,
      isNearLimit: false,
      isOverLimit: false,
      breakdown: {
        trips: 20 * 1024 * 1024,
        tripDays: 5 * 1024 * 1024,
        places: 3 * 1024 * 1024,
        storyItems: 1 * 1024 * 1024,
        packingItems: 500 * 1024,
        syncQueue: 300 * 1024,
        pendingUploads: 100 * 1024,
        metadata: 100 * 1024,
        offlineQueue: 0,
        quickPlan: 0,
      },
    });

    vi.mocked(storageSizeManager.formatBytes).mockImplementation((bytes) => {
      if (bytes === 20 * 1024 * 1024) return '20 MB';
      if (bytes === 5 * 1024 * 1024) return '5 MB';
      if (bytes === 3 * 1024 * 1024) return '3 MB';
      return `${bytes} Bytes`;
    });

    render(<StorageIndicator showDetails />);

    await waitFor(() => {
      expect(screen.getByText('Storage Breakdown')).toBeInTheDocument();
    });
  });

  it('should apply correct color classes based on storage status', async () => {
    const { rerender } = render(<StorageIndicator showDetails />);

    // Normal status
    vi.mocked(storageSizeManager.getStorageStats).mockResolvedValue({
      totalSize: 30 * 1024 * 1024,
      maxSize: 50 * 1024 * 1024,
      percentUsed: 60,
      isNearLimit: false,
      isOverLimit: false,
      breakdown: {
        trips: 30 * 1024 * 1024,
        tripDays: 0,
        places: 0,
        storyItems: 0,
        packingItems: 0,
        syncQueue: 0,
        pendingUploads: 0,
        metadata: 0,
        offlineQueue: 0,
        quickPlan: 0,
      },
    });

    rerender(<StorageIndicator showDetails />);

    await waitFor(() => {
      const container = screen.getByText('Offline Storage').closest('div');
      expect(container).toHaveClass('text-blue-600', 'bg-blue-50');
    });

    // Near limit
    vi.mocked(storageSizeManager.getStorageStats).mockResolvedValue({
      totalSize: 42 * 1024 * 1024,
      maxSize: 50 * 1024 * 1024,
      percentUsed: 84,
      isNearLimit: true,
      isOverLimit: false,
      breakdown: {
        trips: 42 * 1024 * 1024,
        tripDays: 0,
        places: 0,
        storyItems: 0,
        packingItems: 0,
        syncQueue: 0,
        pendingUploads: 0,
        metadata: 0,
        offlineQueue: 0,
        quickPlan: 0,
      },
    });

    rerender(<StorageIndicator showDetails />);

    await waitFor(() => {
      const container = screen.getByText('Offline Storage').closest('div');
      expect(container).toHaveClass('text-orange-600', 'bg-orange-50');
    });

    // Over limit
    vi.mocked(storageSizeManager.getStorageStats).mockResolvedValue({
      totalSize: 52 * 1024 * 1024,
      maxSize: 50 * 1024 * 1024,
      percentUsed: 104,
      isNearLimit: true,
      isOverLimit: true,
      breakdown: {
        trips: 52 * 1024 * 1024,
        tripDays: 0,
        places: 0,
        storyItems: 0,
        packingItems: 0,
        syncQueue: 0,
        pendingUploads: 0,
        metadata: 0,
        offlineQueue: 0,
        quickPlan: 0,
      },
    });

    rerender(<StorageIndicator showDetails />);

    await waitFor(() => {
      const container = screen.getByText('Offline Storage').closest('div');
      expect(container).toHaveClass('text-red-600', 'bg-red-50');
    });
  });
});
