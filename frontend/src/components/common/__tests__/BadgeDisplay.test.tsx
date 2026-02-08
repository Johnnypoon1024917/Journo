import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BadgeDisplay, BadgeGrid } from '../BadgeDisplay';
import { UserBadge } from '../../../types/user';

const mockBadge: UserBadge = {
  id: '1',
  user_id: 'user-1',
  trip_id: 'trip-1',
  badge_type: 'golden_hour',
  earned_at: '2024-01-01T19:00:00Z'
};

describe('BadgeDisplay', () => {
  it('renders badge with icon and details', () => {
    render(
      <BadgeDisplay 
        badge={mockBadge} 
        showDetails={true} 
      />
    );

    expect(screen.getByText('Golden Hour')).toBeInTheDocument();
    expect(screen.getByText('Uploaded a photo after 6 PM')).toBeInTheDocument();
    expect(screen.getByText('🌅')).toBeInTheDocument();
  });

  it('renders badge without details when showDetails is false', () => {
    render(
      <BadgeDisplay 
        badge={mockBadge} 
        showDetails={false} 
      />
    );

    expect(screen.getByText('🌅')).toBeInTheDocument();
    expect(screen.queryByText('Golden Hour')).not.toBeInTheDocument();
  });
});

describe('BadgeGrid', () => {
  it('renders empty state when no badges', () => {
    render(<BadgeGrid badges={[]} />);

    expect(screen.getByText('No badges earned yet')).toBeInTheDocument();
    expect(screen.getByText('Start exploring and adding places to earn your first badge!')).toBeInTheDocument();
  });

  it('renders badges in grid layout', () => {
    const badges: UserBadge[] = [
      mockBadge,
      {
        id: '2',
        user_id: 'user-1',
        trip_id: 'trip-1',
        badge_type: 'food_explorer',
        earned_at: '2024-01-02T12:00:00Z'
      }
    ];

    render(<BadgeGrid badges={badges} />);

    expect(screen.getByText('Golden Hour')).toBeInTheDocument();
    expect(screen.getByText('Food Explorer')).toBeInTheDocument();
  });

  it('shows only unique badge types', () => {
    const badges: UserBadge[] = [
      mockBadge,
      {
        id: '2',
        user_id: 'user-1',
        trip_id: 'trip-2',
        badge_type: 'golden_hour', // Duplicate type
        earned_at: '2024-01-02T19:00:00Z'
      }
    ];

    render(<BadgeGrid badges={badges} />);

    // Should only show one Golden Hour badge
    const goldenHourBadges = screen.getAllByText('Golden Hour');
    expect(goldenHourBadges).toHaveLength(1);
  });
});