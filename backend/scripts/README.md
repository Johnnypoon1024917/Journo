# Backend Utility Scripts

This folder contains maintenance, diagnostic, and utility scripts for the backend.

## Script Categories

### Database Checks
- `check_database_state.mjs` - Check overall database state
- `check_places_columns.mjs` - Verify places table schema
- `check_user_sessions_schema.mjs` - Verify user sessions schema
- `check_users.mjs` - Check user records
- `check_notifications.mjs` - Check notification system
- `check_specific_place.mjs` - Check specific place details
- `check_latest_place.mjs` - Check most recent place
- `check_new_place.mjs` - Check newly created places

### Database Verification
- `verify_budget_schema.mjs` - Verify budget table schema
- `verify_sticker_system.mjs` - Verify sticker system integrity
- `show_database_config.mjs` - Display database configuration

### Maintenance
- `cleanup_all_custom_stickers.mjs` - Clean up custom stickers
- `clear_user_sessions.mjs` - Clear user session data
- `delete_missing_sticker.mjs` - Remove missing sticker references
- `fix_user_sessions.mjs` - Fix user session issues

### Diagnostics
- `diagnose_notifications.mjs` - Diagnose notification issues
- `decode_token.mjs` - Decode JWT tokens
- `list_places.mjs` - List all places
- `list_sticker_attachments.mjs` - List sticker attachments
- `check_orphaned_attachments.mjs` - Find orphaned attachments

## Usage

Run scripts from the backend directory:

```bash
node scripts/check_database_state.mjs
```

Most scripts require environment variables from `.env` to be set.
