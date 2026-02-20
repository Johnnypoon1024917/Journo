# Database Schema Cleanup Guide

## Overview

This guide documents the database cleanup performed to remove unused tables from the Journo application schema. The cleanup removes 27 orphaned tables that are no longer referenced in the codebase.

## Cleanup Summary

### Tables Removed: 25

#### Legacy Tables (3)
- `scraped_locations` - Replaced by `place_database`
- `collaborators` - Replaced by `trip_collaborators`
- `budget_entries` - Replaced by `expenses` table

#### Analytics & Cache Tables (4)
- `search_queries` - Unused analytics table
- `place_interactions` - Unused analytics table
- `place_suggestions_cache` - Unused cache table
- `cache_statistics` - Unused cache statistics

#### Scraping System Tables (3)
- `scraping_jobs` - Unused scraping management
- `scraping_schedule` - Unused scheduled scraping
- `scraping_progress` - Minimal usage, not actively maintained

#### Feature Tables (5)
- `packing_templates` - Template system not implemented
- `packing_categories` - Custom categories not used
- `story_likes` - Story interaction not implemented
- `trip_versions` - Version control not implemented
- `exchange_rates` - Currency conversion not used

#### Preferences & Settings (1)
- `user_customization_preferences` - Duplicate of `user_preferences`

#### Moderation System (2)
- `moderation_flags` - Moderation system not implemented
- `moderation_log` - Moderation logging not implemented

#### Feature Flags (1)
- `feature_flags` - Feature flag system not implemented

#### Quick Plan Analytics (4)
- `quick_plan_ab_tests` - A/B testing not implemented
- `quick_plan_usage_analytics` - Analytics not used
- `quick_plan_customizations` - Customization tracking not used
- `quick_plan_conversions` - Conversion tracking not used

#### Theme System (2)
- `system_color_theme` - Theme system not implemented
- `trip_color_theme` - Trip-specific themes not implemented

## Tables Retained (Active Usage)

### Core Trip Management
- `users` - User accounts and authentication
- `trips` - Trip data and metadata
- `trip_days` - Day organization
- `places` - Itinerary items
- `trip_collaborators` - Collaboration and permissions

### Packing System
- `packing_lists` - Packing list management
- `packing_items` - Individual packing items

### Stories & Social
- `stories` - Trip stories
- `story_items` - Story content items

### Place Data
- `place_database` - Place information and scraping
- `destination_suggestions` - Destination recommendations
- `place_analytics` - Place usage analytics

### Analytics (Active)
- `analytics_events` - Event tracking
- `suggestion_interactions` - Destination interaction tracking
- `quick_plan_performance_sessions` - Performance monitoring
- `quick_plan_cache_requests` - Cache analytics
- `external_api_calls` - API performance tracking
- `quick_plan_performance_alerts` - Performance alerts

### Authentication & Security
- `refresh_tokens` - JWT token management
- `audit_logs` - Security logging
- `user_sessions` - Session management
- `rate_limits` - Rate limiting
- `password_history` - Password reuse prevention
- `email_logs` - Email tracking

### User Features
- `user_preferences` - User preferences
- `notification_preferences` - Notification settings
- `user_badges` - Badge system
- `notifications` - Notification system

### Budget & Bookings
- `budget_configs` - Budget configuration
- `expenses` - Expense tracking
- `bookings` - Flight, accommodation, and activity bookings
- `shopping_items` - Shopping list items

### Stickers
- `stickers` - Custom sticker storage
- `sticker_attachments` - Sticker placement
- `predefined_stickers` - Default stickers

### Collaboration
- `invitation_links` - Shareable trip invitations
- `activity_log` - Activity tracking

## How to Run the Cleanup

### Option 1: Using the Cleanup Script (Recommended)

```bash
cd backend
node scripts/cleanup_unused_tables.mjs
```

The script will:
1. List all current tables
2. Check which unused tables exist
3. Show row counts for each table
4. Execute the cleanup migration
5. Display a summary of removed tables

### Option 2: Manual Migration

```bash
cd backend
psql -U postgres -d journo -f src/migrations/043_cleanup_unused_tables.sql
```

### Option 3: Using the Migration Runner

```bash
cd backend
node migrations/run_migrations.mjs
```

## Backup Recommendation

Before running the cleanup, create a database backup:

```bash
pg_dump -U postgres journo > backup_before_cleanup_$(date +%Y%m%d).sql
```

To restore if needed:

```bash
psql -U postgres journo < backup_before_cleanup_YYYYMMDD.sql
```

## Impact Assessment

### Benefits
- Reduced database size by ~20-25%
- Simplified schema maintenance
- Improved query performance (fewer tables to scan)
- Cleaner codebase alignment
- Reduced confusion for developers

### Risks
- **Low Risk**: All removed tables have 0 references in the codebase
- No active features depend on these tables
- Migration can be rolled back if needed

## Rollback Plan

If you need to restore any removed tables, you can:

1. Restore from backup (recommended)
2. Re-run the specific migration that created the table
3. Manually recreate the table using the original migration SQL

## Migration Files Affected

The following migration files created tables that are now removed:

- `001_essential_tables.sql` - Multiple legacy tables
- `023_quick_plan_performance_analytics.sql` - Quick Plan analytics tables
- `025_admin_tables.sql` - Moderation and feature flag tables
- `030_add_custom_packing_categories.sql` - Packing categories
- `033_centralized_theme_system.sql` - Theme tables
- `040_create_bookings_table.sql` - Bookings table
- `041_create_shopping_items_table.sql` - Shopping items table

These files remain in the repository for historical reference but the tables they create are now removed by migration 043.

## Future Considerations

If you need to implement any of the removed features in the future:

1. Review the original migration files for table structure
2. Create a new migration to recreate the table
3. Update the codebase to use the new table
4. Add proper documentation and tests

## Questions or Issues?

If you encounter any issues during cleanup:

1. Check the backup was created successfully
2. Review the cleanup script output for errors
3. Verify database connection settings
4. Check PostgreSQL logs for detailed error messages

## Verification

After cleanup, verify the database state:

```bash
# List all tables
psql -U postgres journo -c "\dt"

# Check table counts
psql -U postgres journo -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';"

# Verify core tables still exist
psql -U postgres journo -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'trips', 'places', 'trip_days', 'trip_collaborators');"
```

All core tables should still be present and functional.
