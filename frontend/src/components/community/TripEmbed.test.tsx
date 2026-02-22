/**
 * TripEmbed Component Tests
 * 
 * Unit tests for the TripEmbed component covering:
 * - Trip summary display
 * - Accordion expand/collapse
 * - Trip not found handling
 * - Full Trip badge display
 * - Full trip link navigation
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TripEmbed } from './TripEmbed';
import { TripSummary } from '@/types/community';

// Wrapper component for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('TripEmbed', () => {
  const mockTrip: TripSummary = {
    id: 'trip-123',
    title: 'Amazing Tokyo Adventure',
    startDate: '2024-03-01',
    endDate: '2024-03-07',
    destinations: ['Tokyo', 'Kyoto', 'Osaka'],
    budget: 2500,
    currency: 'USD',
    coverImage: 'https://example.com/tokyo.jpg',
  };

  describe('Trip summary display', () => {
    it('should display trip title and destinations', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} />
        </RouterWrapper>
      );

      expect(screen.getByText('Amazing Tokyo Adventure')).toBeInTheDocument();
      expect(screen.getByText('Tokyo → Kyoto → Osaka')).toBeInTheDocument();
    });

    it('should display trip duration', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} />
        </RouterWrapper>
      );

      expect(screen.getByText('6 days')).toBeInTheDocument();
    });

    it('should display budget when provided', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} />
        </RouterWrapper>
      );

      expect(screen.getByText(/USD 2,500/)).toBeInTheDocument();
    });

    it('should display cover image when provided', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} />
        </RouterWrapper>
      );

      const image = screen.getByAltText('Amazing Tokyo Adventure');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/tokyo.jpg');
    });

    it('should handle trip without budget', () => {
      const tripWithoutBudget = { ...mockTrip, budget: undefined, currency: undefined };
      render(
        <RouterWrapper>
          <TripEmbed trip={tripWithoutBudget} />
        </RouterWrapper>
      );

      expect(screen.queryByText(/USD/)).not.toBeInTheDocument();
    });

    it('should handle trip without cover image', () => {
      const tripWithoutImage = { ...mockTrip, coverImage: undefined };
      render(
        <RouterWrapper>
          <TripEmbed trip={tripWithoutImage} />
        </RouterWrapper>
      );

      expect(screen.queryByAltText('Amazing Tokyo Adventure')).not.toBeInTheDocument();
    });
  });

  describe('Accordion expand/collapse', () => {
    it('should start collapsed by default', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} />
        </RouterWrapper>
      );

      // Expanded content should not be visible
      expect(screen.queryByText('View full itinerary')).not.toBeInTheDocument();
    });

    it('should expand when clicked', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /expand trip details/i });
      fireEvent.click(button);

      // Expanded content should now be visible
      expect(screen.getByText('View full itinerary')).toBeInTheDocument();
      expect(screen.getByText('Map view with destinations')).toBeInTheDocument();
    });

    it('should collapse when clicked again', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /expand trip details/i });
      
      // Expand
      fireEvent.click(button);
      expect(screen.getByText('View full itinerary')).toBeInTheDocument();

      // Collapse
      fireEvent.click(button);
      expect(screen.queryByText('View full itinerary')).not.toBeInTheDocument();
    });

    it('should update aria-expanded attribute', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /expand trip details/i });
      
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Trip not found handling', () => {
    it('should display fallback message when trip is null', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={null} />
        </RouterWrapper>
      );

      expect(screen.getByText('This trip is no longer available')).toBeInTheDocument();
    });

    it('should not display expand button when trip is null', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={null} />
        </RouterWrapper>
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Full Trip badge display', () => {
    it('should display Full Trip badge when isPublishedTrip is true', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} isPublishedTrip={true} />
        </RouterWrapper>
      );

      expect(screen.getByText('Full Trip')).toBeInTheDocument();
    });

    it('should not display Full Trip badge when isPublishedTrip is false', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} isPublishedTrip={false} />
        </RouterWrapper>
      );

      expect(screen.queryByText('Full Trip')).not.toBeInTheDocument();
    });

    it('should not display Full Trip badge by default', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} />
        </RouterWrapper>
      );

      expect(screen.queryByText('Full Trip')).not.toBeInTheDocument();
    });
  });

  describe('Full trip link navigation', () => {
    it('should display link to full trip itinerary when expanded', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} />
        </RouterWrapper>
      );

      // Expand the accordion
      const button = screen.getByRole('button', { name: /expand trip details/i });
      fireEvent.click(button);

      const link = screen.getByRole('link', { name: /view full itinerary/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/trip/trip-123');
    });

    it('should not display link when collapsed', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} />
        </RouterWrapper>
      );

      expect(screen.queryByRole('link', { name: /view full itinerary/i })).not.toBeInTheDocument();
    });
  });

  describe('Expanded content', () => {
    it('should display formatted dates when expanded', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /expand trip details/i });
      fireEvent.click(button);

      expect(screen.getByText(/Mar 1, 2024 - Mar 7, 2024/)).toBeInTheDocument();
    });

    it('should display budget in expanded view', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /expand trip details/i });
      fireEvent.click(button);

      expect(screen.getByText(/Budget: USD 2,500/)).toBeInTheDocument();
    });

    it('should display destination badges when expanded', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /expand trip details/i });
      fireEvent.click(button);

      expect(screen.getByText('Tokyo')).toBeInTheDocument();
      expect(screen.getByText('Kyoto')).toBeInTheDocument();
      expect(screen.getByText('Osaka')).toBeInTheDocument();
    });

    it('should display map placeholder when expanded', () => {
      render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /expand trip details/i });
      fireEvent.click(button);

      expect(screen.getByText('Map view with destinations')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle single day trip', () => {
      const singleDayTrip = {
        ...mockTrip,
        startDate: '2024-03-01',
        endDate: '2024-03-01',
      };

      render(
        <RouterWrapper>
          <TripEmbed trip={singleDayTrip} />
        </RouterWrapper>
      );

      expect(screen.getByText('0 days')).toBeInTheDocument();
    });

    it('should handle single destination', () => {
      const singleDestTrip = {
        ...mockTrip,
        destinations: ['Tokyo'],
      };

      render(
        <RouterWrapper>
          <TripEmbed trip={singleDestTrip} />
        </RouterWrapper>
      );

      expect(screen.getByText('Tokyo')).toBeInTheDocument();
    });

    it('should handle very long trip title', () => {
      const longTitleTrip = {
        ...mockTrip,
        title: 'A Very Long Trip Title That Should Be Truncated Because It Is Too Long To Display Properly',
      };

      render(
        <RouterWrapper>
          <TripEmbed trip={longTitleTrip} />
        </RouterWrapper>
      );

      expect(screen.getByText(longTitleTrip.title)).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <RouterWrapper>
          <TripEmbed trip={mockTrip} className="custom-class" />
        </RouterWrapper>
      );

      const tripEmbed = container.firstChild;
      expect(tripEmbed).toHaveClass('custom-class');
    });
  });
});
