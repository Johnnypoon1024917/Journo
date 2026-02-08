import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PWAInstallPrompt from '../PWAInstallPrompt';

// Mock the beforeinstallprompt event
const mockPrompt = vi.fn();
const mockUserChoice = Promise.resolve({ outcome: 'accepted' });

const createMockEvent = () => ({
  preventDefault: vi.fn(),
  prompt: mockPrompt,
  userChoice: mockUserChoice,
  platforms: ['web'],
});

describe('PWAInstallPrompt', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    // Clean up event listeners
    const events = ['beforeinstallprompt', 'appinstalled'];
    events.forEach(event => {
      window.removeEventListener(event, vi.fn());
    });
  });

  it('should not render when app is already installed', () => {
    // Mock standalone mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<PWAInstallPrompt />);
    
    expect(screen.queryByText('Install Journo')).not.toBeInTheDocument();
  });

  it('should not render when no install prompt is available', () => {
    render(<PWAInstallPrompt />);
    
    expect(screen.queryByText('Install Journo')).not.toBeInTheDocument();
  });

  it('should render when install prompt is available', async () => {
    const { rerender } = render(<PWAInstallPrompt />);
    
    // Simulate beforeinstallprompt event
    const mockEvent = createMockEvent();
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent));
    
    rerender(<PWAInstallPrompt />);
    
    await waitFor(() => {
      expect(screen.getByText('Install Journo')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Get the full app experience with offline access and faster loading.')).toBeInTheDocument();
  });

  it('should handle install button click', async () => {
    const { rerender } = render(<PWAInstallPrompt />);
    
    // Simulate beforeinstallprompt event
    const mockEvent = createMockEvent();
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent));
    
    rerender(<PWAInstallPrompt />);
    
    await waitFor(() => {
      expect(screen.getByText('Install')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Install'));
    
    expect(mockPrompt).toHaveBeenCalled();
  });

  it('should handle dismiss button click', async () => {
    const { rerender } = render(<PWAInstallPrompt />);
    
    // Simulate beforeinstallprompt event
    const mockEvent = createMockEvent();
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent));
    
    rerender(<PWAInstallPrompt />);
    
    await waitFor(() => {
      expect(screen.getByText('Not now')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Not now'));
    
    expect(localStorage.getItem('pwa-install-dismissed')).toBe('true');
  });

  it('should not render when user has previously dismissed', () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    
    const { rerender } = render(<PWAInstallPrompt />);
    
    // Simulate beforeinstallprompt event
    const mockEvent = createMockEvent();
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent));
    
    rerender(<PWAInstallPrompt />);
    
    expect(screen.queryByText('Install Journo')).not.toBeInTheDocument();
  });

  it('should hide when app is installed', async () => {
    const { rerender } = render(<PWAInstallPrompt />);
    
    // Simulate beforeinstallprompt event
    const mockEvent = createMockEvent();
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent));
    
    rerender(<PWAInstallPrompt />);
    
    await waitFor(() => {
      expect(screen.getByText('Install Journo')).toBeInTheDocument();
    });
    
    // Simulate app installed event
    window.dispatchEvent(new Event('appinstalled'));
    
    rerender(<PWAInstallPrompt />);
    
    await waitFor(() => {
      expect(screen.queryByText('Install Journo')).not.toBeInTheDocument();
    });
  });
});