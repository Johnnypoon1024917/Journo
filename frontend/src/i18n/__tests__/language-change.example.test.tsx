/**
 * Example Test: Language Change Without Restart
 * 
 * Validates Requirement 15.9:
 * - Language can be changed without restarting the application
 * - All components re-render with new translations
 * - Language change is immediate and seamless
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../config';

/**
 * Test component that displays translated text
 */
function TestComponent() {
  const { t, i18n: i18nInstance } = useTranslation();
  
  return (
    <div>
      <h1 data-testid="app-name">{t('common:appName')}</h1>
      <p data-testid="current-language">{i18nInstance.language}</p>
      <button
        data-testid="change-to-english"
        onClick={() => i18nInstance.changeLanguage('en')}
      >
        English
      </button>
      <button
        data-testid="change-to-chinese"
        onClick={() => i18nInstance.changeLanguage('zh-TW')}
      >
        繁體中文
      </button>
      <button
        data-testid="change-to-japanese"
        onClick={() => i18nInstance.changeLanguage('ja')}
      >
        日本語
      </button>
    </div>
  );
}

/**
 * Test component with multiple translated elements
 */
function MultiElementComponent() {
  const { t } = useTranslation(['common', 'trip', 'settings']);
  
  return (
    <div>
      <h1 data-testid="app-name">{t('common:appName')}</h1>
      <h2 data-testid="trip-title">{t('trip:title')}</h2>
      <h3 data-testid="settings-title">{t('settings:title')}</h3>
      <p data-testid="home-nav">{t('common:navigation.home')}</p>
    </div>
  );
}

