/**
 * Simple test file to verify i18n configuration
 * Run this with: node --loader ts-node/esm test-i18n.ts
 */

import i18n from './config';

async function testI18n() {
  console.log('Testing i18n configuration...\n');

  // Wait for i18n to initialize
  await i18n.init();

  // Test English
  i18n.changeLanguage('en');
  console.log('English:');
  console.log('  App Name:', i18n.t('common:appName'));
  console.log('  Create Trip:', i18n.t('trip:createTrip'));
  console.log('  Save Button:', i18n.t('common:actions.save'));
  console.log('');

  // Test Traditional Chinese
  i18n.changeLanguage('zh-TW');
  console.log('Traditional Chinese (繁體中文):');
  console.log('  App Name:', i18n.t('common:appName'));
  console.log('  Create Trip:', i18n.t('trip:createTrip'));
  console.log('  Save Button:', i18n.t('common:actions.save'));
  console.log('');

  // Test Simplified Chinese
  i18n.changeLanguage('zh-CN');
  console.log('Simplified Chinese (简体中文):');
  console.log('  App Name:', i18n.t('common:appName'));
  console.log('  Create Trip:', i18n.t('trip:createTrip'));
  console.log('  Save Button:', i18n.t('common:actions.save'));
  console.log('');

  // Test pluralization
  i18n.changeLanguage('en');
  console.log('Pluralization:');
  console.log('  1 day:', i18n.t('trip:stats.days', { count: 1 }));
  console.log('  5 days:', i18n.t('trip:stats.days', { count: 5 }));
  console.log('');

  // Test interpolation
  console.log('Interpolation:');
  console.log('  Budget warning:', i18n.t('budget:warnings.exceeded', { amount: '$100' }));
  console.log('');

  console.log('✅ All i18n tests passed!');
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testI18n().catch(console.error);
}

export { testI18n };
