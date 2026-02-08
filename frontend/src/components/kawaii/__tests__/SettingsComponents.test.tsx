/**
 * Settings Components Tests
 * 
 * Unit tests for Settings screen components:
 * - ThemeCustomization
 * - FontSizeSlider
 * - DarkModeToggle
 * - AnimationSelector
 * - LanguageSelector
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useKawaiiThemeStore } from '@/stores/kawaiiThemeStore';
import { ThemeCustomization } from '../ThemeCustomization';
import { FontSizeSlider } from '../FontSizeSlider';
import { DarkModeToggle } from '../DarkModeToggle';
import { AnimationSelector } from '../AnimationSelector';
import { LanguageSelector } from '../LanguageSelector';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

describe('ThemeCustomization', () => {
  beforeEach(() => {
    // Reset theme store to default
    const store = useKawaiiThemeStore.getState();
    store.resetTheme();
  });

  it('renders theme customization component', () => {
    render(<ThemeCustomization />);
    expect(screen.getByText('Theme Color')).toBeInTheDocument();
    expect(screen.getByText('Preset Colors')).toBeInTheDocument();
    expect(screen.getByText('Custom Color')).toBeInTheDocument();
  });

  it('displays all 6 preset colors', () => {
    render(<ThemeCustomization />);
    expect(screen.getByText('Pink')).toBeInTheDocument();
    expect(screen.getByText('Orange')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('Teal')).toBeInTheDocument();
    expect(screen.getByText('Purple')).toBeInTheDocument();
    expect(screen.getByText('Yellow')).toBeInTheDocument();
  });

  it('applies preset color when clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeCustomization />);
    
    const blueButton = screen.getByLabelText('Select Blue theme');
    await user.click(blueButton);
    
    const store = useKawaiiThemeStore.getState();
    expect(store.primaryColor).toBe('#6B9BD1');
  });

  it('shows custom color picker when custom button clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeCustomization />);
    
    const customButton = screen.getByLabelText('Custom color picker');
    await user.click(customButton);
    
    // HexColorPicker should be visible
    await waitFor(() => {
      expect(screen.getByPlaceholderText('var(--kawaii-primary-500)')).toBeInTheDocument();
    });
  });

  it('displays live preview indicator', () => {
    render(<ThemeCustomization />);
    expect(screen.getByText('Theme changes are applied immediately')).toBeInTheDocument();
  });

  it('highlights selected preset color', () => {
    render(<ThemeCustomization />);
    
    const pinkButton = screen.getByLabelText('Select Pink theme');
    expect(pinkButton).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('FontSizeSlider', () => {
  beforeEach(() => {
    const store = useKawaiiThemeStore.getState();
    store.resetTheme();
  });

  it('renders font size slider component', () => {
    render(<FontSizeSlider />);
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByText('Text Size')).toBeInTheDocument();
  });

  it('displays current font size value', () => {
    render(<FontSizeSlider />);
    expect(screen.getByText('16px')).toBeInTheDocument();
  });

  it('displays size reference labels', () => {
    render(<FontSizeSlider />);
    expect(screen.getByText('Small')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();
    expect(screen.getByText('Extra Large')).toBeInTheDocument();
  });

  it('changes font size when slider moved', async () => {
    render(<FontSizeSlider />);
    
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '20' } });
    
    await waitFor(() => {
      const store = useKawaiiThemeStore.getState();
      expect(store.fontSize).toBe(20);
    });
  });

  it('changes font size when size label clicked', async () => {
    const user = userEvent.setup();
    render(<FontSizeSlider />);
    
    const largeButton = screen.getByLabelText('Set font size to Large');
    await user.click(largeButton);
    
    const store = useKawaiiThemeStore.getState();
    expect(store.fontSize).toBe(20);
  });

  it('displays preview text', () => {
    render(<FontSizeSlider />);
    expect(screen.getByText(/The quick brown fox/)).toBeInTheDocument();
  });

  it('shows reset button when font size is not default', async () => {
    const store = useKawaiiThemeStore.getState();
    store.setFontSize(20);
    
    render(<FontSizeSlider />);
    expect(screen.getByText('Reset to Default (16px)')).toBeInTheDocument();
  });

  it('resets font size when reset button clicked', async () => {
    const user = userEvent.setup();
    const store = useKawaiiThemeStore.getState();
    store.setFontSize(20);
    
    render(<FontSizeSlider />);
    
    const resetButton = screen.getByText('Reset to Default (16px)');
    await user.click(resetButton);
    
    expect(store.fontSize).toBe(16);
  });
});

describe('DarkModeToggle', () => {
  beforeEach(() => {
    const store = useKawaiiThemeStore.getState();
    store.resetTheme();
  });

  it('renders dark mode toggle component', () => {
    render(<DarkModeToggle />);
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });

  it('displays correct description for light mode', () => {
    render(<DarkModeToggle />);
    expect(screen.getByText('Switch to dark theme')).toBeInTheDocument();
  });

  it('displays correct description for dark mode', () => {
    const store = useKawaiiThemeStore.getState();
    store.setDarkMode(true);
    
    render(<DarkModeToggle />);
    expect(screen.getByText('Switch to light theme')).toBeInTheDocument();
  });

  it('toggles dark mode when clicked', async () => {
    const user = userEvent.setup();
    render(<DarkModeToggle />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    
    await user.click(toggle);
    
    const store = useKawaiiThemeStore.getState();
    expect(store.darkMode).toBe(true);
  });

  it('displays appropriate info text for light mode', () => {
    render(<DarkModeToggle />);
    expect(screen.getByText(/Light mode is active/)).toBeInTheDocument();
  });

  it('displays appropriate info text for dark mode', () => {
    const store = useKawaiiThemeStore.getState();
    store.setDarkMode(true);
    
    render(<DarkModeToggle />);
    expect(screen.getByText(/Dark mode is active/)).toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    render(<DarkModeToggle />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-label', 'Enable dark mode');
  });
});

describe('AnimationSelector', () => {
  beforeEach(() => {
    const store = useKawaiiThemeStore.getState();
    store.resetTheme();
  });

  it('renders animation selector component', () => {
    render(<AnimationSelector />);
    expect(screen.getByText('Particle Animations')).toBeInTheDocument();
  });

  it('displays all animation options', () => {
    render(<AnimationSelector />);
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.getByText('Snow')).toBeInTheDocument();
    expect(screen.getByText('Sakura')).toBeInTheDocument();
  });

  it('displays descriptions for each option', () => {
    render(<AnimationSelector />);
    expect(screen.getByText('No particle effects')).toBeInTheDocument();
    expect(screen.getByText('Gentle snowfall')).toBeInTheDocument();
    expect(screen.getByText('Cherry blossom petals')).toBeInTheDocument();
  });

  it('selects animation when clicked', async () => {
    const user = userEvent.setup();
    render(<AnimationSelector />);
    
    const snowButton = screen.getByLabelText('Select Snow animation');
    await user.click(snowButton);
    
    const store = useKawaiiThemeStore.getState();
    expect(store.animations).toBe('snow');
  });

  it('highlights selected animation', () => {
    render(<AnimationSelector />);
    
    const noneButton = screen.getByLabelText('Select None animation');
    expect(noneButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('displays info for selected animation', () => {
    render(<AnimationSelector />);
    expect(screen.getByText(/No animations selected/)).toBeInTheDocument();
  });

  it('shows performance note when animation is active', () => {
    const store = useKawaiiThemeStore.getState();
    store.setAnimations('snow');
    
    render(<AnimationSelector />);
    expect(screen.getByText(/optimized for 60fps performance/)).toBeInTheDocument();
  });

  it('does not show performance note when no animation', () => {
    render(<AnimationSelector />);
    expect(screen.queryByText(/optimized for 60fps performance/)).not.toBeInTheDocument();
  });
});

describe('LanguageSelector', () => {
  it('renders language selector component', () => {
    render(<LanguageSelector />);
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it('displays current language', () => {
    render(<LanguageSelector />);
    // Use getAllByText since "English" appears twice (native name and English name)
    const englishElements = screen.getAllByText('English');
    expect(englishElements.length).toBeGreaterThan(0);
  });

  it('opens dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);
    
    const button = screen.getByLabelText('Select language');
    await user.click(button);
    
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('displays all language options in dropdown', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);
    
    const button = screen.getByLabelText('Select language');
    await user.click(button);
    
    await waitFor(() => {
      // English appears 4 times: 2 in button (native + English), 2 in dropdown (native + English)
      expect(screen.getAllByText('English').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('繁體中文')).toBeInTheDocument();
      expect(screen.getByText('简体中文')).toBeInTheDocument();
      expect(screen.getByText('日本語')).toBeInTheDocument();
    });
  });

  it('displays language info', () => {
    render(<LanguageSelector />);
    expect(screen.getByText(/Current language:/)).toBeInTheDocument();
  });

  it('displays live preview indicator', () => {
    render(<LanguageSelector />);
    expect(screen.getByText('Language changes are applied immediately across the app')).toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    render(<LanguageSelector />);
    
    const button = screen.getByLabelText('Select language');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Settings Components Integration', () => {
  it('all components can be rendered together', () => {
    const { container } = render(
      <div>
        <ThemeCustomization />
        <FontSizeSlider />
        <DarkModeToggle />
        <AnimationSelector />
        <LanguageSelector />
      </div>
    );
    
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Theme Color')).toBeInTheDocument();
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByText('Particle Animations')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it('theme changes persist across components', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <ThemeCustomization />
        <DarkModeToggle />
      </div>
    );
    
    // Change theme color
    const blueButton = screen.getByLabelText('Select Blue theme');
    await user.click(blueButton);
    
    // Toggle dark mode
    const darkModeToggle = screen.getByRole('switch');
    await user.click(darkModeToggle);
    
    const store = useKawaiiThemeStore.getState();
    expect(store.primaryColor).toBe('#6B9BD1');
    expect(store.darkMode).toBe(true);
  });
});
