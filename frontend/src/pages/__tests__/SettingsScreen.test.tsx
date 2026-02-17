/**
 * SettingsScreen Component Tests
 * 
 * Tests for the SettingsScreen component that integrates all settings components.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SettingsScreen } from '../SettingsScreen';
import * as authHook from '@/hooks/useAuth';
import * as toastHook from '@/hooks/useToast';

// Mock the hooks
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useToast');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock the BubbleQuest components
vi.mock('@/components/bubblequest/ThemeCustomization', () => ({
  ThemeCustomization: () => <div data-testid="theme-customization">Theme Customization</div>,
}));

vi.mock('@/components/bubblequest/FontSizeSlider', () => ({
  FontSizeSlider: () => <div data-testid="font-size-slider">Font Size Slider</div>,
}));

vi.mock('@/components/bubblequest/DarkModeToggle', () => ({
  DarkModeToggle: () => <div data-testid="dark-mode-toggle">Dark Mode Toggle</div>,
}));

vi.mock('@/components/bubblequest/AnimationSelector', () => ({
  AnimationSelector: () => <div data-testid="animation-selector">Animation Selector</div>,
}));

vi.mock('@/components/bubblequest/LanguageSelector', () => ({
  LanguageSelector: () => <div data-testid="language-selector">Language Selector</div>,
}));

vi.mock('@/components/bubblequest/Card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
}));

vi.mock('@/components/bubblequest/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user' as const,
  created_at: '2024-01-01',
};

const mockLogout = vi.fn();
const mockSuccess = vi.fn();
const mockError = vi.fn();

describe('SettingsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    vi.mocked(toastHook.useToast).mockReturnValue({
      success: mockSuccess,
      error: mockError,
      info: vi.fn(),
      warning: vi.fn(),
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <SettingsScreen />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render the settings screen with all sections', () => {
      renderComponent();

      // Check for main sections
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Language')).toBeInTheDocument();
      expect(screen.getByText('Account')).toBeInTheDocument();
    });

    it('should render all appearance components', () => {
      renderComponent();

      expect(screen.getByTestId('theme-customization')).toBeInTheDocument();
      expect(screen.getByTestId('font-size-slider')).toBeInTheDocument();
      expect(screen.getByTestId('dark-mode-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('animation-selector')).toBeInTheDocument();
    });

    it('should render language selector', () => {
      renderComponent();

      expect(screen.getByTestId('language-selector')).toBeInTheDocument();
    });

    it('should render account section with user info', () => {
      renderComponent();

      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should render password section', () => {
      renderComponent();

      expect(screen.getByText('Password')).toBeInTheDocument();
      expect(screen.getAllByText('Change')[0]).toBeInTheDocument();
    });

    it('should render logout section', () => {
      renderComponent();

      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.getByText('Sign out of your account on this device')).toBeInTheDocument();
    });
  });

  describe('Account Actions', () => {
    it('should handle logout', async () => {
      renderComponent();

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });

    it('should show password change form when change button is clicked', () => {
      renderComponent();

      const changeButton = screen.getAllByText('Change')[0];
      fireEvent.click(changeButton);

      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    });

    it('should hide password form when cancel is clicked', () => {
      renderComponent();

      // Open form
      const changeButton = screen.getAllByText('Change')[0];
      fireEvent.click(changeButton);

      // Close form
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument();
    });
  });

  describe('Settings Persistence', () => {
    it('should display info about settings persistence', () => {
      renderComponent();

      expect(
        screen.getByText(/all settings are saved automatically/i)
      ).toBeInTheDocument();
    });
  });

  describe('Requirements Validation', () => {
    it('should integrate theme customization (Requirement 15.1)', () => {
      renderComponent();
      expect(screen.getByTestId('theme-customization')).toBeInTheDocument();
    });

    it('should integrate font size slider (Requirement 15.2)', () => {
      renderComponent();
      expect(screen.getByTestId('font-size-slider')).toBeInTheDocument();
    });

    it('should integrate dark mode toggle (Requirement 15.3)', () => {
      renderComponent();
      expect(screen.getByTestId('dark-mode-toggle')).toBeInTheDocument();
    });

    it('should integrate animation selector (Requirement 15.4)', () => {
      renderComponent();
      expect(screen.getByTestId('animation-selector')).toBeInTheDocument();
    });

    it('should integrate language selector (Requirement 15.5)', () => {
      renderComponent();
      expect(screen.getByTestId('language-selector')).toBeInTheDocument();
    });

    it('should include account settings (Requirement 15.6)', () => {
      renderComponent();
      
      // Profile section
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      
      // Password section
      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    it('should include logout functionality (Requirement 15.7)', () => {
      renderComponent();
      
      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });
  });
});
