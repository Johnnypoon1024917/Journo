/**
 * Property Test: Translation Completeness
 * 
 * Validates Requirement 15.4:
 * - All translation keys exist in all languages
 * - Translation structure is consistent across languages
 * 
 * Property: For any translation key that exists in English,
 * the same key must exist in all other supported languages
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
  'bubbleQuest',
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

describe('Property Test: Translation Completeness', () => {
  /**
   * Property 30: Translation Completeness
   * 
   * For any translation key K in English namespace N:
   * - K must exist in the same namespace N for all supported languages
   * - The value for K must be a non-empty string
   * - The structure of nested keys must be consistent
   */
  describe('Property 30: All languages have complete translations', () => {
    for (const namespace of NAMESPACES) {
      it(`should have all keys in all languages for namespace: ${namespace}`, () => {
        // Load English as the reference
        const enTranslations = loadTranslationFile('en', namespace);
        const enKeys = getAllKeys(enTranslations);

        // Property: For each language, all English keys must exist
        for (const language of LANGUAGES) {
          const translations = loadTranslationFile(language, namespace);
          const keys = new Set(getAllKeys(translations));

          // Check that all English keys exist in this language
          for (const enKey of enKeys) {
            expect(
              keys.has(enKey),
              `Key "${enKey}" from English ${namespace} is missing in ${language}`
            ).toBe(true);

            // Get the value for this key
            const parts = enKey.split('.');
            let value: any = translations;
            
            for (const part of parts) {
              value = value?.[part];
            }

            // Property: Value must be a non-empty string
            expect(
              typeof value,
              `Key "${enKey}" in ${language}/${namespace} should be a string`
            ).toBe('string');
            
            expect(
              value && value.trim().length > 0,
              `Key "${enKey}" in ${language}/${namespace} should not be empty`
            ).toBe(true);
          }
        }
      });
    }
  });

  /**
   * Property: No extra keys
   * 
   * For any translation key K in language L namespace N:
   * - K must also exist in English namespace N
   * 
   * This ensures we don't have orphaned translations
   */
  describe('Property: No orphaned translation keys', () => {
    for (const namespace of NAMESPACES) {
      it(`should not have extra keys in any language for namespace: ${namespace}`, () => {
        const enTranslations = loadTranslationFile('en', namespace);
        const enKeys = new Set(getAllKeys(enTranslations));

        for (const language of LANGUAGES) {
          if (language === 'en') continue;

          const translations = loadTranslationFile(language, namespace);
          const keys = getAllKeys(translations);

          // Property: No key should exist in non-English that doesn't exist in English
          for (const key of keys) {
            expect(
              enKeys.has(key),
              `Key "${key}" in ${language}/${namespace} does not exist in English (orphaned key)`
            ).toBe(true);
          }
        }
      });
    }
  });

  /**
   * Property: Structural consistency
   * 
   * For any nested object path P in English namespace N:
   * - P must be a nested object in all languages
   * - P must not be a string in one language and object in another
   */
  describe('Property: Structural consistency across languages', () => {
    for (const namespace of NAMESPACES) {
      it(`should have consistent structure across languages for namespace: ${namespace}`, () => {
        const enTranslations = loadTranslationFile('en', namespace);

        // Get all paths that are objects (not leaf strings)
        function getObjectPaths(obj: TranslationStructure, prefix = ''): string[] {
          const paths: string[] = [];
          
          for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            
            if (typeof value === 'object' && value !== null) {
              paths.push(fullKey);
              paths.push(...getObjectPaths(value, fullKey));
            }
          }
          
          return paths;
        }

        const enObjectPaths = new Set(getObjectPaths(enTranslations));

        for (const language of LANGUAGES) {
          if (language === 'en') continue;

          const translations = loadTranslationFile(language, namespace);
          const objectPaths = new Set(getObjectPaths(translations));

          // Property: All object paths in English must be objects in other languages
          for (const path of enObjectPaths) {
            expect(
              objectPaths.has(path),
              `Path "${path}" is an object in English ${namespace} but not in ${language}`
            ).toBe(true);
          }

          // Property: No path should be an object in non-English but string in English
          for (const path of objectPaths) {
            expect(
              enObjectPaths.has(path),
              `Path "${path}" is an object in ${language}/${namespace} but not in English`
            ).toBe(true);
          }
        }
      });
    }
  });

  /**
   * Property: Interpolation variable consistency
   * 
   * For any translation value V with interpolation variables in English:
   * - The same variables must exist in all language translations
   */
  describe('Property: Interpolation variables are consistent', () => {
    function extractVariables(text: string): string[] {
      const matches = text.match(/\{\{(\w+)\}\}/g) || [];
      return matches.map(m => m.replace(/\{\{|\}\}/g, ''));
    }

    for (const namespace of NAMESPACES) {
      it(`should have consistent interpolation variables for namespace: ${namespace}`, () => {
        const enTranslations = loadTranslationFile('en', namespace);
        const enKeys = getAllKeys(enTranslations);

        for (const key of enKeys) {
          // Get English value
          const parts = key.split('.');
          let enValue: any = enTranslations;
          
          for (const part of parts) {
            enValue = enValue?.[part];
          }

          if (typeof enValue !== 'string') continue;

          const enVariables = new Set(extractVariables(enValue));
          
          if (enVariables.size === 0) continue;

          // Check all other languages
          for (const language of LANGUAGES) {
            if (language === 'en') continue;

            const translations = loadTranslationFile(language, namespace);
            let value: any = translations;
            
            for (const part of parts) {
              value = value?.[part];
            }

            if (typeof value !== 'string') continue;

            const variables = new Set(extractVariables(value));

            // Property: All English variables must exist in translation
            for (const variable of enVariables) {
              expect(
                variables.has(variable),
                `Variable "{{${variable}}}" in key "${key}" (${namespace}) is missing in ${language}`
              ).toBe(true);
            }
          }
        }
      });
    }
  });
});
