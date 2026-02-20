-- Migration 043: Cleanup Unused Tables
-- This migration removes orphaned and unused tables from the database schema
-- Created: 2026-02-18

-- ============================================================================
-- DROP UNUSED TABLES
-- ============================================================================

-- Legacy tables replaced by newer implementations
DROP TABLE IF EXISTS scraped_locations CASCADE;
DROP TABLE IF EXISTS collaborators CASCADE;
DROP TABLE IF EXISTS budget_entries CASCADE;

-- Unused analytics and cache tables
DROP TABLE IF EXISTS search_queries CASCADE;
DROP TABLE IF EXISTS place_interactions CASCADE;
DROP TABLE IF EXISTS place_suggestions_cache CASCADE;
DROP TABLE IF EXISTS cache_statistics CASCADE;

-- Unused scraping system tables
DROP TABLE IF EXISTS scraping_jobs CASCADE;
DROP TABLE IF EXISTS scraping_schedule CASCADE;
DROP TABLE IF EXISTS scraping_progress CASCADE;

-- Unused feature tables
DROP TABLE IF EXISTS packing_templates CASCADE;
DROP TABLE IF EXISTS packing_categories CASCADE;
DROP TABLE IF EXISTS story_likes CASCADE;
DROP TABLE IF EXISTS trip_versions CASCADE;
DROP TABLE IF EXISTS exchange_rates CASCADE;

-- Duplicate/unused preference tables
DROP TABLE IF EXISTS user_customization_preferences CASCADE;

-- Unused moderation system
DROP TABLE IF EXISTS moderation_flags CASCADE;
DROP TABLE IF EXISTS moderation_log CASCADE;

-- Unused feature flag system
DROP TABLE IF EXISTS feature_flags CASCADE;

-- Unused Quick Plan analytics tables
DROP TABLE IF EXISTS quick_plan_ab_tests CASCADE;
DROP TABLE IF EXISTS quick_plan_usage_analytics CASCADE;
DROP TABLE IF EXISTS quick_plan_customizations CASCADE;
DROP TABLE IF EXISTS quick_plan_conversions CASCADE;

-- Unused theme tables
DROP TABLE IF EXISTS system_color_theme CASCADE;
DROP TABLE IF EXISTS trip_color_theme CASCADE;

-- ============================================================================
-- CLEANUP SUMMARY
-- ============================================================================
-- Tables removed: 25
-- Categories:
--   - Legacy tables: 3 (scraped_locations, collaborators, budget_entries)
--   - Analytics/cache: 4 (search_queries, place_interactions, place_suggestions_cache, cache_statistics)
--   - Scraping system: 3 (scraping_jobs, scraping_schedule, scraping_progress)
--   - Feature tables: 5 (packing_templates, packing_categories, story_likes, trip_versions, exchange_rates)
--   - Preferences: 1 (user_customization_preferences)
--   - Moderation: 2 (moderation_flags, moderation_log)
--   - Feature flags: 1 (feature_flags)
--   - Quick Plan: 4 (quick_plan_ab_tests, quick_plan_usage_analytics, quick_plan_customizations, quick_plan_conversions)
--   - Themes: 2 (system_color_theme, trip_color_theme)
--
-- Note: bookings and shopping_items tables are KEPT as they are actively used
