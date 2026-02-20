/**
 * ActionCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionCard } from '../ActionCard';

describe('ActionCard', () => {
  it('renders with title, description, and icon', () => {
    render(
      <ActionCard
        title="Test Card"
        description="Test description"
        icon="🎉"
      />
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    
    render(
      <ActionCard
        title="Clickable Card"
        description="Click me"
        icon="👆"
        onClick={handleClick}
      />
    );

    const card = screen.getByText('Clickable Card').closest('div');
    if (card) {
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it('applies custom className', () => {
    const { container } = render(
      <ActionCard
        title="Custom Card"
        description="With custom class"
        icon="🎨"
        className="custom-test-class"
      />
    );

    const card = container.querySelector('.custom-test-class');
    expect(card).toBeInTheDocument();
  });

  it('renders with custom icon gradient', () => {
    const { container } = render(
      <ActionCard
        title="Gradient Card"
        description="With custom gradient"
        icon="🌈"
        iconGradient={{
          from: 'from-red-400',
          to: 'to-blue-400',
        }}
      />
    );

    const iconContainer = container.querySelector('.from-red-400');
    expect(iconContainer).toBeInTheDocument();
  });
});
