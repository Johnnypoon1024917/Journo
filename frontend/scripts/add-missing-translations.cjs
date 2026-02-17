/**
 * Add Missing Translations Script
 * 
 * This script adds missing translation keys to all language files
 * using the English version as the source of truth.
 * 
 * Validates Requirements 15.1, 15.4
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const LANGUAGES = ['ja', 'zh-CN', 'zh-TW']; // Languages to update (excluding English)
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
 * Save a translation file
 */
function saveTranslationFile(language, namespace, data) {
  const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);
  
  try {
    const content = JSON.stringify(data, null, 2) + '\n';
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`❌ Error saving ${filePath}:`, error);
    return false;
  }
}

/**
 * Deep merge objects, adding missing keys from source to target
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const [key, value] of Object.entries(source)) {
    if (!(key in result)) {
      // Key is missing, add it
      result[key] = value;
    } else if (typeof value === 'object' && value !== null && typeof result[key] === 'object' && result[key] !== null) {
      // Both are objects, recurse
      result[key] = deepMerge(result[key], value);
    }
    // If key exists and is not an object, keep the existing value
  }
  
  return result;
}

/**
 * Remove extra keys that don't exist in source
 */
function removeExtraKeys(target, source) {
  const result = {};
  
  for (const [key, value] of Object.entries(source)) {
    if (key in target) {
      if (typeof value === 'object' && value !== null && typeof target[key] === 'object' && target[key] !== null) {
        // Both are objects, recurse
        result[key] = removeExtraKeys(target[key], value);
      } else {
        // Keep the value from target
        result[key] = target[key];
      }
    }
  }
  
  return result;
}

/**
 * Update translations for a namespace
 */
function updateNamespace(namespace) {
  console.log(`\n📦 Processing namespace: ${namespace}`);
  
  // Load English as the reference
  const enTranslations = loadTranslationFile('en', namespace);
  
  let updatedCount = 0;
  
  // Update each language
  for (const language of LANGUAGES) {
    const translations = loadTranslationFile(language, namespace);
    
    // First, remove extra keys
    const cleaned = removeExtraKeys(translations, enTranslations);
    
    // Then, add missing keys
    const updated = deepMerge(cleaned, enTranslations);
    
    // Save the updated translations
    if (saveTranslationFile(language, namespace, updated)) {
      console.log(`  ✅ Updated ${language}`);
      updatedCount++;
    } else {
      console.log(`  ❌ Failed to update ${language}`);
    }
  }
  
  return updatedCount;
}

/**
 * Main function
 */
function addMissingTranslations() {
  console.log('🔧 Adding missing translations...\n');
  console.log('⚠️  Note: Missing translations will be filled with English text.');
  console.log('   Please review and translate them manually.\n');
  
  let totalUpdated = 0;
  
  for (const namespace of NAMESPACES) {
    totalUpdated += updateNamespace(namespace);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Updated ${totalUpdated} language files`);
  console.log('='.repeat(60) + '\n');
  
  console.log('Next steps:');
  console.log('1. Review the updated translation files');
  console.log('2. Replace English text with proper translations');
  console.log('3. Run the audit script again to verify');
}

// Run the script
addMissingTranslations();
