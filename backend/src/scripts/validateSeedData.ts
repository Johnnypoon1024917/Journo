/**
 * Validation script for country seed data
 * 
 * Run this script to validate the seed data structure before seeding the database:
 * npx tsx backend/src/scripts/validateSeedData.ts
 */

import { seedCountries, validateAllCountries, getSeedDataStats } from './seedCountries.js';

function main() {
  console.log('🌍 Country Recommendations Seed Data Validation\n');
  console.log('='.repeat(70));

  // Get statistics
  const stats = getSeedDataStats();
  console.log('\n📊 Seed Data Statistics:');
  console.log(`   Total Countries: ${stats.totalCountries}`);
  console.log(`   Average Best Months per Country: ${stats.avgBestMonths}`);
  console.log(`   Average Avoid Months per Country: ${stats.avgAvoidMonths}`);
  console.log('\n   Countries by Region:');
  Object.entries(stats.regionCounts).forEach(([region, count]) => {
    console.log(`     - ${region}: ${count}`);
  });

  // Validate all data
  console.log('\n' + '='.repeat(70));
  console.log('\n🔍 Validating Data Structure...\n');
  
  const validation = validateAllCountries();

  if (validation.valid) {
    console.log('✅ All country records are valid!');
    console.log(`\n   ${seedCountries.length} countries ready for seeding`);
    console.log('   All required fields present');
    console.log('   No overlaps between best_months and avoid_months');
    console.log('   All months in valid range (1-12)');
    console.log('   All regions valid');
  } else {
    console.log(`❌ Found ${validation.totalErrors} validation errors in ${validation.details.length} countries:\n`);
    validation.details.forEach(({ country, errors }) => {
      console.log(`   ${country}:`);
      errors.forEach(error => {
        console.log(`     - ${error}`);
      });
      console.log('');
    });
    process.exit(1);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✨ Validation complete! Data is ready for database seeding.\n');
}

main();
