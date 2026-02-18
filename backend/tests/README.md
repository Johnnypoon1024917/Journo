# Backend Tests

This folder contains test files for backend functionality.

## Test Files

### API Tests
- `test_budget_api.mjs` - Budget API endpoint tests
- `test_budget_endpoints.mjs` - Budget endpoint integration tests
- `test_bookings_shopping.mjs` - Booking and shopping tests
- `test_checkbox.mjs` - Checkbox functionality tests
- `test_notification.mjs` - Notification system tests

### Authentication Tests
- `test_login_cookies.mjs` - Login cookie handling tests
- `test_cookie.mjs` - Cookie management tests
- `test_token_validation.mjs` - JWT token validation tests

### Sticker System Tests
- `test_sticker_attach.mjs` - Sticker attachment tests
- `test_sticker_upload_delete.mjs` - Sticker upload/delete tests
- `test_get_stickers.mjs` - Sticker retrieval tests

### Service Tests
- `test_activity_log_service.ts` - Activity logging service tests
- `test_invitation_link_service.ts` - Invitation link service tests
- `test_invitation_email.ts` - Email invitation tests

## Running Tests

```bash
# Run all tests
npm test

# Run specific test
node tests/test_budget_api.mjs
```

## Note

For unit tests using Jest/Vitest, see `src/__tests__/` directory.
