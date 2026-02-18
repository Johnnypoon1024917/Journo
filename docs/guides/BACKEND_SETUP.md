# Backend Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Initial Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

Install PostgreSQL if not already installed:

```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql-14
sudo systemctl start postgresql
```

Create database:

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE journo;
CREATE USER journo_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE journo TO journo_user;
\q
```

### 3. Environment Configuration

Copy example environment file:

```bash
cp .env.example .env
```

Configure `.env`:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://journo_user:your_password@localhost:5432/journo

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Seed Database (Optional)

```bash
npm run seed
```

### 6. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── models/          # Database models
│   ├── migrations/      # Database migrations
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   └── app.ts           # Express app setup
├── uploads/             # File uploads
├── .env                 # Environment variables
└── package.json
```

## API Endpoints

### Authentication
- POST `/auth/register` - Register new user
- POST `/auth/login` - Login
- POST `/auth/logout` - Logout
- POST `/auth/refresh` - Refresh token
- GET `/auth/me` - Get current user

### Trips
- GET `/api/trips` - List user's trips
- POST `/api/trips` - Create trip
- GET `/api/trips/:id` - Get trip details
- PUT `/api/trips/:id` - Update trip
- DELETE `/api/trips/:id` - Delete trip

### Activities
- GET `/api/trips/:tripId/activities` - List activities
- POST `/api/trips/:tripId/activities` - Create activity
- PUT `/api/activities/:id` - Update activity
- DELETE `/api/activities/:id` - Delete activity

### Budget
- GET `/api/trips/:tripId/budget` - Get budget
- POST `/api/trips/:tripId/budget` - Create budget entry
- PUT `/api/budget/:id` - Update budget entry
- DELETE `/api/budget/:id` - Delete budget entry

### Collaboration
- POST `/api/trips/:tripId/invite` - Invite member
- GET `/api/trips/:tripId/members` - List members
- DELETE `/api/trips/:tripId/members/:userId` - Remove member

## Database Migrations

### Creating a Migration

```bash
npm run migrate:create migration_name
```

This creates a new migration file in `src/migrations/`

### Migration Template

```javascript
export async function up(db) {
  await db.query(`
    CREATE TABLE example (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

export async function down(db) {
  await db.query(`DROP TABLE IF EXISTS example;`);
}
```

### Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Reset database (rollback all)
npm run migrate:reset
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Linting

```bash
# Check for issues
npm run lint

# Fix issues
npm run lint:fix
```

### Type Checking

```bash
npm run type-check
```

### Building for Production

```bash
npm run build
```

## Debugging

### VS Code Launch Configuration

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Logging

```javascript
import logger from './utils/logger';

logger.info('Info message');
logger.error('Error message', { error });
logger.debug('Debug message', { data });
```

## Common Tasks

### Adding a New Endpoint

1. Create route in `src/routes/`
2. Create controller in `src/controllers/`
3. Add business logic in `src/services/`
4. Add middleware if needed
5. Register route in `src/app.ts`
6. Write tests

### Adding Authentication to Route

```javascript
import { authenticateToken } from '../middleware/auth';

router.get('/protected', authenticateToken, controller.handler);
```

### Adding Validation

```javascript
import { body, validationResult } from 'express-validator';

router.post('/trips',
  authenticateToken,
  [
    body('name').notEmpty().trim(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601()
  ],
  controller.createTrip
);
```

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret

### Optional
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origin
- `SMTP_*` - Email configuration
- `RATE_LIMIT_*` - Rate limiting config

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
psql $DATABASE_URL

# Verify credentials
psql -U journo_user -d journo
```

### Migration Failed

```bash
# Check migration syntax
npm run migrate:status

# Rollback and retry
npm run migrate:rollback
npm run migrate
```

### Port Already in Use

```bash
# Find process using port
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

### Build

```bash
npm run build
```

### Environment

Set production environment variables:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=strong-secret-key
CORS_ORIGIN=https://yourdomain.com
```

### Start

```bash
npm start
```

### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name journo-backend

# Monitor
pm2 monit

# Logs
pm2 logs journo-backend

# Restart
pm2 restart journo-backend
```

### Docker

```bash
# Build image
docker build -t journo-backend .

# Run container
docker run -p 3000:3000 --env-file .env journo-backend
```

## Performance

### Database Optimization

- Add indexes for frequently queried columns
- Use connection pooling
- Implement query caching
- Optimize N+1 queries

### Caching

```javascript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 });

// Cache result
cache.set('key', data);

// Get from cache
const data = cache.get('key');
```

### Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

## Security

### Best Practices

1. Use environment variables for secrets
2. Implement rate limiting
3. Validate all inputs
4. Use parameterized queries
5. Enable CORS properly
6. Use HTTPS in production
7. Keep dependencies updated
8. Implement proper error handling
9. Log security events
10. Use security headers

### Security Headers

```javascript
import helmet from 'helmet';

app.use(helmet());
```

## Monitoring

### Health Check

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Logging

- Use structured logging
- Log errors with context
- Monitor error rates
- Set up alerts

## Resources

- [Express Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
