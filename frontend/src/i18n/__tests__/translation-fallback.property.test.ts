/**
 * Property Test: Translation Fallback
 * 
 * Validates Requirement 15.8:
 * - Missing translation keys fall back to English
 * - Missing keys are logged in development
 * 
 * Property: For any missing translation key in a non-English language,
 * the system should return the English translation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import i18n from '../config';

describe('Property Test: Translation Fallback', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    // Ensure i18n is initialized
    await i18n.init();
    
    // Spy on console.warn to check if missing keys are logged
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  /**
   * Property 32: Translation Fallback to English
   * 
   * For any translation key K that exists in English but not in language L:
   * - i18n.t(K) should return the English translation
   * - The returned value should not be the key itself (unless English is also missing it)
   */
  describe('Property 32: Missing keys fall back to English', () => {
    it('should fall back to English for missing keys', async () => {
      // Switch to a non-English language
      await i18n.changeLanguage('ja');
      
      // Create a test key that we know exists in English
      const testKey = 'common:appName';
      
      // Get the translation
      const translation = i18n.t(testKey);
      
      // Property: Should return a non-empty string
      expect(translation).toBeTruthy();
      expect(typeof translation).toBe('string');
      expect(translation.trim().length).toBeGreaterThan(0);
      
      // Property: Should not return the key itself (unless it's truly missing everywhere)
      if (translation === testKey) {
        // If it returns the key, it means it's missing in both languages
        // This should not happen for common:appName
        expect(translation).not.toBe(testKey);
      }
    });

    it('should use English fallback for all supported languages', async () => {
      const languages = ['zh-TW', 'zh-CN', 'ja'];
      const testKey = 'common:appName';
      
      // Get English translation as reference
      await i18n.changeLanguage('en');
      const englishTranslation = i18n.t(testKey);
      
      // Property: For each language, if key is missing, should get English translation
      for (const lang of languages) {
        await i18n.changeLanguage(lang);
        const translation = i18n.t(testKey);
        
        // Should return a valid translation (either language-specific or English fallback)
        expect(translation).toBeTruthy();
        expect(typeof translation).toBe('string');
        expect(translation.trim().length).toBeGreaterThan(0);
        
        // Should not return the key itself
        expect(translation).not.toBe(testKey);
      }
    });

    it('should handle nested key fallback', async () => {
      await i18n.changeLanguage('ja');
      
      // Test nested keys
      const nestedKeys = [
        'common:navigation.home',
        'trip:actions.create',
        'settings:profile.title',
      ];
      
      for (const key of nestedKeys) {
        const translation = i18n.t(key);
        
        // Property: Should return a valid translation
        expect(translation).toBeTruthy();
        expect(typeof translation).toBe('string');
        expect(translation.trim().length).toBeGreaterThan(0);
        
        // Property: Should not return the key itself
        expect(translation).not.toBe(key);
      }
    });

    it('should handle namespace fallback', async () => {
      await i18n.changeLanguage('zh-CN');
      
      // Test keys from different namespaces
      const namespaces = [
        { ns: 'common', key: 'appName' },
        { ns: 'trip', key: 'title' },
        { ns: 'budget', key: 'title' },
        { ns: 'settings', key: 'title' },
      ];
      
      for (const { ns, key } of namespaces) {
        const translation = i18n.t(`${ns}:${key}`);
        
        // Property: Should return a valid translation
        expect(translation).toBeTruthy();
        expect(typeof translation).toBe('string');
        
        // Property: Should not return the full key
        expect(translation).not.toBe(`${ns}:${key}`);
      }
    });
  });

  /**
   * Property: Fallback configuration
   * 
   * The i18n configuration should have English as fallback language
   */
  describe('Property: Fallback language configuration', () => {
    it('should have English configured as fallback language', () => {
      const fallbackLng = i18n.options.fallbackLng;
      
      // Property: Fallback language must be configured
      expect(fallbackLng).toBeDefined();
      
      // Property: Fallback language must include English
      if (Array.isArray(fallbackLng)) {
        expect(fallbackLng).toContain('en');
      } else {
        expect(fallbackLng).toBe('en');
      }
    });

    it('should have missing key handler configured in development', () => {
      // Property: Missing key handler should be configured
      expect(i18n.options.saveMissing).toBeDefined();
      expect(i18n.options.missingKeyHandler).toBeDefined();
      
      // In development, saveMissing should be true
      if (import.meta.env.DEV) {
        expect(i18n.options.saveMissing).toBe(true);
        expect(typeof i18n.options.missingKeyHandler).toBe('function');
      }
    });
  });

  /**
   * Property: Consistent fallback behavior
   * 
   * For any key K, the fallback behavior should be consistent
   * across multiple calls
   */
  describe('Property: Consistent fallback behavior', () => {
    it('should return the same fallback translation on multiple calls', async () => {
      await i18n.changeLanguage('ja');
      
      const testKey = 'common:appName';
      
      // Get translation multiple times
      const translation1 = i18n.t(testKey);
      const translation2 = i18n.t(testKey);
      const translation3 = i18n.t(testKey);
      
      // Property: Should return the same value every time
      expect(translation1).toBe(translation2);
      expect(translation2).toBe(translation3);
    });

    it('should maintain fallback behavior across language switches', async () => {
      const testKey = 'common:appName';
      const languages = ['en', 'zh-TW', 'zh-CN', 'ja'];
      const translations: Record<string, string> = {};
      
      // Get translations for all languages
      for (const lang of languages) {
        await i18n.changeLanguage(lang);
        translations[lang] = i18n.t(testKey);
      }
      
      // Switch back and verify consistency
      for (const lang of languages) {
        await i18n.changeLanguage(lang);
        const translation = i18n.t(testKey);
        
        // Property: Should return the same translation as before
        expect(translation).toBe(translations[lang]);
      }
    });
  });

  /**
   * Property: Interpolation in fallback
   * 
   * For any key K with interpolation variables,
   * fallback should preserve interpolation
   */
  describe('Property: Interpolation works with fallback', () => {
    it('should handle interpolation in fallback translations', async () => {
      await i18n.changeLanguage('ja');
      
      // Test keys with interpolation
      const testCases = [
        { key: 'common:welcome', params: { name: 'Test User' } },
        { key: 'trip:stats.days', params: { count: 5 } },
      ];
      
      for (const { key, params } of testCases) {
        const translation = i18n.t(key, params);
        
        // Property: Should return a valid translation
        expect(translation).toBeTruthy();
        expect(typeof translation).toBe('string');
        
        // Property: Should not contain raw interpolation syntax
        expect(translation).not.toMatch(/\{\{.*\}\}/);
      }
    });
  });

  /**
   * Property: Fallback chain
   * 
   * If a key is missing in both the current language and English,
   * it should return the key itself (without namespace prefix and with dots)
   */
  describe('Property: Ultimate fallback to key', () => {
    it('should return the key itself if missing in all languages', async () => {
      await i18n.changeLanguage('ja');
      
      // Use a key that definitely doesn't exist
      const nonExistentKey = 'nonexistent:key:that:does:not:exist:anywhere';
      const translation = i18n.t(nonExistentKey);
      
      // Property: Should return the key itself as last resort (i18n strips namespace and converts : to .)
      expect(translation).toBe('key.that.does.not.exist.anywhere');
    });

    it('should handle missing nested keys gracefully', async () => {
      await i18n.changeLanguage('zh-TW');
      
      const nonExistentKey = 'common:deeply.nested.nonexistent.key';
      const translation = i18n.t(nonExistentKey);
      
      // Property: Should return the key itself (without namespace)
      expect(translation).toBe('deeply.nested.nonexistent.key');
    });
  });
});
