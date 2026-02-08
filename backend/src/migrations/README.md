# Database Migrations

This directory contains SQL migration files for the Journo platform database schema.

## Migration Order

Migrations are executed in alphabetical order by filename. The current migration sequence is:

1. **001_create_users_table.sql** - User authentication and refresh tokens
2. **002_create_trips_tables.sql** - Trips, trip days, and places
3. **003_create_story_and_likes_tables.sql** - Story items and trip likes
4. **004_create_packing_tables.sql** - Packing lists and templates
5. **005_create_collaboration_tables.sql** - Trip collaborators and versions
6. **006_create_analytics_tables.sql** - User badges, analytics events, and currency rates
7. **007_create_destination_and_scraping_tables.sql** - Destination suggestions and scraped locations
8. **008_create_security_policies.sql** - Security functions and triggers
9. **009_create_admin_tables.sql** - Moderation, feature flags, and admin tools
10. **010_add_travel_time_to_places.sql** - Travel time and distance fields for places
11. **011_create_trip_versions_table.sql** - Trip version history for undo/redo
12. **012_add_place_order_column.sql** - Display order for drag-and-drop
13. **013_add_optimistic_update_fields.sql** - Optimistic updates, transport routes, and sync queue

## Running Migrations

To run all migrations:

```bash
npm run migrate
```

Or manually:

```bash
tsx src/utils/runMigrations.ts
```

## Database Schema Overview

### Core Tables

- **users** - User accounts with authentication
- **refresh_tokens** - JWT refresh tokens
- **trips** - Trip itineraries with metadata
- **trip_days** - Individual days within trips
- **places** - Locations within trip days (with optimistic update fields)
- **transport_routes** - Cached route calculations between places
- **sync_queue** - Queue for optimistic updates and offline operations
- **story_items** - Photos, videos, and notes
- **trip_likes** - User likes on trips

### Feature Tables

- **packing_lists** - Trip packing items
- **packing_templates** - Auto-suggestion templates
- **trip_collaborators** - Multi-user collaboration
- **trip_versions** - Version history for undo/redo
- **user_badges** - Achievement system
- **currency_rates** - Exchange rate cache

### Analytics Tables

- **analytics_events** - User behavior tracking
- **search_queries** - Search analytics
- **suggestion_interactions** - Destination suggestion engagement

### Admin Tables

- **moderation_flags** - Content moderation flags
- **moderation_log** - Moderation action history
- **feature_flags** - Feature toggle system
- **destination_suggestions** - Curated destination recommendations
- **scraped_locations** - Dynamic location data

## Security Features

### Database Functions

- `user_owns_trip(user_id, trip_id)` - Check trip ownership
- `user_is_collaborator(user_id, trip_id)` - Check collaboration status
- `user_can_edit_trip(user_id, trip_id)` - Check edit permissions
- `trip_is_public(trip_id)` - Check public visibility
- `increment_trip_views(trip_id)` - Increment view counter
- `increment_trip_likes(trip_id)` - Increment like counter
- `decrement_trip_likes(trip_id)` - Decrement like counter

### Triggers

- **update_updated_at** - Auto-update timestamps on record changes
- **trip_likes_insert_trigger** - Auto-increment likes count
- **trip_likes_delete_trigger** - Auto-decrement likes count
- **ensure_trip_owner_is_collaborator** - Auto-add owner as collaborator
- **validate_collaborator_role_change** - Prevent owner role changes
- **prevent_delete_last_owner** - Ensure at least one owner exists

## Indexes

All tables include optimized indexes for:
- Foreign key relationships
- Frequently queried columns
- Sort operations (created_at, updated_at)
- Unique constraints

## Data Constraints

### Check Constraints

- Trip themes: default, adventure, romantic, foodie, chill
- Place types: attraction, food, hotel, transport, other
- Budget categories: accommodation, food, transport, activities, shopping, misc
- Transport modes: driving, walking, transit, flight
- Story item types: photo, youtube, note
- Collaborator roles: owner, editor, viewer
- Packing categories: essentials, clothing, toiletries, electronics, documents, health, activities, misc

### Cascade Deletes

- Deleting a user cascades to their trips, story items, and collaborations
- Deleting a trip cascades to all related data (days, places, story items, etc.)
- Deleting a trip day cascades to all places in that day

## Storage

File storage is handled separately through the `storageService`:
- Local filesystem storage (default)
- MinIO/S3-compatible storage (optional)
- Configurable via environment variables

## Notes

- All timestamps use UTC
- UUIDs are used for primary keys
- Decimal types are used for currency and coordinates
- JSONB is used for flexible metadata storage
