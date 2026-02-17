/**
 * BubbleQuest Components Tests
 * 
 * Basic tests to verify component rendering and functionality.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';
import { FAB } from '../FAB';
import { Card } from '../Card';
import { Input } from '../Input';
import { Checkbox } from '../Checkbox';
import { Slider } from '../Slider';

describe('BubbleQuest Components', () => {
  describe('Button', () => {
    it('renders with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders with icon on left', () => {
      render(
        <Button icon={<span data-testid="icon">🎨</span>}>
          With Icon
        </Button>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('handles click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      await user.click(screen.getByText('Click me'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('shows loading spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByText('Loading')).toBeInTheDocument();
    });
  });

  describe('FAB', () => {
    it('renders with default plus icon', () => {
      render(<FAB onClick={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders with custom icon', () => {
      render(<FAB onClick={() => {}} icon={<span data-testid="custom-icon">✨</span>} />);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('handles click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<FAB onClick={handleClick} />);
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Card', () => {
    it('renders children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('handles click when hoverable', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Card hoverable onClick={handleClick}>Clickable card</Card>);
      
      await user.click(screen.getByText('Clickable card'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Input', () => {
    it('renders with label', () => {
      render(<Input label="Username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('shows error message', () => {
      render(<Input label="Email" error="Invalid email" />);
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('shows helper text', () => {
      render(<Input label="Password" helperText="Must be 8+ characters" />);
      expect(screen.getByText('Must be 8+ characters')).toBeInTheDocument();
    });

    it('handles input changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<Input label="Name" onChange={handleChange} />);
      
      const input = screen.getByLabelText('Name');
      await user.type(input, 'John');
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Checkbox', () => {
    it('renders with label', () => {
      render(<Checkbox label="Accept terms" />);
      expect(screen.getByText('Accept terms')).toBeInTheDocument();
    });

    it('handles check/uncheck', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<Checkbox label="Subscribe" onChange={handleChange} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalled();
    });

    it('shows helper text', () => {
      render(<Checkbox label="Remember me" helperText="Stay logged in for 30 days" />);
      expect(screen.getByText('Stay logged in for 30 days')).toBeInTheDocument();
    });
  });

  describe('Slider', () => {
    it('renders with label', () => {
      render(<Slider label="Volume" />);
      expect(screen.getByText('Volume')).toBeInTheDocument();
    });

    it('shows current value', () => {
      render(<Slider label="Brightness" value={75} showValue />);
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('renders slider input element', () => {
      render(<Slider label="Size" min={0} max={100} defaultValue={50} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '100');
    });

    it('formats value with custom formatter', () => {
      render(
        <Slider 
          label="Font Size" 
          value={16} 
          showValue 
          valueFormatter={(val) => `${val}px`}
        />
      );
      expect(screen.getByText('16px')).toBeInTheDocument();
    });
  });
});
