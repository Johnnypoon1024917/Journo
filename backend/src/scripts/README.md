# Database Seeding Scripts

## Country Recommendations Seeding

### Overview

The `seedCountries.ts` script populates the `countries` table with curated travel destination data from trusted sources (Frequent Miler, Zicasso, and TripShare).

### Features

- **Data Validation**: Validates all seed data before insertion
- **Duplicate Detection**: Automatically detects existing countries and updates them instead of creating duplicates
- **Error Handling**: Continues processing even if individual records fail, with detailed error logging
- **Statistics**: Provides comprehensive statistics about the seed data
- **Idempotent**: Can be run multiple times safely

### Usage

```bash
# Run the seeding script
npm run seed:countries

# Verify the seeding
npx tsx src/scripts/verifyCountriesSeeding.ts
```

### Data Structure

Each country record includes:
- `country_name`: Full country name
- `best_months`: Array of optimal travel months (1-12)
- `temp_range`: Temperature range or description
- `avoid_months`: Months to avoid for travel
- `region`: Geographic classification (Asia, Europe, Americas, Africa, Oceania, Middle East)
- `description`: Brief destination overview (200-300 characters)

### Validation Rules

The script validates:
- Country name is not empty
- `best_months` is a non-empty array with valid month values (1-12)
- `temp_range` is not empty
- `avoid_months` is an array with valid month values (1-12)
- Region is one of the valid regions
- Description is at least 50 characters
- No overlap between `best_months` and `avoid_months`

### Output

The script provides:
- Validation results
- Statistics (total countries, regional distribution, average months)
- Progress updates for each country (inserted/updated/skipped)
- Summary with counts and any errors encountered

### Example Output

```
🌍 Starting country recommendations database seeding...

📋 Validating seed data...
✅ All seed data validated successfully

📊 Seed data statistics:
  Total countries: 88
  Average best months per country: 5.2
  Average avoid months per country: 3.2
  Countries by region:
    Asia: 17
    Europe: 27
    Americas: 17
    Africa: 15
    Oceania: 7
    Middle East: 5

  ➕ Inserted: Japan
  ➕ Inserted: Thailand
  ...

📈 Seeding Summary:
  ✅ Inserted: 88
  ✏️  Updated: 0
  📊 Total processed: 88

🎉 Database seeding completed successfully!
```

### Testing

Run the unit tests:

```bash
npm test -- seedCountries.test.ts
```

The test suite covers:
- Data validation logic
- Seed data quality checks
- Statistics calculation
- Edge cases and error conditions

### Maintenance

To update the seed data:
1. Edit the `seedCountries` array in `seedCountries.ts`
2. Run validation: `npm test -- seedCountries.test.ts`
3. Run the seeding script: `npm run seed:countries`
4. Verify the results: `npx tsx src/scripts/verifyCountriesSeeding.ts`

### Error Handling

The script handles errors gracefully:
- **Validation errors**: Stops execution before any database operations
- **Individual record errors**: Logs the error and continues with remaining records
- **Database connection errors**: Throws an error and exits
- **Duplicate detection**: Updates existing records instead of failing

### Requirements

- PostgreSQL database with the `countries` table created (migration 051)
- Node.js with TypeScript support
- Database connection configured in `.env`
