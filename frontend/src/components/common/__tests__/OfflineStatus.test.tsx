import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import OfflineStatus from '../OfflineStatus';

describe('OfflineStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up event listeners
    window.removeEventListener('online', vi.fn());
    window.removeEventListener('offline', vi.fn());
  });

  it('should not render when online initially', () => {
    // Mock navigator.onLine as true
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    render(<OfflineStatus />);
    
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
  });

  it('should render offline message when offline initially', () => {
    // Mock navigator.onLine as false
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    render(<OfflineStatus />);
    
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
  });

  it('should show offline message when going offline', async () => {
    // Start online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    render(<OfflineStatus />);
    
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
    
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    
    window.dispatchEvent(new Event('offline'));
    
    await waitFor(() => {
      expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
    });
  });

  it('should show back online message when reconnecting', async () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    render(<OfflineStatus />);
    
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
    
    // Simulate going back online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
    
    window.dispatchEvent(new Event('online'));
    
    await waitFor(() => {
      expect(screen.getByText(/back online/i)).toBeInTheDocument();
    });
  });

  it('should contain correct offline message elements', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    render(<OfflineStatus />);
    
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
    expect(screen.getByText(/changes will sync when reconnected/i)).toBeInTheDocument();
  });

  it('should contain correct online message elements', async () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    render(<OfflineStatus />);
    
    // Go back online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
    
    window.dispatchEvent(new Event('online'));
    
    await waitFor(() => {
      expect(screen.getByText(/back online/i)).toBeInTheDocument();
      expect(screen.getByText(/syncing changes/i)).toBeInTheDocument();
    });
  });
});