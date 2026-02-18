# Backend Improvements Integration Guide

This guide provides step-by-step instructions for integrating the new backend security and performance improvements.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Redis server running
- SendGrid account (optional, for email functionality)

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

This will install the new dependencies:
- joi
- winston
- winston-daily-rotate-file
- express-rate-limit
- @sendgrid/mail
- argon2
- compression (needs to be added)
- morgan (needs to be added)

Add these to package.json if not already present:
```bash
npm install compression morgan @types/compression @types/morgan
```

## Step 2: Environment Variables

Update your `backend/.env` file:

```env
# Existing variables
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/journo_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
CORS_ORIGIN=http://localhost:3000

# New variables for improvements
LOG_LEVEL=info
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# SendGrid Email (optional)
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=noreply@journo.app
FROM_NAME=Journo

# Frontend URL for email links
FRONTEND_URL=http://localhost:3000
```

## Step 3: Run Database Migration

Execute the performance indexes migration:

```bash
# Using npm script
npm run migrate

# Or manually with psql
psql -U your_user -d journo_db -f src/migrations/050_add_performance_indexes.sql
```

Verify indexes were created:
```sql
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
```

## Step 4: Update index.ts

Replace the error handling and add new middleware in `backend/src/index.ts`:

### 4.1: Add Imports

```typescript
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import logger, { stream } from './utils/logger.js';
```

### 4.2: Replace console.log with logger

```typescript
// Replace all console.log statements
logger.info('🔑 OPENWEATHER_API_KEY loaded:', process.env.OPENWEATHER_API_KEY ? 'YES' : 'NO');
logger.info('✅ Enhanced auth routes registered at /api/auth');
logger.info('🛡️ Rate limiting middleware initialized');
logger.info(`🚀 Server is running on port ${PORT}`);
```

### 4.3: Add Compression Middleware

After `app.use(express.json())`:

```typescript
// Compression middleware
app.use(compression());
```

### 4.4: Add HTTP Request Logging

After compression:

```typescript
// HTTP request logging
app.use(morgan('combined', { stream }));
```

### 4.5: Add Rate Limiting

Before route definitions:

```typescript
// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// Stricter rate limiting for scraping endpoint
const scrapeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window per IP
  message: 'Scraping rate limit exceeded. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/scrape', scrapeLimiter);
```

### 4.6: Replace Error Handlers

Replace the existing 404 and error handlers at the end of the file:

```typescript
// Remove old handlers:
// app.use((_req, res) => { ... });
// app.use((err: any, ...) => { ... });

// Add new handlers:
app.use(notFoundHandler);
app.use(errorHandler);
```

## Step 5: Update Upload Controller

In `backend/src/controllers/uploadController.ts`, add file validation:

```typescript
import { validateFile } from '../utils/fileValidation.js';
import logger from '../utils/logger.js';

export const uploadPhoto = async (req: Request, res: Response) => {
  try {
    if (!req.body.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Add validation
    const filename = req.body.filename || 'upload.jpg';
    const contentType = req.body.contentType || 'image/jpeg';
    const fileBuffer = Buffer.from(req.body.file, 'base64');
    
    const validation = validateFile(filename, contentType, fileBuffer.length);
    if (!validation.valid) {
      logger.warn('File upload validation failed', { 
        filename, 
        contentType, 
        size: fileBuffer.length,
        error: validation.error 
      });
      return res.status(400).json({ error: validation.error });
    }

    // Use sanitized filename
    const sanitizedFilename = validation.sanitizedFilename!;
    
    // Continue with upload...
    const result = await storageService.upload(fileBuffer, {
      bucket: 'photos',
      contentType,
      filename: sanitizedFilename,
    });

    logger.info('Photo uploaded successfully', { 
      filename: sanitizedFilename, 
      size: result.size 
    });

    res.status(201).json({
      message: 'Photo uploaded successfully',
      url: result.url,
      filename: result.filename,
      size: result.size
    });
  } catch (error: any) {
    logger.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload photo' });
  }
};
```

## Step 6: Integrate Email Service

In `backend/src/controllers/authController.ts`, add welcome email:

```typescript
import EmailService from '../services/emailService.js';
import logger from '../utils/logger.js';

// In register method, after successful user creation:
try {
  await EmailService.sendWelcomeEmail(result.user.email, {
    userName: result.user.name,
    loginLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
  });
  logger.info(`Welcome email sent to ${result.user.email}`);
} catch (emailError) {
  // Don't fail registration if email fails
  logger.error('Failed to send welcome email:', emailError);
}
```