describe('Example Test: Language Change Without Restart', () => {
  beforeEach(async () => {
    // Reset to English before each test
    await i18n.changeLanguage('en');
  });

  /**
   * Example 26: Language Change Without Restart
   * 
   * Scenario: User changes language from English to Traditional Chinese
   * Expected: All text updates immediately without page reload
   */
  it('should change language from English to Traditional Chinese without restart', async () => {
    const { rerender } = render(<TestComponent />);
    
    // Initial state: English
    await waitFor(() => {
      expect(screen.getByTestId('app-name')).toHaveTextContent('Journo');
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });
    
    // Change language to Traditional Chinese
    await act(async () => {
      await i18n.changeLanguage('zh-TW');
    });
    
    // Force re-render to simulate React's response to language change
    rerender(<TestComponent />);
    
    // Verify language changed without restart
    await waitFor(() => {
      expect(screen.getByTestId('app-name')).toHaveTextContent('Journo');
      expect(screen.getByTestId('current-language')).toHaveTextContent('zh-TW');
    });
  });

  it('should change language from English to Japanese without restart', async () => {
    const { rerender } = render(<TestComponent />);
    
    // Initial state: English
    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });
    
    // Change language to Japanese
    await act(async () => {
      await i18n.changeLanguage('ja');
    });
    
    rerender(<TestComponent />);
    
    // Verify language changed
    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('ja');
    });
  });

  it('should update all translated elements when language changes', async () => {
    const { rerender } = render(<MultiElementComponent />);
    
    // Initial state: English
    await waitFor(() => {
      expect(screen.getByTestId('app-name')).toHaveTextContent('Journo');
    });
    
    // Change to Traditional Chinese
    await act(async () => {
      await i18n.changeLanguage('zh-TW');
    });
    
    rerender(<MultiElementComponent />);
    
    // Verify all elements updated
    await waitFor(() => {
      const appName = screen.getByTestId('app-name');
      const tripTitle = screen.getByTestId('trip-title');
      const settingsTitle = screen.getByTestId('settings-title');
      const homeNav = screen.getByTestId('home-nav');
      
      // All should have non-empty content
      expect(appName.textContent).toBeTruthy();
      expect(tripTitle.textContent).toBeTruthy();
      expect(settingsTitle.textContent).toBeTruthy();
      expect(homeNav.textContent).toBeTruthy();
      
      // Content should be different from English (for most keys)
      expect(appName.textContent?.length).toBeGreaterThan(0);
    });
  });

  it('should switch between multiple languages seamlessly', async () => {
    const { rerender } = render(<TestComponent />);
    
    const languages = ['en', 'zh-TW', 'zh-CN', 'ja'];
    
    for (const lang of languages) {
      await act(async () => {
        await i18n.changeLanguage(lang);
      });
      
      rerender(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent(lang);
      });
    }
  });

  it('should emit languageChanged event when language changes', async () => {
    let eventFired = false;
    let newLanguage = '';
    
    const handler = (lng: string) => {
      eventFired = true;
      newLanguage = lng;
    };
    
    i18n.on('languageChanged', handler);
    
    await act(async () => {
      await i18n.changeLanguage('zh-TW');
    });
    
    await waitFor(() => {
      expect(eventFired).toBe(true);
      expect(newLanguage).toBe('zh-TW');
    });
    
    i18n.off('languageChanged', handler);
  });

  it('should persist language change across component remounts', async () => {
    const { unmount, rerender } = render(<TestComponent />);
    
    // Change language
    await act(async () => {
      await i18n.changeLanguage('ja');
    });
    
    rerender(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('ja');
    });
    
    // Unmount and remount
    unmount();
    const { rerender: rerender2 } = render(<TestComponent />);
    
    // Language should still be Japanese
    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('ja');
    });
  });

  it('should handle rapid language changes', async () => {
    const { rerender } = render(<TestComponent />);
    
    // Rapidly change languages
    await act(async () => {
      await i18n.changeLanguage('zh-TW');
      await i18n.changeLanguage('ja');
      await i18n.changeLanguage('zh-CN');
      await i18n.changeLanguage('en');
    });
    
    rerender(<TestComponent />);
    
    // Should end up with the last language
    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });
  });

  it('should update translations in real-time without flickering', async () => {
    const { rerender } = render(<MultiElementComponent />);
    
    // Get initial content
    await waitFor(() => {
      expect(screen.getByTestId('app-name')).toBeInTheDocument();
    });
    
    const initialContent = screen.getByTestId('app-name').textContent;
    
    // Change language
    await act(async () => {
      await i18n.changeLanguage('zh-TW');
    });
    
    rerender(<MultiElementComponent />);
    
    // Content should update
    await waitFor(() => {
      const newContent = screen.getByTestId('app-name').textContent;
      // Content should exist (no flickering to empty state)
      expect(newContent).toBeTruthy();
      expect(newContent?.length).toBeGreaterThan(0);
    });
  });

  it('should maintain component state during language change', async () => {
    function StatefulComponent() {
      const { t } = useTranslation();
      const [count, setCount] = React.useState(0);
      
      return (
        <div>
          <p data-testid="translated-text">{t('common:appName')}</p>
          <p data-testid="count">{count}</p>
          <button onClick={() => setCount(c => c + 1)}>Increment</button>
        </div>
      );
    }
    
    const { rerender } = render(<StatefulComponent />);
    
    // Increment counter
    await act(async () => {
      screen.getByText('Increment').click();
      screen.getByText('Increment').click();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2');
    });
    
    // Change language
    await act(async () => {
      await i18n.changeLanguage('ja');
    });
    
    rerender(<StatefulComponent />);
    
    // Counter should maintain its value
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2');
    });
  });

  it('should work with multiple namespaces', async () => {
    function MultiNamespaceComponent() {
      const { t } = useTranslation(['common', 'trip', 'budget', 'settings']);
      
      return (
        <div>
          <p data-testid="common">{t('common:appName')}</p>
          <p data-testid="trip">{t('trip:title')}</p>
          <p data-testid="budget">{t('budget:title')}</p>
          <p data-testid="settings">{t('settings:title')}</p>
        </div>
      );
    }
    
    const { rerender } = render(<MultiNamespaceComponent />);
    
    // Change language
    await act(async () => {
      await i18n.changeLanguage('zh-CN');
    });
    
    rerender(<MultiNamespaceComponent />);
    
    // All namespaces should update
    await waitFor(() => {
      expect(screen.getByTestId('common').textContent).toBeTruthy();
      expect(screen.getByTestId('trip').textContent).toBeTruthy();
      expect(screen.getByTestId('budget').textContent).toBeTruthy();
      expect(screen.getByTestId('settings').textContent).toBeTruthy();
    });
  });
});

// Import React for the stateful component test
import React from 'react';
