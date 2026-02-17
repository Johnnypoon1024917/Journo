/**
 * Translation Audit Script
 * 
 * This script audits all translation files to ensure:
 * 1. All translation keys exist in all languages
 * 2. No missing translations
 * 3. All languages have the same structure
 * 
 * Validates Requirements 15.1, 15.4
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
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

/**
 * Load a translation file
 */
function loadTranslationFile(language, namespace) {
  const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing file: ${filePath}`);
    return {};
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error parsing ${filePath}:`, error);
    return {};
  }
}

/**
 * Get all keys from a translation object (flattened with dot notation)
 */
function getAllKeys(obj, prefix = '') {
  const keys = [];
  
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

/**
 * Compare translation keys between languages
 */
function auditNamespace(namespace) {
  const results = [];
  
  // Load English as the reference
  const enTranslations = loadTranslationFile('en', namespace);
  const enKeys = new Set(getAllKeys(enTranslations));
  
  // Compare each language against English
  for (const language of LANGUAGES) {
    if (language === 'en') continue;
    
    const translations = loadTranslationFile(language, namespace);
    const keys = new Set(getAllKeys(translations));
    
    // Find missing keys (in English but not in this language)
    const missingKeys = Array.from(enKeys).filter(key => !keys.has(key));
    
    // Find extra keys (in this language but not in English)
    const extraKeys = Array.from(keys).filter(key => !enKeys.has(key));
    
    if (missingKeys.length > 0 || extraKeys.length > 0) {
      results.push({
        language,
        namespace,
        missingKeys,
        extraKeys,
      });
    }
  }
  
  return results;
}

/**
 * Main audit function
 */
function auditAllTranslations() {
  console.log('🔍 Starting translation audit...\n');
  
  let totalIssues = 0;
  const allResults = [];
  
  for (const namespace of NAMESPACES) {
    const results = auditNamespace(namespace);
    allResults.push(...results);
    
    if (results.length > 0) {
      console.log(`\n📦 Namespace: ${namespace}`);
      
      for (const result of results) {
        if (result.missingKeys.length > 0) {
          console.log(`  ❌ ${result.language}: Missing ${result.missingKeys.length} keys`);
          result.missingKeys.forEach(key => {
            console.log(`     - ${key}`);
          });
          totalIssues += result.missingKeys.length;
        }
        
        if (result.extraKeys.length > 0) {
          console.log(`  ⚠️  ${result.language}: Extra ${result.extraKeys.length} keys`);
          result.extraKeys.forEach(key => {
            console.log(`     - ${key}`);
          });
          totalIssues += result.extraKeys.length;
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (totalIssues === 0) {
    console.log('✅ All translations are complete and consistent!');
  } else {
    console.log(`❌ Found ${totalIssues} translation issues`);
    console.log('\nSummary by language:');
    
    for (const language of LANGUAGES) {
      if (language === 'en') continue;
      
      const languageResults = allResults.filter(r => r.language === language);
      const missingCount = languageResults.reduce((sum, r) => sum + r.missingKeys.length, 0);
      const extraCount = languageResults.reduce((sum, r) => sum + r.extraKeys.length, 0);
      
      if (missingCount > 0 || extraCount > 0) {
        console.log(`  ${language}: ${missingCount} missing, ${extraCount} extra`);
      }
    }
  }
  
  console.log('='.repeat(60) + '\n');
  
  return totalIssues;
}

// Run the audit
const issues = auditAllTranslations();
process.exit(issues > 0 ? 1 : 0);
