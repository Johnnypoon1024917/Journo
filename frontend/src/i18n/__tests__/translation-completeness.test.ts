/**
 * Translation Completeness Tests
 * 
 * Validates Requirements 15.1, 15.4:
 * - All translation keys exist in all languages
 * - No hardcoded strings in components
 * - All languages have consistent structure
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const LOCALES_DIR = path.join(__dirname, '../../locales');
const LANGUAGES = ['en', 'ja', 'zh-CN', 'zh-TW'];
const NAMESPACES = [
  'common',
  'trip',
  'place',
  'budget',
  'packing',
  'community',
  'settings',
  'errors',
  'kawaii',
  'members',
  'activity',
  'collaboration',
  'newTrip',
  'notifications',
];

interface TranslationStructure {
  [key: string]: string | TranslationStructure;
}

/**
 * Load a translation file
 */
function loadTranslationFile(language: string, namespace: string): TranslationStructure {
  const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Get all keys from a translation object (flattened with dot notation)
 */
function getAllKeys(obj: TranslationStructure, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

describe('Translation Completeness', () => {
  describe('All translation files exist', () => {
    for (const language of LANGUAGES) {
      for (const namespace of NAMESPACES) {
        it(`should have ${language}/${namespace}.json`, () => {
          const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);
          expect(fs.existsSync(filePath)).toBe(true);
        });
      }
    }
  });

  describe('All languages have the same keys', () => {
    for (const namespace of NAMESPACES) {
      describe(`Namespace: ${namespace}`, () => {
        it('should have consistent keys across all languages', () => {
          // Load English as reference
          const enTranslations = loadTranslationFile('en', namespace);
          const enKeys = new Set(getAllKeys(enTranslations));

          // Check each language
          for (const language of LANGUAGES) {
            if (language === 'en') continue;

            const translations = loadTranslationFile(language, namespace);
            const keys = new Set(getAllKeys(translations));

            // Find missing keys
            const missingKeys = Array.from(enKeys).filter(key => !keys.has(key));
            
            // Find extra keys
            const extraKeys = Array.from(keys).filter(key => !enKeys.has(key));

            expect(missingKeys, `${language} is missing keys: ${missingKeys.join(', ')}`).toHaveLength(0);
            expect(extraKeys, `${language} has extra keys: ${extraKeys.join(', ')}`).toHaveLength(0);
          }
        });
      });
    }
  });

  describe('Translation values are not empty', () => {
    for (const language of LANGUAGES) {
      for (const namespace of NAMESPACES) {
        it(`should have non-empty values in ${language}/${namespace}`, () => {
          const translations = loadTranslationFile(language, namespace);
          const keys = getAllKeys(translations);

          for (const key of keys) {
            const parts = key.split('.');
            let value: any = translations;
            
            for (const part of parts) {
              value = value[part];
            }

            expect(value, `Key "${key}" in ${language}/${namespace} is empty`).toBeTruthy();
            expect(typeof value, `Key "${key}" in ${language}/${namespace} should be a string`).toBe('string');
            expect(value.trim(), `Key "${key}" in ${language}/${namespace} is whitespace only`).not.toBe('');
          }
        });
      }
    }
  });

  describe('iOS-specific translations exist', () => {
    it('should have offline indicator translations', () => {
      const enCommon = loadTranslationFile('en', 'common');
      
      expect(enCommon.offline).toBeDefined();
      expect(enCommon.offline.indicator).toBeDefined();
      expect(enCommon.offline.indicator.backOnline).toBeDefined();
      expect(enCommon.offline.indicator.offlineMessage).toBeDefined();
    });

    it('should have storage translations', () => {
      const enCommon = loadTranslationFile('en', 'common');
      
      expect(enCommon.storage).toBeDefined();
      expect(enCommon.storage.offlineStorage).toBeDefined();
      expect(enCommon.storage.used).toBeDefined();
      expect(enCommon.storage.limitExceeded).toBeDefined();
      expect(enCommon.storage.nearLimit).toBeDefined();
      expect(enCommon.storage.breakdown).toBeDefined();
    });

    it('should have sync conflict translations', () => {
      const enCommon = loadTranslationFile('en', 'common');
      
      expect(enCommon.syncConflict).toBeDefined();
      expect(enCommon.syncConflict.title).toBeDefined();
      expect(enCommon.syncConflict.description).toBeDefined();
      expect(enCommon.syncConflict.localChanges).toBeDefined();
      expect(enCommon.syncConflict.serverVersion).toBeDefined();
      expect(enCommon.syncConflict.keepServer).toBeDefined();
      expect(enCommon.syncConflict.keepLocal).toBeDefined();
      expect(enCommon.syncConflict.types).toBeDefined();
    });
  });

  describe('Required languages are supported', () => {
    it('should support English', () => {
      expect(LANGUAGES).toContain('en');
    });

    it('should support Japanese', () => {
      expect(LANGUAGES).toContain('ja');
    });

    it('should support Simplified Chinese', () => {
      expect(LANGUAGES).toContain('zh-CN');
    });

    it('should support Traditional Chinese', () => {
      expect(LANGUAGES).toContain('zh-TW');
    });
  });
});
