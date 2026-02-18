# Database Migrations

This folder contains SQL migration files and migration runner scripts.

## Migration Files

### SQL Migrations
- `fix_sticker_tables.sql` - Fix sticker table schema
- `fix_user_sessions_schema.sql` - Fix user sessions schema

### Migration Runners
- `run_migrations.mjs` - Run all pending migrations
- `run_migration_029.mjs` - Run specific migration #029
- `recreate_database.ts` - Recreate database from scratch
- `create_notifications_table.mjs` - Create notifications table

## Running Migrations

```bash
# Run all migrations
npm run migrate

# Or manually
node migrations/run_migrations.mjs

# Recreate database (WARNING: destroys all data)
ts-node migrations/recreate_database.ts
```

## Migration Naming Convention

Migrations in `src/migrations/` follow the pattern:
- `NNN_description.sql` (e.g., `001_create_users_table.sql`)

## Note

The main migration files are in `src/migrations/`. This folder contains utility scripts and one-off fixes.
