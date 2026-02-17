import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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

// Mock navigator.language
Object.defineProperty(navigator, 'language', {
  writable: true,
  value: 'en-US',
});

// Mock react-i18next - Simple version that returns keys
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // Handle interpolation
      if (options && typeof options === 'object') {
        let result = key;
        Object.keys(options).forEach(optKey => {
          if (optKey !== 'ns' && optKey !== 'defaultValue') {
            result = result.replace(`{{${optKey}}}`, String(options[optKey]));
          }
        });
        return result;
      }
      return key;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn().mockResolvedValue(undefined),
      getFixedT: () => (key: string) => key,
      exists: () => true,
      isInitialized: true,
    },
  }),
  Trans: ({ children, i18nKey }: any) => children || i18nKey,
  Translation: ({ children }: any) => children((key: string) => key),
  I18nextProvider: ({ children }: any) => children,
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock language utils
vi.mock('../utils/languageUtils', () => ({
  changeLanguage: vi.fn().mockResolvedValue(undefined),
  getCurrentLanguage: vi.fn().mockReturnValue('en'),
}));
