# Journo Backend API

Express + TypeScript + PostgreSQL backend for the Journo travel platform.

## Features

- JWT-based authentication with refresh tokens
- PostgreSQL database with connection pooling
- Bcrypt password hashing
- Role-based access control (user, admin, moderator)
- Socket.IO for real-time features
- RESTful API endpoints
- Automatic token refresh
- Session persistence

## Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your database credentials and JWT secrets.

4. Create the PostgreSQL database:
```bash
createdb journo
```

5. Run database migrations:
```bash
npm run migrate
```

### Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Production

Build the project:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Health Check

- `GET /health` - Check API and database status

## Database Schema

### Users Table
- `id` - UUID primary key
- `email` - Unique email address
- `name` - User's full name
- `password_hash` - Bcrypt hashed password
- `role` - User role (user, admin, moderator)
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

### Refresh Tokens Table
- `id` - UUID primary key
- `user_id` - Foreign key to users table
- `token` - JWT refresh token
- `expires_at` - Token expiration timestamp
- `created_at` - Token creation timestamp

## Authentication Flow

1. User registers or logs in
2. Server returns access token (15min expiry) and refresh token (7 days expiry)
3. Client stores both tokens
4. Client includes access token in Authorization header for protected routes
5. When access token expires, client uses refresh token to get new tokens
6. On logout, refresh token is deleted from database

## Security Features

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with configurable expiration
- Refresh token rotation on use
- Database-level constraints and indexes
- CORS configuration
- Input validation
- Error handling middleware

## Environment Variables

See `.env.example` for all available configuration options.

## License

MIT
