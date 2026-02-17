import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AriaAnnouncerProvider, useAriaAnnouncer } from '../AriaAnnouncerProvider';
import React from 'react';

describe('AriaAnnouncerProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Provider Setup', () => {
    it('should render children', () => {
      render(
        <AriaAnnouncerProvider>
          <div>Test Child</div>
        </AriaAnnouncerProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should render ARIA live region', () => {
      const { container } = render(
        <AriaAnnouncerProvider>
          <div>Test</div>
        </AriaAnnouncerProvider>
      );

      const liveRegion = container.querySelector('[role="status"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('should throw error when useAriaAnnouncer is used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      function TestComponent() {
        useAriaAnnouncer();
        return <div>Test</div>;
      }

      expect(() => render(<TestComponent />)).toThrow(
        'useAriaAnnouncer must be used within AriaAnnouncerProvider'
      );

      consoleError.mockRestore();
    });
  });

  describe('Announcement Functions', () => {
    it('should announce loading messages with polite priority', () => {
      let announcer: ReturnType<typeof useAriaAnnouncer>;

      function TestComponent() {
        announcer = useAriaAnnouncer();
        return <button onClick={() => announcer.announceLoading('Loading...')}>Load</button>;
      }

      const { container } = render(
        <AriaAnnouncerProvider>
          <TestComponent />
        </AriaAnnouncerProvider>
      );

      screen.getByText('Load').click();

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toHaveTextContent('Loading...');
    });

    it('should announce error messages with assertive priority', () => {
      let announcer: ReturnType<typeof useAriaAnnouncer>;

      function TestComponent() {
        announcer = useAriaAnnouncer();
        return <button onClick={() => announcer.announceError('Error occurred')}>Error</button>;
      }

      const { container } = render(
        <AriaAnnouncerProvider>
          <TestComponent />
        </AriaAnnouncerProvider>
      );

      screen.getByText('Error').click();

      const liveRegion = container.querySelector('[aria-live="assertive"]');
      expect(liveRegion).toHaveTextContent('Error occurred');
    });

    it('should announce success messages with polite priority', () => {
      let announcer: ReturnType<typeof useAriaAnnouncer>;

      function TestComponent() {
        announcer = useAriaAnnouncer();
        return <button onClick={() => announcer.announceSuccess('Success!')}>Success</button>;
      }

      const { container } = render(
        <AriaAnnouncerProvider>
          <TestComponent />
        </AriaAnnouncerProvider>
      );

      screen.getByText('Success').click();

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toHaveTextContent('Success!');
    });

    it('should announce info messages with polite priority', () => {
      let announcer: ReturnType<typeof useAriaAnnouncer>;

      function TestComponent() {
        announcer = useAriaAnnouncer();
        return <button onClick={() => announcer.announceInfo('Information')}>Info</button>;
      }

      const { container } = render(
        <AriaAnnouncerProvider>
          <TestComponent />
        </AriaAnnouncerProvider>
      );

      screen.getByText('Info').click();

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toHaveTextContent('Information');
    });

    it('should clear announcements', () => {
      let announcer: ReturnType<typeof useAriaAnnouncer>;

      function TestComponent() {
        announcer = useAriaAnnouncer();
        return (
          <>
            <button onClick={() => announcer.announceInfo('Test message')}>Announce</button>
            <button onClick={() => announcer.clearAnnouncement()}>Clear</button>
          </>
        );
      }

      render(
        <AriaAnnouncerProvider>
          <TestComponent />
        </AriaAnnouncerProvider>
      );

      screen.getByText('Announce').click();
      expect(screen.getByRole('status')).toHaveTextContent('Test message');

      screen.getByText('Clear').click();
      expect(screen.getByRole('status')).toHaveTextContent('');
    });
  });

  describe('Auto-clear Behavior', () => {
    it('should auto-clear messages after 3 seconds', async () => {
      let announcer: ReturnType<typeof useAriaAnnouncer>;

      function TestComponent() {
        announcer = useAriaAnnouncer();
        return <button onClick={() => announcer.announceInfo('Temporary')}>Announce</button>;
      }

      render(
        <AriaAnnouncerProvider>
          <TestComponent />
        </AriaAnnouncerProvider>
      );

      screen.getByText('Announce').click();
      expect(screen.getByRole('status')).toHaveTextContent('Temporary');

      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('');
      });
    });
  });

  describe('Requirements Validation', () => {
    it('should validate Requirements 9.6 - State change announcements for loading', () => {
      let announcer: ReturnType<typeof useAriaAnnouncer>;

      function TestComponent() {
        announcer = useAriaAnnouncer();
        return <button onClick={() => announcer.announceLoading('Loading data...')}>Load</button>;
      }

      const { container } = render(
        <AriaAnnouncerProvider>
          <TestComponent />
        </AriaAnnouncerProvider>
      );

      screen.getByText('Load').click();

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Loading data...');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should validate Requirements 9.6 - State change announcements for errors', () => {
      let announcer: ReturnType<typeof useAriaAnnouncer>;

      function TestComponent() {
        announcer = useAriaAnnouncer();
        return <button onClick={() => announcer.announceError('Failed to load')}>Error</button>;
      }

      const { container } = render(
        <AriaAnnouncerProvider>
          <TestComponent />
        </AriaAnnouncerProvider>
      );

      screen.getByText('Error').click();

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Failed to load');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should validate Requirements 9.6 - State change announcements for success', () => {
      let announcer: ReturnType<typeof useAriaAnnouncer>;

      function TestComponent() {
        announcer = useAriaAnnouncer();
        return <button onClick={() => announcer.announceSuccess('Saved successfully')}>Save</button>;
      }

      const { container } = render(
        <AriaAnnouncerProvider>
          <TestComponent />
        </AriaAnnouncerProvider>
      );

      screen.getByText('Save').click();

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Saved successfully');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Multiple Announcements', () => {
    it('should handle rapid successive announcements', () => {
      let announcer: ReturnType<typeof useAriaAnnouncer>;

      function TestComponent() {
        announcer = useAriaAnnouncer();
        return (
          <button
            onClick={() => {
              announcer.announceInfo('First');
              announcer.announceInfo('Second');
              announcer.announceInfo('Third');
            }}
          >
            Multiple
          </button>
        );
      }

      render(
        <AriaAnnouncerProvider>
          <TestComponent />
        </AriaAnnouncerProvider>
      );

      screen.getByText('Multiple').click();

      // Should show the last announcement
      expect(screen.getByRole('status')).toHaveTextContent('Third');
    });

    it('should switch priority when announcement type changes', () => {
      let announcer: ReturnType<typeof useAriaAnnouncer>;

      function TestComponent() {
        announcer = useAriaAnnouncer();
        return (
          <>
            <button onClick={() => announcer.announceInfo('Info')}>Info</button>
            <button onClick={() => announcer.announceError('Error')}>Error</button>
          </>
        );
      }

      const { container } = render(
        <AriaAnnouncerProvider>
          <TestComponent />
        </AriaAnnouncerProvider>
      );

      screen.getByText('Info').click();
      expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();

      screen.getByText('Error').click();
      expect(container.querySelector('[aria-live="assertive"]')).toBeInTheDocument();
    });
  });
});