## Step 7: Replace console.log Throughout Codebase

Use find and replace to update logging:

```bash
# Find all console.log usage
grep -r "console\." backend/src --include="*.ts" --include="*.js"

# Replace with logger calls:
# console.log → logger.info
# console.error → logger.error
# console.warn → logger.warn
# console.debug → logger.debug
```

## Step 8: Test the Implementation

### 8.1: Test Validation

```bash
# Test registration with invalid email
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","name":"Test","password":"short"}'

# Should return validation errors
```

### 8.2: Test Rate Limiting

```bash
# Make multiple rapid requests
for i in {1..10}; do
  curl http://localhost:5000/api/health
done

# After 100 requests in 15 minutes, should get rate limit error
```

### 8.3: Test Logging

```bash
# Check logs are being created
ls -la backend/logs/

# View recent logs
tail -f backend/logs/combined-*.log
tail -f backend/logs/error-*.log
```

### 8.4: Test Caching

```bash
# Make a request that uses caching
curl http://localhost:5000/api/weather?city=Tokyo

# Check Redis for cached data
redis-cli
> KEYS weather:*
> GET weather:Tokyo:2026-02-18
```

### 8.5: Test Database Indexes

```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM trips WHERE user_id = 'some-user-id' ORDER BY start_date DESC;

-- Should show "Index Scan using idx_trips_user_start_date"
```

## Step 9: Monitor and Verify

### 9.1: Check Logs

```bash
# Watch logs in real-time
tail -f backend/logs/combined-*.log

# Check for errors
grep "error" backend/logs/error-*.log
```

### 9.2: Monitor Performance

```bash
# Check Redis memory usage
redis-cli INFO memory

# Check database query performance
psql -U your_user -d journo_db -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### 9.3: Test Email Delivery

```bash
# Register a new user and check email
# Check SendGrid dashboard for delivery status
```

## Troubleshooting

### Issue: Dependencies not installing

```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: Migration fails

```bash
# Check if indexes already exist
psql -U your_user -d journo_db -c "\di"

# Drop existing indexes if needed
psql -U your_user -d journo_db -c "DROP INDEX IF EXISTS idx_trips_user_id;"
```

### Issue: Redis connection fails

```bash
# Check Redis is running
redis-cli ping

# Should return "PONG"

# Check Redis URL in .env
echo $REDIS_URL
```

### Issue: SendGrid emails not sending

```bash
# Verify API key is set
echo $SENDGRID_API_KEY

# Check SendGrid dashboard for errors
# Verify sender email is verified in SendGrid
```

### Issue: Rate limiting not working

```bash
# Check Redis is running (rate limiting uses Redis)
redis-cli ping

# Check rate limit keys in Redis
redis-cli KEYS rate-limit:*
```

## Rollback Plan

If you need to rollback:

### 1. Revert Code Changes

```bash
git checkout HEAD -- backend/src/index.ts
git checkout HEAD -- backend/src/routes/auth.ts
git checkout HEAD -- backend/src/models/User.ts
```

### 2. Remove New Files

```bash
rm backend/src/schemas/authSchemas.ts
rm backend/src/middleware/validationMiddleware.ts
rm backend/src/utils/logger.ts
rm backend/src/middleware/errorHandler.ts
rm backend/src/services/cacheService.ts
rm backend/src/utils/fileValidation.ts
rm backend/src/templates/*.ts
rm backend/src/services/emailService.ts
```

### 3. Rollback Database

```bash
# Drop indexes
psql -U your_user -d journo_db -f backend/src/migrations/rollback_050.sql
```

Create `rollback_050.sql`:
```sql
DROP INDEX IF EXISTS idx_trips_user_id;
DROP INDEX IF EXISTS idx_trips_start_date;
-- ... drop all other indexes
```

### 4. Uninstall Dependencies

```bash
npm uninstall joi winston winston-daily-rotate-file express-rate-limit @sendgrid/mail argon2 compression morgan
```

## Support

For issues or questions:
1. Check logs in `backend/logs/`
2. Review error messages in console
3. Verify environment variables are set correctly
4. Ensure all services (PostgreSQL, Redis) are running

## Next Steps

After successful integration:
1. Monitor logs for errors
2. Check performance metrics
3. Test all API endpoints
4. Verify email delivery
5. Monitor rate limiting effectiveness
6. Consider adding:
   - Prometheus metrics
   - Sentry error tracking
   - APM monitoring
   - Database query performance monitoring
